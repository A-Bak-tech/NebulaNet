import { supabase } from '../supabase';

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  categories: {
    hate: number;
    harassment: number;
    selfHarm: number;
    sexual: number;
    violence: number;
  };
}

export const aiModeration = {
  async moderateContent(content: string): Promise<ModerationResult> {
    // Simulate AI moderation - replace with actual AI service
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple rule-based moderation for demo
        const flags: string[] = [];
        const categories = {
          hate: 0.1,
          harassment: 0.2,
          selfHarm: 0.05,
          sexual: 0.1,
          violence: 0.15,
        };

        const badWords = ['hate', 'violence', 'attack', 'stupid'];
        const hasBadWords = badWords.some(word => 
          content.toLowerCase().includes(word)
        );

        if (hasBadWords) {
          flags.push('inappropriate_language');
          categories.hate = 0.8;
        }

        if (content.length < 5) {
          flags.push('low_quality');
        }

        if (content.length > 500) {
          flags.push('too_long');
        }

        const totalRisk = Object.values(categories).reduce((a, b) => a + b, 0) / 5;
        const riskLevel = totalRisk > 0.7 ? 'high' : totalRisk > 0.4 ? 'medium' : 'low';
        const isApproved = flags.length === 0 && totalRisk < 0.6;

        const suggestions = [];
        if (content.length < 10) {
          suggestions.push('Consider adding more detail to your post');
        }
        if (hasBadWords) {
          suggestions.push('Please use more respectful language');
        }

        resolve({
          isApproved,
          confidence: 0.85,
          flags,
          suggestions,
          riskLevel,
          categories,
        });
      }, 1000);
    });
  },

  async moderateImage(imageUri: string): Promise<ModerationResult> {
    // Simulate image moderation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isApproved: true,
          confidence: 0.92,
          flags: [],
          suggestions: [],
          riskLevel: 'low',
          categories: {
            hate: 0.1,
            harassment: 0.1,
            selfHarm: 0.05,
            sexual: 0.1,
            violence: 0.1,
          },
        });
      }, 1500);
    });
  },

  async logModeration(
    content: string,
    result: ModerationResult,
    contentType: 'text' | 'image'
  ): Promise<void> {
    await supabase.from('ai_logs').insert([{
      type: 'moderation',
      input: { content, contentType },
      output: result,
      success: result.isApproved,
      created_at: new Date().toISOString(),
    }]);
  },
};