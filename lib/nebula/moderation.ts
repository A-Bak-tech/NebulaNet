import { ContentClassifier } from './models/content-classifier';
import { SentimentModel } from './models/sentiment-model';

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

export interface ModerationConfig {
  thresholds: Record<string, number>;
  autoModerate: boolean;
  requireHumanReview: boolean;
  strictness: 'low' | 'medium' | 'high';
}

export class ContentModerator {
  private classifier: ContentClassifier;
  private sentimentModel: SentimentModel;
  private config: ModerationConfig;
  
  constructor(config: Partial<ModerationConfig> = {}) {
    this.classifier = new ContentClassifier();
    this.sentimentModel = new SentimentModel();
    
    const defaultThresholds = {
      spam: 0.6,
      harassment: 0.7,
      hate_speech: 0.8,
      explicit: 0.5,
      violence: 0.7,
      misinformation: 0.6
    };
    
    this.config = {
      thresholds: defaultThresholds,
      autoModerate: true,
      requireHumanReview: false,
      strictness: 'medium',
      ...config
    };
    
    // Adjust thresholds based on strictness
    this.adjustThresholds();
  }
  
  private adjustThresholds(): void {
    const multiplier = {
      low: 1.2,    // Higher threshold = less sensitive
      medium: 1.0,
      high: 0.8    // Lower threshold = more sensitive
    }[this.config.strictness];
    
    for (const key in this.config.thresholds) {
      this.config.thresholds[key] *= multiplier;
      // Clamp between 0.3 and 0.9
      this.config.thresholds[key] = Math.min(0.9, Math.max(0.3, this.config.thresholds[key]));
    }
  }
  
  async moderate(
    content: string,
    options: {
      checkSentiment?: boolean;
      autoModerate?: boolean;
    } = {}
  ): Promise<ModerationResult> {
    console.log('🛡️ Moderating content...');
    
    const checkSentiment = options.checkSentiment ?? true;
    const autoModerate = options.autoModerate ?? this.config.autoModerate;
    
    // Classify content
    const classification = await this.classifier.classify(content);
    
    // Check each category against thresholds
    const categories = classification.categories.map(cat => {
      const threshold = this.config.thresholds[cat.name] || 0.5;
      return {
        name: cat.name,
        score: cat.score,
        threshold,
        passed: cat.score < threshold
      };
    });
    
    // Determine overall safety
    const failedCategories = categories.filter(cat => !cat.passed);
    const isSafe = failedCategories.length === 0;
    const flags = failedCategories.map(cat => cat.name);
    
    // Calculate overall risk score (0-1, higher = more risky)
    const riskScore = this.calculateRiskScore(categories);
    
    // Check sentiment if requested
    let sentiment;
    if (checkSentiment) {
      const sentimentResult = await this.sentimentModel.analyze(content);
      sentiment = {
        overall: sentimentResult.sentiment,
        confidence: sentimentResult.confidence
      };
    }
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      failedCategories,
      content,
      sentiment
    );
    
    // Auto-moderate if enabled
    let moderatedContent;
    if (autoModerate && !isSafe) {
      moderatedContent = this.autoModerateContent(content, failedCategories);
    }
    
