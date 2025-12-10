import { LanguageModel } from './language-model';
import { TextGenerator } from './text-generator';
import { Tokenizer } from '../data/tokenizer';

export interface InferenceConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
}

export interface InferenceResult {
  text: string;
  tokens: number;
  inferenceTime: number;
  confidence: number;
  finishReason: 'length' | 'stop' | 'eos';
}

export class InferenceEngine {
  private languageModel: LanguageModel;
  private textGenerator: TextGenerator;
  private tokenizer: Tokenizer;
  private config: InferenceConfig;
  private cache: Map<string, InferenceResult> = new Map();
  
  constructor(
    languageModel: LanguageModel,
    config: Partial<InferenceConfig> = {}
  ) {
    this.languageModel = languageModel;
    this.textGenerator = new TextGenerator();
    this.tokenizer = new Tokenizer();
    
    this.config = {
      maxTokens: 512,
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
      repetitionPenalty: 1.2,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
      stopSequences: ['\n\n', 'Human:', 'AI:', '---'],
      ...config
    };
  }
  
  async initialize(): Promise<void> {
    await Promise.all([
      this.languageModel.initialize(),
      this.textGenerator.initialize()
    ]);
  }
  
  async generate(
    prompt: string,
    options: Partial<InferenceConfig> = {}
  ): Promise<InferenceResult> {
    const startTime = Date.now();
    
    // Check cache
    const cacheKey = `${prompt}:${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      console.log('📦 Using cached inference result');
      return {
        ...cached,
        inferenceTime: 0.1 // Minimal time for cache retrieval
      };
    }
    
    // Merge config with options
    const config = { ...this.config, ...options };
    
    // Tokenize prompt
    const promptTokens = this.tokenizer.encode(prompt);
    
    // Generate tokens
    const generatedTokens = await this.generateTokens(
      promptTokens,
      config
    );
    
    // Decode tokens
    const generatedText = this.tokenizer.decode(generatedTokens);
    
    // Calculate confidence (simplified)
    const confidence = this.calculateConfidence(generatedTokens);
    
    const inferenceTime = Date.now() - startTime;
    
    const result: InferenceResult = {
      text: generatedText,
      tokens: generatedTokens.length,
      inferenceTime,
      confidence,
      finishReason: this.getFinishReason(generatedTokens, config)
    };
    
    // Cache result
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  private async generateTokens(
    promptTokens: number[],
    config: InferenceConfig
  ): Promise<number[]> {
    const tokens = [...promptTokens];
    const tokenHistory: number[] = [];
    
    for (let i = 0; i < config.maxTokens; i++) {
      // Get next token probabilities
      const logits = await this.languageModel.forward(tokens);
      
      // Apply penalties
      const penalizedLogits = this.applyPenalties(
        logits,
        tokenHistory,
        config
      );
      
      // Sample next token
      const nextToken = this.sampleToken(penalizedLogits, config);
      
      // Check stop conditions
      if (this.shouldStop(nextToken, tokens, config)) {
        break;
      }
      
      tokens.push(nextToken);
      tokenHistory.push(nextToken);
    }
    
    return tokens;
  }
  
  private applyPenalties(
    logits: number[],
    tokenHistory: number[],
    config: InferenceConfig
  ): number[] {
    const penalized = [...logits];
    
    // Frequency penalty
    const frequencyCount = new Map<number, number>();
    tokenHistory.forEach(token => {
      frequencyCount.set(token, (frequencyCount.get(token) || 0) + 1);
    });
    
    // Presence penalty
    const presenceSet = new Set(tokenHistory);
    
    for (let i = 0; i < penalized.length; i++) {
      let penalty = 0;
      
      // Repetition penalty
      if (tokenHistory.slice(-10).includes(i)) {
        penalty += config.repetitionPenalty;
      }
      
      // Frequency penalty
      const freq = frequencyCount.get(i) || 0;
      penalty += freq * config.frequencyPenalty;
      
      // Presence penalty
      if (presenceSet.has(i)) {
        penalty += config.presencePenalty;
      }
      
      penalized[i] = penalized[i] - penalty;
    }
    
    return penalized;
  }
  
  private sampleToken(
    logits: number[],
    config: InferenceConfig
  ): number {
    // Apply temperature
    const temperature = Math.max(0.1, config.temperature);
    const scaledLogits = logits.map(l => l / temperature);
    
    // Apply top-k
    if (config.topK > 0) {
      const sorted = [...scaledLogits]
        .map((val, idx) => ({ val, idx }))
        .sort((a, b) => b.val - a.val)
        .slice(0, config.topK);
      
      const topKLogits = new Array(logits.length).fill(-Infinity);
      sorted.forEach(({ idx }) => {
        topKLogits[idx] = scaledLogits[idx];
      });
      
      return this.sampleFromLogits(topKLogits, config.topP);
    }
    
    return this.sampleFromLogits(scaledLogits, config.topP);
  }
  
  private sampleFromLogits(
    logits: number[],
    topP: number
  ): number {
    // Convert to probabilities
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    
    let probs = exps.map(exp => exp / sumExps);
    
    // Apply nucleus (top-p) sampling
    if (topP < 1.0) {
      const { filteredProbs, filteredIndices } = this.applyNucleusSampling(
        probs,
        topP
      );
      probs = filteredProbs;
      
      // Sample from filtered distribution
      const rand = Math.random();
      let cumulative = 0;
      
      for (let i = 0; i < probs.length; i++) {
        cumulative += probs[i];
        if (rand <= cumulative) {
          return filteredIndices[i];
        }
      }
      
      return filteredIndices[filteredIndices.length - 1];
    }
    
    // Sample from full distribution
    const rand = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i];
      if (rand <= cumulative) {
        return i;
      }
    }
    
    return probs.length - 1;
  }
  
  private applyNucleusSampling(
    probs: number[],
    topP: number
  ): { filteredProbs: number[], filteredIndices: number[] } {
    // Sort probabilities in descending order
    const sorted = probs
      .map((prob, idx) => ({ prob, idx }))
      .sort((a, b) => b.prob - a.prob);
    
    let cumulative = 0;
    let cutoff = 0;
    
    for (let i = 0; i < sorted.length; i++) {
      cumulative += sorted[i].prob;
      if (cumulative >= topP) {
        cutoff = i + 1;
        break;
      }
    }
    
    // Keep top-p tokens
    const filtered = sorted.slice(0, cutoff);
    const filteredProbs = filtered.map(item => item.prob);
    const filteredIndices = filtered.map(item => item.idx);
    
    // Renormalize probabilities
    const sumFiltered = filteredProbs.reduce((a, b) => a + b, 0);
    const normalizedProbs = filteredProbs.map(prob => prob / sumFiltered);
    
    return {
      filteredProbs: normalizedProbs,
      filteredIndices
    };
  }
  
  private shouldStop(
    token: number,
    tokens: number[],
    config: InferenceConfig
  ): boolean {
    // Check for end-of-sequence token
    if (token === this.tokenizer.endToken) {
      return true;
    }
    
    // Check for stop sequences
    const currentText = this.tokenizer.decode(tokens);
    for (const stopSeq of config.stopSequences) {
      if (currentText.endsWith(stopSeq)) {
        return true;
      }
    }
    
    return false;
  }
  
  private calculateConfidence(tokens: number[]): number {
    // Simplified confidence calculation
    const uniqueTokens = new Set(tokens).size;
    const totalTokens = tokens.length;
    
    // Higher confidence for more diverse tokens
    const diversityScore = uniqueTokens / totalTokens;
    
    // Higher confidence for reasonable length
    const lengthScore = Math.min(tokens.length / 100, 1);
    
    return (diversityScore * 0.7 + lengthScore * 0.3);
  }
  
  private getFinishReason(
    tokens: number[],
    config: InferenceConfig
  ): 'length' | 'stop' | 'eos' {
    if (tokens.length >= config.maxTokens) {
      return 'length';
    }
    
    const lastToken = tokens[tokens.length - 1];
    if (lastToken === this.tokenizer.endToken) {
      return 'eos';
    }
    
    return 'stop';
  }
  
  clearCache(): void {
    this.cache.clear();
  }
  
  getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
  } {
    return {
      size: this.cache.size,
      hits: 0, // Track in real implementation
      misses: 0
    };
  }
  
  async batchGenerate(
    prompts: string[],
    options: Partial<InferenceConfig> = {}
  ): Promise<InferenceResult[]> {
    const results: InferenceResult[] = [];
    
    for (const prompt of prompts) {
      const result = await this.generate(prompt, options);
      results.push(result);
    }
    
    return results;
  }
}