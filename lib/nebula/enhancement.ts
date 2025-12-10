import { TextGenerationModel } from './models/text-generation-model';
import { TextPreprocessor } from './data/preprocessor';

export interface EnhancementOptions {
  style?: 'professional' | 'casual' | 'creative' | 'concise';
  creativity?: number; // 0.0 to 1.0
  length?: 'short' | 'medium' | 'long';
  tone?: 'positive' | 'neutral' | 'formal' | 'friendly';
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

export class ContentEnhancer {
  private textGenerator: TextGenerationModel;
  private preprocessor: TextPreprocessor;
  
  constructor() {
    this.textGenerator = new TextGenerationModel();
    this.preprocessor = new TextPreprocessor();
  }
  
  async enhance(
    content: string,
    options: EnhancementOptions = {}
  ): Promise<EnhancedContent> {
    console.log('🔧 Enhancing content...');
    
    const mergedOptions: EnhancementOptions = {
      style: 'professional',
      creativity: 0.7,
      length: 'medium',
      tone: 'positive',
      ...options
    };
    
    // Generate enhancement prompt
    const prompt = this.createEnhancementPrompt(content, mergedOptions);
    
    // Generate enhanced content
    const enhanced = await this.textGenerator.generate(prompt, {
      temperature: mergedOptions.creativity,
      maxLength: this.getMaxLength(mergedOptions.length)
    });
    
    // Extract just the enhanced part (remove prompt)
    const enhancedText = this.extractEnhancedText(enhanced, content);
    
    // Analyze changes
    const changes = this.analyzeChanges(content, enhancedText);
    
    // Calculate readability
    const readability = this.calculateReadability(enhancedText);
    
    return {
      original: content,
      enhanced: enhancedText,
      changes,
      readability
    };
  }
  
  private createEnhancementPrompt(
    content: string,
    options: EnhancementOptions
  ): string {
    const styleInstructions = {
      professional: "Rewrite this in a professional, polished style suitable for business or academic contexts.",
      casual: "Make this more casual and conversational, like you're talking to a friend.",
      creative: "Make this more creative, engaging, and interesting to read.",
      concise: "Make this more concise and to the point while keeping all important information."
    };
    
    const toneInstructions = {
      positive: "Use a positive and encouraging tone.",
      neutral: "Maintain a neutral, objective tone.",
      formal: "Use a formal and respectful tone.",
      friendly: "Use a warm and friendly tone."
    };
    
    const lengthInstructions = {
      short: "Keep it brief and under 100 words.",
      medium: "Aim for a medium length, around 200-300 words.",
      long: "Provide a detailed explanation, around 400-500 words."
    };
    
    return `
      Original content:
      "${content}"
      
      Instructions:
      1. ${styleInstructions[options.style || 'professional']}
      2. ${toneInstructions[options.tone || 'positive']}
      3. ${lengthInstructions[options.length || 'medium']}
      4. Improve grammar, clarity, and flow
      5. Keep the original meaning and key points
      
      Enhanced version:
    `;
  }
  
  private getMaxLength(length: string = 'medium'): number {
    const lengths = {
      short: 100,
      medium: 300,
      long: 500
    };
    return lengths[length] || 300;
  }
  
  private extractEnhancedText(generated: string, original: string): string {
    // Remove the prompt part from generated text
    const lines = generated.split('\n');
    const enhancedStart = lines.findIndex(line => 
      line.toLowerCase().includes('enhanced') || 
      line.includes('version:')
    );
    
    if (enhancedStart !== -1) {
      return lines.slice(enhancedStart + 1).join('\n').trim();
    }
    
    // Fallback: return everything after the original content mention
    const originalIndex = generated.indexOf(original);
    if (originalIndex !== -1) {
      return generated.slice(originalIndex + original.length).trim();
    }
    
    return generated.trim();
  }
  
