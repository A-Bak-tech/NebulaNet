import React from 'react';
import { View, Text, Image } from 'react-native';
import { cn } from '@/utils/helpers';

interface AvatarProps {
  source?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const backgroundColor = 'bg-primary-500';

  return (
    <View
      className={cn(
        'rounded-full items-center justify-center overflow-hidden',
        sizeClasses[size],
        backgroundColor,
        className
      )}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : name ? (
        <Text
          className={cn(
            'text-white font-semibold',
            textSizes[size]
          )}
        >
          {getInitials(name)}
        </Text>
      ) : (
        <Text
          className={cn(
            'text-white font-semibold',
            textSizes[size]
          )}
        >
          ?
        </Text>
      )}
    </View>
  );
};