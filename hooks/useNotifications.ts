// File: /hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import notificationsService from '../lib/notifications';
import { 
  Notification, 
  NotificationSettings,
  NotificationsResponse 
} from '../types/notifications';

interface UseNotificationsOptions {
  initialLimit?: number;
  autoLoad?: boolean;
  pollInterval?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const {
    initialLimit = 20,
    autoLoad = true,
    pollInterval = 30000, // 30 seconds
  } = options;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [settings, setSettings] = useState<NotificationSettings>({});
  const [error, setError] = useState<string | null>(null);
  
  const loadNotifications = useCallback(async (loadPage: number = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      
      const response = await notificationsService.getNotifications(
        loadPage,
        initialLimit,
        false
      );
      
      if (loadPage === 1 || isRefresh) {
        setNotifications(response.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.notifications]);
      }
      
      setUnreadCount(response.unread_count);
      setHasMore(response.has_more);
      setPage(loadPage);
    } catch (err: any) {
      console.error('Load notifications error:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [initialLimit]);
  
  const refreshNotifications = useCallback(() => {
    return loadNotifications(1, true);
  }, [loadNotifications]);
  
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadNotifications(page + 1);
    }
  }, [isLoading, hasMore, page, loadNotifications]);
  
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Mark as read error:', err);
      throw err;
    }
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    try {
      const count = await notificationsService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true,
      })));
      
      // Update unread count
      setUnreadCount(0);
      
      return count;
    } catch (err: any) {
      console.error('Mark all as read error:', err);
      throw err;
    }
  }, []);
  
  const markAsSeen = useCallback(async () => {
    try {
      await notificationsService.markAsSeen();
    } catch (err: any) {
      console.error('Mark as seen error:', err);
    }
  }, []);
  
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Check if notification was unread
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('Delete notification error:', err);
      throw err;
    }
  }, [notifications]);
  
  const clearAll = useCallback(async () => {
    try {
      await notificationsService.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Clear all error:', err);
      throw err;
    }
  }, []);
  
  const loadSettings = useCallback(async () => {
    try {
      const settings = await notificationsService.getPreferences();
      setSettings(settings);
    } catch (err: any) {
      console.error('Load settings error:', err);
    }
  }, []);
  
  const updateSetting = useCallback(async (
    type: string,
    channel: 'in_app' | 'email' | 'push',
    enabled: boolean
  ) => {
    try {
      await notificationsService.updatePreference(type as any, channel, enabled);
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [channel]: enabled,
        },
      }));
    } catch (err: any) {
      console.error('Update setting error:', err);
      throw err;
    }
  }, []);
  
  // Subscribe to new notifications
  useEffect(() => {
    const unsubscribeNew = notificationsService.subscribeToNotifications(
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        if (!newNotification.is_read) {
          setUnreadCount(prev => prev + 1);
        }
      }
    );
    
    const unsubscribeUpdates = notificationsService.subscribeToNotificationUpdates(
      (updatedNotification) => {
        setNotifications(prev => prev.map(notification => 
          notification.id === updatedNotification.id
            ? updatedNotification
            : notification
        ));
        
        // Recalculate unread count
        const newUnreadCount = notifications.filter(n => !n.is_read).length;
        setUnreadCount(newUnreadCount);
      }
    );
    
    const unsubscribeCount = notificationsService.subscribeToUnreadCount(
      (count) => {
        setUnreadCount(count);
      }
    );
    
    return () => {
      unsubscribeNew();
      unsubscribeUpdates();
      unsubscribeCount();
    };
  }, [notifications]);
  
  // Auto-poll for new notifications
  useEffect(() => {
    if (!pollInterval) return;
    
    const interval = setInterval(() => {
      refreshNotifications();
    }, pollInterval);
    
    return () => clearInterval(interval);
  }, [pollInterval, refreshNotifications]);
  
  // Initial load
  useEffect(() => {
    if (autoLoad) {
      loadNotifications(1);
      loadSettings();
    }
  }, [autoLoad, loadNotifications, loadSettings]);
  
  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    hasMore,
    error,
    settings,
    
    // Actions
    refreshNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    markAsSeen,
    deleteNotification,
    clearAll,
    loadSettings,
    updateSetting,
  };
};

export default useNotifications;