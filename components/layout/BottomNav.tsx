import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react-native';
import { cn } from '@/utils/helpers';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/(tabs)',
      matches: ['/(tabs)', '/(tabs)/index'],
    },
    {
      icon: Search,
      label: 'Search',
      href: '/(tabs)/search',
      matches: ['/(tabs)/search'],
    },
    {
      icon: PlusCircle,
      label: 'Create',
      href: '/(tabs)/create',
      matches: ['/(tabs)/create'],
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/(tabs)/notifications',
      matches: ['/(tabs)/notifications'],
    },
    {
      icon: User,
      label: 'Profile',
      href: '/(tabs)/profile',
      matches: ['/(tabs)/profile'],
    },
  ];

  const isActive = (item: typeof navItems[0]) => {
    return item.matches.some(match => pathname === match);
  };

  return (
    <View className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 pb-8 pt-2">
      <View className="flex-row justify-around items-center">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.href as any)}
              className="items-center space-y-1 flex-1"
            >
              <Icon
                size={24}
                color={active ? '#0ea5e9' : '#6b7280'}
                fill={active ? '#0ea5e9' : 'transparent'}
              />
              <Text
                className={cn(
                  'text-xs',
                  active
                    ? 'text-primary-500 font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};