// components/layout/ScreenWrapper.tsx
import React from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_IOS } from '../../constants/Layout';
import { currentTheme } from '../../constants/Colors';

interface ScreenWrapperProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
  withHeader?: boolean;
  withBottomNav?: boolean;
  withKeyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  backgroundColor?: string;
  statusBarStyle?: 'dark-content' | 'light-content';
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  className = '',
  scrollable = false,
  withHeader = false,
  withBottomNav = false,
  withKeyboardAvoiding = false,
  keyboardVerticalOffset = 0,
  backgroundColor = 'bg-background',
  statusBarStyle = 'light-content',
}) => {
  const insets = useSafeAreaInsets();
  
  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        className: 'flex-1',
        contentContainerStyle: { flexGrow: 1 },
      }
    : { className: 'flex-1' };

  const renderContent = () => (
    <View className={`flex-1 ${backgroundColor} ${className}`}>
      {/* Status Bar Background for Android */}
      {Platform.OS === 'android' && (
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={currentTheme.background}
        />
      )}
      
      {/* iOS Status Bar */}
      {Platform.OS === 'ios' && (
        <StatusBar barStyle={statusBarStyle} />
      )}
      
      {/* Safe Area Top */}
      {withHeader && (
        <View style={{ height: insets.top }} className="bg-background" />
      )}
      
      {/* Main Content */}
      <Container {...containerProps}>
        {children}
      </Container>
      
      {/* Safe Area Bottom */}
      {withBottomNav && (
        <View style={{ height: insets.bottom }} className="bg-transparent" />
      )}
    </View>
  );

  if (withKeyboardAvoiding && IS_IOS) {
    return (
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
        className="flex-1"
      >
        {renderContent()}
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      {renderContent()}
    </SafeAreaView>
  );
};

export default ScreenWrapper;