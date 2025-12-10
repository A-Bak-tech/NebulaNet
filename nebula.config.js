module.exports = {
  // Model Configuration
  models: {
    textGeneration: {
      enabled: true,
      modelSize: 'medium', // small, medium, large
      useGPU: true,
      cacheSize: 1000
    },
    sentimentAnalysis: {
      enabled: true,
      threshold: 0.7
    },
    contentModeration: {
      enabled: true,
      strictness: 'medium' // low, medium, high
    }
  },
  
  // Training Configuration
  training: {
    autoTrain: false,
    datasetPath: 'data/training',
    validationSplit: 0.2,
    earlyStopping: true,
    saveBestModel: true
  },
  
  // Inference Configuration
  inference: {
    maxTokens: 512,
    temperature: 0.7,
    topP: 0.9,
    repetitionPenalty: 1.2,
    frequencyPenalty: 0.5,
    presencePenalty: 0.5
  },
  
  // Performance
  performance: {
    enableCaching: true,
    cacheTTL: 3600, // 1 hour
    batchInference: true,
    batchSize: 8
  }
};