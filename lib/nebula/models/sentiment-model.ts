import { BaseModel } from './base-model';
import { TextPreprocessor } from '../data/preprocessor';

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  tokens?: string[];
}

export class SentimentModel extends BaseModel {
  private preprocessor: TextPreprocessor;
  private classes = ['positive', 'negative', 'neutral'];
  
  constructor() {
    super();
    this.preprocessor = new TextPreprocessor();
    this.initializeModel();
  }
  
  private initializeModel(): void {
    // Input layer: takes 768-dimensional embeddings
    this.addLayer({
      type: 'dense',
      units: 256,
      activation: 'relu',
      dropout: 0.3
    });
    
    // Hidden layers
    this.addLayer({
      type: 'dense',
      units: 128,
      activation: 'relu',
      dropout: 0.2
    });
    
    this.addLayer({
      type: 'dense',
      units: 64,
      activation: 'relu'
    });
    
    // Output layer: 3 classes (positive, negative, neutral)
    this.addLayer({
      type: 'dense',
      units: 3,
      activation: 'softmax'
    });
  }
  
  async analyze(text: string): Promise<SentimentResult> {
    // Preprocess text
    const processed = this.preprocessor.preprocess(text, {
      lowercase: true,
      removePunctuation: true,
      removeNumbers: true
    });
    
    // Extract features (in production, use embeddings)
    const features = this.extractFeatures(processed);
    
    // Get predictions
    const predictions = await this.forward(features);
    
    // Interpret results
    return this.interpretPredictions(predictions, processed);
  }
  
  private extractFeatures(text: string): number[] {
    // Extract various text features for sentiment analysis
    const features: number[] = [];
    
    // Sentiment lexicon scores (simplified)
    const positiveWords = new Set(['good', 'great', 'excellent', 'happy', 'love', 'like']);
    const negativeWords = new Set(['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad']);
    
    const words = text.toLowerCase().split(/\s+/);
    
    // Positive word count
    const positiveCount = words.filter(w => positiveWords.has(w)).length;
    features.push(positiveCount / (words.length || 1));
    
    // Negative word count
    const negativeCount = words.filter(w => negativeWords.has(w)).length;
    features.push(negativeCount / (words.length || 1));
    
    // Exclamation marks (excitement indicator)
    const exclamationCount = (text.match(/!/g) || []).length;
    features.push(exclamationCount / (text.length || 1));
    
    // Question marks (uncertainty indicator)
    const questionCount = (text.match(/\?/g) || []).length;
    features.push(questionCount / (text.length || 1));
    
    // ALL CAPS words (emphasis indicator)
    const allCapsCount = words.filter(w => w === w.toUpperCase() && w.length > 1).length;
    features.push(allCapsCount / (words.length || 1));
    
    // Emoticons (if not removed)
    const positiveEmoticons = (text.match(/[:;]-?[)D]/g) || []).length;
    const negativeEmoticons = (text.match(/[:;]-?[(]/g) || []).length;
    features.push(positiveEmoticons / (text.length || 1));
    features.push(negativeEmoticons / (text.length || 1));
    
    // Text length features
    features.push(words.length / 100); // Normalized word count
    features.push(text.length / 500); // Normalized character count
    
    // Average word length
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);
    features.push(avgWordLength / 10);
    
    // Pad or truncate to expected input size
    const expectedSize = 768;
    if (features.length < expectedSize) {
      features.push(...new Array(expectedSize - features.length).fill(0));
    } else {
      return features.slice(0, expectedSize);
    }
    
