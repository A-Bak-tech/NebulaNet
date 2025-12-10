export interface PreprocessingOptions {
  lowercase?: boolean;
  removePunctuation?: boolean;
  removeNumbers?: boolean;
  removeStopwords?: boolean;
  stem?: boolean;
  lemmatize?: boolean;
  maxLength?: number;
  padding?: 'pre' | 'post';
  truncating?: 'pre' | 'post';
}

export class TextPreprocessor {
  private stopwords: Set<string>;
  
  constructor() {
    // Common English stopwords
    this.stopwords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what',
      'which', 'this', 'that', 'these', 'those', 'then', 'just', 'so', 'than',
      'such', 'both', 'through', 'about', 'for', 'is', 'of', 'while', 'during',
      'to', 'from', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
      'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
    ]);
  }
  
  preprocess(
    text: string,
    options: PreprocessingOptions = {}
  ): string {
    let processed = text;
    
    // Apply preprocessing steps
    if (options.lowercase) {
      processed = processed.toLowerCase();
    }
    
    if (options.removePunctuation) {
      processed = processed.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ');
    }
    
    if (options.removeNumbers) {
      processed = processed.replace(/\d+/g, '');
    }
    
    if (options.removeStopwords) {
      processed = processed
        .split(/\s+/)
        .filter(word => !this.stopwords.has(word.toLowerCase()))
        .join(' ');
    }
    
    if (options.stem) {
      processed = this.stemText(processed);
    }
    
    if (options.lemmatize) {
      processed = this.lemmatizeText(processed);
    }
    
    // Handle length constraints
    if (options.maxLength) {
      processed = this.truncateText(
        processed,
        options.maxLength,
        options.truncating || 'post'
      );
      
      if (options.padding) {
        processed = this.padText(
          processed,
          options.maxLength,
          options.padding
        );
      }
    }
    
    return processed.trim();
  }
  
  preprocessBatch(
    texts: string[],
    options: PreprocessingOptions = {}
  ): string[] {
    return texts.map(text => this.preprocess(text, options));
  }
  
  private stemText(text: string): string {
    // Porter Stemmer (simplified implementation)
    const words = text.split(/\s+/);
    const stemmedWords = words.map(word => {
      // Simple stemming rules
      if (word.length > 3) {
        if (word.endsWith('ing')) {
          return word.slice(0, -3);
        }
        if (word.endsWith('ed')) {
          return word.slice(0, -2);
        }
        if (word.endsWith('ly')) {
          return word.slice(0, -2);
        }
        if (word.endsWith('s')) {
          return word.slice(0, -1);
        }
        if (word.endsWith('ies')) {
          return word.slice(0, -3) + 'y';
        }
      }
      return word;
    });
    
    return stemmedWords.join(' ');
  }
  
  private lemmatizeText(text: string): string {
    // Simple lemmatization (would use a proper dictionary in production)
    const lemmaMap: Record<string, string> = {
      'running': 'run',
      'ran': 'run',
      'better': 'good',
      'best': 'good',
      'worse': 'bad',
      'worst': 'bad',
      'am': 'be',
      'is': 'be',
      'are': 'be',
      'was': 'be',
      'were': 'be',
      'been': 'be',
      'being': 'be',
      'has': 'have',
      'had': 'have',
      'having': 'have'
    };
    
    const words = text.split(/\s+/);
    const lemmatizedWords = words.map(word => 
      lemmaMap[word.toLowerCase()] || word
    );
    
    return lemmatizedWords.join(' ');
  }
  
  private truncateText(
    text: string,
    maxLength: number,
    truncating: 'pre' | 'post' = 'post'
  ): string {
    const words = text.split(/\s+/);
    
    if (words.length <= maxLength) {
      return text;
    }
    
    if (truncating === 'pre') {
      return words.slice(-maxLength).join(' ');
    } else {
      return words.slice(0, maxLength).join(' ');
    }
  }
  
  private padText(
    text: string,
    targetLength: number,
    padding: 'pre' | 'post' = 'post'
  ): string {
    const words = text.split(/\s+/);
    
    if (words.length >= targetLength) {
      return text;
    }
    
    const paddingNeeded = targetLength - words.length;
    const paddingWords = new Array(paddingNeeded).fill('[PAD]');
    
    if (padding === 'pre') {
      return [...paddingWords, ...words].join(' ');
    } else {
      return [...words, ...paddingWords].join(' ');
    }
  }
  
  extractNGrams(text: string, n: number): string[] {
    const words = text.split(/\s+/);
    const ngrams: string[] = [];
    
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
    
    return ngrams;
  }
  
  extractFeatures(text: string): Record<string, number> {
    const features: Record<string, number> = {};
    
    // Basic text statistics
    features['char_count'] = text.length;
    features['word_count'] = text.split(/\s+/).length;
    features['sentence_count'] = text.split(/[.!?]+/).length - 1;
    features['avg_word_length'] = features['word_count'] > 0 
      ? features['char_count'] / features['word_count']
      : 0;
    
    // Special characters
    features['digit_count'] = (text.match(/\d/g) || []).length;
    features['uppercase_count'] = (text.match(/[A-Z]/g) || []).length;
    features['punctuation_count'] = (text.match(/[^\w\s]/g) || []).length;
    
    // Readability scores (simplified)
    const words = text.split(/\s+/);
    const longWords = words.filter(word => word.length > 6).length;
    features['long_word_ratio'] = features['word_count'] > 0
      ? longWords / features['word_count']
      : 0;
    
    return features;
  }
  
  cleanHtml(text: string): string {
    return text
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/&[a-z]+;/gi, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  normalizeWhitespace(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  removeEmojis(text: string): string {
    // Remove emojis and other symbols
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols & pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & map symbols
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
  }
  
  detectLanguage(text: string): string {
    // Simple language detection based on common words
    const commonWords = {
      english: new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i']),
      spanish: new Set(['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se']),
      french: new Set(['le', 'de', 'un', 'à', 'etre', 'et', 'en', 'avoir', 'que', 'pour'])
    };
    
    const words = text.toLowerCase().split(/\s+/);
    const scores: Record<string, number> = {};
    
    for (const [lang, wordSet] of Object.entries(commonWords)) {
      scores[lang] = words.filter(word => wordSet.has(word)).length;
    }
    
    const detected = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return detected ? detected[0] : 'unknown';
  }
}