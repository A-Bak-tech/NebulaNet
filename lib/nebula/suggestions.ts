import { TextGenerationModel } from './models/text-generation-model';
import { SentimentModel } from './models/sentiment-model';
import { TextPreprocessor } from './data/preprocessor';

export interface SuggestionOptions {
  context?: string;
  maxSuggestions?: number;
  creativity?: number;
  style?: 'casual' | 'professional' | 'creative';
  length?: 'short' | 'medium' | 'long';
}

export interface ContentSuggestion {
  id: string;
  text: string;
  type: 'completion' | 'paraphrase' | 'expansion' | 'question' | 'topic';
  confidence: number;
  metadata?: Record<string, any>;
}

export class ContentSuggestions {
  private textGenerator: TextGenerationModel;
  private sentimentModel: SentimentModel;
  private preprocessor: TextPreprocessor;
  
  constructor() {
    this.textGenerator = new TextGenerationModel();
    this.sentimentModel = new SentimentModel();
    this.preprocessor = new TextPreprocessor();
  }
  
  async generateSuggestions(
    content: string,
    options: SuggestionOptions = {}
  ): Promise<ContentSuggestion[]> {
    console.log('💡 Generating content suggestions...');
    
    const mergedOptions: SuggestionOptions = {
      maxSuggestions: 5,
      creativity: 0.7,
      style: 'professional',
      length: 'medium',
      ...options
    };
    
    const suggestions: ContentSuggestion[] = [];
    
    // Generate different types of suggestions
    const suggestionTypes = [
      this.generateCompletions.bind(this),
      this.generateParaphrases.bind(this),
      this.generateExpansions.bind(this),
      this.generateQuestions.bind(this),
      this.generateTopics.bind(this)
    ];
    
    for (const generator of suggestionTypes) {
      if (suggestions.length >= mergedOptions.maxSuggestions!) break;
      
      const newSuggestions = await generator(content, mergedOptions);
      suggestions.push(...newSuggestions.slice(0, mergedOptions.maxSuggestions! - suggestions.length));
    }
    
    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);
    
