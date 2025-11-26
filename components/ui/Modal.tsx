import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { cn } from '@/utils/helpers';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  if (!visible) return null;

  const sizeClasses = {
    sm: 'w-11/12 max-w-sm',
    md: 'w-11/12 max-w-md',
    lg: 'w-11/12 max-w-lg',
  };

  return (
    <View className="absolute inset-0 z-50">
      <BlurView intensity={50} className="flex-1 justify-center items-center p-4">
        <TouchableOpacity 
          className="absolute inset-0" 
          onPress={onClose}
        />
        
        <View className={cn(
          'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700',
          sizeClasses[size]
        )}>
          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              {title && (
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </Text>
              )}
              
              {showCloseButton && (
                <TouchableOpacity 
                  onPress={onClose}
                  className="p-1 rounded-full bg-gray-100 dark:bg-gray-700"
                >
                  <X size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Content */}
          <View className="p-4">
            {children}
          </View>
        </View>
      </BlurView>
    </View>
  );
};