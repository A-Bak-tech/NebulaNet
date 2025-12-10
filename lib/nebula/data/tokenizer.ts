export class Tokenizer {
  private vocab: string[] = [];
  private vocabSize: number;
  private wordToId: Map<string, number> = new Map();
  private idToWord: Map<number, string> = new Map();
  public endToken = 0;
  public padToken = 1;
  public unkToken = 2;
  
  constructor(vocabSize: number = 50257) {
    this.vocabSize = vocabSize;
    this.initializeVocabulary();
  }
  
  private initializeVocabulary(): void {
    // Initialize with basic tokens
    this.vocab = [
      '[END]', '[PAD]', '[UNK]',
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      ' ', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',',
      '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']',
      '^', '_', '`', '{', '|', '}', '~', '\n', '\t'
    ];
    
    // Add more tokens if needed
    while (this.vocab.length < this.vocabSize) {
      this.vocab.push(`[EXTRA_${this.vocab.length}]`);
    }
    
    // Build mappings
    this.vocab.forEach((word, id) => {
      this.wordToId.set(word, id);
      this.idToWord.set(id, word);
    });
  }
  
  async loadVocabulary(): Promise<void> {
    // In real implementation, load from file
    console.log(`📚 Loaded vocabulary with ${this.vocabSize} tokens`);
  }
  
  encode(text: string): number[] {
    const tokens: number[] = [];
    
    // Simple tokenization by character
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const tokenId = this.wordToId.get(char) || this.unkToken;
      tokens.push(tokenId);
    }
    
    // Add end token
    tokens.push(this.endToken);
    
    return tokens;
  }
  
  decode(tokens: number[]): string {
    let text = '';
    
    for (const tokenId of tokens) {
      if (tokenId === this.endToken) break;
      if (tokenId === this.padToken) continue;
      
      const word = this.idToWord.get(tokenId) || '[UNK]';
      text += word;
    }
    
    return text;
  }
  
  encodeBatch(texts: string[]): number[][] {
    return texts.map(text => this.encode(text));
  }
  
  decodeBatch(tokensBatch: number[][]): string[] {
    return tokensBatch.map(tokens => this.decode(tokens));
  }
  
  tokenizeWithSubwords(text: string): number[] {
    // BPE-like tokenization (simplified)
    const tokens: number[] = [];
    let current = '';
    
    for (let i = 0; i < text.length; i++) {
      current += text[i];
      
      if (this.wordToId.has(current)) {
        tokens.push(this.wordToId.get(current)!);
        current = '';
      } else if (current.length > 10) {
        // Fallback to character-level
        for (const char of current) {
          const tokenId = this.wordToId.get(char) || this.unkToken;
          tokens.push(tokenId);
        }
        current = '';
      }
    }
    
    if (current) {
      for (const char of current) {
        const tokenId = this.wordToId.get(char) || this.unkToken;
        tokens.push(tokenId);
      }
    }
    
    tokens.push(this.endToken);
    return tokens;
  }
  
  getVocabSize(): number {
    return this.vocabSize;
  }
  
  getTokenInfo(tokenId: number): { token: string, frequency?: number } {
    const token = this.idToWord.get(tokenId) || '[UNKNOWN]';
    return { token };
  }
  
  save(): string {
    return JSON.stringify({
      vocab: this.vocab,
      vocabSize: this.vocabSize
    });
  }
  
  load(saved: string): void {
    const data = JSON.parse(saved);
    this.vocab = data.vocab;
    this.vocabSize = data.vocabSize;
    
    // Rebuild mappings
    this.wordToId.clear();
    this.idToWord.clear();
    
    this.vocab.forEach((word, id) => {
      this.wordToId.set(word, id);
      this.idToWord.set(id, word);
    });
  }
}