    return suggestions.slice(0, mergedOptions.maxSuggestions);
  }
  
  private async generateCompletions(
    content: string,
    options: SuggestionOptions
  ): Promise<ContentSuggestion[]> {
    const prompt = `
      Original content: "${content}"
      
      ${options.context ? `Context: ${options.context}` : ''}
      
      Generate ${options.maxSuggestions || 3} possible continuations or next sentences.
      Style: ${options.style}
      Length: ${options.length}
      
      Suggestions:
      1.
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: options.creativity,
      maxLength: 300
    });
    
    return this.parseNumberedList(response).map((text, index) => ({
      id: `completion_${Date.now()}_${index}`,
      text,
      type: 'completion',
      confidence: 0.8 - (index * 0.1) // First suggestion has highest confidence
    }));
  }
  
  private async generateParaphrases(
    content: string,
    options: SuggestionOptions
  ): Promise<ContentSuggestion[]> {
    const prompt = `
      Original content: "${content}"
      
      Generate ${options.maxSuggestions || 3} different ways to say the same thing.
      Style: ${options.style}
      
      Paraphrases:
      1.
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: options.creativity,
      maxLength: 300
    });
    
    return this.parseNumberedList(response).map((text, index) => ({
      id: `paraphrase_${Date.now()}_${index}`,
      text,
      type: 'paraphrase',
      confidence: 0.7 - (index * 0.1)
    }));
  }
  
  private async generateExpansions(
    content: string,
    options: SuggestionOptions
  ): Promise<ContentSuggestion[]> {
    const prompt = `
      Original content: "${content}"
      
      Generate ${options.maxSuggestions || 3} ways to expand on this idea with more detail.
      Style: ${options.style}
      
      Expansions:
      1.
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: options.creativity,
      maxLength: 400
    });
    
    return this.parseNumberedList(response).map((text, index) => ({
      id: `expansion_${Date.now()}_${index}`,
      text,
      type: 'expansion',
      confidence: 0.75 - (index * 0.1)
    }));
  }
  
  private async generateQuestions(
    content: string,
    options: SuggestionOptions
  ): Promise<ContentSuggestion[]> {
    const prompt = `
      Based on this content: "${content}"
      
      Generate ${options.maxSuggestions || 3} relevant questions that this content might answer,
      or questions that could lead to interesting discussions.
      
      Questions:
      1.
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: options.creativity,
      maxLength: 200
    });
    
    return this.parseNumberedList(response).map((text, index) => ({
      id: `question_${Date.now()}_${index}`,
      text,
      type: 'question',
      confidence: 0.85 - (index * 0.1)
    }));
  }
  
  private async generateTopics(
    content: string,
    options: SuggestionOptions
  ): Promise<ContentSuggestion[]> {
    const prompt = `
      Content: "${content}"
      
      Generate ${options.maxSuggestions || 3} related topics or themes that could be explored.
      
      Related topics:
      1.
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: options.creativity,
      maxLength: 200
    });
    
    return this.parseNumberedList(response).map((text, index) => ({
      id: `topic_${Date.now()}_${index}`,
      text,
      type: 'topic',
      confidence: 0.9 - (index * 0.1)
    }));
  }
  
  private parseNumberedList(text: string): string[] {
    const lines = text.split('\n');
    const items: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        items.push(match[1].trim());
      }
    }
    
    return items;
  }
  
  async generateWritingPrompts(
    seed?: string,
    count: number = 5
  ): Promise<ContentSuggestion[]> {
    const basePrompt = seed 
      ? `Generate ${count} creative writing prompts related to: "${seed}"`
      : `Generate ${count} creative writing prompts on various topics`;
    
    const prompt = `
      ${basePrompt}
      
      Make them interesting, thought-provoking, and suitable for social media posts.
      
      Prompts:
      1.
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: 0.9,
      maxLength: 500
    });
    
    return this.parseNumberedList(response).map((text, index) => ({
      id: `prompt_${Date.now()}_${index}`,
      text,
      type: 'topic',
      confidence: 0.8,
      metadata: { category: 'writing_prompt' }
    }));
  }
  
  async generateHashtags(
    content: string,
    maxTags: number = 10
  ): Promise<string[]> {
    const prompt = `
      Content: "${content}"
      
      Generate ${maxTags} relevant and popular hashtags for this content.
      Include a mix of general and specific tags.
      
      Hashtags:
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: 0.3,
      maxLength: 200
    });
    
    // Extract hashtags from response
    const hashtags: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      const matches = line.match(/#\w+/g);
      if (matches) {
        hashtags.push(...matches);
      }
    }
    
    // Deduplicate and limit
    return [...new Set(hashtags)].slice(0, maxTags);
  }
  
  async analyzeSentimentAndSuggest(
    content: string
  ): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    suggestions: ContentSuggestion[];
  }> {
    // Analyze sentiment
    const sentimentResult = await this.sentimentModel.analyze(content);
    
    // Generate sentiment-aware suggestions
    let suggestionsPrompt = '';
    switch (sentimentResult.sentiment) {
      case 'positive':
        suggestionsPrompt = `The content has a positive tone. Suggest ways to make it even more engaging and shareable.`;
        break;
      case 'negative':
        suggestionsPrompt = `The content has a negative tone. Suggest ways to make it more constructive or balanced.`;
        break;
      default:
        suggestionsPrompt = `The content has a neutral tone. Suggest ways to make it more interesting or emotionally engaging.`;
    }
    
    const prompt = `
      Content: "${content}"
      
      ${suggestionsPrompt}
      
      Suggestions:
      1.
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: 0.7,
      maxLength: 300
    });
    
    const suggestions = this.parseNumberedList(response).map((text, index) => ({
      id: `sentiment_${Date.now()}_${index}`,
      text,
      type: 'completion',
      confidence: sentimentResult.confidence * (0.9 - index * 0.1)
    }));
    
    return {
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence,
      suggestions
    };
  }
  
  async generateAIIdeas(
    context: string,
    category?: string
  ): Promise<ContentSuggestion[]> {
    const categoryPrompt = category 
      ? `in the category of ${category}`
      : 'on various interesting topics';
    
    const prompt = `
      Context: ${context}
      
      Generate 5 creative AI-powered feature ideas or enhancements ${categoryPrompt}
      that could be implemented in a social media app.
      
      Make them practical, innovative, and user-friendly.
      
      Ideas:
      1.
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: 0.8,
      maxLength: 500
    });
    
    return this.parseNumberedList(response).map((text, index) => ({
      id: `idea_${Date.now()}_${index}`,
      text,
      type: 'topic',
      confidence: 0.85 - (index * 0.1),
      metadata: { category: 'ai_ideas' }
    }));
  }
  
  async summarizeAndSuggest(
    content: string,
    options: {
      summaryLength?: 'short' | 'medium' | 'long';
      suggestionCount?: number;
    } = {}
  ): Promise<{
    summary: string;
    keyPoints: string[];
    suggestions: ContentSuggestion[];
  }> {
    // First, generate a summary
    const summaryPrompt = `
      Content: "${content}"
      
      Please provide a ${options.summaryLength || 'medium'} summary of this content.
      
      Summary:
    `;
    
    const summary = await this.textGenerator.generate(summaryPrompt, {
      temperature: 0.3,
      maxLength: 200
    });
    
    // Extract key points
    const keyPointsPrompt = `
      Content: "${content}"
      
      Extract 3-5 key points from this content.
      
      Key points:
      1.
    `;
    
    const keyPointsResponse = await this.textGenerator.generate(keyPointsPrompt, {
      temperature: 0.2,
      maxLength: 300
    });
    
    const keyPoints = this.parseNumberedList(keyPointsResponse);
    
    // Generate suggestions based on the summary
    const suggestions = await this.generateSuggestions(summary, {
      maxSuggestions: options.suggestionCount || 3,
      creativity: 0.6
    });
    
    return {
      summary: summary.trim(),
      keyPoints,
      suggestions
    };
  }
  
  async getTrendingTopics(
    domain?: string,
    count: number = 10
  ): Promise<ContentSuggestion[]> {
    const domainPrompt = domain 
      ? `in ${domain}`
      : 'across social media';
    
    const prompt = `
      Generate ${count} currently trending topics or discussions ${domainPrompt}.
      Make them timely, relevant, and engaging for social media posts.
      
      Format each as a topic with a brief description.
      
      Trending topics:
      1. [Topic]: [Brief description]
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: 0.7,
      maxLength: 500
    });
    
    const lines = response.split('\n');
    const topics: ContentSuggestion[] = [];
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+?):\s*(.+)$/);
      if (match) {
        topics.push({
          id: `trend_${Date.now()}_${topics.length}`,
          text: `${match[1].trim()} - ${match[2].trim()}`,
          type: 'topic',
          confidence: 0.9 - (topics.length * 0.05),
          metadata: { category: 'trending' }
        });
      }
    }
    
    return topics.slice(0, count);
  }
  
  async personalizeSuggestions(
    content: string,
    userPreferences: {
      interests?: string[];
      writingStyle?: string;
      tonePreference?: string;
    },
    options: SuggestionOptions = {}
  ): Promise<ContentSuggestion[]> {
    const preferencesText = [
      userPreferences.interests?.length 
        ? `User interests: ${userPreferences.interests.join(', ')}`
        : '',
      userPreferences.writingStyle 
        ? `Preferred writing style: ${userPreferences.writingStyle}`
        : '',
      userPreferences.tonePreference 
        ? `Preferred tone: ${userPreferences.tonePreference}`
        : ''
    ].filter(Boolean).join('\n');
    
    const prompt = `
      Content: "${content}"
      
      ${preferencesText}
      
      Generate personalized suggestions that match the user's preferences.
      Make them relevant, engaging, and tailored to what this user would like.
      
      Personalized suggestions:
      1.
    `;
    
    const response = await this.textGenerator.generate(prompt, {
      temperature: options.creativity || 0.7,
      maxLength: 400
    });
    
    return this.parseNumberedList(response).map((text, index) => ({
      id: `personalized_${Date.now()}_${index}`,
      text,
      type: 'completion',
      confidence: 0.85 - (index * 0.1),
      metadata: { personalized: true }
    }));
  }
}