  private analyzeChanges(
    original: string,
    enhanced: string
  ): Array<{
    type: 'addition' | 'deletion' | 'replacement';
    original?: string;
    new?: string;
    reason: string;
  }> {
    const changes = [];
    
    // Split into sentences
    const originalSentences = this.splitIntoSentences(original);
    const enhancedSentences = this.splitIntoSentences(enhanced);
    
    // Simple diff analysis (in production, use a proper diff library)
    if (enhanced.length > original.length * 1.5) {
      changes.push({
        type: 'addition',
        new: this.getAddedContent(original, enhanced),
        reason: 'Added more detail and explanation'
      });
    }
    
    if (enhanced.length < original.length * 0.7) {
      changes.push({
        type: 'deletion',
        original: this.getRemovedContent(original, enhanced),
        reason: 'Removed redundant information'
      });
    }
    
    // Check for vocabulary improvement
    const originalWords = this.preprocessor.preprocess(original, {
      lowercase: true,
      removePunctuation: true
    }).split(/\s+/);
    
    const enhancedWords = this.preprocessor.preprocess(enhanced, {
      lowercase: true,
      removePunctuation: true
    }).split(/\s+/);
    
    const improvedVocabulary = this.getImprovedVocabulary(originalWords, enhancedWords);
    if (improvedVocabulary.length > 0) {
      changes.push({
        type: 'replacement',
        original: improvedVocabulary.slice(0, 3).join(', '),
        new: 'More varied and precise vocabulary',
        reason: 'Improved word choice'
      });
    }
    
    return changes;
  }
  
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }
  
  private getAddedContent(original: string, enhanced: string): string {
    // Simple addition detection (would use proper diff in production)
    const originalWords = new Set(original.toLowerCase().split(/\s+/));
    const enhancedWords = enhanced.toLowerCase().split(/\s+/);
    
    const addedWords = enhancedWords.filter(word => 
      !originalWords.has(word) && word.length > 3
    );
    
    return addedWords.slice(0, 5).join(' ') + '...';
  }
  
  private getRemovedContent(original: string, enhanced: string): string {
    // Simple removal detection
    const enhancedWords = new Set(enhanced.toLowerCase().split(/\s+/));
    const originalWords = original.toLowerCase().split(/\s+/);
    
    const removedWords = originalWords.filter(word => 
      !enhancedWords.has(word) && word.length > 3
    );
    
    return removedWords.slice(0, 5).join(' ') + '...';
  }
  
  private getImprovedVocabulary(originalWords: string[], enhancedWords: string[]): string[] {
    const basicWords = new Set([
      'good', 'bad', 'nice', 'big', 'small', 'get', 'make', 'do', 'thing', 'stuff'
    ]);
    
    const advancedWords = new Set([
      'excellent', 'terrible', 'pleasant', 'enormous', 'minuscule',
      'obtain', 'fabricate', 'execute', 'item', 'equipment'
    ]);
    
    const improved = [];
    
    for (let i = 0; i < Math.min(originalWords.length, enhancedWords.length); i++) {
      const original = originalWords[i];
      const enhanced = enhancedWords[i];
      
      if (basicWords.has(original) && advancedWords.has(enhanced)) {
        improved.push(`${original} → ${enhanced}`);
      }
    }
    
    return improved;
  }
  
  private calculateReadability(text: string): { score: number; grade: string } {
    // Flesch Reading Ease score
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);
    
    if (sentences === 0 || words === 0) {
      return { score: 0, grade: 'Unknown' };
    }
    
    // Flesch Reading Ease formula
    const score = 206.835 - 
      1.015 * (words / sentences) - 
      84.6 * (syllables / words);
    
    // Convert to grade level
    const grade = this.scoreToGrade(score);
    
