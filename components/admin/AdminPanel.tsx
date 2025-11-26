import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { 
  BarChart3, 
  Shield, 
  Users, 
  Clock, 
  Sparkles, 
  Settings,
  AlertTriangle,
  TrendingUp
} from 'lucide-react-native';

export const AdminPanel: React.FC = () => {
  const adminCards = [
    {
      title: 'AI Dashboard',
      description: 'Monitor AI performance and usage',
      icon: Sparkles,
      href: '/admin/ai-dashboard',
      color: 'bg-purple-500',
    },
    {
      title: 'Content Moderation',
      description: 'Review and manage user content',
      icon: Shield,
      href: '/admin/moderation',
      color: 'bg-blue-500',
    },
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'bg-green-500',
    },
    {
      title: 'Waitlist Management',
      description: 'Manage beta waitlist entries',
      icon: Clock,
      href: '/admin/waitlist-management',
      color: 'bg-yellow-500',
    },
    {
      title: 'Platform Insights',
      description: 'View analytics and metrics',
      icon: BarChart3,
      href: '/admin/insights',
      color: 'bg-indigo-500',
    },
    {
      title: 'System Health',
      description: 'Monitor system performance',
      icon: TrendingUp,
      href: '/admin/health',
      color: 'bg-red-500',
    },
  ];

  const quickStats = [
    { label: 'Pending Moderation', value: '24', color: 'text-yellow-600' },
    { label: 'New Users Today', value: '156', color: 'text-green-600' },
    { label: 'AI Requests', value: '2.4K', color: 'text-purple-600' },
    { label: 'Waitlist', value: '1.2K', color: 'text-blue-600' },
  ];

  return (
    <View className="flex-1 p-4">
      {/* Welcome Section */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </Text>
        <Text className="text-gray-600 dark:text-gray-400">
          Manage your NebulaNet platform and monitor performance
        </Text>
      </View>

      {/* Quick Stats */}
      <View className="grid grid-cols-2 gap-4 mb-6">
        {quickStats.map((stat, index) => (
          <View
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <Text className={`text-2xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Admin Cards */}
      <ScrollView className="flex-1">
        <View className="grid grid-cols-1 gap-4 pb-4">
          {adminCards.map((card, index) => (
            <Link key={card.title} href={card.href} asChild>
              <TouchableOpacity className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center space-x-4">
                  <View className={`${card.color} p-3 rounded-lg`}>
                    <card.icon size={24} color="white" />
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {card.title}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-gray-400">
                      {card.description}
                    </Text>
                  </View>
                  
                  <View className="p-2">
                    <Text className="text-gray-400">→</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>

      {/* System Status */}
      <View className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
          <Text className="text-green-800 dark:text-green-200 font-medium">
            All systems operational
          </Text>
        </View>
        <Text className="text-green-700 dark:text-green-300 text-sm mt-1">
          Last checked: Just now
        </Text>
      </View>
    </View>
  );
};