    return {
      isSafe,
      score: riskScore,
      flags,
      categories,
      sentiment,
      recommendations,
      moderatedContent
    };
  }
  
  private calculateRiskScore(categories: Array<{ score: number; threshold: number }>): number {
    // Weighted average of category scores above threshold
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const cat of categories) {
      if (cat.score > cat.threshold) {
        const weight = 1 + (cat.score - cat.threshold); // Higher weight for more severe violations
        weightedSum += cat.score * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  private generateRecommendations(
    failedCategories: Array<{ name: string; score: number }>,
    content: string,
    sentiment?: { overall: string; confidence: number }
  ): string[] {
    const recommendations: string[] = [];
    
    // Category-specific recommendations
    for (const cat of failedCategories) {
      switch (cat.name) {
        case 'spam':
          recommendations.push('Remove promotional content or external links');
          break;
        case 'harassment':
          recommendations.push('Remove threatening or bullying language');
          break;
        case 'hate_speech':
          recommendations.push('Remove discriminatory or offensive language');
          break;
        case 'explicit':
          recommendations.push('Remove explicit language or content');
          break;
        case 'violence':
          recommendations.push('Remove references to violence or harm');
          break;
        case 'misinformation':
          recommendations.push('Verify factual claims or add sources');
          break;
      }
    }
    
    // Sentiment-based recommendations
    if (sentiment) {
      if (sentiment.overall === 'negative' && sentiment.confidence > 0.7) {
        recommendations.push('Consider using more positive language');
      }
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Content appears appropriate');
    } else if (this.config.requireHumanReview) {
      recommendations.unshift('Requires human review before publishing');
    }
    
    return recommendations;
  }
  
  private autoModerateContent(
    content: string,
    failedCategories: Array<{ name: string; score: number }>
  ): string {
    let moderated = content;
    
    for (const cat of failedCategories) {
      switch (cat.name) {
        case 'explicit':
          // Censor explicit words
          moderated = this.censorExplicitWords(moderated);
          break;
        case 'harassment':
        case 'hate_speech':
          // Remove offensive phrases
          moderated = this.removeOffensivePhrases(moderated);
          break;
        case 'spam':
          // Remove links and promotional text
          moderated = this.removeSpamContent(moderated);
          break;
      }
    }
    
    return moderated;
  }
  
  private censorExplicitWords(text: string): string {
    const explicitWords = [
      'fuck', 'shit', 'asshole', 'bitch', 'damn', 'hell',
      'cunt', 'dick', 'pussy', 'cock', 'whore', 'slut'
    ];
    
    let censored = text;
    for (const word of explicitWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      censored = censored.replace(regex, '*'.repeat(word.length));
    }
    
    return censored;
  }
  
  private removeOffensivePhrases(text: string): string {
    const offensivePatterns = [
      /\b(kill\s+(yourself|myself|himself|herself|themselves))\b/gi,
      /\b(hate\s+(black|white|jews|muslims|gays|trans))\b/gi,
      /\b(go\s+die|burn\s+in\s+hell)\b/gi,
      /\b(worthless|useless|stupid\s+idiot)\b/gi
    ];
    
    let cleaned = text;
    for (const pattern of offensivePatterns) {
      cleaned = cleaned.replace(pattern, '[removed]');
    }
    
    return cleaned;
  }
  
  private removeSpamContent(text: string): string {
    // Remove URLs
    let cleaned = text.replace(/https?:\/\/[^\s]+/g, '[link removed]');
    
    // Remove common spam phrases
    const spamPhrases = [
      'buy now', 'click here', 'limited time offer',
      'free gift', 'make money fast', 'work from home',
      'earn $', 'win prize', 'exclusive deal'
    ];
    
    for (const phrase of spamPhrases) {
      const regex = new RegExp(phrase, 'gi');
      cleaned = cleaned.replace(regex, '[promotional content removed]');
    }
    
    // Remove excessive punctuation
    cleaned = cleaned.replace(/!{3,}/g, '!');
    cleaned = cleaned.replace(/\?{3,}/g, '?');
    
    return cleaned;
  }
  
  async batchModerate(
    contents: string[],
    options?: {
      checkSentiment?: boolean;
      autoModerate?: boolean;
    }
  ): Promise<ModerationResult[]> {
    const results: ModerationResult[] = [];
    
    for (const content of contents) {
      const result = await this.moderate(content, options);
      results.push(result);
    }
    
    return results;
  }
  
  async moderateWithContext(
    content: string,
    context: {
      authorHistory?: Array<{ content: string; moderated: boolean }>;
      communityGuidelines?: string[];
      previousFlags?: string[];
    } = {}
  ): Promise<ModerationResult> {
    // Get basic moderation result
    const baseResult = await this.moderate(content, { checkSentiment: true });
    
    // Apply context-based adjustments
    if (context.authorHistory) {
      const authorScore = this.calculateAuthorScore(context.authorHistory);
      baseResult.score *= authorScore; // Adjust risk based on author history
    }
    
    if (context.communityGuidelines) {
      const guidelineViolations = this.checkGuidelines(content, context.communityGuidelines);
      baseResult.flags.push(...guidelineViolations);
    }
    
    if (context.previousFlags && context.previousFlags.length > 0) {
      // If user has previous flags, be more strict
      baseResult.score *= 1.2;
      baseResult.recommendations.unshift('User has previous content violations');
    }
    
    // Re-evaluate safety
    baseResult.isSafe = baseResult.score < 0.5 && baseResult.flags.length === 0;
    
    return baseResult;
  }
  
  private calculateAuthorScore(
    history: Array<{ content: string; moderated: boolean }>
  ): number {
    const total = history.length;
    const violations = history.filter(h => h.moderated).length;
    const violationRate = total > 0 ? violations / total : 0;
    
    // Higher score for authors with clean history
    return 1.0 - (violationRate * 0.5);
  }
  
  private checkGuidelines(content: string, guidelines: string[]): string[] {
    const violations: string[] = [];
    
    for (const guideline of guidelines) {
      if (this.violatesGuideline(content, guideline)) {
        violations.push(`guideline: ${guideline.substring(0, 50)}...`);
      }
    }
    
    return violations;
  }
  
  private violatesGuideline(content: string, guideline: string): boolean {
    // Simple keyword matching for guidelines
    const keywords = guideline.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const contentLower = content.toLowerCase();
    
    return keywords.some(keyword => contentLower.includes(keyword));
  }
  
  updateConfig(newConfig: Partial<ModerationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.strictness) {
      this.adjustThresholds();
    }
  }
  
  getConfig(): ModerationConfig {
    return { ...this.config };
  }
  
  async generateReport(
    results: ModerationResult[],
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    summary: {
      total: number;
      safe: number;
      flagged: number;
      autoModerated: number;
      avgScore: number;
    };
    categoryBreakdown: Record<string, number>;
    recommendations: string[];
  }> {
    const summary = {
      total: results.length,
      safe: results.filter(r => r.isSafe).length,
      flagged: results.filter(r => !r.isSafe).length,
      autoModerated: results.filter(r => r.moderatedContent).length,
      avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
    };
    
    const categoryBreakdown: Record<string, number> = {};
    for (const result of results) {
      for (const cat of result.categories) {
        if (!cat.passed) {
          categoryBreakdown[cat.name] = (categoryBreakdown[cat.name] || 0) + 1;
        }
      }
    }
    
    const recommendations = [
      `Flagged content: ${summary.flagged}/${summary.total} (${((summary.flagged / summary.total) * 100).toFixed(1)}%)`,
      `Average risk score: ${summary.avgScore.toFixed(3)}`
    ];
    
    if (summary.avgScore > 0.7) {
      recommendations.push('Consider increasing moderation strictness');
    }
    
    if (Object.keys(categoryBreakdown).length > 0) {
      recommendations.push('Most common issues:');
      Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([category, count]) => {
          recommendations.push(`  - ${category}: ${count} instances`);
        });
    }
    
    return {
      summary,
      categoryBreakdown,
      recommendations
    };
  }
}