import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Bell, UserPlus, Heart, MessageCircle, Users } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = 'all';

  // TODO:Mock data - replace with actual API calls
  useEffect(() => {
    setNotifications([
      {
        id: '1',
        type: 'like',
        title: 'Post liked',
        message: 'Sarah Johnson liked your post about AI technology',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      },
      {
        id: '2',
        type: 'comment',
        title: 'New comment',
        message: 'Mike Chen commented on your post: "Great insights!"',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      },
      {
        id: '3',
        type: 'follow',
        title: 'New follower',
        message: 'Alex Rivera started following you',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
    ]);
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    const iconProps = { size: 20, color: '#0ea5e9' };
    
    switch (type) {
      case 'like':
        return <Heart {...iconProps} />;
      case 'comment':
        return <MessageCircle {...iconProps} />;
      case 'follow':
        return <UserPlus {...iconProps} />;
      case 'mention':
        return <Users {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notif.isRead;
    return notif.type === activeFilter;
  });

  return (
    <ScreenWrapper>
      <Header 
        title="Notifications" 
        rightAction={
          <TouchableOpacity onPress={markAllAsRead}>
            <Text className="text-primary-500 font-medium">Mark all read</Text>
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row px-4 py-2 space-x-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'like', label: 'Likes' },
            { key: 'comment', label: 'Comments' },
            { key: 'follow', label: 'Follows' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              className={cn(
                'px-4 py-2 rounded-full',
                activeFilter === filter.key
                  ? 'bg-primary-500'
                  : 'bg-gray-100 dark:bg-gray-800'
              )}
            >
              <Text
                className={cn(
                  'text-sm font-medium',
                  activeFilter === filter.key
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Notifications List */}
      <ScrollView className="flex-1">
        {filteredNotifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Bell size={48} color="#9CA3AF" />
            <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4">
              No notifications
            </Text>
          </View>
        ) : (
          <View className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => markAsRead(notification.id)}
                className={cn(
                  'p-4 flex-row space-x-3',
                  !notification.isRead && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                <View className="mt-1">
                  {getNotificationIcon(notification.type)}
                </View>
                
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white text-sm">
                    {notification.title}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {notification.message}
                  </Text>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt))} ago
                  </Text>
                </View>

                {!notification.isRead && (
                  <View className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}