import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { AnalyticsCard } from '@/components/admin/AnalyticsCard';
import { BarChart, PieChart, TrendingUp, Users, MessageCircle, Sparkles } from 'lucide-react-native';

export default function AIDashboardScreen() {
  const aiMetrics = [
    {
      title: 'AI Enhancements',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      icon: Sparkles,
    },
    {
      title: 'Content Moderation',
      value: '856',
      change: '+5%',
      trend: 'up',
      icon: MessageCircle,
    },
    {
      title: 'User Suggestions',
      value: '2,567',
      change: '+23%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Accuracy Rate',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  return (
    <ScreenWrapper>
      <Header title="AI Dashboard" showBack />
      
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* AI Metrics Grid */}
          <View className="grid grid-cols-2 gap-4 mb-6">
            {aiMetrics.map((metric, index) => (
              <AnalyticsCard
                key={index}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                trend={metric.trend as 'up' | 'down'}
                icon={metric.icon}
              />
            ))}
          </View>

          {/* AI Usage Charts */}
          <View className="space-y-6">
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI Usage Over Time
              </Text>
              <View className="items-center justify-center h-40 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <BarChart size={48} color="#6b7280" />
                <Text className="text-gray-500 dark:text-gray-400 mt-2">
                  Usage chart visualization
                </Text>
              </View>
            </View>

            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI Feature Distribution
              </Text>
              <View className="items-center justify-center h-40 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <PieChart size={48} color="#6b7280" />
                <Text className="text-gray-500 dark:text-gray-400 mt-2">
                  Feature distribution chart
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}