// File: /components/notifications/NotificationItem.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Notification } from '../../types/notifications';
import { 
  HeartIcon,
  HeartFilledIcon,
  CommentIcon,
  UserPlusIcon,
  AtIcon,
  EchoIcon,
  CheckIcon,
  VerifiedIcon,
  MoreIcon,
} from '../../assets/icons';
import { Avatar } from '../ui/Avatar';
import { currentTheme } from '../../constants/Colors';
import { formatDistanceToNow } from '../../utils/date';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  compact?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const getIcon = () => {
    switch (notification.type) {
      case 'like_post':
        return <HeartFilledIcon size={20} color="#FF3B30" />;
      case 'comment_post':
      case 'reply_comment':
        return <CommentIcon size={20} color={currentTheme.brand.primary} />;
      case 'follow_user':
        return <UserPlusIcon size={20} color="#4CD964" />;
      case 'mention':
        return <AtIcon size={20} color="#FF9500" />;
      case 'echo_post':
        return <EchoIcon size={20} color="#5856D6" />;
      case 'welcome':
        return <VerifiedIcon size={20} color={currentTheme.brand.primary} />;
      default:
        return <CheckIcon size={20} color={currentTheme.brand.primary} />;
    }
  };
  
  const getActionText = () => {
    switch (notification.type) {
      case 'like_post':
        return 'liked your post';
      case 'comment_post':
        return 'commented on your post';
      case 'reply_comment':
        return 'replied to your comment';
      case 'follow_user':
        return 'started following you';
      case 'mention':
        return 'mentioned you';
      case 'echo_post':
        return 'echoed your post';
      case 'welcome':
        return 'Welcome to NebulaNet!';
      default:
        return notification.message;
    }
  };
  
  const handlePress = async () => {
    if (!notification.is_read) {
      await onMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.target_id && notification.target_type) {
      switch (notification.target_type) {
        case 'post':
          router.push(`/post/${notification.target_id}`);
          break;
        case 'comment':
          router.push(`/post/${notification.data?.post_id}?comment=${notification.target_id}`);
          break;
        case 'user':
          if (notification.actor_id) {
            router.push(`/profile?id=${notification.actor_id}`);
          }
          break;
      }
    } else if (notification.actor_id) {
      router.push(`/profile?id=${notification.actor_id}`);
    }
  };
  
  const handleLongPress = () => {
    setShowOptions(true);
  };
  
  const handleMarkAsRead = async () => {
    try {
      await onMarkAsRead(notification.id);
      setShowOptions(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as read');
    }
  };
  
  const handleDelete = async () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDelete(notification.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notification');
            } finally {
              setIsDeleting(false);
              setShowOptions(false);
            }
          },
        },
      ]
    );
  };
  
  const handleViewProfile = () => {
    if (notification.actor_id) {
      router.push(`/profile?id=${notification.actor_id}`);
    }
    setShowOptions(false);
  };
  
  if (isDeleting) {
    return null;
  }
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.is_read && styles.unread,
        compact && styles.compact,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        
        {/* Avatar */}
        {notification.actor && (
          <TouchableOpacity
            onPress={handleViewProfile}
            style={styles.avatarContainer}
          >
            <Avatar
              source={notification.actor.avatar_url ? { uri: notification.actor.avatar_url } : undefined}
              size={compact ? 40 : 48}
              placeholder={notification.actor.display_name?.[0] || notification.actor.username?.[0]}
              isVerified={notification.actor.is_verified}
            />
          </TouchableOpacity>
        )}
        
        {/* Text */}
        <View style={styles.textContainer}>
          <View style={styles.header}>
            {notification.actor && (
              <Text style={styles.actorName}>
                {notification.actor.display_name || notification.actor.username}
              </Text>
            )}
            <Text style={styles.actionText}>
              {getActionText()}
            </Text>
          </View>
          
          {notification.message && !compact && (
            <Text 
              style={styles.message}
              numberOfLines={2}
            >
              {notification.message}
            </Text>
          )}
          
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(notification.created_at))}
          </Text>
        </View>
        
        {/* Options Button */}
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => setShowOptions(!showOptions)}
        >
          <MoreIcon size={20} color={currentTheme.icon.secondary} />
        </TouchableOpacity>
      </View>
      
      {/* Options Menu */}
      {showOptions && (
        <View style={styles.optionsMenu}>
          {!notification.is_read && (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleMarkAsRead}
            >
              <Text style={styles.optionText}>Mark as read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.optionItem}
            onPress={handleViewProfile}
          >
            <Text style={styles.optionText}>View profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionItem, styles.deleteOption]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteOptionText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => setShowOptions(false)}
          >
            <Text style={styles.optionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Unread indicator */}
      {!notification.is_read && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border.primary,
    backgroundColor: currentTheme.background.primary,
  },
  unread: {
    backgroundColor: currentTheme.brand.primary + '08', // 8% opacity
  },
  compact: {
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  avatarContainer: {
    marginLeft: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  actorName: {
    fontWeight: '600',
    fontSize: 15,
    color: currentTheme.text.primary,
    marginRight: 4,
  },
  actionText: {
    fontSize: 15,
    color: currentTheme.text.secondary,
  },
  message: {
    fontSize: 14,
    color: currentTheme.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    color: currentTheme.text.tertiary,
    marginTop: 4,
  },
  optionsButton: {
    padding: 4,
    marginLeft: 4,
  },
  optionsMenu: {
    position: 'absolute',
    top: 50,
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
    minWidth: 160,
    zIndex: 100,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border.primary,
  },
  optionText: {
    fontSize: 14,
    color: currentTheme.text.primary,
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  deleteOptionText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 4,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: currentTheme.brand.primary,
  },
});

export default NotificationItem;