// File: /types/search.ts
export type SearchType = 'all' | 'posts' | 'users' | 'tags' | 'echoes';

export interface SearchFilters {
  type?: SearchType;
  sort?: 'relevance' | 'latest' | 'popular';
  timeRange?: 'all' | 'day' | 'week' | 'month' | 'year';
  verifiedOnly?: boolean;
  mediaOnly?: boolean;
  minLikes?: number;
  maxResults?: number;
}

export interface SearchResult {
  type: 'post' | 'user' | 'tag';
  id: string;
  relevance: number;
  data: any;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  has_more: boolean;
  suggestions: string[];
  trending_topics?: TrendingTopic[];
}

export interface TrendingTopic {
  tag: string;
  count: number;
  growth: number;
  posts: any[];
}

export interface SearchSuggestion {
  id: string;
  type: 'user' | 'tag' | 'post';
  text: string;
  subtitle?: string;
  image?: string;
  metadata?: any;
}