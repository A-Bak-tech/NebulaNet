import { BaseModel } from './base-model';
import { Tokenizer } from '../data/tokenizer';

export interface TextGenerationConfig {
  modelSize: 'small' | 'medium' | 'large';
  maxLength: number;
  temperature: number;
  topP: number;
  topK: number;
}

export class TextGenerationModel extends BaseModel {
  private config: TextGenerationConfig;
  private tokenizer: Tokenizer;
  
  constructor(config: Partial<TextGenerationConfig> = {}) {
    super();
    
    this.config = {
      modelSize: 'medium',
      maxLength: 512,
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
      ...config
    };
    
    this.tokenizer = new Tokenizer();
    this.initializeModel();
  }
  
  private initializeModel(): void {
    const sizeConfigs = {
      small: { layers: 6, hiddenSize: 384, heads: 6 },
      medium: { layers: 12, hiddenSize: 768, heads: 12 },
      large: { layers: 24, hiddenSize: 1024, heads: 16 }
    };
    
    const config = sizeConfigs[this.config.modelSize];
    
    // Initialize transformer layers
    for (let i = 0; i < config.layers; i++) {
      this.addLayer({
        type: 'attention',
        units: config.hiddenSize,
        activation: 'linear'
      });
      
      this.addLayer({
        type: 'feedforward',
        units: config.hiddenSize * 4,
        activation: 'relu'
      });
      
      this.addLayer({
        type: 'feedforward',
        units: config.hiddenSize,
        activation: 'linear'
      });
    }
    
    // Final projection layer
    this.addLayer({
      type: 'dense',
      units: this.tokenizer.getVocabSize(),
      activation: 'linear'
    });
  }
  
  async generate(
    prompt: string,
    options: Partial<TextGenerationConfig> = {}
  ): Promise<string> {
    const mergedConfig = { ...this.config, ...options };
    
    // Tokenize prompt
    const promptTokens = this.tokenizer.encode(prompt);
    
    // Generate continuation
    const generatedTokens = await this.generateTokens(
      promptTokens,
      mergedConfig
    );
    
    // Decode to text
    return this.tokenizer.decode(generatedTokens);
  }
  
  private async generateTokens(
    promptTokens: number[],
    config: TextGenerationConfig
  ): Promise<number[]> {
    const tokens = [...promptTokens];
    
    for (let i = 0; i < config.maxLength; i++) {
      // Get next token probabilities
      const logits = await this.forward(tokens);
      
      // Apply temperature scaling
      const scaledLogits = logits.map(l => l / config.temperature);
      
      // Apply top-k filtering
      const topKLogits = this.applyTopK(scaledLogits, config.topK);
      
      // Apply top-p (nucleus) sampling
      const nextToken = this.sampleWithTopP(topKLogits, config.topP);
      
      tokens.push(nextToken);
      
      // Stop if we hit end token
      if (nextToken === this.tokenizer.endToken) break;
    }
    
    return tokens;
  }
  
  private applyTopK(logits: number[], k: number): number[] {
    if (k === 0) return logits;
    
    const sortedWithIndices = logits
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val);
    
    const threshold = sortedWithIndices[Math.min(k, sortedWithIndices.length) - 1].val;
    
    return logits.map(val => val >= threshold ? val : -Infinity);
  }
  
  private sampleWithTopP(logits: number[], p: number): number {
    // Convert to probabilities
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(exp => exp / sumExps);
    
    // Sort probabilities in descending order
    const sorted = probs
      .map((prob, idx) => ({ prob, idx }))
      .sort((a, b) => b.prob - a.prob);
    
    // Find cumulative probability cutoff
    let cumulative = 0;
    let cutoff = 0;
    for (let i = 0; i < sorted.length; i++) {
      cumulative += sorted[i].prob;
      if (cumulative >= p) {
        cutoff = i + 1;
        break;
      }
    }
    
    // Sample from top-p tokens
    const topPItems = sorted.slice(0, cutoff);
    const topPProbs = topPItems.map(item => item.prob);
    const topPIndices = topPItems.map(item => item.idx);
    
    // Renormalize
    const sumTopP = topPProbs.reduce((a, b) => a + b, 0);
    const normalizedProbs = topPProbs.map(prob => prob / sumTopP);
    
    // Sample
    const rand = Math.random();
    let cumulativeProb = 0;
    
    for (let i = 0; i < normalizedProbs.length; i++) {
      cumulativeProb += normalizedProbs[i];
      if (rand <= cumulativeProb) {
        return topPIndices[i];
      }
    }
    
    return topPIndices[topPIndices.length - 1];
  }
  
  async batchGenerate(
    prompts: string[],
    options: Partial<TextGenerationConfig> = {}
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (const prompt of prompts) {
      const result = await this.generate(prompt, options);
      results.push(result);
    }
    
    return results;
  }
  
  async calculatePerplexity(text: string): Promise<number> {
    const tokens = this.tokenizer.encode(text);
    let totalLogProb = 0;
    
    for (let i = 1; i < tokens.length; i++) {
      const context = tokens.slice(0, i);
      const nextToken = tokens[i];
      
      const logits = await this.forward(context);
      const probs = this.softmax(logits);
      const tokenProb = probs[nextToken] || 1e-10;
      
      totalLogProb += Math.log(tokenProb);
    }
    
    const avgLogProb = totalLogProb / (tokens.length - 1);
    return Math.exp(-avgLogProb);
  }
  
  private softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map(exp => exp / sumExps);
  }
  
  async fineTune(
    trainingData: Array<{ prompt: string; completion: string }>,
    epochs: number = 3,
    learningRate: number = 0.0001
  ): Promise<void> {
    console.log(`🎯 Fine-tuning model with ${trainingData.length} examples`);
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochLoss = 0;
      
      for (const example of trainingData) {
        const fullText = example.prompt + example.completion;
        const tokens = this.tokenizer.encode(fullText);
        
        // Simple training: predict next token
        for (let i = 1; i < tokens.length; i++) {
          const context = tokens.slice(0, i);
          const target = tokens[i];
          
          const logits = await this.forward(context);
          const loss = this.computeCrossEntropyLoss(logits, target);
          
          // Backward pass (simplified)
          await this.backward(context, [target], learningRate);
          
          epochLoss += loss;
        }
      }
      
      const avgLoss = epochLoss / trainingData.length;
      console.log(`  Epoch ${epoch + 1}: Loss = ${avgLoss.toFixed(4)}`);
    }
    
    console.log('✅ Fine-tuning complete!');
  }
  
  private computeCrossEntropyLoss(logits: number[], target: number): number {
    const probs = this.softmax(logits);
    const targetProb = probs[target] || 1e-10;
    return -Math.log(targetProb);
  }
  
  async save(path: string): Promise<void> {
    const modelData = {
      config: this.config,
      weights: this.getWeights(),
      tokenizer: this.tokenizer.save()
    };
    
    // In React Native, save to AsyncStorage
    await this.saveToStorage(path, modelData);
    console.log(`💾 Model saved to: ${path}`);
  }
  
  async load(path: string): Promise<void> {
    const modelData = await this.loadFromStorage(path);
    
    this.config = modelData.config;
    this.setWeights(modelData.weights);
    this.tokenizer.load(modelData.tokenizer);
    
    console.log(`📥 Model loaded from: ${path}`);
  }
  
  private async saveToStorage(path: string, data: any): Promise<void> {
    // Implement AsyncStorage or FileSystem save
    const key = `model_${path}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }
  
  private async loadFromStorage(path: string): Promise<any> {
    const key = `model_${path}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}