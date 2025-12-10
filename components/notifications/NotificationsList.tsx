// File: /components/notifications/NotificationsList.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
} from 'react-native';
import { Notification } from '../../types/notifications';
import NotificationItem from './NotificationItem';
import { 
  CheckIcon,
  TrashIcon,
  FilterIcon,
  BellOffIcon,
} from '../../assets/icons';
import { Button } from '../ui/Button';
import { currentTheme } from '../../constants/Colors';
import { EmptyState } from '../ui/EmptyState';

interface NotificationsListProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  error?: string | null;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onLoadMore: () => void;
  onFilterChange?: (filter: 'all' | 'unread') => void;
  compact?: boolean;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  unreadCount,
  isLoading,
  isRefreshing,
  hasMore,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onRefresh,
  onLoadMore,
  onFilterChange,
  compact = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;
  
  const handleFilterChange = (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
    setShowFilterMenu(false);
    onFilterChange?.(newFilter);
  };
  
  const handleClearAll = async () => {
    try {
      await onClearAll();
      setShowClearModal(false);
    } catch (error) {
      console.error('Clear all error:', error);
    }
  };
  
  const renderHeader = () => {
    if (compact) return null;
    
    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {/* Filter Button */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterMenu(!showFilterMenu)}
          >
            <FilterIcon size={22} color={currentTheme.icon.primary} />
            <Text style={styles.filterText}>
              {filter === 'all' ? 'All' : 'Unread'}
            </Text>
          </TouchableOpacity>
          
          {/* Mark All as Read Button */}
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={onMarkAllAsRead}
            >
              <CheckIcon size={20} color={currentTheme.icon.primary} />
            </TouchableOpacity>
          )}
          
          {/* Clear All Button */}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setShowClearModal(true)}
            >
              <TrashIcon size={20} color={currentTheme.icon.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Menu */}
        {showFilterMenu && (
          <View style={styles.filterMenu}>
            <TouchableOpacity
              style={[
                styles.filterMenuItem,
                filter === 'all' && styles.filterMenuItemActive,
              ]}
              onPress={() => handleFilterChange('all')}
            >
              <Text style={[
                styles.filterMenuText,
                filter === 'all' && styles.filterMenuTextActive,
              ]}>
                All Notifications
              </Text>
              <Text style={styles.filterMenuCount}>
                {notifications.length}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterMenuItem,
                filter === 'unread' && styles.filterMenuItemActive,
              ]}
              onPress={() => handleFilterChange('unread')}
            >
              <Text style={[
                styles.filterMenuText,
                filter === 'unread' && styles.filterMenuTextActive,
              ]}>
                Unread
              </Text>
              <View style={styles.unreadBadgeSmall}>
                <Text style={styles.unreadCountSmall}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  const renderEmptyState = () => {
    if (isLoading) return null;
    
    return (
      <EmptyState
        title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
        description={
          filter === 'unread'
            ? 'You\'re all caught up! Check back later for new notifications.'
            : 'Notifications about likes, comments, and follows will appear here.'
        }
        icon={filter === 'unread' ? '✅' : '🔔'}
      />
    );
  };
  
  const renderFooter = () => {
    if (!hasMore || filteredNotifications.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        {isLoading && !isRefreshing ? (
          <>
            <ActivityIndicator size="small" color={currentTheme.brand.primary} />
            <Text style={styles.footerText}>Loading more notifications...</Text>
          </>
        ) : (
          <TouchableOpacity onPress={onLoadMore}>
            <Text style={styles.loadMoreText}>Load more notifications</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  const renderError = () => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to load notifications</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Button
          variant="primary"
          size="sm"
          onPress={onRefresh}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {renderHeader()}
      
      {error ? (
        renderError()
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
              compact={compact}
            />
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[currentTheme.brand.primary]}
              tintColor={currentTheme.brand.primary}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}
      
      {/* Clear All Modal */}
      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <BellOffIcon size={24} color={currentTheme.icon.primary} />
              <Text style={styles.modalTitle}>Clear all notifications?</Text>
              <Text style={styles.modalDescription}>
                This will permanently delete all your notifications. This action cannot be undone.
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <Button
                variant="outline"
                fullWidth
                onPress={() => setShowClearModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onPress={handleClearAll}
              >
                Clear All
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.background.primary,
  },
  compactContainer: {
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border.primary,
    backgroundColor: currentTheme.background.primary,
    position: 'relative',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: currentTheme.text.primary,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: currentTheme.brand.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: currentTheme.background.secondary,
    borderRadius: 20,
    flex: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    color: currentTheme.text.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  markAllButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: currentTheme.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: currentTheme.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterMenu: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: currentTheme.background.primary,
    borderWidth: 1,
    borderColor: currentTheme.border.primary,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 200,
    zIndex: 100,
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border.primary,
  },
  filterMenuItemActive: {
    backgroundColor: currentTheme.brand.primary + '10',
  },
  filterMenuText: {
    fontSize: 14,
    color: currentTheme.text.primary,
  },
  filterMenuTextActive: {
    color: currentTheme.brand.primary,
    fontWeight: '500',
  },
  filterMenuCount: {
    fontSize: 12,
    color: currentTheme.text.secondary,
    backgroundColor: currentTheme.background.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeSmall: {
    backgroundColor: currentTheme.brand.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountSmall: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  list: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: currentTheme.text.secondary,
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: currentTheme.brand.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: currentTheme.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: currentTheme.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: currentTheme.background.primary,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: currentTheme.text.primary,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: currentTheme.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default NotificationsList;