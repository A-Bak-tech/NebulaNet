import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { 
  Home, 
  Search, 
  PlusCircle, 
  Bell, 
  User,
  Settings
} from 'lucide-react-native';

interface AdminBottomNavProps {
  onMenuPress: () => void;
}

const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ onMenuPress }) => {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeColors();

  const tabs = [
    {
      id: 'home',
      icon: Home,
      route: '/(tabs)',
      label: 'Home',
    },
    {
      id: 'search',
      icon: Search,
      route: '/(tabs)/search',
      label: 'Search',
    },
    {
      id: 'create',
      icon: PlusCircle,
      route: '/(tabs)/create',
      label: 'Create',
    },
    {
      id: 'notifications',
      icon: Bell,
      route: '/(tabs)/notifications',
      label: 'Notifications',
    },
    {
      id: 'menu',
      icon: Settings,
      action: onMenuPress,
      label: 'Menu',
    },
  ];

  const isActive = (route: string) => {
    if (route === '/(tabs)' && pathname === '/(tabs)') return true;
    if (route === '/(tabs)' && pathname === '/') return true;
    return pathname === route;
  };

  const handlePress = (tab: any) => {
    if (tab.action) {
      tab.action();
    } else {
      router.push(tab.route);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: colors.ui.separator,
      paddingBottom: 20,
      paddingTop: 12,
      paddingHorizontal: 16,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      padding: 8,
      borderRadius: 20,
    },
    activeIconContainer: {
      backgroundColor: colors.ui.primaryLight,
    },
    adminBadge: {
      position: 'absolute',
      top: 4,
      right: 20,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.status.warning,
    },
  });

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.route);
        const isMenuButton = tab.id === 'menu';
        
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => handlePress(tab)}
          >
            <View style={[
              styles.iconContainer,
              active && styles.activeIconContainer
            ]}>
              <Icon 
                size={24} 
                color={active ? colors.ui.primary : colors.icon.secondary} 
                fill={active ? colors.ui.primary : 'none'}
              />
            </View>
            
            {isMenuButton && <View style={styles.adminBadge} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default AdminBottomNav;