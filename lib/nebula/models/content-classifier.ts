import { BaseModel } from './base-model';
import { TextPreprocessor } from '../data/preprocessor';

export interface ClassificationResult {
  category: string;
  confidence: number;
  categories: Array<{ name: string; score: number }>;
  flags: string[];
  isSafe: boolean;
}

export interface ClassificationRule {
  name: string;
  pattern: RegExp;
  weight: number;
  category: string;
}

export class ContentClassifier extends BaseModel {
  private preprocessor: TextPreprocessor;
  private categories: string[];
  private rules: ClassificationRule[] = [];
  
  constructor(categories: string[] = []) {
    super();
    this.preprocessor = new TextPreprocessor();
    this.categories = categories.length > 0 ? categories : [
      'safe',
      'spam',
      'harassment',
      'hate_speech',
      'explicit',
      'violence',
      'misinformation'
    ];
    
    this.initializeModel();
    this.initializeRules();
  }
  
  private initializeModel(): void {
    // Input layer
    this.addLayer({
      type: 'dense',
      units: 512,
      activation: 'relu',
      dropout: 0.3
    });
    
    // Hidden layers
    this.addLayer({
      type: 'dense',
      units: 256,
      activation: 'relu',
      dropout: 0.2
    });
    
    this.addLayer({
      type: 'dense',
      units: 128,
      activation: 'relu'
    });
    
    // Output layer: one per category
    this.addLayer({
      type: 'dense',
      units: this.categories.length,
      activation: 'sigmoid' // Multi-label classification
    });
  }
  
  private initializeRules(): void {
    // Define rule-based patterns for quick classification
    this.rules = [
      // Spam detection
      {
        name: 'spam_links',
        pattern: /(http|https|www\.|\.com|\.net|\.org)/gi,
        weight: 0.3,
        category: 'spam'
      },
      {
        name: 'spam_keywords',
        pattern: /\b(buy now|click here|free offer|discount|limited time)\b/gi,
        weight: 0.4,
        category: 'spam'
      },
      
      // Hate speech detection
      {
        name: 'hate_slurs',
        pattern: /\b(racist|sexist|homophobic|slur|hate)\b/gi,
        weight: 0.8,
        category: 'hate_speech'
      },
      
      // Harassment detection
      {
        name: 'harassment_threats',
        pattern: /\b(kill|hurt|harm|threat|attack|beat)\b/gi,
        weight: 0.7,
        category: 'harassment'
      },
      
      // Explicit content
      {
        name: 'explicit_language',
        pattern: /\b(fuck|shit|asshole|bitch|damn|hell)\b/gi,
        weight: 0.6,
        category: 'explicit'
      },
      
      // Violence
      {
        name: 'violence_words',
        pattern: /\b(violence|fight|weapon|gun|knife|blood)\b/gi,
        weight: 0.7,
        category: 'violence'
      },
      
      // Misinformation
      {
        name: 'misinformation_indicators',
        pattern: /\b(fake news|conspiracy|hoax|lies|false)\b/gi,
        weight: 0.5,
        category: 'misinformation'
      }
    ];
  }
  
  async classify(text: string): Promise<ClassificationResult> {
    // Preprocess text
    const processed = this.preprocessor.preprocess(text, {
      lowercase: true,
      removePunctuation: true
    });
    
    // Extract features
    const features = this.extractFeatures(processed);
    
    // Get neural network predictions
    const predictions = await this.forward(features);
    
    // Apply rule-based adjustments
    const adjustedPredictions = this.applyRules(text, predictions);
    
    // Interpret results
    return this.interpretPredictions(adjustedPredictions);
  }
  
