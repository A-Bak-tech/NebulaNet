import { BaseModel } from '../models/base-model';
import { Tokenizer } from '../data/tokenizer';

export interface GenerationOptions {
  temperature?: number;
  maxLength?: number;
  topP?: number;
  topK?: number;
  repetitionPenalty?: number;
}

export class TextGenerator {
  private model: BaseModel;
  private tokenizer: Tokenizer;
  
  constructor(modelPath: string) {
    this.model = new BaseModel();
    this.tokenizer = new Tokenizer();
  }

  async initialize(): Promise<void> {
    await this.model.load();
    await this.tokenizer.loadVocabulary();
  }

  async generate(prompt: string, options: GenerationOptions = {}): Promise<string> {
    const {
      temperature = 0.7,
      maxLength = 100,
      topP = 0.9,
      topK = 50,
      repetitionPenalty = 1.2
    } = options;

    // Tokenize input
    const tokens = this.tokenizer.encode(prompt);
    
    // Generate using neural network
    let generatedTokens = [...tokens];
    
    for (let i = 0; i < maxLength; i++) {
      const logits = await this.model.forward(generatedTokens);
      const nextToken = this.sampleToken(logits, {
        temperature,
        topP,
        topK,
        repetitionPenalty
      });
      
      generatedTokens.push(nextToken);
      
      // Stop if we hit end token
      if (nextToken === this.tokenizer.endToken) break;
    }
    
    return this.tokenizer.decode(generatedTokens);
  }

  private sampleToken(
    logits: number[], 
    options: SamplingOptions
  ): number {
    const { temperature, topP, topK } = options;
    
    // Apply temperature scaling
    const scaledLogits = logits.map(logit => logit / temperature);
    
    // Apply top-k filtering
    const sorted = [...scaledLogits].sort((a, b) => b - a);
    const threshold = sorted[Math.min(topK, sorted.length) - 1];
    const filteredLogits = scaledLogits.map(l => l >= threshold ? l : -Infinity);
    
    // Apply top-p (nucleus) sampling
    const sortedProbs = this.softmax(filteredLogits)
      .sort((a, b) => b - a);
    
    let cumulative = 0;
    let cutoff = 0;
    for (let i = 0; i < sortedProbs.length; i++) {
      cumulative += sortedProbs[i];
      if (cumulative >= topP) {
        cutoff = i;
        break;
      }
    }
    
    // Sample from filtered distribution
    const probs = this.softmax(filteredLogits.slice(0, cutoff + 1));
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < probs.length; i++) {
      sum += probs[i];
      if (random <= sum) return i;
    }
    
    return 0;
  }

  private softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits);
    const exp = logits.map(l => Math.exp(l - maxLogit));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(e => e / sum);
  }
}