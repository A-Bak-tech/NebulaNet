export interface AISuggestion {
  id: string;
  type: 'hashtag' | 'topic' | 'improvement' | 'engagement';
  title: string;
  description: string;
  confidence: number;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  categories: {
    hate: number;
    harassment: number;
    selfHarm: number;
    sexual: number;
    violence: number;
  };
}

export interface AIEnhancementResult {
  original: string;
  enhanced: string;
  changes: Array<{
    type: 'grammar' | 'clarity' | 'engagement' | 'length';
    description: string;
    confidence: number;
  }>;
  readability: {
    score: number;
    level: 'easy' | 'medium' | 'difficult';
  };
}

export interface AIPerformanceMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  requestsByType: Record<string, number>;
  accuracy: number;
  errorRate: number;
}

export interface AIUsageStats {
  dailyRequests: number;
  weeklyGrowth: number;
  popularFeatures: Array<{
    feature: string;
    usage: number;
    growth: number;
  }>;
  userEngagement: {
    activeUsers: number;
    retentionRate: number;
    averageSession: number;
  };
}

export type AIFeature = 
  | 'content_enhancement'
  | 'moderation'
  | 'suggestions'
  | 'analytics'
  | 'personalization';