  private extractFeatures(text: string): number[] {
    const features: number[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Basic text statistics
    features.push(words.length / 100); // Normalized length
    features.push((text.match(/[A-Z]/g) || []).length / text.length || 0); // Caps ratio
    
    // Keyword density for each category
    for (const category of this.categories) {
      const keywords = this.getCategoryKeywords(category);
      const keywordCount = words.filter(w => keywords.has(w)).length;
      features.push(keywordCount / (words.length || 1));
    }
    
    // Special character ratios
    features.push((text.match(/[!]/g) || []).length / text.length || 0); // Exclamation
    features.push((text.match(/[?]/g) || []).length / text.length || 0); // Question
    features.push((text.match(/[$]/g) || []).length / text.length || 0); // Dollar signs
    
    // Link and mention detection
    features.push((text.match(/@\w+/g) || []).length / 10); // Mentions
    features.push((text.match(/#\w+/g) || []).length / 10); // Hashtags
    
    // Pad to expected size
    const expectedSize = 512;
    while (features.length < expectedSize) {
      features.push(0);
    }
    
    return features.slice(0, expectedSize);
  }
  
  private getCategoryKeywords(category: string): Set<string> {
    const keywordMap: Record<string, string[]> = {
      spam: ['buy', 'free', 'offer', 'click', 'link', 'discount', 'win', 'prize'],
      harassment: ['kill', 'hurt', 'harm', 'threat', 'attack', 'beat', 'bully'],
      hate_speech: ['hate', 'racist', 'sexist', 'homophobic', 'slur', 'bigot'],
      explicit: ['fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'sex', 'nude'],
      violence: ['fight', 'weapon', 'gun', 'knife', 'blood', 'violence', 'war'],
      misinformation: ['fake', 'hoax', 'lies', 'false', 'conspiracy', 'rumor']
    };
    
    return new Set(keywordMap[category] || []);
  }
  
  private applyRules(text: string, predictions: number[]): number[] {
    const adjusted = [...predictions];
    
    for (const rule of this.rules) {
      const matches = text.match(rule.pattern);
      if (matches) {
        const categoryIndex = this.categories.indexOf(rule.category);
        if (categoryIndex !== -1) {
          // Increase prediction for this category based on rule matches
          const boost = Math.min(rule.weight * (matches.length / 10), 0.5);
          adjusted[categoryIndex] = Math.min(adjusted[categoryIndex] + boost, 1.0);
        }
      }
    }
    
    return adjusted;
  }
  
  private interpretPredictions(predictions: number[]): ClassificationResult {
    // Get top categories
    const categoryScores = predictions.map((score, index) => ({
      name: this.categories[index],
      score
    }));
    
    // Sort by score descending
    categoryScores.sort((a, b) => b.score - a.score);
    
    // Determine primary category
    const primary = categoryScores[0];
    
    // Check if content is safe
    const isSafe = primary.name === 'safe' || primary.score < 0.5;
    
    // Get flags for unsafe content
    const flags = categoryScores
      .filter(cat => cat.name !== 'safe' && cat.score > 0.3)
      .map(cat => cat.name);
    
    return {
      category: primary.name,
      confidence: primary.score,
      categories: categoryScores,
      flags,
      isSafe
    };
  }
  
  async batchClassify(texts: string[]): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];
    
    for (const text of texts) {
      const result = await this.classify(text);
      results.push(result);
    }
    
    return results;
  }
  
  async train(
    trainingData: Array<{
      text: string;
      labels: Record<string, boolean>; // Multi-label
    }>,
    epochs: number = 5,
    learningRate: number = 0.001
  ): Promise<{ accuracy: number; loss: number }> {
    console.log(`🎯 Training classifier with ${trainingData.length} examples`);
    
    let totalLoss = 0;
    let correct = 0;
    let total = 0;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochLoss = 0;
      let epochCorrect = 0;
      let epochTotal = 0;
      
      for (const example of trainingData) {
        // Extract features
        const processed = this.preprocessor.preprocess(example.text, {
          lowercase: true,
          removePunctuation: true
        });
        
        const features = this.extractFeatures(processed);
        
        // Convert labels to array
        const target = this.categories.map(cat => 
          example.labels[cat] ? 1 : 0
        );
        
        // Forward pass
        const predictions = await this.forward(features);
        
        // Calculate loss (binary cross-entropy)
        const loss = this.computeBinaryCrossEntropy(predictions, target);
        epochLoss += loss;
        
        // Check predictions (threshold at 0.5)
        for (let i = 0; i < predictions.length; i++) {
          const predicted = predictions[i] > 0.5 ? 1 : 0;
          if (predicted === target[i]) {
            epochCorrect++;
          }
          epochTotal++;
        }
        
        // Backward pass
        await this.backward(features, target, learningRate);
      }
      
      const avgLoss = epochLoss / trainingData.length;
      const accuracy = epochTotal > 0 ? epochCorrect / epochTotal : 0;
      
      totalLoss += avgLoss;
      correct += epochCorrect;
      total += epochTotal;
      
      console.log(
        `  Epoch ${epoch + 1}: Loss = ${avgLoss.toFixed(4)}, ` +
        `Accuracy = ${(accuracy * 100).toFixed(2)}%`
      );
    }
    
    const finalAccuracy = total > 0 ? correct / total : 0;
    const finalLoss = totalLoss / epochs;
    
    console.log(`✅ Training complete! Final accuracy: ${(finalAccuracy * 100).toFixed(2)}%`);
    
    return { accuracy: finalAccuracy, loss: finalLoss };
  }
  
  private computeBinaryCrossEntropy(predictions: number[], target: number[]): number {
    let loss = 0;
    for (let i = 0; i < predictions.length; i++) {
      const p = Math.max(Math.min(predictions[i], 1 - 1e-10), 1e-10);
      loss -= target[i] * Math.log(p) + (1 - target[i]) * Math.log(1 - p);
    }
    return loss / predictions.length;
  }
  
  addCategory(name: string): void {
    if (!this.categories.includes(name)) {
      this.categories.push(name);
      // Re-initialize model with new category
      this.initializeModel();
    }
  }
  
  addRule(rule: Omit<ClassificationRule, 'weight'> & { weight?: number }): void {
    this.rules.push({
      ...rule,
      weight: rule.weight || 0.5
    });
  }
  
  async evaluate(
    testData: Array<{
      text: string;
      labels: Record<string, boolean>;
    }>
  ): Promise<{
    accuracy: number;
    precision: Record<string, number>;
    recall: Record<string, number>;
    f1: Record<string, number>;
    rocAuc: Record<string, number>;
  }> {
    const results = {
      accuracy: 0,
      precision: {} as Record<string, number>,
      recall: {} as Record<string, number>,
      f1: {} as Record<string, number>,
      rocAuc: {} as Record<string, number>
    };
    
    // Initialize metrics for each category
    for (const category of this.categories) {
      results.precision[category] = 0;
      results.recall[category] = 0;
      results.f1[category] = 0;
      results.rocAuc[category] = 0;
    }
    
    let totalCorrect = 0;
    let totalPredictions = 0;
    
    const categoryStats: Record<string, {
      tp: number; // True positives
      fp: number; // False positives
      fn: number; // False negatives
      tn: number; // True negatives
      scores: number[];
      labels: number[];
    }> = {};
    
    // Initialize stats for each category
    for (const category of this.categories) {
      categoryStats[category] = { tp: 0, fp: 0, fn: 0, tn: 0, scores: [], labels: [] };
    }
    
    for (const example of testData) {
      const result = await this.classify(example.text);
      
      for (let i = 0; i < this.categories.length; i++) {
        const category = this.categories[i];
        const predictedScore = result.categories.find(c => c.name === category)?.score || 0;
        const predicted = predictedScore > 0.5;
        const actual = example.labels[category] || false;
        
        // Store for ROC AUC calculation
        categoryStats[category].scores.push(predictedScore);
        categoryStats[category].labels.push(actual ? 1 : 0);
        
        // Update confusion matrix
        if (predicted && actual) {
          categoryStats[category].tp++;
        } else if (predicted && !actual) {
          categoryStats[category].fp++;
        } else if (!predicted && actual) {
          categoryStats[category].fn++;
        } else {
          categoryStats[category].tn++;
        }
        
        if (predicted === actual) {
          totalCorrect++;
        }
        totalPredictions++;
      }
    }
    
    // Calculate metrics for each category
    for (const category of this.categories) {
      const stats = categoryStats[category];
      
      // Precision
      results.precision[category] = stats.tp + stats.fp > 0 
        ? stats.tp / (stats.tp + stats.fp) 
        : 0;
      
      // Recall
      results.recall[category] = stats.tp + stats.fn > 0 
        ? stats.tp / (stats.tp + stats.fn) 
        : 0;
      
      // F1 Score
      const p = results.precision[category];
      const r = results.recall[category];
      results.f1[category] = p + r > 0 
        ? (2 * p * r) / (p + r) 
        : 0;
      
      // ROC AUC (simplified)
      results.rocAuc[category] = this.calculateRocAuc(
        stats.scores,
        stats.labels
      );
    }
    
    // Overall accuracy
    results.accuracy = totalPredictions > 0 
      ? totalCorrect / totalPredictions 
      : 0;
    
    return results;
  }
  
  private calculateRocAuc(scores: number[], labels: number[]): number {
    // Simplified ROC AUC calculation
    if (scores.length === 0) return 0.5;
    
    // Pair scores with labels and sort by score descending
    const pairs = scores.map((score, i) => ({ score, label: labels[i] }));
    pairs.sort((a, b) => b.score - a.score);
    
    let auc = 0;
    let prevFalsePositives = 0;
    let prevTruePositives = 0;
    let totalPositives = labels.filter(l => l === 1).length;
    let totalNegatives = labels.filter(l => l === 0).length;
    
    if (totalPositives === 0 || totalNegatives === 0) return 0.5;
    
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      
      if (pair.label === 1) {
        prevTruePositives++;
      } else {
        prevFalsePositives++;
      }
      
      // Add to AUC
      if (i < pairs.length - 1 && pairs[i + 1].score !== pair.score) {
        const falsePositiveRate = prevFalsePositives / totalNegatives;
        const truePositiveRate = prevTruePositives / totalPositives;
        
        auc += (falsePositiveRate - (prevFalsePositives - 1) / totalNegatives) * truePositiveRate;
      }
    }
    
    return auc;
  }
}