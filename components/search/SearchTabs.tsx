// File: /components/search/SearchTabs.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SearchType } from '../../types/search';
import { currentTheme } from '../../constants/Colors';

interface SearchTabsProps {
  activeTab: SearchType;
  onTabChange: (tab: SearchType) => void;
  showCounts?: boolean;
  counts?: Partial<Record<SearchType, number>>;
}

const SearchTabs: React.FC<SearchTabsProps> = ({
  activeTab,
  onTabChange,
  showCounts = false,
  counts = {},
}) => {
  const tabs: Array<{ id: SearchType; label: string; icon?: string }> = [
    { id: 'all', label: 'All' },
    { id: 'posts', label: 'Posts' },
    { id: 'users', label: 'People' },
    { id: 'tags', label: 'Tags' },
    { id: 'echoes', label: 'Echoes' },
  ];

  return (
    <View className="border-b border-border">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        className="py-2"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts[tab.id] || 0;

          return (
            <TouchableOpacity
              key={tab.id}
              className={`px-4 py-2 rounded-full mr-2 ${
                isActive ? 'bg-brand-primary' : 'bg-surface'
              }`}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                {tab.icon && (
                  <Text className="mr-1">{tab.icon}</Text>
                )}
                <Text
                  className={`font-medium text-sm ${
                    isActive ? 'text-white' : 'text-text-primary'
                  }`}
                >
                  {tab.label}
                </Text>
                {showCounts && count > 0 && (
                  <View
                    className={`ml-2 px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-surface-light'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        isActive ? 'text-white' : 'text-text-secondary'
                      }`}
                    >
                      {count > 99 ? '99+' : count}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default SearchTabs;