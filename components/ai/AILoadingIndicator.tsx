import React from 'react';
import { View, Text } from 'react-native';
import { Loader } from '../ui/Loader';
import { Sparkles } from 'lucide-react-native';

interface AILoadingIndicatorProps {
  message?: string;
  subMessage?: string;
}

export const AILoadingIndicator: React.FC<AILoadingIndicatorProps> = ({
  message = "AI is thinking...",
  subMessage,
}) => {
  return (
    <View className="items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <View className="flex-row items-center mb-3">
        <Sparkles size={24} color="#8b5cf6" className="mr-2" />
        <Loader size="small" color="#8b5cf6" />
      </View>
      <Text className="font-medium text-gray-900 dark:text-white text-center mb-1">
        {message}
      </Text>
      {subMessage && (
        <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
          {subMessage}
        </Text>
      )}
    </View>
  );
};