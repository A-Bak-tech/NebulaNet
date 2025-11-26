import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { cn } from '@/utils/helpers';

interface AnalyticsCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  className?: string;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  className = '',
}) => {
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <View
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </Text>
        <Icon size={16} color="#6b7280" />
      </View>

      <View className="flex-row items-end justify-between">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </Text>
        
        <View className="flex-row items-center">
          <TrendIcon 
            size={14} 
            color={isPositive ? '#10b981' : '#ef4444'} 
          />
          <Text
            className={cn(
              'text-sm font-medium ml-1',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {change}
          </Text>
        </View>
      </View>
    </View>
  );
};