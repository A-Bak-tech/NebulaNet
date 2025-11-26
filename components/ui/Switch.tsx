import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { cn } from '@/utils/helpers';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  className = '',
}) => {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      className={cn(
        'w-12 h-6 rounded-full p-1',
        value ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600',
        disabled && 'opacity-50',
        className
      )}
    >
      <View
        className={cn(
          'w-4 h-4 rounded-full bg-white transform transition-transform',
          value ? 'translate-x-6' : 'translate-x-0'
        )}
      />
    </TouchableOpacity>
  );
};