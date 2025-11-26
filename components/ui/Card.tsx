import React from 'react';
import { View } from 'react-native';
import { cn } from '@/utils/helpers';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 shadow-sm',
    outlined: 'border border-gray-200 dark:border-gray-700',
  };

  return (
    <View
      className={cn(
        'rounded-lg p-4',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </View>
  );
};