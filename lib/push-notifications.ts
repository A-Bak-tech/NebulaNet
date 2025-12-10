// File: /lib/push-notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const pushNotificationService = {
  /**
   * Request permissions and register for push notifications
   */
  registerForPushNotifications: async (): Promise<string | null> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      })).data;
      
      // Save token to user's profile in Supabase
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase
          .from('user_devices')
          .upsert({
            user_id: userData.user.id,
            device_token: token,
            platform: Platform.OS,
            is_active: true,
            last_active: new Date().toISOString(),
          }, {
            onConflict: 'user_id,device_token',
            ignoreDuplicates: false
          });
      }
      
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },
  
  /**
   * Schedule a local notification
   */
  scheduleLocalNotification: async (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        badge: 1,
      },
      trigger: null, // Show immediately
    });
  },
  
  /**
   * Set notification badge count
   */
  setBadgeCount: async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
  },
  
  /**
   * Clear all notifications
   */
  clearAllNotifications: async () => {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  },
  
  /**
   * Listen for notification responses
   */
  addNotificationResponseListener: (
    callback: (response: Notifications.NotificationResponse) => void
  ) => {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
  
  /**
   * Listen for notifications received in foreground
   */
  addNotificationReceivedListener: (
    callback: (notification: Notifications.Notification) => void
  ) => {
    return Notifications.addNotificationReceivedListener(callback);
  },
};