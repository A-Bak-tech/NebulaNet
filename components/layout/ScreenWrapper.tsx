import React from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/utils/helpers';

interface ScreenWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  className = '',
}) => {
  const { state: appState } = useAppContext();

  return (
    <View 
      className={cn(
        'flex-1 bg-white dark:bg-gray-900',
        className
      )}
    >
      <StatusBar 
        barStyle={appState.theme === 'dark' ? 'light-content' : 'dark-content'} 
      />
      <SafeAreaView className="flex-1">
        {children}
      </SafeAreaView>
    </View>
  );
};