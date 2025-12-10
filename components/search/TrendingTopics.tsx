// File: /components/search/TrendingTopics.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingTopic } from '../../types/search';
import { 
  FireIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  MoreIcon,
} from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';

interface TrendingTopicsProps {
  topics: TrendingTopic[];
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  maxItems?: number;
  showHeader?: boolean;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({
  topics,
  onRefresh,
  isLoading = false,
  maxItems = 10,
  showHeader = true,
}) => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTopicPress = (tag: string) => {
    router.push(`/search?q=${encodeURIComponent(`#${tag}`)}&type=posts`);
  };

  const handleSeeAll = () => {
    router.push('/trending');
  };

  const displayedTopics = expanded ? topics : topics.slice(0, maxItems);

  if (topics.length === 0 && !isLoading) {
    return null;
  }

  return (
    <View className="mb-4">
      {showHeader && (
        <View className="flex-row items-center justify-between px-4 mb-2">
          <View className="flex-row items-center">
            <FireIcon size={20} color="#FF9500" />
            <Text className="text-text-primary font-semibold text-lg ml-2">
              Trending Now
            </Text>
          </View>
          
          {topics.length > maxItems && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text className="text-brand-primary text-sm">
                {expanded ? 'Show less' : 'See all'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[currentTheme.brand.primary]}
              tintColor={currentTheme.brand.primary}
            />
          ) : undefined
        }
      >
        {displayedTopics.map((topic, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const isGrowing = topic.growth > 0;
          
          return (
            <TouchableOpacity
              key={topic.tag}
              className={`mr-3 rounded-xl p-3 ${
                isTop3 ? 'bg-gradient-to-br from-orange-50 to-amber-50' : 'bg-surface'
              } border border-border min-w-[140]`}
              onPress={() => handleTopicPress(topic.tag)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className={`w-6 h-6 rounded-full items-center justify-center ${
                  isTop3 ? 'bg-brand-primary' : 'bg-surface-light'
                }`}>
                  <Text className={`text-xs font-bold ${
                    isTop3 ? 'text-white' : 'text-text-secondary'
                  }`}>
                    {rank}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  {isGrowing ? (
                    <TrendingUpIcon size={14} color="#4CD964" />
                  ) : (
                    <TrendingDownIcon size={14} color="#FF3B30" />
                  )}
                  <Text className={`text-xs ml-1 ${
                    isGrowing ? 'text-[#4CD964]' : 'text-[#FF3B30]'
                  }`}>
                    {Math.abs(topic.growth)}%
                  </Text>
                </View>
              </View>
              
              <Text className="text-text-primary font-semibold text-base mb-1">
                #{topic.tag}
              </Text>
              
              <Text className="text-text-secondary text-sm">
                {topic.count.toLocaleString()} post{topic.count !== 1 ? 's' : ''}
              </Text>
              
              {topic.posts && topic.posts.length > 0 && (
                <View className="mt-2">
                  <Text className="text-text-tertiary text-xs" numberOfLines={2}>
                    {topic.posts[0]?.content?.substring(0, 60)}...
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {showHeader && topics.length > 0 && (
        <TouchableOpacity
          className="mt-3 px-4 py-2 items-center"
          onPress={handleSeeAll}
        >
          <Text className="text-brand-primary text-sm font-medium">
            View all trending topics →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TrendingTopics;