// File: /components/search/TagCard.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { TrendingUpIcon, FireIcon } from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';

interface TagCardProps {
  tag: {
    name: string;
    count: number;
    growth?: number;
    latest_post_id?: string;
    latest_post_time?: string;
  };
  onPress: () => void;
  compact?: boolean;
}

const TagCard: React.FC<TagCardProps> = ({ tag, onPress, compact = false }) => {
  const isTrending = tag.growth && tag.growth > 50;
  const isHot = tag.count > 1000;

  return (
    <TouchableOpacity
      className={`px-4 py-3 border-b border-border active:opacity-70 ${
        compact ? '' : 'bg-surface'
      }`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-brand-primary text-lg font-semibold">
              #{tag.name}
            </Text>
            {(isTrending || isHot) && (
              <View className="ml-2 flex-row items-center">
                {isHot && (
                  <View className="flex-row items-center mr-2">
                    <FireIcon size={14} color="#FF9500" />
                    <Text className="text-[#FF9500] text-xs ml-1">Hot</Text>
                  </View>
                )}
                {isTrending && (
                  <View className="flex-row items-center">
                    <TrendingUpIcon size={14} color="#4CD964" />
                    <Text className="text-[#4CD964] text-xs ml-1">
                      +{tag.growth}%
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          
          <Text className="text-text-secondary text-sm mt-1">
            {tag.count.toLocaleString()} post{tag.count !== 1 ? 's' : ''}
          </Text>
          
          {tag.latest_post_time && !compact && (
            <Text className="text-text-tertiary text-xs mt-1">
              Latest post {formatTimeAgo(tag.latest_post_time)}
            </Text>
          )}
        </View>
        
        {!compact && (
          <View className="ml-4">
            <Text className="text-brand-primary text-sm font-medium">
              Explore
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

export default TagCard;