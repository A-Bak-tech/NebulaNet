// Model Constants
export const MODEL_SIZES = {
  SMALL: {
    layers: 6,
    hiddenSize: 384,
    attentionHeads: 6,
    feedForwardSize: 1536,
    maxSequenceLength: 512
  },
  MEDIUM: {
    layers: 12,
    hiddenSize: 768,
    attentionHeads: 12,
    feedForwardSize: 3072,
    maxSequenceLength: 1024
  },
  LARGE: {
    layers: 24,
    hiddenSize: 1024,
    attentionHeads: 16,
    feedForwardSize: 4096,
    maxSequenceLength: 2048
  }
} as const;

// Tokenizer Constants
export const TOKENIZER = {
  VOCAB_SIZE: 50257,
  MAX_SEQUENCE_LENGTH: 1024,
  PADDING_TOKEN: '[PAD]',
  UNKNOWN_TOKEN: '[UNK]',
  END_TOKEN: '[END]',
  START_TOKEN: '[START]'
} as const;

// Training Constants
export const TRAINING = {
  DEFAULT_EPOCHS: 10,
  DEFAULT_BATCH_SIZE: 32,
  DEFAULT_LEARNING_RATE: 0.001,
  VALIDATION_SPLIT: 0.2,
  EARLY_STOPPING_PATIENCE: 5,
  MIN_LEARNING_RATE: 0.00001
} as const;

// Inference Constants
export const INFERENCE = {
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 512,
  DEFAULT_TOP_P: 0.9,
  DEFAULT_TOP_K: 50,
  DEFAULT_REPETITION_PENALTY: 1.2,
  MIN_TEMPERATURE: 0.1,
  MAX_TEMPERATURE: 2.0
} as const;

// Enhancement Constants
export const ENHANCEMENT = {
  STYLES: ['professional', 'casual', 'creative', 'concise'] as const,
  TONES: ['positive', 'neutral', 'formal', 'friendly'] as const,
  LENGTHS: ['short', 'medium', 'long'] as const,
  MAX_CREATIVITY: 1.0,
  MIN_CREATIVITY: 0.0
} as const;

// Moderation Constants
export const MODERATION = {
  CATEGORIES: [
    'safe',
    'spam',
    'harassment',
    'hate_speech',
    'explicit',
    'violence',
    'misinformation'
  ] as const,
  THRESHOLDS: {
    LOW: {
      spam: 0.7,
      harassment: 0.8,
      hate_speech: 0.9,
      explicit: 0.6,
      violence: 0.8,
      misinformation: 0.7
    },
    MEDIUM: {
      spam: 0.6,
      harassment: 0.7,
      hate_speech: 0.8,
      explicit: 0.5,
      violence: 0.7,
      misinformation: 0.6
    },
    HIGH: {
      spam: 0.5,
      harassment: 0.6,
      hate_speech: 0.7,
      explicit: 0.4,
      violence: 0.6,
      misinformation: 0.5
    }
  },
  SAFETY_SCORE_RANGES: {
    SAFE: [0, 0.3],
    REVIEW: [0.3, 0.7],
    UNSAFE: [0.7, 1.0]
  }
} as const;

// Analytics Constants
export const ANALYTICS = {
  EVENT_TYPES: [
    'text_generation',
    'sentiment_analysis',
    'content_moderation',
    'enhancement',
    'training',
    'system'
  ] as const,
  RETENTION_DAYS: 30,
  MAX_EVENTS: 10000,
  FLUSH_INTERVAL: 60000 // 1 minute
} as const;

// Performance Constants
export const PERFORMANCE = {
  LATENCY_THRESHOLDS: {
    GOOD: 100, // ms
    ACCEPTABLE: 500, // ms
    POOR: 1000 // ms
  },
  ACCURACY_THRESHOLDS: {
    EXCELLENT: 0.95,
    GOOD: 0.85,
    ACCEPTABLE: 0.70
  },
  ERROR_RATE_THRESHOLDS: {
    LOW: 0.01,
    MEDIUM: 0.05,
    HIGH: 0.10
  }
} as const;

// Suggestion Constants
export const SUGGESTIONS = {
  TYPES: ['completion', 'paraphrase', 'expansion', 'question', 'topic'] as const,
  MAX_SUGGESTIONS: 10,
  CONFIDENCE_THRESHOLD: 0.5,
  CONTEXT_WINDOW: 500 // characters
} as const;

// Cache Constants
export const CACHE = {
  TTL: 3600000, // 1 hour in milliseconds
  MAX_SIZE: 1000, // items
  CLEANUP_INTERVAL: 300000 // 5 minutes
} as const;

// Error Constants
export const ERRORS = {
  MODEL_NOT_READY: 'AI model is not ready. Please wait for initialization.',
  INVALID_INPUT: 'Invalid input provided.',
  GENERATION_FAILED: 'Text generation failed. Please try again.',
  TRAINING_FAILED: 'Model training failed. Check your data and try again.',
  MODERATION_FAILED: 'Content moderation failed. Please try again.',
  ENHANCEMENT_FAILED: 'Content enhancement failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.'
} as const;

// UI Constants
export const UI = {
  LOADING_MESSAGES: [
    'Thinking...',
    'Processing your request...',
    'Generating AI magic...',
    'Analyzing content...',
    'Training neural networks...'
  ],
  COLOR_SCHEME: {
    PRIMARY: '#8B5CF6',
    SECONDARY: '#3B82F6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6'
  },
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  }
} as const;

// Feature Flags
export const FEATURES = {
  TEXT_GENERATION: true,
  CONTENT_ENHANCEMENT: true,
  CONTENT_MODERATION: true,
  SENTIMENT_ANALYSIS: true,
  SUGGESTIONS: true,
  MODEL_TRAINING: true,
  ANALYTICS: true,
  BATCH_PROCESSING: true,
  OFFLINE_MODE: false
} as const;

// Version Constants
export const VERSIONS = {
  CURRENT: '1.0.0',
  COMPATIBLE_VERSIONS: ['1.0.0', '1.0.1', '1.1.0'],
  MIN_SUPPORTED: '1.0.0'
} as const;

// API Endpoints (for cloud integration)
export const API_ENDPOINTS = {
  BASE: 'https://api.nebula.net/ai',
  GENERATE: '/generate',
  ENHANCE: '/enhance',
  MODERATE: '/moderate',
  ANALYZE_SENTIMENT: '/sentiment',
  GET_SUGGESTIONS: '/suggestions',
  TRAIN_MODEL: '/train',
  GET_MODELS: '/models',
  UPLOAD_DATA: '/data/upload'
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  MODELS: 'nebula_models',
  TRAINING_DATA: 'nebula_training_data',
  SETTINGS: 'nebula_settings',
  ANALYTICS: 'nebula_analytics',
  CACHE: 'nebula_cache',
  USER_PREFERENCES: 'nebula_user_preferences'
} as const;

// Export everything
export default {
  MODEL_SIZES,
  TOKENIZER,
  TRAINING,
  INFERENCE,
  ENHANCEMENT,
  MODERATION,
  ANALYTICS,
  PERFORMANCE,
  SUGGESTIONS,
  CACHE,
  ERRORS,
  UI,
  FEATURES,
  VERSIONS,
  API_ENDPOINTS,
  STORAGE_KEYS
};