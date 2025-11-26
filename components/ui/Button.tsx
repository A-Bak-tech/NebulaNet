import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { cn } from '@/utils/helpers';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
}) => {
  const baseClasses = 'flex-row items-center justify-center rounded-lg font-semibold';
  
  const variantClasses = {
    primary: 'bg-primary-500 border border-primary-500',
    secondary: 'bg-nebula-500 border border-nebula-500',
    outline: 'bg-transparent border border-gray-300',
    destructive: 'bg-red-500 border border-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-gray-700 dark:text-gray-300',
    destructive: 'text-white',
  };

  const disabledClasses = 'opacity-50';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && disabledClasses,
        className
      )}
    >
      {loading && <ActivityIndicator size="small" className="mr-2" color="white" />}
      <Text className={cn('font-semibold', textClasses[variant])}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};