// File: /components/layout/BottomNav.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { SIZES, SPACING, isTablet, responsiveSize } from '../../constants/Layout';
import { currentTheme } from '../../constants/Colors';

// Import icons (create these as SVG components)
import HomeIcon from '../../assets/icons/home';
import SearchIcon from '../../assets/icons/search';
import PlusIcon from '../../assets/icons/plus';
import BellIcon from '../../assets/icons/notification';
import UserIcon from '../../assets/icons/user';

// Import NotificationBadge
import NotificationBadge from '../notifications/NotificationBadge';

const { width } = Dimensions.get('window');

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  route: string;
  isSpecial?: boolean; // For the center "Create" button
  withBadge?: boolean; // For notifications badge
}

const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  const navItems: NavItem[] = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: HomeIcon, 
      route: '/(tabs)' 
    },
    { 
      id: 'search', 
      label: 'Explore', 
      icon: SearchIcon, 
      route: '/(tabs)/search' 
    },
    { 
      id: 'create', 
      label: '', 
      icon: PlusIcon, 
      route: '/(tabs)/create',
      isSpecial: true 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: BellIcon, 
      route: '/(tabs)/notifications',
      withBadge: true 
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: UserIcon, 
      route: '/(tabs)/profile' 
    },
  ];
  
  const isActive = (route: string) => {
    return pathname === route || pathname.startsWith(route + '/');
  };
  
  // Calculate responsive sizes
  const tabBarHeight = isTablet ? SIZES.BOTTOM_TAB_HEIGHT * 1.2 : SIZES.BOTTOM_TAB_HEIGHT;
  const iconSize = isTablet ? SIZES.BOTTOM_TAB_ICON_SIZE * 1.2 : SIZES.BOTTOM_TAB_ICON_SIZE;
  const createButtonSize = responsiveSize(56);
  
  return (
    <View 
      style={{ 
        height: tabBarHeight,
        paddingBottom: SPACING.sm,
      }}
      className="flex-row border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
    >
      {navItems.map((item) => {
        const active = isActive(item.route);
        
        if (item.isSpecial) {
          // Center "Create" button (Twitter-like)
          return (
            <View 
              key={item.id}
              className="flex-1 items-center justify-center relative"
            >
              <TouchableOpacity
                activeOpacity={0.7}
                className="absolute -top-6"
                style={{
                  width: createButtonSize,
                  height: createButtonSize,
                }}
                onPress={() => router.push(item.route as any)}
              >
                <View 
                  className="flex-1 rounded-full bg-purple-600 dark:bg-purple-500 items-center justify-center shadow-lg"
                  style={{
                    shadowColor: '#7C3AED',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <item.icon 
                    color="#FFFFFF" 
                    size={iconSize * 1.2}
                  />
                </View>
              </TouchableOpacity>
            </View>
          );
        }
        
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            className="flex-1 items-center justify-center"
            onPress={() => router.push(item.route as any)}
          >
            <View className="items-center relative">
              {item.withBadge ? (
                // Use NotificationBadge component for notifications
                <NotificationBadge
                  showCount={false}
                  animated={true}
                  onPress={() => router.push(item.route as any)}
                />
              ) : (
                // Regular icon for other tabs
                <item.icon
                  color={active ? '#7C3AED' : '#64748B'}
                  size={iconSize}
                />
              )}
              
              <Text
                style={{ 
                  fontSize: responsiveSize(11),
                  marginTop: SPACING.xs,
                }}
                className={`${
                  active
                    ? 'text-purple-600 dark:text-purple-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {item.label}
              </Text>
              
              {/* Active indicator dot */}
              {active && !item.withBadge && (
                <View 
                  className="absolute -top-1"
                  style={{
                    width: responsiveSize(4),
                    height: responsiveSize(4),
                    borderRadius: responsiveSize(2),
                    backgroundColor: '#7C3AED',
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNav;