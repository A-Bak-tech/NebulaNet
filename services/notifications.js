// services/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Request permission for notifications
   */
  async requestPermissions() {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotificationsAsync() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Get project ID from expo config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                       Constants.manifest?.extra?.eas?.projectId;

      if (!projectId) {
        console.log('Project ID not found');
        return null;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      this.expoPushToken = token.data;
      console.log('Expo Push Token:', this.expoPushToken);

      // Set notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Store token in Supabase
      await this.storePushToken(this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Store push token in Supabase
   */
  async storePushToken(token) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found to store push token');
        return;
      }

      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          expo_push_token: token,
          device_platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      console.log('Push token stored successfully');
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Send push notification via Expo server
   */
  async sendPushNotification(token, title, body, data = {}) {
    try {
      const message = {
        to: token,
        sound: 'default',
        title,
        body,
        data,
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(userIds, title, body, data = {}) {
    try {
      // Fetch push tokens for users
      const { data: tokens, error } = await supabase
        .from('user_push_tokens')
        .select('expo_push_token')
        .in('user_id', userIds);

      if (error) throw error;

      // Send notifications
      const promises = tokens.map(token => 
        this.sendPushNotification(token.expo_push_token, title, body, data)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error sending notifications to users:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners(navigation) {
    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // Update badge count or state
      // You can dispatch to Redux or update context here
    });

    // Listen for user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle deep linking based on notification data
      if (data?.type === 'mention' && data?.commentId) {
        navigation.navigate('Comments', { commentId: data.commentId });
      } else if (data?.type === 'like' && data?.postId) {
        navigation.navigate('PostDetail', { postId: data.postId });
      } else if (data?.type === 'follow') {
        navigation.navigate('Profile', { userId: data.userId });
      } else if (data?.type === 'message') {
        navigation.navigate('ChatDetail', { userId: data.userId });
      }
    });
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Remove push token on logout
   */
  async removePushToken() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('user_push_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      console.log('Push token removed');
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }
}

// Singleton instance
const notificationService = new NotificationService();
export default notificationService;