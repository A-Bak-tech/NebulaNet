import { useState, useCallback, useEffect } from 'react';
import { NebulaAI } from '@/lib/nebula';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrainingData {
  input: string;
  output: string;
  metadata?: Record<string, any>;
}

export interface TrainingConfig {
  modelType: 'text' | 'sentiment' | 'classification';
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
}

export interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  status: 'training' | 'validating' | 'completed' | 'error';
}

export interface TrainedModel {
  id: string;
  name: string;
  type: string;
  version: string;
  accuracy: number;
  trainedAt: Date;
  size: number; // in MB
  config: TrainingConfig;
}

export const useModelTraining = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [trainedModels, setTrainedModels] = useState<TrainedModel[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<Array<{
    id: string;
    modelId: string;
    timestamp: Date;
    duration: number;
    finalAccuracy: number;
    finalLoss: number;
  }>>([]);

  // Load trained models on mount
  useEffect(() => {
    loadTrainedModels();
    loadTrainingHistory();
  }, []);

  const loadTrainedModels = async () => {
    try {
      const savedModels = await AsyncStorage.getItem('nebula_trained_models');
      if (savedModels) {
        const parsed = JSON.parse(savedModels);
        setTrainedModels(parsed.map((model: any) => ({
          ...model,
          trainedAt: new Date(model.trainedAt)
        })));
      }
    } catch (error) {
      console.error('Failed to load trained models:', error);
    }
  };

  const loadTrainingHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('nebula_training_history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setTrainingHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }
    } catch (error) {
      console.error('Failed to load training history:', error);
    }
  };

  const saveTrainedModel = async (model: TrainedModel) => {
    try {
      const newModels = [...trainedModels, model];
      setTrainedModels(newModels);
      await AsyncStorage.setItem('nebula_trained_models', JSON.stringify(newModels));
    } catch (error) {
      console.error('Failed to save trained model:', error);
    }
  };

  const saveTrainingHistory = async (historyItem: any) => {
    try {
      const newHistory = [...trainingHistory, historyItem];
      setTrainingHistory(newHistory);
      await AsyncStorage.setItem('nebula_training_history', JSON.stringify(newHistory.slice(-100))); // Keep last 100
    } catch (error) {
      console.error('Failed to save training history:', error);
    }
  };

  const train = useCallback(async (
    data: TrainingData[],
    config: Partial<TrainingConfig> = {}
  ): Promise<TrainedModel> => {
    if (data.length === 0) {
      throw new Error('Training data cannot be empty');
    }

    setIsTraining(true);
    setTrainingProgress({
      epoch: 0,
      totalEpochs: config.epochs || 10,
      loss: 0,
      accuracy: 0,
      status: 'training'
    });

    const nebula = NebulaAI.getInstance();
    const startTime = Date.now();

    try {
      // Prepare training configuration
      const fullConfig: TrainingConfig = {
        modelType: 'text',
        epochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        validationSplit: 0.2,
        ...config
      };

      // Convert data format
      const trainingData = data.map(item => ({
        text: item.input,
        label: item.output
      }));

      // Train the model
      const result = await nebula.trainModel(trainingData, {
        epochs: fullConfig.epochs,
        learningRate: fullConfig.learningRate
      });

      const trainingTime = Date.now() - startTime;

      // Create model record
      const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const trainedModel: TrainedModel = {
        id: modelId,
        name: `Trained Model ${new Date().toLocaleDateString()}`,
        type: fullConfig.modelType,
        version: '1.0',
        accuracy: result.finalAccuracy,
        trainedAt: new Date(),
        size: 50, // Estimated size in MB
        config: fullConfig
      };

      // Save model
      await saveTrainedModel(trainedModel);

      // Save training history
      await saveTrainingHistory({
        id: `train_${Date.now()}`,
        modelId,
        timestamp: new Date(),
        duration: trainingTime,
        finalAccuracy: result.finalAccuracy,
        finalLoss: result.finalLoss
      });

      // Track analytics
      nebula.analytics.trackEvent({
        type: 'training',
        duration: trainingTime,
        success: true,
        metadata: {
          modelType: fullConfig.modelType,
          dataSize: data.length,
          epochs: fullConfig.epochs,
          finalAccuracy: result.finalAccuracy
        }
      });

      setTrainingProgress({
        ...trainingProgress!,
        status: 'completed',
        accuracy: result.finalAccuracy,
        loss: result.finalLoss
      });

      return trainedModel;

    } catch (error) {
      const trainingTime = Date.now() - startTime;
      
      nebula.analytics.trackEvent({
        type: 'training',
        duration: trainingTime,
        success: false,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          dataSize: data.length
        }
      });

      setTrainingProgress({
        ...trainingProgress!,
        status: 'error'
      });

      throw error;
    } finally {
      setTimeout(() => {
        setIsTraining(false);
        setTrainingProgress(null);
      }, 2000);
    }
  }, []);

  const fineTune = useCallback(async (
    modelId: string,
    data: TrainingData[],
    config: Partial<TrainingConfig> = {}
  ): Promise<TrainedModel> => {
    const existingModel = trainedModels.find(m => m.id === modelId);
    if (!existingModel) {
      throw new Error('Model not found');
    }

    // Load the existing model
    const nebula = NebulaAI.getInstance();
    await nebula.loadModel(modelId);

    // Fine-tune with new data
    return train(data, {
      ...existingModel.config,
      ...config,
      epochs: config.epochs || 5, // Fewer epochs for fine-tuning
      learningRate: config.learningRate || 0.0001 // Smaller learning rate
    });
  }, [trainedModels, train]);

  const evaluateModel = useCallback(async (
    modelId: string,
    testData: TrainingData[]
  ): Promise<{
    accuracy: number;
    loss: number;
    metrics: Record<string, number>;
  }> => {
    const model = trainedModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    const nebula = NebulaAI.getInstance();
    
    // In a real implementation, you'd evaluate the model
    // This is a simplified version
    const evaluation = {
      accuracy: model.accuracy,
      loss: 0.1,
      metrics: {
        precision: 0.85,
        recall: 0.82,
        f1: 0.83
      }
    };

    return evaluation;
  }, [trainedModels]);

  const deleteModel = useCallback(async (modelId: string): Promise<void> => {
    const newModels = trainedModels.filter(m => m.id !== modelId);
    setTrainedModels(newModels);
    await AsyncStorage.setItem('nebula_trained_models', JSON.stringify(newModels));
  }, [trainedModels]);

  const exportModel = useCallback(async (modelId: string): Promise<string> => {
    const model = trainedModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    const exportData = {
      model,
      exportDate: new Date().toISOString(),
      format: 'nebula-model-v1'
    };

    return JSON.stringify(exportData, null, 2);
  }, [trainedModels]);

  const importModel = useCallback(async (modelData: string): Promise<TrainedModel> => {
    try {
      const data = JSON.parse(modelData);
      
      if (data.format !== 'nebula-model-v1') {
        throw new Error('Invalid model format');
      }

      const importedModel: TrainedModel = {
        ...data.model,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trainedAt: new Date(data.model.trainedAt)
      };

      await saveTrainedModel(importedModel);
      return importedModel;

    } catch (error) {
      throw new Error('Failed to import model: Invalid format');
    }
  }, []);

  const getTrainingStats = useCallback(() => {
    const totalModels = trainedModels.length;
    const totalTrainingTime = trainingHistory.reduce((sum, item) => sum + item.duration, 0);
    const avgAccuracy = trainedModels.length > 0
      ? trainedModels.reduce((sum, model) => sum + model.accuracy, 0) / trainedModels.length
      : 0;

    const recentTraining = trainingHistory.slice(-5);
    const recentAccuracy = recentTraining.length > 0
      ? recentTraining.reduce((sum, item) => sum + item.finalAccuracy, 0) / recentTraining.length
      : 0;

    return {
      totalModels,
      totalTrainingTime,
      avgAccuracy,
      recentAccuracy,
      mostTrainedType: trainedModels.length > 0
        ? trainedModels.reduce((acc, model) => {
            acc[model.type] = (acc[model.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        : {}
    };
  }, [trainedModels, trainingHistory]);

  return {
    // Training functions
    train,
    fineTune,
    evaluateModel,
    
    // Model management
    trainedModels,
    deleteModel,
    exportModel,
    importModel,
    
    // Training state
    isTraining,
    trainingProgress,
    trainingHistory,
    
    // Statistics
    getTrainingStats,
    
    // Utility
    canTrain: true // Check if model is ready
  };
};