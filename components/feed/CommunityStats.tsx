import React from 'react';
import { View, Text } from 'react-native';
import { useAdmin } from '@/hooks/useAdmin';

export function CommunityStats() {
  const { stats } = useAdmin();

  const StatItem = ({ value, label, color }: any) => (
    <View className="items-center">
      <Text className={`text-2xl font-bold ${color}`}>
        {value}
      </Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {label}
      </Text>
    </View>
  );

  return (
    <View className="mx-4 mt-4">
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Community Status
        </Text>
        
        <View className="flex-row justify-between">
          <StatItem 
            value={stats?.totalUsers || 0} 
            label="Members" 
            color="text-nebula-600 dark:text-nebula-400" 
          />
          <StatItem 
            value={stats?.activeToday || 0} 
            label="Active Today" 
            color="text-cosmic-600 dark:text-cosmic-400" 
          />
          <StatItem 
            value={stats?.totalPosts || 0} 
            label="Posts" 
            color="text-green-600 dark:text-green-400" 
          />
          <StatItem 
            value={stats?.waitingList || 0} 
            label="Waiting" 
            color="text-orange-600 dark:text-orange-400" 
          />
        </View>
        
        {/* Progress bar for member limit */}
        <View className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              Elite Community
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {stats?.totalUsers || 0}/1,000
            </Text>
          </View>
          <View className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <View 
              className="bg-nebula-500 h-2 rounded-full" 
              style={{ width: `${((stats?.totalUsers || 0) / 1000) * 100}%` }}
            />
          </View>
          <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            🎯 Exclusive community of 1,000 curated members
          </Text>
        </View>
      </View>
    </View>
  );
}