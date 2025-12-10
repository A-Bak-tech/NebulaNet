// File: /components/notifications/NotificationMenu.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { 
  BellIcon,
  HeartIcon,
  CommentIcon,
  UserPlusIcon,
  AtIcon,
  EchoIcon,
  MailIcon,
  MessageIcon,
  TrendingUpIcon,
  CheckIcon,
} from '../../assets/icons';
import { Button } from '../ui/Button';
import { currentTheme } from '../../constants/Colors';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType } from '../../types/notifications';

interface NotificationMenuProps {
  onClose?: () => void;
}

const NotificationMenu: React.FC<NotificationMenuProps> = ({ onClose }) => {
  const { settings, updateSetting, loadSettings } = useNotifications();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  
  const notificationTypes: Array<{
    type: NotificationType;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      type: 'like_post',
      label: 'Likes',
      description: 'When someone likes your post',
      icon: <HeartIcon size={20} color={currentTheme.icon.primary} />,
    },
    {
      type: 'comment_post',
      label: 'Comments',
      description: 'When someone comments on your post',
      icon: <CommentIcon size={20} color={currentTheme.icon.primary} />,
    },
    {
      type: 'reply_comment',
      label: 'Replies',
      description: 'When someone replies to your comment',
      icon: <MessageIcon size={20} color={currentTheme.icon.primary} />,
    },
    {
      type: 'follow_user',
      label: 'New Followers',
      description: 'When someone follows you',
      icon: <UserPlusIcon size={20} color={currentTheme.icon.primary} />,
    },
    {
      type: 'mention',
      label: 'Mentions',
      description: 'When someone mentions you',
      icon: <AtIcon size={20} color={currentTheme.icon.primary} />,
    },
    {
      type: 'echo_post',
      label: 'Echoes',
      description: 'When someone echoes your post',
      icon: <EchoIcon size={20} color={currentTheme.icon.primary} />,
    },
    {
      type: 'trending',
      label: 'Trending',
      description: 'Trending posts and topics',
      icon: <TrendingUpIcon size={20} color={currentTheme.icon.primary} />,
    },
  ];
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);
  
  const handleToggle = (type: NotificationType, channel: 'in_app' | 'push' | 'email') => {
    const newSettings = {
      ...localSettings,
      [type]: {
        ...localSettings[type],
        [channel]: !localSettings[type]?.[channel],
      },
    };
    
    setLocalSettings(newSettings);
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    try {
      // Update each setting
      for (const [type, channels] of Object.entries(localSettings)) {
        for (const [channel, enabled] of Object.entries(channels)) {
          await updateSetting(
            type,
            channel as 'in_app' | 'push' | 'email',
            enabled
          );
        }
      }
      
      setHasChanges(false);
      onClose?.();
    } catch (error) {
      console.error('Save settings error:', error);
    }
  };
  
  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };
  
  const renderChannelToggle = (
    type: NotificationType,
    channel: 'in_app' | 'push' | 'email',
    label: string,
    icon: React.ReactNode
  ) => {
    const enabled = localSettings[type]?.[channel] ?? true;
    
    return (
      <View style={styles.channelToggle}>
        <View style={styles.channelInfo}>
          {icon}
          <Text style={styles.channelLabel}>{label}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={() => handleToggle(type, channel)}
          trackColor={{ 
            false: currentTheme.border.primary, 
            true: channel === 'in_app' ? currentTheme.brand.primary :
                  channel === 'push' ? '#5856D6' : '#FF9500'
          }}
          thumbColor={enabled ? '#FFFFFF' : currentTheme.icon.secondary}
        />
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <BellIcon size={24} color={currentTheme.icon.primary} />
          <Text style={styles.title}>Notification Settings</Text>
        </View>
        <Text style={styles.description}>
          Choose what notifications you want to receive
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        {notificationTypes.map((item) => (
          <View key={item.type} style={styles.notificationType}>
            <View style={styles.typeHeader}>
              <View style={styles.typeIcon}>
                {item.icon}
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeLabel}>{item.label}</Text>
                <Text style={styles.typeDescription}>{item.description}</Text>
              </View>
            </View>
            
            <View style={styles.channels}>
              {renderChannelToggle(
                item.type,
                'in_app',
                'In-App',
                <MessageIcon size={16} color={currentTheme.icon.secondary} />
              )}
              
              {renderChannelToggle(
                item.type,
                'push',
                'Push',
                <BellIcon size={16} color={currentTheme.icon.secondary} />
              )}
              
              {renderChannelToggle(
                item.type,
                'email',
                'Email',
                <MailIcon size={16} color={currentTheme.icon.secondary} />
              )}
            </View>
          </View>
        ))}
        
        {/* Digest Settings */}
        <View style={styles.notificationType}>
          <View style={styles.typeHeader}>
            <View style={styles.typeIcon}>
              <MailIcon size={20} color={currentTheme.icon.primary} />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeLabel}>Email Digests</Text>
              <Text style={styles.typeDescription}>
                Weekly summaries of your activity
              </Text>
            </View>
          </View>
          
          <View style={styles.channels}>
            {renderChannelToggle(
              'weekly_digest',
              'email',
              'Weekly Digest',
              <MailIcon size={16} color={currentTheme.icon.secondary} />
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      {hasChanges && (
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={handleReset}
            style={styles.actionButton}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onPress={handleSave}
            style={styles.actionButton}
            leftIcon={<CheckIcon size={16} color="#FFFFFF" />}
          >
            Save Changes
          </Button>
        </View>
      )}
      
      {!hasChanges && onClose && (
        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={onClose}
            fullWidth
          >
            Done
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.background.primary,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border.primary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: currentTheme.text.primary,
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    color: currentTheme.text.secondary,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notificationType: {
    marginBottom: 24,
    backgroundColor: currentTheme.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: currentTheme.brand.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: currentTheme.text.primary,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: currentTheme.text.secondary,
    lineHeight: 18,
  },
  channels: {
    gap: 12,
  },
  channelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelLabel: {
    fontSize: 14,
    color: currentTheme.text.primary,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: currentTheme.border.primary,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default NotificationMenu;