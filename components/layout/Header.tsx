// components/layout/Header.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SIZES, SPACING, responsiveSize, IS_IOS } from '../../constants/Layout';
import { currentTheme } from '../../constants/Colors';
import { 
  SearchIcon, 
  SettingsIcon, 
  MessageIcon,
  NotificationIcon 
} from '../../assets/icons';

// Import your logo
const logo = require('../../assets/images/icon.png');

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  rightAction?: {
    icon?: React.ReactNode;
    text?: string;
    onPress?: () => void;
  };
  leftAction?: {
    icon?: React.ReactNode;
    text?: string;
    onPress?: () => void;
  };
  centerTitle?: boolean;
  transparent?: boolean;
  elevated?: boolean;
  showSearch?: boolean;
  onSearchPress?: () => void;
  showSettings?: boolean;
  onSettingsPress?: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationPress?: () => void;
  showMessages?: boolean;
  onMessagesPress?: () => void;
  backgroundColor?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  showLogo = true,
  rightAction,
  leftAction,
  centerTitle = true,
  transparent = false,
  elevated = true,
  showSearch = false,
  onSearchPress,
  showSettings = false,
  onSettingsPress,
  showNotifications = false,
  notificationCount = 0,
  onNotificationPress,
  showMessages = false,
  onMessagesPress,
  backgroundColor,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };
  
  const renderLogo = () => (
    <View className="items-center justify-center">
      <Image
        source={logo}
        style={{
          width: responsiveSize(32),
          height: responsiveSize(32),
          resizeMode: 'contain',
        }}
        className="rounded-lg"
      />
    </View>
  );
  
  const renderTitle = () => {
    if (!title) return null;
    
    return (
      <Text
        style={{ 
          fontSize: SIZES.H3,
          fontWeight: '700',
          lineHeight: SIZES.H3 * 1.2,
        }}
        className="text-text-primary"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
    );
  };
  
  const renderBackButton = () => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleBack}
      className="p-2 -ml-2"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <View className="flex-row items-center">
        <Text 
          style={{ fontSize: responsiveSize(24) }}
          className="text-text-primary"
        >
          ←
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderLeftAction = () => {
    if (leftAction) {
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={leftAction.onPress}
          className="p-2 -ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {leftAction.icon ? (
            leftAction.icon
          ) : leftAction.text ? (
            <Text 
              style={{ fontSize: SIZES.BODY }}
              className="text-brand-primary font-semibold"
            >
              {leftAction.text}
            </Text>
          ) : null}
        </TouchableOpacity>
      );
    }
    
    if (showBackButton) {
      return renderBackButton();
    }
    
    if (showLogo && !title) {
      return renderLogo();
    }
    
    return <View style={{ width: responsiveSize(40) }} />;
  };
  
  const renderRightActions = () => {
    const actions = [];
    
    // Search icon
    if (showSearch && onSearchPress) {
      actions.push(
        <TouchableOpacity
          key="search"
          activeOpacity={0.7}
          onPress={onSearchPress}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Search"
          accessibilityRole="button"
        >
          <SearchIcon size={SIZES.ICON.MD} color={currentTheme.icon.primary} />
        </TouchableOpacity>
      );
    }
    
    // Messages icon
    if (showMessages && onMessagesPress) {
      actions.push(
        <TouchableOpacity
          key="messages"
          activeOpacity={0.7}
          onPress={onMessagesPress}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Messages"
          accessibilityRole="button"
        >
          <MessageIcon size={SIZES.ICON.MD} color={currentTheme.icon.primary} />
        </TouchableOpacity>
      );
    }
    
    // Notifications icon with badge
    if (showNotifications && onNotificationPress) {
      actions.push(
        <TouchableOpacity
          key="notifications"
          activeOpacity={0.7}
          onPress={onNotificationPress}
          className="p-2 relative"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Notifications"
          accessibilityRole="button"
        >
          <NotificationIcon size={SIZES.ICON.MD} color={currentTheme.icon.primary} />
          {notificationCount > 0 && (
            <View
              className="absolute top-1 right-1 bg-status-error rounded-full items-center justify-center border-2 border-surface"
              style={{
                minWidth: responsiveSize(18),
                minHeight: responsiveSize(18),
                paddingHorizontal: SPACING.xs,
              }}
            >
              <Text
                style={{ fontSize: responsiveSize(10) }}
                className="text-white font-bold"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
    
    // Settings icon
    if (showSettings && onSettingsPress) {
      actions.push(
        <TouchableOpacity
          key="settings"
          activeOpacity={0.7}
          onPress={onSettingsPress}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <SettingsIcon size={SIZES.ICON.MD} color={currentTheme.icon.primary} />
        </TouchableOpacity>
      );
    }
    
    // Custom right action
    if (rightAction) {
      actions.push(
        <TouchableOpacity
          key="custom-action"
          activeOpacity={0.7}
          onPress={rightAction.onPress}
          className="p-2 -mr-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {rightAction.icon ? (
            rightAction.icon
          ) : rightAction.text ? (
            <Text 
              style={{ fontSize: SIZES.BODY }}
              className="text-brand-primary font-semibold"
            >
              {rightAction.text}
            </Text>
          ) : null}
        </TouchableOpacity>
      );
    }
    
    if (actions.length === 0) {
      return <View style={{ width: responsiveSize(40) }} />;
    }
    
    return (
      <View className="flex-row items-center">
        {actions}
      </View>
    );
  };
  
  const renderCenterContent = () => {
    if (centerTitle && title) {
      return renderTitle();
    }
    
    if (showLogo && title) {
      return (
        <View className="flex-row items-center">
          <Image
            source={logo}
            style={{
              width: responsiveSize(28),
              height: responsiveSize(28),
              resizeMode: 'contain',
              marginRight: SPACING.sm,
            }}
            className="rounded-lg"
          />
          {renderTitle()}
        </View>
      );
    }
    
    if (!title && showLogo) {
      return renderLogo();
    }
    
    return null;
  };
  
  // Custom background or default
  const bgColor = backgroundColor || 
    (transparent ? 'bg-transparent' : 'bg-surface/95');
  
  const headerHeight = Platform.select({
    ios: SIZES.HEADER_HEIGHT,
    android: SIZES.HEADER_HEIGHT - SPACING.sm,
  });
  
  return (
    <View
      style={{
        height: headerHeight,
        paddingHorizontal: SPACING.md,
        paddingTop: IS_IOS ? 0 : SPACING.xs,
      }}
      className={`flex-row items-center justify-between ${bgColor} ${
        elevated 
          ? 'border-b border-border' 
          : ''
      } backdrop-blur-md`}
    >
      {/* Left Section */}
      <View style={{ minWidth: responsiveSize(56) }}>
        {renderLeftAction()}
      </View>
      
      {/* Center Section */}
      <View className="flex-1 items-center justify-center px-2">
        {renderCenterContent()}
      </View>
      
      {/* Right Section */}
      <View style={{ minWidth: responsiveSize(56) }}>
        {renderRightActions()}
      </View>
    </View>
  );
};

export default Header;