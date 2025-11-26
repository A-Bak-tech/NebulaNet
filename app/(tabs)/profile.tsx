import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Edit, Users, Bookmark, BarChart3 } from 'lucide-react-native';
import { Link } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const stats = [
    { label: 'Posts', value: '24' },
    { label: 'Followers', value: '1.2K' },
    { label: 'Following', value: '356' },
  ];

  const menuItems = [
    {
      icon: Edit,
      label: 'Edit Profile',
      href: '/profile/edit',
    },
    {
      icon: Bookmark,
      label: 'Saved Posts',
      href: '/profile/saved',
    },
    {
      icon: Users,
      label: 'Followers',
      href: '/profile/followers',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      href: '/profile/analytics',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
    },
  ];

  if (!user) {
    return (
      <ScreenWrapper>
        <Text>Not authenticated</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header 
        title="Profile" 
        rightAction={
          <Link href="/settings" asChild>
            <TouchableOpacity>
              <Settings size={24} color="#374151" />
            </TouchableOpacity>
          </Link>
        }
      />

      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="p-6 items-center border-b border-gray-200 dark:border-gray-700">
          <Avatar
            source={user.avatar_url}
            name={user.full_name || user.username}
            size="xl"
            className="mb-4"
          />
          
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {user.full_name || user.username}
          </Text>
          
          <Text className="text-gray-500 dark:text-gray-400 mb-4">
            @{user.username}
          </Text>

          {user.bio && (
            <Text className="text-gray-600 dark:text-gray-300 text-center mb-6">
              {user.bio}
            </Text>
          )}

          {/* Stats */}
          <View className="flex-row justify-around w-full mb-6">
            {stats.map((stat, index) => (
              <View key={stat.label} className="items-center">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3 w-full">
            <Button
              title="Edit Profile"
              variant="outline"
              className="flex-1"
              onPress={() => console.log('Edit profile')}
            />
            <Button
              title="Share Profile"
              variant="outline"
              className="flex-1"
              onPress={() => console.log('Share profile')}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View className="p-4">
          {menuItems.map((item, index) => (
            <Link key={item.label} href={item.href} asChild>
              <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-700">
                <item.icon size={20} color="#6b7280" />
                <Text className="text-gray-700 dark:text-gray-300 ml-3 flex-1">
                  {item.label}
                </Text>
                <Text>→</Text>
              </TouchableOpacity>
            </Link>
          ))}

          {/* Logout Button */}
          <TouchableOpacity 
            onPress={signOut}
            className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-700"
          >
            <Text className="text-red-500 font-medium flex-1">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}