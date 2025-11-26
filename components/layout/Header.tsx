import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Menu } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
  onMenuPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showLogo = false,
  rightAction,
  onMenuPress,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <View className="flex-row items-center flex-1">
        {showBack ? (
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
        ) : onMenuPress ? (
          <TouchableOpacity onPress={onMenuPress} className="mr-3">
            <Menu size={24} color="#374151" />
          </TouchableOpacity>
        ) : null}

        {showLogo ? (
          <View className="flex-row items-center">
            <View className="w-6 h-6 bg-nebula-500 rounded-lg mr-2" />
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              NebulaNet
            </Text>
          </View>
        ) : (
          <Text className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </Text>
        )}
      </View>

      {rightAction && (
        <View className="flex-1 items-end">
          {rightAction}
        </View>
      )}
    </View>
  );
};