// File: /components/search/RecentSearches.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SearchType } from '../../types/search';
import { 
  HistoryIcon, 
  XIcon,
  HashIcon,
  UserIcon,
  PostIcon,
} from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';

interface RecentSearch {
  query: string;
  type: SearchType;
  count: number;
  last_searched: string;
}

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSearch: (query: string, type: SearchType) => void;
  onClear: () => void;
  onRemove: (query: string, type: SearchType) => void;
  maxItems?: number;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
  searches,
  onSearch,
  onClear,
  onRemove,
  maxItems = 10,
}) => {
  if (searches.length === 0) {
    return null;
  }

  const getTypeIcon = (type: SearchType) => {
    switch (type) {
      case 'users':
        return <UserIcon size={16} color={currentTheme.icon.secondary} />;
      case 'tags':
        return <HashIcon size={16} color={currentTheme.icon.secondary} />;
      case 'posts':
      case 'echoes':
        return <PostIcon size={16} color={currentTheme.icon.secondary} />;
      default:
        return <HistoryIcon size={16} color={currentTheme.icon.secondary} />;
    }
  };

  const getTypeLabel = (type: SearchType) => {
    switch (type) {
      case 'users': return 'People';
      case 'tags': return 'Tags';
      case 'posts': return 'Posts';
      case 'echoes': return 'Echoes';
      default: return 'All';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const displayedSearches = searches.slice(0, maxItems);

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <View className="flex-row items-center">
          <HistoryIcon size={20} color={currentTheme.icon.primary} />
          <Text className="text-text-primary font-semibold text-lg ml-2">
            Recent Searches
          </Text>
        </View>
        
        <TouchableOpacity onPress={onClear}>
          <Text className="text-brand-primary text-sm">Clear all</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={displayedSearches}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3 border-b border-border active:bg-surface"
            onPress={() => onSearch(item.query, item.type)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              {getTypeIcon(item.type)}
              
              <View className="ml-3 flex-1">
                <Text className="text-text-primary text-base">
                  {item.query}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-text-secondary text-xs">
                    {getTypeLabel(item.type)}
                  </Text>
                  <Text className="text-text-tertiary text-xs mx-2">•</Text>
                  <Text className="text-text-tertiary text-xs">
                    {formatTime(item.last_searched)}
                  </Text>
                  {item.count > 1 && (
                    <>
                      <Text className="text-text-tertiary text-xs mx-2">•</Text>
                      <Text className="text-text-tertiary text-xs">
                        {item.count} searches
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              onPress={() => onRemove(item.query, item.type)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <XIcon size={18} color={currentTheme.icon.secondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => `${item.query}-${item.type}`}
      />
    </View>
  );
};

export default RecentSearches;