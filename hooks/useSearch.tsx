// File: /hooks/useSearch.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SearchType, 
  SearchFilters, 
  SearchResponse, 
  TrendingTopic,
  SearchSuggestion 
} from '../types/search';
import { searchService } from '../lib/search';
import debounce from 'lodash/debounce';

interface UseSearchOptions {
  initialQuery?: string;
  initialType?: SearchType;
  filters?: SearchFilters;
  debounceTime?: number;
  autoSearch?: boolean;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const {
    initialQuery = '',
    initialType = 'all',
    filters = {},
    debounceTime = 300,
    autoSearch = true,
  } = options;
  
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<SearchType>(initialType);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [searchHistory, setSearchHistory] = useState<{ query: string; type: SearchType }[]>([]);
  const [page, setPage] = useState(1);
  
  const debouncedSearchRef = useRef(
    debounce(async (searchQuery: string, searchType: SearchType, searchPage: number) => {
      if (!searchQuery.trim()) {
        setResults(null);
        setSuggestions([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await searchService.search(
          searchQuery,
          { ...filters, type: searchType },
          searchPage,
          20
        );
        
        setResults(prev => 
          searchPage === 1 
            ? response 
            : prev 
              ? {
                  ...response,
                  results: [...prev.results, ...response.results],
                }
              : response
        );
        
        // Save to history
        if (searchPage === 1) {
          await searchService.saveSearchHistory(searchQuery, searchType);
          await loadSearchHistory();
        }
      } catch (err: any) {
        console.error('Search error:', err);
        setError(err.message || 'Failed to perform search');
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, debounceTime)
  );
  
  const loadSearchHistory = useCallback(async () => {
    try {
      const history = await searchService.getSearchHistory();
      setSearchHistory(history.map(item => ({
        query: item.query,
        type: item.type as SearchType,
      })));
    } catch (err) {
      console.error('Load search history error:', err);
    }
  }, []);
  
  const loadTrendingTopics = useCallback(async () => {
    try {
      const topics = await searchService.getTrendingTopics();
      setTrendingTopics(topics);
    } catch (err) {
      console.error('Load trending topics error:', err);
    }
  }, []);
  
  const loadAutocompleteSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    
    try {
      const suggestions = await searchService.getAutocompleteSuggestions(searchQuery);
      setSuggestions(suggestions);
    } catch (err) {
      console.error('Load autocomplete error:', err);
    }
  }, []);
  
  const search = useCallback(async (
    searchQuery: string,
    searchType: SearchType = type,
    searchPage: number = 1
  ) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }
    
    setPage(searchPage);
    setType(searchType);
    
    if (searchPage === 1) {
      setResults(null);
    }
    
    debouncedSearchRef.current(searchQuery, searchType, searchPage);
  }, [type]);
  
  const searchMore = useCallback(() => {
    if (!results?.has_more || isLoading) return;
    
    search(query, type, page + 1);
  }, [query, type, page, results?.has_more, isLoading, search]);
  
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setSuggestions([]);
    setError(null);
    setPage(1);
  }, []);
  
  const clearHistory = useCallback(async () => {
    try {
      await searchService.clearSearchHistory();
      setSearchHistory([]);
    } catch (err) {
      console.error('Clear history error:', err);
    }
  }, []);
  
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    
    if (autoSearch) {
      // Reset page when query changes
      setPage(1);
      debouncedSearchRef.current(newQuery, type, 1);
    }
    
    // Load autocomplete suggestions
    loadAutocompleteSuggestions(newQuery);
  }, [type, autoSearch, loadAutocompleteSuggestions]);
  
  const updateType = useCallback((newType: SearchType) => {
    setType(newType);
    
    if (query.trim()) {
      // Reset page when type changes
      setPage(1);
      debouncedSearchRef.current(query, newType, 1);
    }
  }, [query]);
  
  // Subscribe to trending updates
  useEffect(() => {
    const unsubscribe = searchService.subscribeToTrendingUpdates((topics) => {
      setTrendingTopics(topics);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Load initial data
  useEffect(() => {
    loadSearchHistory();
    loadTrendingTopics();
  }, [loadSearchHistory, loadTrendingTopics]);
  
  return {
    // State
    query,
    type,
    results,
    isLoading,
    error,
    suggestions,
    trendingTopics,
    searchHistory,
    page,
    
    // Actions
    setQuery: updateQuery,
    setType: updateType,
    search,
    searchMore,
    clearSearch,
    clearHistory,
    loadAutocompleteSuggestions,
    loadTrendingTopics,
    loadSearchHistory,
  };
};

export default useSearch;