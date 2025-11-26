import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/utils/helpers';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-primary-500 border-primary-500',
    secondary: 'bg-gray-500 border-gray-500',
    destructive: 'bg-red-500 border-red-500',
    outline: 'border border-gray-300 bg-transparent',
    success: 'bg-green-500 border-green-500',
  };

  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2',
  };

  const textClasses = {
    default: 'text-white',
    secondary: 'text-white',
    destructive: 'text-white',
    outline: 'text-gray-700 dark:text-gray-300',
    success: 'text-white',
  };

  return (
    <View
      className={cn(
        'rounded-full border items-center justify-center',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      <Text
        className={cn(
          'font-medium text-xs',
          textClasses[variant]
        )}
      >
        {children}
      </Text>
    </View>
  );
};