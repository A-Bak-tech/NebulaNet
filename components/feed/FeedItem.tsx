import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { formatRelativeTime } from '@/utils/date';

interface FeedItemProps {
  type: 'post' | 'like' | 'comment' | 'follow';
  user: {
    name: string;
    username: string;
    avatar?: string;
  };
  content?: string;
  target?: string;
  timestamp: string;
  isRead: boolean;
  onPress?: () => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({
  type,
  user,
  content,
  target,
  timestamp,
  isRead,
  onPress,
}) => {
  const getActionText = () => {
    switch (type) {
      case 'post':
        return 'created a new post';
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      default:
        return 'performed an action';
    }
  };

  const getIcon = () => {
    // You can add icons here based on type
    return null;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={cn(
        'p-4 border-b border-gray-100 dark:border-gray-700',
        !isRead && 'bg-blue-50 dark:bg-blue-900/20'
      )}
    >
      <View className="flex-row space-x-3">
        <Avatar
          source={user.avatar}
          name={user.name}
          size="md"
        />
        
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap mb-1">
            <Text className="font-semibold text-gray-900 dark:text-white mr-1">
              {user.name}
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              {getActionText()}
            </Text>
            {target && (
              <Text className="text-gray-900 dark:text-white font-medium ml-1">
                {target}
              </Text>
            )}
          </View>

          {content && (
            <Text 
              className="text-gray-600 dark:text-gray-400 text-sm mb-2"
              numberOfLines={2}
            >
              {content}
            </Text>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="text-gray-400 dark:text-gray-500 text-xs">
              {formatRelativeTime(timestamp)}
            </Text>
            
            {!isRead && (
              <View className="w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};