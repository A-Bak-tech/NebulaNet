import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { AnalyticsCard } from '@/components/admin/AnalyticsCard';
import { Users, Eye, MessageCircle, Share2, TrendingUp, Clock } from 'lucide-react-native';

export default function InsightsScreen() {
  const insights = [
    {
      title: 'Total Users',
      value: '12,456',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Daily Active',
      value: '3,287',
      change: '+12.5%',
      trend: 'up',
      icon: Eye,
    },
    {
      title: 'Posts Today',
      value: '456',
      change: '+5.3%',
      trend: 'up',
      icon: MessageCircle,
    },
    {
      title: 'Engagement Rate',
      value: '24.8%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
    },
    {
      title: 'Avg. Session',
      value: '4.2m',
      change: '+0.3m',
      trend: 'up',
      icon: Clock,
    },
    {
      title: 'Shares',
      value: '1,234',
      change: '+15.7%',
      trend: 'up',
      icon: Share2,
    },
  ];

  return (
    <ScreenWrapper>
      <Header title="Platform Insights" showBack />
      
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Insights Grid */}
          <View className="grid grid-cols-2 gap-4 mb-6">
            {insights.map((insight, index) => (
              <AnalyticsCard
                key={index}
                title={insight.title}
                value={insight.value}
                change={insight.change}
                trend={insight.trend as 'up' | 'down'}
                icon={insight.icon}
              />
            ))}
          </View>

          {/* Additional Analytics */}
          <View className="space-y-6">
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                User Growth
              </Text>
              <View className="items-center justify-center h-40 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <TrendingUp size={48} color="#6b7280" />
                <Text className="text-gray-500 dark:text-gray-400 mt-2">
                  Growth chart visualization
                </Text>
              </View>
            </View>

            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Content Performance
              </Text>
              <View className="items-center justify-center h-40 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <MessageCircle size={48} color="#6b7280" />
                <Text className="text-gray-500 dark:text-gray-400 mt-2">
                  Performance metrics
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}