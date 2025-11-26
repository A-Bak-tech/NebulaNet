import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, Hash } from 'lucide-react-native';

interface TrendingTopic {
  id: string;
  name: string;
  postCount: number;
  growth: number;
}

interface TrendingTopicsProps {
  topics: TrendingTopic[];
  onTopicPress?: (topicId: string) => void;
}

export const TrendingTopics: React.FC<TrendingTopicsProps> = ({
  topics,
  onTopicPress,
}) => {
  if (topics.length === 0) return null;

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <View className="flex-row items-center mb-4">
        <TrendingUp size={20} color="#6b7280" />
        <Text className="font-semibold text-gray-900 dark:text-white ml-2">
          Trending Topics
        </Text>
      </View>

      <View className="space-y-3">
        {topics.map((topic, index) => (
          <TouchableOpacity
            key={topic.id}
            onPress={() => onTopicPress?.(topic.id)}
            className="flex-row items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-gray-500 dark:text-gray-400 font-mono text-sm mr-3">
                #{index + 1}
              </Text>
              
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Hash size={14} color="#6b7280" />
                  <Text className="font-medium text-gray-900 dark:text-white ml-1">
                    {topic.name}
                  </Text>
                </div>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">
                  {topic.postCount.toLocaleString()} posts
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <TrendingUp 
                size={12} 
                color={topic.growth > 0 ? '#10b981' : '#ef4444'} 
              />
              <Text
                className={cn(
                  'text-xs font-medium ml-1',
                  topic.growth > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {topic.growth > 0 ? '+' : ''}{topic.growth}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};