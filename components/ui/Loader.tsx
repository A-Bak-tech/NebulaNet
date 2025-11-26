import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { cn } from '@/utils/helpers';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'small',
  color = '#0ea5e9',
  text,
  className = '',
}) => {
  return (
    <View className={cn('items-center justify-center p-4', className)}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
          {text}
        </Text>
      )}
    </View>
  );
};