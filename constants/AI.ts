export const AI_CONFIG = {
  MAX_CONTENT_LENGTH: 1000,
  MIN_CONTENT_LENGTH: 10,
  ENHANCEMENT_TYPES: ['improve', 'expand', 'summarize', 'rephrase'] as const,
  MODERATION_THRESHOLDS: {
    LOW_RISK: 0.3,
    MEDIUM_RISK: 0.6,
    HIGH_RISK: 0.8,
  },
  SUGGESTION_CONFIDENCE: 0.7,
  RESPONSE_TIME: {
    ENHANCEMENT: 2000,
    MODERATION: 1500,
    SUGGESTIONS: 1000,
  },
  FEATURES: {
    CONTENT_ENHANCEMENT: true,
    AUTO_MODERATION: true,
    SMART_SUGGESTIONS: true,
    SENTIMENT_ANALYSIS: true,
    TRENDING_TOPICS: true,
  },
} as const;

export const AI_PROMPTS = {
  ENHANCEMENT: "Please enhance this content while maintaining the original meaning and tone:",
  SUMMARIZATION: "Please provide a concise summary of this content:",
  MODERATION: "Analyze this content for inappropriate material:",
  SUGGESTION: "Generate helpful suggestions to improve this content:",
};

export const AI_LIMITS = {
  DAILY_ENHANCEMENTS: 50,
  DAILY_SUGGESTIONS: 100,
  MAX_CONCURRENT_REQUESTS: 10,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
};