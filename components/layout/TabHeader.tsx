// components/layout/TabHeader.tsx
import React from 'react';
import { usePathname } from 'expo-router';
import Header from './Header';

const TabHeader = () => {
  const pathname = usePathname();
  
  // Determine which tab is active and show appropriate header
  const getHeaderProps = () => {
    switch (pathname) {
      case '/(tabs)':
      case '/(tabs)/index':
        return {
          showLogo: true,
          showMessages: true,
          showNotifications: true,
          showSettings: true,
          elevated: true,
        };
        
      case '/(tabs)/search':
        return {
          title: "Search",
          showSearch: true,
          rightAction: {
            text: "Filters",
          },
        };
        
      case '/(tabs)/notifications':
        return {
          title: "Notifications",
          showBackButton: true,
          rightAction: {
            text: "Settings",
          },
        };
        
      case '/(tabs)/profile':
        return {
          title: "Profile",
          showBackButton: true,
          showSettings: true,
        };
        
      default:
        return {
          showLogo: true,
          showBackButton: true,
        };
    }
  };
  
  return <Header {...getHeaderProps()} />;
};

export default TabHeader;