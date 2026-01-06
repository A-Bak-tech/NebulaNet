// screens/notification/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState('nebulanet.space/invite/yourcode');

  // Mock data structure based on your design
  const mockNotifications = [
    {
      id: '1',
      type: 'like_comment',
      username: 'valerieazr90',
      message: 'Liked your comment',
      time: '3hr ago',
      isNew: true,
      dateGroup: 'Today',
      avatarColor: '#FF6B6B',
    },
    {
      id: '2',
      type: 'like_post',
      username: 'arlamgn',
      message: 'Liked your post',
      time: '3hr ago',
      isNew: true,
      dateGroup: 'Today',
      avatarColor: '#4ECDC4',
    },
    {
      id: '3',
      type: 'follow_back',
      username: 'lolitahoran',
      message: 'Followed you back!',
      time: '2hr ago',
      isNew: true,
      dateGroup: 'Today',
      avatarColor: '#FFD166',
    },
    {
      id: '4',
      type: 'mention',
      username: 'skyedsn',
      message: 'mentioned you in a comment',
      time: '2hr ago',
      isNew: true,
      dateGroup: 'Today',
      avatarColor: '#06D6A0',
    },
    {
      id: '5',
      type: 'message',
      username: 'lailagibs',
      message: 'do you wanna hang out this...',
      time: '2hr ago',
      isNew: true,
      dateGroup: 'Today',
      avatarColor: '#118AB2',
    },
    {
      id: '6',
      type: 'like_post',
      username: 'harrymalks',
      message: 'Liked your post',
      time: '3hr ago',
      isNew: false,
      dateGroup: 'Today',
      avatarColor: '#EF476F',
    },
    {
      id: '7',
      type: 'follow_back',
      username: 'jolinaangine',
      message: 'Followed you back!',
      time: '18 May 2025',
      isNew: false,
      dateGroup: 'Yesterday',
      avatarColor: '#073B4C',
    },
    {
      id: '8',
      type: 'like_post',
      username: 'aidenblaze',
      message: 'Liked your post',
      time: '18 May 2025',
      isNew: false,
      dateGroup: 'Yesterday',
      avatarColor: '#7209B7',
    },
    {
      id: '9',
      type: 'like_comment',
      username: 'aidenfrost',
      message: 'Liked your comment',
      time: '16 May 2025',
      isNew: false,
      dateGroup: 'Yesterday',
      avatarColor: '#F72585',
    },
  ];

  // Group notifications by date
  const groupedNotifications = mockNotifications.reduce((groups, notification) => {
    const dateGroup = notification.dateGroup;
    if (!groups[dateGroup]) {
      groups[dateGroup] = [];
    }
    groups[dateGroup].push(notification);
    return groups;
  }, {});

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like_post':
      case 'like_comment':
        return 'heart';
      case 'follow_back':
        return 'person-add';
      case 'mention':
        return 'at';
      case 'message':
        return 'chatbubble';
      default:
        return 'notifications';
    }
  };

  // Get icon color based on notification type
  const getIconColor = (type) => {
    switch (type) {
      case 'like_post':
      case 'like_comment':
        return '#EF476F'; // Red for likes
      case 'follow_back':
        return '#06D6A0'; // Green for follows
      case 'mention':
        return '#118AB2'; // Blue for mentions
      case 'message':
        return '#7209B7'; // Purple for messages
      default:
        return '#657786'; // Gray for others
    }
  };

  // Copy invite link to clipboard
  const handleCopyLink = async () => {
    try {
      // In a real app, use expo-clipboard
      // await Clipboard.setStringAsync(inviteLink);
      Alert.alert('Link Copied!', 'Invite link copied to clipboard');
      
      // Generate a new invite code (in a real app, this would be from your backend)
      const newCode = Math.random().toString(36).substring(7);
      setInviteLink(`nebulanet.space/invite/${newCode}`);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  // Handle notification press
  const handleNotificationPress = (notification) => {
    switch (notification.type) {
      case 'like_post':
        // Navigate to post
        // navigation.navigate('PostDetail', { postId: notification.postId });
        break;
      case 'mention':
        // Navigate to comment
        // navigation.navigate('Comments', { commentId: notification.commentId });
        break;
      case 'follow_back':
        // Navigate to profile
        // navigation.navigate('Profile', { userId: notification.userId });
        break;
      case 'message':
        // Navigate to chat
        // navigation.navigate('ChatDetail', { userId: notification.userId });
        break;
    }
    
    // Mark as read (in a real app)
    console.log('Notification pressed:', notification.id);
  };

  // Render individual notification item
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        item.isNew && styles.newNotification
      ]} 
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.notificationText}>
          <Text style={styles.username}>@{item.username}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </View>
      <View style={styles.notificationIcon}>
        <Ionicons 
          name={getNotificationIcon(item.type)} 
          size={20} 
          color={getIconColor(item.type)} 
        />
        {item.isNew && <View style={styles.newIndicator} />}
      </View>
    </TouchableOpacity>
  );

  // Render date group header
  const renderDateGroup = (dateGroup, notifications) => (
    <View key={dateGroup}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateHeaderText}>{dateGroup}</Text>
        <View style={styles.dateLine} />
      </View>
      {notifications.map((notification) => (
        <View key={notification.id}>
          {renderNotificationItem({ item: notification })}
        </View>
      ))}
    </View>
  );

  // Render invite friends section
  const renderInviteSection = () => (
    <View style={styles.inviteSection}>
      <Text style={styles.sectionTitle}>Invite Friends</Text>
      <Text style={styles.sectionSubtitle}>Share your link invite</Text>
      
      <View style={styles.separator} />
      
      <View style={styles.inviteLinkContainer}>
        <View style={styles.linkBox}>
          <Text style={styles.linkText} numberOfLines={1}>
            {inviteLink}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.copyButton} 
          onPress={handleCopyLink}
          activeOpacity={0.7}
        >
          <Text style={styles.copyButtonText}>Copy Link</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.separator} />
      
      <View style={styles.followingStatus}>
        <Text style={styles.followingText}>Following</Text>
        <Text style={styles.followingText}>Following</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1DA1F2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={22} color="#1DA1F2" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Invite Friends Section */}
        {renderInviteSection()}

        {/* Notifications List */}
        <View style={styles.notificationsContainer}>
          {Object.keys(groupedNotifications).map((dateGroup) =>
            renderDateGroup(dateGroup, groupedNotifications[dateGroup])
          )}
        </View>
      </ScrollView>

      {/* Mark All as Read Button */}
      <TouchableOpacity 
        style={styles.markAllButton}
        activeOpacity={0.7}
        onPress={() => Alert.alert('Mark All Read', 'All notifications marked as read')}
      >
        <Text style={styles.markAllText}>Mark all as read</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15202B',
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  inviteSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#15202B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#657786',
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E1E8ED',
    marginVertical: 12,
  },
  inviteLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  linkBox: {
    flex: 1,
    backgroundColor: '#F7F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  linkText: {
    fontSize: 14,
    color: '#15202B',
    fontWeight: '500',
  },
  copyButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  followingText: {
    fontSize: 14,
    color: '#657786',
    fontWeight: '500',
  },
  notificationsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 14,
    color: '#657786',
    fontWeight: '600',
    marginRight: 12,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E8ED',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  newNotification: {
    backgroundColor: '#F0F8FF',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationText: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#15202B',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#657786',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#AAB8C2',
  },
  notificationIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    position: 'relative',
  },
  newIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DA1F2',
  },
  markAllButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationsScreen;