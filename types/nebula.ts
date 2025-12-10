// Core AI Types
export interface GenerationOptions {
  temperature?: number;
  maxLength?: number;
  topP?: number;
  topK?: number;
  repetitionPenalty?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface InferenceResult {
  text: string;
  tokens: number;
  inferenceTime: number;
  confidence: number;
  finishReason: 'length' | 'stop' | 'eos';
}

// Model Types
export interface BaseModelConfig {
  type: string;
  layers: number;
  hiddenSize: number;
  vocabSize: number;
  maxSequenceLength: number;
}

export interface TextGenerationModelConfig extends BaseModelConfig {
  modelSize: 'small' | 'medium' | 'large';
  attentionHeads: number;
  feedForwardSize: number;
}

export interface SentimentModelConfig {
  classes: string[];
  threshold: number;
  useAttention: boolean;
}

export interface ContentClassifierConfig {
  categories: string[];
  multiLabel: boolean;
  confidenceThreshold: number;
}

// Training Types
export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  earlyStopping: boolean;
  patience: number;
}

export interface TrainingMetrics {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  accuracy: number;
  learningRate: number;
  timestamp: Date;
}

// Enhancement Types
export interface EnhancementOptions {
  style: 'professional' | 'casual' | 'creative' | 'concise';
  creativity: number;
  length: 'short' | 'medium' | 'long';
  tone: 'positive' | 'neutral' | 'formal' | 'friendly';
}

export interface EnhancedContent {
  original: string;
  enhanced: string;
  changes: Array<{
    type: 'addition' | 'deletion' | 'replacement';
    original?: string;
    new?: string;
    reason: string;
  }>;
  readability: {
    score: number;
    grade: string;
  };
}

// Moderation Types
export interface ModerationConfig {
  thresholds: Record<string, number>;
  autoModerate: boolean;
  requireHumanReview: boolean;
  strictness: 'low' | 'medium' | 'high';
}

export interface ModerationResult {
  isSafe: boolean;
  score: number;
  flags: string[];
  categories: Array<{
    name: string;
    score: number;
    threshold: number;
    passed: boolean;
  }>;
  sentiment?: {
    overall: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  recommendations: string[];
  moderatedContent?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  id: string;
  type: 'text_generation' | 'sentiment_analysis' | 'content_moderation' | 'enhancement' | 'training' | 'system';
  timestamp: Date;
  userId?: string;
  duration: number;
  success: boolean;
  metadata: Record<string, any>;
}

export interface PerformanceMetrics {
  latency: {
    p50: number;
    p90: number;
    p99: number;
    avg: number;
  };
  accuracy: number;
  throughput: number;
  errorRate: number;
  modelSize: number;
  memoryUsage: number;
}

export interface UsageAnalytics {
  totalRequests: number;
  uniqueUsers: number;
  peakHour: number;
  averageResponseTime: number;
  mostUsedFeature: string;
  geographicDistribution: Record<string, number>;
}

// Suggestion Types
export interface SuggestionOptions {
  context?: string;
  maxSuggestions?: number;
  creativity?: number;
  style?: 'casual' | 'professional' | 'creative';
  length?: 'short' | 'medium' | 'long';
}

export interface ContentSuggestion {
  id: string;
  text: string;
  type: 'completion' | 'paraphrase' | 'expansion' | 'question' | 'topic';
  confidence: number;
  metadata?: Record<string, any>;
}

// Data Types
export interface DatasetItem {
  id: string;
  text: string;
  label?: any;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface PreprocessingOptions {
  lowercase?: boolean;
  removePunctuation?: boolean;
  removeNumbers?: boolean;
  removeStopwords?: boolean;
  stem?: boolean;
  lemmatize?: boolean;
  maxLength?: number;
  padding?: 'pre' | 'post';
  truncating?: 'pre' | 'post';
}

// Neural Network Types
export interface LayerConfig {
  type: 'dense' | 'conv1d' | 'lstm' | 'attention' | 'dropout' | 'batch_norm';
  units: number;
  activation?: 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear' | 'gelu';
  dropout?: number;
  returnSequences?: boolean;
  kernelSize?: number;
}

// Tokenizer Types
export interface TokenizerConfig {
  vocabSize: number;
  maxSequenceLength: number;
  paddingToken: string;
  unknownToken: string;
  endToken: string;
}

// API Response Types
export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId: string;
}

export interface BatchResponse<T> {
  results: T[];
  total: number;
  successful: number;
  failed: number;
}

// User AI Preferences
export interface UserAIPreferences {
  preferredStyle: 'casual' | 'professional' | 'creative';
  creativityLevel: number;
  autoEnhance: boolean;
  autoModerate: boolean;
  suggestionFrequency: 'low' | 'medium' | 'high';
  theme: 'light' | 'dark' | 'auto';
}

// Model State Types
export interface ModelState {
  id: string;
  name: string;
  type: string;
  version: string;
  status: 'loading' | 'ready' | 'training' | 'error';
  accuracy: number;
  size: number;
  loadedAt: Date;
  config: Record<string, any>;
}

// Training Data Types
export interface TrainingExample {
  id: string;
  input: string;
  output: string;
  metadata: {
    source: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    quality: number; // 0-1
  };
}

// Evaluation Types
export interface EvaluationResult {
  modelId: string;
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1: Record<string, number>;
  confusionMatrix: number[][];
  timestamp: Date;
}

// Nebula AI Configuration
export interface NebulaConfig {
  models: {
    textGeneration: {
      enabled: boolean;
      modelSize: 'small' | 'medium' | 'large';
      useGPU: boolean;
      cacheSize: number;
    };
    sentimentAnalysis: {
      enabled: boolean;
      threshold: number;
    };
    contentModeration: {
      enabled: boolean;
      strictness: 'low' | 'medium' | 'high';
    };
  };
  training: {
    autoTrain: boolean;
    datasetPath: string;
    validationSplit: number;
    earlyStopping: boolean;
    saveBestModel: boolean;
  };
  inference: {
    maxTokens: number;
    temperature: number;
    topP: number;
    repetitionPenalty: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  performance: {
    enableCaching: boolean;
    cacheTTL: number;
    batchInference: boolean;
    batchSize: number;
  };
}