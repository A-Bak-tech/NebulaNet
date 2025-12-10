// File: /app/(tabs)/notifications.tsx
import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Header } from '../../components/layout';
import NotificationsList from '../../components/notifications/NotificationsList';
import NotificationMenu from '../../components/notifications/NotificationMenu';
import { SettingsIcon } from '../../assets/icons';
import { useNotifications } from '../../hooks/useNotifications';
import { currentTheme } from '../../constants/Colors';

export default function NotificationsScreen() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    hasMore,
    error,
    refreshNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications({
    initialLimit: 20,
    autoLoad: true,
    pollInterval: 30000,
  });
  
  const handleFilterChange = (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
    // In a real implementation, you might want to fetch filtered notifications
  };
  
  const handleNotificationPress = (notificationId: string) => {
    // Navigation is handled in NotificationItem
    // This is just for additional logic if needed
  };
  
  const renderHeaderActions = () => (
    <TouchableOpacity onPress={() => setShowSettings(true)}>
      <SettingsIcon size={24} color={currentTheme.icon.primary} />
    </TouchableOpacity>
  );
  
  return (
    <ScreenWrapper withBottomNav>
      <Header
        title="Notifications"
        showBack={false}
        rightAction={renderHeaderActions()}
      />
      
      <NotificationsList
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        hasMore={hasMore}
        error={error}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
        onClearAll={clearAll}
        onRefresh={refreshNotifications}
        onLoadMore={loadMore}
        onFilterChange={handleFilterChange}
      />
      
      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <NotificationMenu onClose={() => setShowSettings(false)} />
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.background.primary,
  },
});