import { NeuralNetwork } from './neural-network';
import { DatasetManager } from '../data/dataset-manager';

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  earlyStopping: boolean;
  patience: number;
  saveBestModel: boolean;
}

export interface TrainingMetrics {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  accuracy: number;
  learningRate: number;
  timestamp: Date;
}

export class ModelTrainer {
  private model: NeuralNetwork;
  private dataset: DatasetManager;
  private config: TrainingConfig;
  private metrics: TrainingMetrics[] = [];
  
  constructor(
    model: NeuralNetwork,
    dataset: DatasetManager,
    config: Partial<TrainingConfig> = {}
  ) {
    this.model = model;
    this.dataset = dataset;
    this.config = {
      epochs: 10,
      batchSize: 32,
      learningRate: 0.001,
      validationSplit: 0.2,
      earlyStopping: true,
      patience: 5,
      saveBestModel: true,
      ...config
    };
  }
  
  async train(): Promise<TrainingMetrics[]> {
    console.log('🚀 Starting model training...');
    
    const { trainData, valData } = await this.dataset.split(
      this.config.validationSplit
    );
    
    let bestValLoss = Infinity;
    let patienceCounter = 0;
    
    for (let epoch = 0; epoch < this.config.epochs; epoch++) {
      console.log(`📊 Epoch ${epoch + 1}/${this.config.epochs}`);
      
      // Shuffle training data
      const shuffledData = this.shuffleArray([...trainData]);
      
      // Batch training
      let epochLoss = 0;
      let batchCount = 0;
      
      for (let i = 0; i < shuffledData.length; i += this.config.batchSize) {
        const batch = shuffledData.slice(i, i + this.config.batchSize);
        const batchLoss = await this.trainBatch(batch);
        epochLoss += batchLoss;
        batchCount++;
        
        // Log progress
        if (batchCount % 10 === 0) {
          const progress = Math.min(
            ((i + this.config.batchSize) / shuffledData.length) * 100,
            100
          ).toFixed(1);
          console.log(`  Progress: ${progress}% - Batch Loss: ${batchLoss.toFixed(4)}`);
        }
      }
      
      const avgTrainLoss = epochLoss / batchCount;
      
      // Validation
      const valLoss = await this.validate(valData);
      
      // Calculate accuracy
      const accuracy = await this.calculateAccuracy(valData);
      
      // Store metrics
      const metrics: TrainingMetrics = {
        epoch: epoch + 1,
        trainLoss: avgTrainLoss,
        valLoss,
        accuracy,
        learningRate: this.config.learningRate,
        timestamp: new Date()
      };
      
      this.metrics.push(metrics);
      this.logMetrics(metrics);
      
      // Early stopping check
      if (this.config.earlyStopping) {
        if (valLoss < bestValLoss) {
          bestValLoss = valLoss;
          patienceCounter = 0;
          
          // Save best model
          if (this.config.saveBestModel) {
            await this.saveModel(`best_epoch_${epoch + 1}`);
          }
        } else {
          patienceCounter++;
          if (patienceCounter >= this.config.patience) {
            console.log(`⏹️ Early stopping triggered at epoch ${epoch + 1}`);
            break;
          }
        }
      }
      
      // Learning rate decay
      this.config.learningRate *= 0.95;
    }
    
    console.log('✅ Training completed!');
    return this.metrics;
  }
  
  private async trainBatch(batch: any[]): Promise<number> {
    let batchLoss = 0;
    
    for (const sample of batch) {
      const { input, target } = sample;
      const loss = await this.model.backward(
        input,
        target,
        this.config.learningRate
      );
      batchLoss += loss;
    }
    
    return batchLoss / batch.length;
  }
  
  private async validate(data: any[]): Promise<number> {
    let totalLoss = 0;
    let sampleCount = 0;
    
    for (const sample of data) {
      const { input, target } = sample;
      const output = await this.model.forward(input);
      
      // Calculate MSE loss
      let loss = 0;
      for (let i = 0; i < output.length; i++) {
        const diff = output[i] - (target[i] || 0);
        loss += diff * diff;
      }
      loss /= output.length;
      
      totalLoss += loss;
      sampleCount++;
    }
    
    return totalLoss / sampleCount;
  }
  
  private async calculateAccuracy(data: any[]): Promise<number> {
    let correct = 0;
    let total = 0;
    
    for (const sample of data) {
      const { input, target } = sample;
      const output = await this.model.forward(input);
      
      // For classification tasks
      const predIndex = output.indexOf(Math.max(...output));
      const trueIndex = target.indexOf(Math.max(...target));
      
      if (predIndex === trueIndex) {
        correct++;
      }
      total++;
    }
    
    return total > 0 ? correct / total : 0;
  }
  
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  private logMetrics(metrics: TrainingMetrics): void {
    console.log(
      `  Epoch ${metrics.epoch}: ` +
      `Train Loss: ${metrics.trainLoss.toFixed(4)}, ` +
      `Val Loss: ${metrics.valLoss.toFixed(4)}, ` +
      `Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`
    );
  }
  
  private async saveModel(name: string): Promise<void> {
    // Save model weights and configuration
    const modelData = {
      name,
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      config: this.config
    };
    
    // In a real implementation, save to file system or database
    console.log(`💾 Saved model: ${name}`);
  }
  
  getMetrics(): TrainingMetrics[] {
    return this.metrics;
  }
  
  plotLossCurve(): { train: number[], val: number[] } {
    return {
      train: this.metrics.map(m => m.trainLoss),
      val: this.metrics.map(m => m.valLoss)
    };
  }
  
  plotAccuracyCurve(): number[] {
    return this.metrics.map(m => m.accuracy);
  }
}