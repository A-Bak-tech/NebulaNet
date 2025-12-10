// File: /components/search/SearchFilters.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SearchFilters as SearchFilterType } from '../../types/search';
import { 
  XIcon,
  CheckIcon,
  SortIcon,
  ClockIcon,
  VerifiedIcon,
  ImageIcon,
} from '../../assets/icons';
import { Button } from '../ui/Button';
import { currentTheme } from '../../constants/Colors';

interface SearchFiltersProps {
  currentFilters: SearchFilterType;
  onApply: (filters: SearchFilterType) => void;
  onClose: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  currentFilters,
  onApply,
  onClose,
}) => {
  const [filters, setFilters] = useState<SearchFilterType>(currentFilters);
  const [minLikes, setMinLikes] = useState<string>(
    currentFilters.minLikes?.toString() || ''
  );
  
  const handleSortChange = (sort: SearchFilterType['sort']) => {
    setFilters(prev => ({ ...prev, sort }));
  };
  
  const handleTimeRangeChange = (timeRange: SearchFilterType['timeRange']) => {
    setFilters(prev => ({ ...prev, timeRange }));
  };
  
  const handleVerifiedToggle = () => {
    setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }));
  };
  
  const handleMediaToggle = () => {
    setFilters(prev => ({ ...prev, mediaOnly: !prev.mediaOnly }));
  };
  
  const handleMinLikesChange = (text: string) => {
    setMinLikes(text);
    const value = parseInt(text);
    if (!isNaN(value) && value > 0) {
      setFilters(prev => ({ ...prev, minLikes: value }));
    } else {
      setFilters(prev => ({ ...prev, minLikes: undefined }));
    }
  };
  
  const handleReset = () => {
    setFilters({});
    setMinLikes('');
  };
  
  const handleApply = () => {
    onApply(filters);
  };
  
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'latest', label: 'Latest' },
    { value: 'popular', label: 'Most Popular' },
  ];
  
  const timeRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'day', label: 'Past 24 Hours' },
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' },
    { value: 'year', label: 'Past Year' },
  ];
  
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Text className="text-text-primary text-xl font-semibold">
          Search Filters
        </Text>
        <TouchableOpacity onPress={onClose}>
          <XIcon size={24} color={currentTheme.icon.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView className="flex-1 px-4 py-3">
        {/* Sort By */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <SortIcon size={20} color={currentTheme.icon.primary} />
            <Text className="text-text-primary font-semibold text-lg ml-2">
              Sort By
            </Text>
          </View>
          
          <View className="space-y-2">
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`flex-row items-center justify-between px-3 py-2 rounded-lg ${
                  filters.sort === option.value 
                    ? 'bg-brand-primary/10 border border-brand-primary/20' 
                    : 'bg-surface'
                }`}
                onPress={() => handleSortChange(option.value as any)}
              >
                <Text className="text-text-primary">{option.label}</Text>
                {filters.sort === option.value && (
                  <CheckIcon size={20} color={currentTheme.brand.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Time Range */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <ClockIcon size={20} color={currentTheme.icon.primary} />
            <Text className="text-text-primary font-semibold text-lg ml-2">
              Time Range
            </Text>
          </View>
          
          <View className="space-y-2">
            {timeRangeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`flex-row items-center justify-between px-3 py-2 rounded-lg ${
                  filters.timeRange === option.value 
                    ? 'bg-brand-primary/10 border border-brand-primary/20' 
                    : 'bg-surface'
                }`}
                onPress={() => handleTimeRangeChange(option.value as any)}
              >
                <Text className="text-text-primary">{option.label}</Text>
                {filters.timeRange === option.value && (
                  <CheckIcon size={20} color={currentTheme.brand.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Filters */}
        <View className="mb-6">
          <Text className="text-text-primary font-semibold text-lg mb-3">
            Filters
          </Text>
          
          {/* Verified Only */}
          <View className="flex-row items-center justify-between py-3 border-b border-border">
            <View className="flex-row items-center">
              <VerifiedIcon size={20} color={currentTheme.icon.primary} />
              <Text className="text-text-primary ml-3">Verified Only</Text>
            </View>
            <Switch
              value={filters.verifiedOnly || false}
              onValueChange={handleVerifiedToggle}
              trackColor={{ false: currentTheme.border.primary, true: currentTheme.brand.primary }}
            />
          </View>
          
          {/* Media Only */}
          <View className="flex-row items-center justify-between py-3 border-b border-border">
            <View className="flex-row items-center">
              <ImageIcon size={20} color={currentTheme.icon.primary} />
              <Text className="text-text-primary ml-3">With Media Only</Text>
            </View>
            <Switch
              value={filters.mediaOnly || false}
              onValueChange={handleMediaToggle}
              trackColor={{ false: currentTheme.border.primary, true: currentTheme.brand.primary }}
            />
          </View>
          
          {/* Minimum Likes */}
          <View className="py-3 border-b border-border">
            <Text className="text-text-primary mb-2">Minimum Likes</Text>
            <TextInput
              value={minLikes}
              onChangeText={handleMinLikesChange}
              placeholder="e.g., 100"
              keyboardType="numeric"
              className="bg-surface rounded-lg px-3 py-2 text-text-primary"
              placeholderTextColor={currentTheme.text.tertiary}
            />
          </View>
        </View>
      </ScrollView>
      
      {/* Footer Buttons */}
      <View className="px-4 py-3 border-t border-border">
        <View className="flex-row space-x-3">
          <Button
            variant="outline"
            fullWidth
            onPress={handleReset}
          >
            Reset All
          </Button>
          <Button
            variant="primary"
            fullWidth
            onPress={handleApply}
          >
            Apply Filters
          </Button>
        </View>
      </View>
    </View>
  );
};

export default SearchFilters;