// File: /app/(tabs)/search.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import SearchBar from '../../components/search/SearchBar';
import SearchTabs from '../../components/search/SearchTabs';
import SearchResults from '../../components/search/SearchResults';
import TrendingTopics from '../../components/search/TrendingTopics';
import RecentSearches from '../../components/search/RecentSearches';
import SuggestedUsers from '../../components/search/SuggestedUsers';
import SearchFilters from '../../components/search/SearchFilters';
import { useSearch } from '../../hooks/useSearch';
import { searchService } from '../../lib/search';
import { SearchType, SearchFilters as SearchFilterType } from '../../types/search';
import { useAuth } from '../../hooks/useAuth';
import { currentTheme } from '../../constants/Colors';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  const initialQuery = (params.q as string) || '';
  const initialType = (params.type as SearchType) || 'all';
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilterType>({});
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  
  const {
    query,
    type,
    results,
    isLoading,
    suggestions,
    trendingTopics,
    searchHistory,
    page,
    setQuery,
    setType,
    search,
    searchMore,
    clearSearch,
    clearHistory,
    loadTrendingTopics,
  } = useSearch({
    initialQuery,
    initialType,
    filters,
    autoSearch: true,
  });
  
  // Load suggested users
  useEffect(() => {
    if (user) {
      loadSuggestedUsers();
    }
  }, [user]);
  
  const loadSuggestedUsers = async () => {
    try {
      const users = await searchService.getSuggestedUsers();
      setSuggestedUsers(users);
    } catch (error) {
      console.error('Load suggested users error:', error);
    }
  };
  
  const handleSearch = (searchQuery: string) => {
    search(searchQuery, type);
  };
  
  const handleClearSearch = () => {
    clearSearch();
    setQuery('');
  };
  
  const handleTabChange = (newType: SearchType) => {
    setType(newType);
    if (query.trim()) {
      search(query, newType);
    }
  };
  
  const handleSuggestionSelect = (suggestion: string) => {
    if (suggestion.startsWith('@')) {
      const username = suggestion.slice(1);
      router.push(`/profile?username=${username}`);
    } else if (suggestion.startsWith('#')) {
      const tag = suggestion.slice(1);
      setQuery(tag);
      search(tag, 'tags');
    } else {
      setQuery(suggestion);
      search(suggestion);
    }
  };
  
  const handleRecentSearch = (recentQuery: string, recentType: SearchType) => {
    setQuery(recentQuery);
    setType(recentType);
    search(recentQuery, recentType);
  };
  
  const handleRemoveRecent = (recentQuery: string, recentType: SearchType) => {
    // TODO: Implement remove from history
    console.log('Remove:', recentQuery, recentType);
  };
  
  const handleApplyFilters = (newFilters: SearchFilterType) => {
    setFilters(newFilters);
    setShowFilters(false);
    
    if (query.trim()) {
      // Re-search with new filters
      search(query, type);
    }
  };
  
  const renderSuggestions = () => {
    if (!query.trim() || results || isLoading) return null;
    
    return (
      <View className="px-4 py-3">
        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            className="py-2 border-b border-border"
            onPress={() => handleSuggestionSelect(suggestion.text)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Text className="text-text-primary text-base flex-1">
                {suggestion.text}
              </Text>
              <Text className="text-text-tertiary text-sm">
                {suggestion.type === 'user' ? 'Person' : 
                 suggestion.type === 'tag' ? 'Tag' : 'Post'}
              </Text>
            </View>
            {suggestion.subtitle && (
              <Text className="text-text-secondary text-sm mt-1">
                {suggestion.subtitle}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  const renderEmptyState = () => {
    if (query.trim() && !isLoading) return null;
    
    return (
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Trending Topics */}
        <TrendingTopics
          topics={trendingTopics}
          onRefresh={loadTrendingTopics}
          isLoading={isLoading}
        />
        
        {/* Recent Searches */}
        <RecentSearches
          searches={searchHistory}
          onSearch={handleRecentSearch}
          onClear={clearHistory}
          onRemove={handleRemoveRecent}
        />
        
        {/* Suggested Users */}
        {suggestedUsers.length > 0 && (
          <SuggestedUsers
            users={suggestedUsers}
            onFollow={loadSuggestedUsers}
            onUnfollow={loadSuggestedUsers}
          />
        )}
        
        {/* Quick Suggestions */}
        <View className="px-4 mb-6">
          <Text className="text-text-primary font-semibold text-lg mb-3">
            Try searching for
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {['#technology', '#art', '@nebulanet', '#fitness', '#music'].map((tag) => (
              <TouchableOpacity
                key={tag}
                className="px-3 py-2 bg-surface rounded-full"
                onPress={() => handleSuggestionSelect(tag)}
              >
                <Text className="text-brand-primary text-sm">{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };
  
  return (
    <ScreenWrapper withBottomNav>
      {/* Header with Search Bar */}
      <View className="px-4 pt-2 pb-3 border-b border-border">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={handleClearSearch}
          onSearch={handleSearch}
          onFocus={() => Keyboard.dismiss()}
          placeholder="Search posts, people, or tags..."
          autoFocus={!initialQuery}
          showFilterButton={true}
          showMicButton={true}
          animated
        />
      </View>
      
      {/* Search Tabs */}
      {query.trim() && (
        <SearchTabs
          activeTab={type}
          onTabChange={handleTabChange}
          showCounts={!!results}
          counts={{
            posts: results?.results.filter(r => r.type === 'post').length || 0,
            users: results?.results.filter(r => r.type === 'user').length || 0,
            tags: results?.results.filter(r => r.type === 'tag').length || 0,
          }}
        />
      )}
      
      {/* Main Content */}
      <View className="flex-1">
        {/* Search Results or Suggestions */}
        {query.trim() && results ? (
          <SearchResults
            results={results.results}
            query={query}
            type={type}
            isLoading={isLoading}
            hasMore={results.has_more}
            onLoadMore={searchMore}
            onRefresh={() => search(query, type)}
            refreshing={isLoading && page === 1}
          />
        ) : (
          <>
            {renderSuggestions()}
            {renderEmptyState()}
          </>
        )}
      </View>
      
      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SearchFilters
          currentFilters={filters}
          onApply={handleApplyFilters}
          onClose={() => setShowFilters(false)}
        />
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.background.primary,
  },
});