    return { score, grade };
  }
  
  private countSyllables(text: string): number {
    // Simplified syllable count
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;
    
    for (const word of words) {
      // Basic vowel counting
      const vowels = word.match(/[aeiouy]+/g);
      count += vowels ? vowels.length : 1;
      
      // Adjustments
      if (word.endsWith('e')) count--;
      if (word.endsWith('le') && word.length > 2) count++;
      if (word.match(/[aeiou]{3,}/)) count -= 1;
    }
    
    return Math.max(count, words.length);
  }
  
  private scoreToGrade(score: number): string {
    if (score >= 90) return '5th grade';
    if (score >= 80) return '6th grade';
    if (score >= 70) return '7th grade';
    if (score >= 60) return '8th & 9th grade';
    if (score >= 50) return '10th to 12th grade';
    if (score >= 30) return 'College';
    return 'College Graduate';
  }
  
  async paraphrase(
    text: string,
    options: {
      preserveMeaning?: boolean;
      changeStyle?: boolean;
    } = {}
  ): Promise<string> {
    const prompt = `
      Original text: "${text}"
      
      Please paraphrase this text${options.preserveMeaning !== false ? ' while preserving the original meaning' : ''}.
      ${options.changeStyle ? 'Change the writing style completely.' : ''}
      
      Paraphrased version:
    `;
    
    return await this.textGenerator.generate(prompt, {
      temperature: 0.8,
      maxLength: 200
    });
  }
  
  async expand(
    text: string,
    targetLength: number = 300
  ): Promise<string> {
    const prompt = `
      Original text: "${text}"
      
      Please expand this text to about ${targetLength} words, adding more detail, 
      examples, and explanations while keeping the original meaning.
      
      Expanded version:
    `;
    
    return await this.textGenerator.generate(prompt, {
      temperature: 0.7,
      maxLength: targetLength * 2
    });
  }
  
  async summarize(
    text: string,
    options: {
      length?: 'short' | 'medium' | 'long';
      focus?: 'key_points' | 'overview' | 'detailed';
    } = {}
  ): Promise<string> {
    const lengthMap = {
      short: '50 words',
      medium: '100 words',
      long: '200 words'
    };
    
    const focusMap = {
      key_points: 'Focus on the key points and main ideas.',
      overview: 'Provide a comprehensive overview.',
      detailed: 'Include important details and examples.'
    };
    
    const prompt = `
      Original text: "${text}"
      
      Please summarize this text in about ${lengthMap[options.length || 'medium']}.
      ${focusMap[options.focus || 'key_points']}
      
      Summary:
    `;
    
    return await this.textGenerator.generate(prompt, {
      temperature: 0.3,
      maxLength: 500
    });
  }
  
  async grammarCheck(text: string): Promise<{
    original: string;
    corrected: string;
    errors: Array<{
      type: string;
      original: string;
      suggestion: string;
      explanation: string;
    }>;
  }> {
    const prompt = `
      Original text with potential grammar errors:
      "${text}"
      
      Please correct any grammar errors and explain what was wrong and how it was fixed.
      Format your response as:
      CORRECTED: [corrected text]
      ERRORS:
      1. [Error type]: "[original]" → "[corrected]" - [explanation]
      2. ...
      
      Response:
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: 0.2,
      maxLength: 500
    });
    
    return this.parseGrammarResponse(response, text);
  }
  
  private parseGrammarResponse(
    response: string,
    original: string
  ): {
    original: string;
    corrected: string;
    errors: Array<{
      type: string;
      original: string;
      suggestion: string;
      explanation: string;
    }>;
  } {
    const lines = response.split('\n');
    let corrected = original;
    const errors = [];
    
    // Extract corrected text
    const correctedLine = lines.find(line => line.startsWith('CORRECTED:'));
    if (correctedLine) {
      corrected = correctedLine.replace('CORRECTED:', '').trim();
    }
    
    // Extract errors
    const errorsStart = lines.findIndex(line => line.startsWith('ERRORS:'));
    if (errorsStart !== -1) {
      for (let i = errorsStart + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/^\d+\./)) {
          const match = line.match(/^\d+\.\s*(.+?):\s*"(.+?)"\s*→\s*"(.+?)"\s*-\s*(.+)$/);
          if (match) {
            errors.push({
              type: match[1].trim(),
              original: match[2].trim(),
              suggestion: match[3].trim(),
              explanation: match[4].trim()
            });
          }
        }
      }
    }
    
    return {
      original,
      corrected,
      errors
    };
  }
}