    return features;
  }
  
  private interpretPredictions(
    predictions: number[], 
    text: string
  ): SentimentResult {
    const scores = {
      positive: predictions[0],
      negative: predictions[1],
      neutral: predictions[2]
    };
    
    // Find highest score
    const maxScore = Math.max(...predictions);
    const maxIndex = predictions.indexOf(maxScore);
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    switch (maxIndex) {
      case 0: sentiment = 'positive'; break;
      case 1: sentiment = 'negative'; break;
      default: sentiment = 'neutral'; break;
    }
    
    // Extract significant tokens
    const tokens = this.extractSignificantTokens(text);
    
    return {
      sentiment,
      confidence: maxScore,
      scores,
      tokens
    };
  }
  
  private extractSignificantTokens(text: string): string[] {
    const significantWords = new Set([
      // Positive
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'happy', 'joy', 'love', 'like', 'awesome', 'perfect', 'best',
      // Negative
      'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate',
      'dislike', 'angry', 'sad', 'upset', 'disappointing', 'poor',
      // Intensifiers
      'very', 'extremely', 'really', 'so', 'too', 'absolutely'
    ]);
    
    const words = text.toLowerCase().split(/\s+/);
    return words
      .filter(word => significantWords.has(word))
      .filter((word, index, array) => array.indexOf(word) === index) // Unique
      .slice(0, 10); // Limit to 10 tokens
  }
  
  async batchAnalyze(texts: string[]): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];
    
    for (const text of texts) {
      const result = await this.analyze(text);
      results.push(result);
    }
    
    return results;
  }
  
  async train(
    trainingData: Array<{ text: string; label: 'positive' | 'negative' | 'neutral' }>,
    epochs: number = 10,
    learningRate: number = 0.001
  ): Promise<{ accuracy: number; loss: number }> {
    console.log(`🎯 Training sentiment model with ${trainingData.length} examples`);
    
    let totalLoss = 0;
    let correct = 0;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      epochLoss = 0;
      epochCorrect = 0;
      
      for (const example of trainingData) {
        // Extract features
        const processed = this.preprocessor.preprocess(example.text, {
          lowercase: true,
          removePunctuation: true
        });
        
        const features = this.extractFeatures(processed);
        
        // Convert label to one-hot encoding
        const labelIndex = this.classes.indexOf(example.label);
        const target = new Array(3).fill(0);
        target[labelIndex] = 1;
        
        // Forward pass
        const predictions = await this.forward(features);
        
        // Calculate loss
        const loss = this.computeLoss(predictions, target);
        epochLoss += loss;
        
        // Check prediction
        const predIndex = predictions.indexOf(Math.max(...predictions));
        if (predIndex === labelIndex) {
          epochCorrect++;
        }
        
        // Backward pass (simplified)
        await this.backward(features, target, learningRate);
      }
      
      const avgLoss = epochLoss / trainingData.length;
      const accuracy = epochCorrect / trainingData.length;
      
      totalLoss += avgLoss;
      correct += epochCorrect;
      
      console.log(
        `  Epoch ${epoch + 1}: Loss = ${avgLoss.toFixed(4)}, ` +
        `Accuracy = ${(accuracy * 100).toFixed(2)}%`
      );
    }
    
    const finalAccuracy = correct / (trainingData.length * epochs);
    const finalLoss = totalLoss / epochs;
    
    console.log(`✅ Training complete! Final accuracy: ${(finalAccuracy * 100).toFixed(2)}%`);
    
    return { accuracy: finalAccuracy, loss: finalLoss };
  }
  
  private computeLoss(predictions: number[], target: number[]): number {
    // Cross-entropy loss
    let loss = 0;
    for (let i = 0; i < predictions.length; i++) {
      const p = Math.max(predictions[i], 1e-10); // Prevent log(0)
      loss -= target[i] * Math.log(p);
    }
    return loss;
  }
  
  async evaluate(
    testData: Array<{ text: string; label: 'positive' | 'negative' | 'neutral' }>
  ): Promise<{
    accuracy: number;
    precision: Record<string, number>;
    recall: Record<string, number>;
    f1: Record<string, number>;
    confusionMatrix: number[][];
  }> {
    let correct = 0;
    const confusionMatrix = Array(3).fill(0).map(() => Array(3).fill(0));
    
    for (const example of testData) {
      const result = await this.analyze(example.text);
      const predIndex = this.classes.indexOf(result.sentiment);
      const trueIndex = this.classes.indexOf(example.label);
      
      confusionMatrix[trueIndex][predIndex]++;
      
      if (result.sentiment === example.label) {
        correct++;
      }
    }
    
    const accuracy = correct / testData.length;
    
    // Calculate precision, recall, F1 for each class
    const precision: Record<string, number> = {};
    const recall: Record<string, number> = {};
    const f1: Record<string, number> = {};
    
    for (let i = 0; i < this.classes.length; i++) {
      const className = this.classes[i];
      
      // True positives
      const tp = confusionMatrix[i][i];
      
      // False positives
      let fp = 0;
      for (let j = 0; j < this.classes.length; j++) {
        if (j !== i) fp += confusionMatrix[j][i];
      }
      
      // False negatives
      let fn = 0;
      for (let j = 0; j < this.classes.length; j++) {
        if (j !== i) fn += confusionMatrix[i][j];
      }
      
      precision[className] = tp + fp > 0 ? tp / (tp + fp) : 0;
      recall[className] = tp + fn > 0 ? tp / (tp + fn) : 0;
      
      const p = precision[className];
      const r = recall[className];
      f1[className] = p + r > 0 ? (2 * p * r) / (p + r) : 0;
    }
    
    return {
      accuracy,
      precision,
      recall,
      f1,
      confusionMatrix
    };
  }
}