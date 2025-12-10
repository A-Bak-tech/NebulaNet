// File: /components/search/SearchResults.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SearchResult, SearchType } from '../../types/search';
import PostCard from '../post/PostCard';
import { UserCard } from '../feed/UserCard';
import { TagCard } from '../search/TagCard';
import { currentTheme } from '../../constants/Colors';
import { EmptyState } from '../ui/EmptyState';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  type: SearchType;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  type,
  isLoading,
  hasMore,
  onLoadMore,
  onRefresh,
  refreshing = false,
}) => {
  const router = useRouter();

  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleUserPress = (userId: string) => {
    router.push(`/profile?id=${userId}`);
  };

  const handleTagPress = (tag: string) => {
    router.push(`/search?q=${encodeURIComponent(`#${tag}`)}&type=posts`);
  };

  const renderItem: ListRenderItem<SearchResult> = ({ item }) => {
    switch (item.type) {
      case 'post':
        return (
          <PostCard
            post={item.data}
            onPress={() => handlePostPress(item.id)}
            compact
          />
        );
      
      case 'user':
        return (
          <UserCard
            user={item.data}
            onPress={() => handleUserPress(item.id)}
            showFollowButton
          />
        );
      
      case 'tag':
        return (
          <TagCard
            tag={item.data}
            onPress={() => handleTagPress(item.data.name)}
          />
        );
      
      default:
        return null;
    }
  };

  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <EmptyState
        title={query ? 'No results found' : 'Start searching'}
        description={
          query
            ? `No ${type === 'all' ? '' : type} results for "${query}"`
            : 'Search for posts, people, or tags'
        }
        icon="🔍"
      />
    );
  };

  const renderHeader = () => {
    if (!query || results.length === 0) return null;

    return (
      <View className="px-4 py-3 border-b border-border">
        <Text className="text-text-secondary text-sm">
          {results.length} {type === 'all' ? 'results' : type} for "{query}"
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore || results.length === 0) return null;

    return (
      <View className="py-4 items-center">
        {isLoading ? (
          <>
            <ActivityIndicator size="small" color={currentTheme.brand.primary} />
            <Text className="text-text-secondary text-sm mt-2">
              Loading more results...
            </Text>
          </>
        ) : (
          <TouchableOpacity onPress={onLoadMore}>
            <Text className="text-brand-primary text-sm">
              Load more results
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={results}
      renderItem={renderItem}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
  },
});

export default SearchResults;