export interface AISuggestion {
  id: string;
  type: 'hashtag' | 'topic' | 'improvement' | 'engagement';
  title: string;
  description: string;
  confidence: number;
  action?: string;
}

export const aiSuggestions = {
  async generateContentSuggestions(content: string): Promise<AISuggestion[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions: AISuggestion[] = [];

        // Analyze content length
        if (content.length < 50) {
          suggestions.push({
            id: '1',
            type: 'improvement',
            title: 'Add more detail',
            description: 'Your post is quite short. Consider adding more context or details.',
            confidence: 0.8,
            action: 'expand_content',
          });
        }

        if (content.length > 300) {
          suggestions.push({
            id: '2',
            type: 'improvement',
            title: 'Consider summarizing',
            description: 'Your post might be too long for some readers. Consider making it more concise.',
            confidence: 0.6,
            action: 'summarize',
          });
        }

        // Suggest hashtags based on content
        const keywords = this.extractKeywords(content);
        if (keywords.length > 0) {
          suggestions.push({
            id: '3',
            type: 'hashtag',
            title: 'Add relevant hashtags',
            description: `Consider using hashtags like: ${keywords.slice(0, 3).map(k => `#${k}`).join(', ')}`,
            confidence: 0.7,
            action: 'add_hashtags',
          });
        }

        // Engagement suggestions
        if (content.includes('?')) {
          suggestions.push({
            id: '4',
            type: 'engagement',
            title: 'Ask for opinions',
            description: 'Your question could spark interesting discussions in the comments.',
            confidence: 0.9,
            action: 'encourage_engagement',
          });
        }

        resolve(suggestions);
      }, 800);
    });
  },

  async generateReplySuggestions(originalContent: string): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions = [
          "That's an interesting perspective!",
          "Thanks for sharing this.",
          "I never thought about it that way.",
          "This is really helpful information.",
          "Great point! I completely agree.",
        ];
        resolve(suggestions);
      }, 500);
    });
  },

  async generateHashtags(content: string, count: number = 5): Promise<string[]> {
    const keywords = this.extractKeywords(content);
    const commonHashtags = ['tech', 'ai', 'innovation', 'future', 'community'];
    
    return [...new Set([...keywords, ...commonHashtags])]
      .slice(0, count)
      .map(tag => tag.toLowerCase().replace(/\s+/g, ''));
  },

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10);
  },
};