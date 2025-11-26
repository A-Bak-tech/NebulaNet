import React, { useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (text: string) => {
    setQuery(text);
    setIsSearching(text.length > 0);
  };

  const clearSearch = () => {
    setQuery('');
    setIsSearching(false);
  };

  return (
    <ScreenWrapper>
      <Header title="Search" />
      
      {/* Search Bar */}
      <View className="px-4 pb-4">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
          <SearchIcon size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-3 text-gray-900 dark:text-white text-base"
            placeholder="Search posts, people, or topics..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        {isSearching ? (
          <View className="p-4">
            <Text className="text-gray-500 dark:text-gray-400 text-center">
              Search results for "{query}"
            </Text>
            {/* Search results would go here */}
          </View>
        ) : (
          <View className="p-4">
            {/* Trending Topics */}
            <View className="mb-8">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Trending Topics
              </Text>
              {['Technology', 'AI', 'Space', 'Programming', 'Design'].map((topic) => (
                <TouchableOpacity
                  key={topic}
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 mb-2"
                >
                  <Text className="text-gray-900 dark:text-white font-medium">
                    #{topic}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Suggested Users */}
            <View>
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Suggested Users
              </Text>
              {/* Suggested users list would go here */}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}