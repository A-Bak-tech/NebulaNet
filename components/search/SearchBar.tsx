// File: /components/search/SearchBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  SearchIcon, 
  XIcon, 
  FilterIcon,
  MicIcon,
} from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';
import { SIZES } from '../../constants/Layout';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onSearch: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  showFilterButton?: boolean;
  showMicButton?: boolean;
  animated?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onSearch,
  onFocus,
  onBlur,
  placeholder = 'Search NebulaNet...',
  autoFocus = false,
  showFilterButton = true,
  showMicButton = false,
  animated = false,
}) => {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(autoFocus);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };
  
  const handleClear = () => {
    onChangeText('');
    onClear();
    inputRef.current?.focus();
  };
  
  const handleSubmit = () => {
    if (value.trim()) {
      onSearch(value.trim());
      Keyboard.dismiss();
    }
  };
  
  const handleFilterPress = () => {
    router.push('/search/filters');
  };
  
  const handleMicPress = () => {
    // TODO: Implement voice search
    console.log('Voice search');
  };
  
  // Animate on focus
  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: isFocused ? 1.02 : 1,
          useNativeDriver: true,
          tension: 200,
          friction: 20,
        }),
        Animated.timing(opacityAnim, {
          toValue: isFocused ? 1 : 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused, animated]);
  
  return (
    <Animated.View 
      style={[
        styles.container,
        animated && {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.searchContainer}>
        {/* Search Icon */}
        <View style={styles.iconContainer}>
          <SearchIcon 
            size={SIZES.ICON.MD} 
            color={currentTheme.icon.secondary} 
          />
        </View>
        
        {/* Input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={currentTheme.text.tertiary}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          clearButtonMode="never"
        />
        
        {/* Clear Button */}
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <XIcon 
              size={SIZES.ICON.SM} 
              color={currentTheme.icon.secondary} 
            />
          </TouchableOpacity>
        )}
        
        {/* Mic Button */}
        {showMicButton && value.length === 0 && (
          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMicPress}
          >
            <MicIcon 
              size={SIZES.ICON.MD} 
              color={currentTheme.icon.primary} 
            />
          </TouchableOpacity>
        )}
        
        {/* Filter Button */}
        {showFilterButton && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleFilterPress}
          >
            <FilterIcon 
              size={SIZES.ICON.MD} 
              color={currentTheme.icon.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentTheme.background.secondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: currentTheme.text.primary,
    paddingVertical: 4,
    minHeight: 24,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  micButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    padding: 4,
    marginLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: currentTheme.border.primary,
    paddingLeft: 12,
  },
});

export default SearchBar;