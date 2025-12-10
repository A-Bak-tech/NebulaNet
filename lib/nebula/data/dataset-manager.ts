export interface DatasetItem {
  id: string;
  text: string;
  label?: any;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface DatasetStats {
  totalItems: number;
  avgLength: number;
  labelDistribution: Record<string, number>;
  dateRange: { start: Date; end: Date };
}

export class DatasetManager {
  private items: DatasetItem[] = [];
  private name: string;
  private stats: DatasetStats | null = null;
  
  constructor(name: string = 'default') {
    this.name = name;
  }
  
  async loadFromFile(filePath: string): Promise<void> {
    // In React Native, you might load from AsyncStorage or API
    console.log(`📂 Loading dataset from: ${filePath}`);
    
    // Mock data for development
    this.items = this.generateMockData(1000);
    await this.calculateStats();
  }
  
  async loadFromAPI(endpoint: string): Promise<void> {
    console.log(`🌐 Loading dataset from API: ${endpoint}`);
    
    try {
      // Mock API call
      const response = await fetch(endpoint);
      const data = await response.json();
      
      this.items = data.map((item: any, index: number) => ({
        id: `item_${index}`,
        text: item.text || '',
        label: item.label,
        metadata: item.metadata || {}
      }));
      
      await this.calculateStats();
    } catch (error) {
      console.error('Failed to load dataset from API:', error);
      throw error;
    }
  }
  
  async split(validationSplit: number = 0.2): Promise<{
    train: DatasetItem[];
    val: DatasetItem[];
  }> {
    this.shuffle();
    
    const splitIndex = Math.floor(this.items.length * (1 - validationSplit));
    
    return {
      train: this.items.slice(0, splitIndex),
      val: this.items.slice(splitIndex)
    };
  }
  
  shuffle(): void {
    for (let i = this.items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
    }
  }
  
  async calculateStats(): Promise<DatasetStats> {
    const totalItems = this.items.length;
    
    // Calculate average text length
    const totalLength = this.items.reduce((sum, item) => 
      sum + (item.text?.length || 0), 0
    );
    const avgLength = totalItems > 0 ? totalLength / totalItems : 0;
    
    // Calculate label distribution
    const labelDistribution: Record<string, number> = {};
    this.items.forEach(item => {
      if (item.label !== undefined) {
        const label = String(item.label);
        labelDistribution[label] = (labelDistribution[label] || 0) + 1;
      }
    });
    
    // Normalize distribution to percentages
    Object.keys(labelDistribution).forEach(label => {
      labelDistribution[label] = labelDistribution[label] / totalItems;
    });
    
    // Get date range from metadata
    const dates = this.items
      .filter(item => item.metadata?.timestamp)
      .map(item => new Date(item.metadata.timestamp))
      .filter(date => !isNaN(date.getTime()));
    
    const dateRange = dates.length > 0
      ? {
          start: new Date(Math.min(...dates.map(d => d.getTime()))),
          end: new Date(Math.max(...dates.map(d => d.getTime())))
        }
      : { start: new Date(), end: new Date() };
    
    this.stats = {
      totalItems,
      avgLength,
      labelDistribution,
      dateRange
    };
    
    return this.stats;
  }
  
  getBatch(batchSize: number, startIndex: number = 0): DatasetItem[] {
    return this.items.slice(startIndex, startIndex + batchSize);
  }
  
  filterByLabel(label: any): DatasetItem[] {
    return this.items.filter(item => item.label === label);
  }
  
  filterByMetadata(key: string, value: any): DatasetItem[] {
    return this.items.filter(item => item.metadata?.[key] === value);
  }
  
  search(query: string): DatasetItem[] {
    const lowerQuery = query.toLowerCase();
    return this.items.filter(item =>
      item.text.toLowerCase().includes(lowerQuery)
    );
  }
  
  addItem(item: Omit<DatasetItem, 'id'>): string {
    const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem: DatasetItem = { ...item, id };
    this.items.push(newItem);
    return id;
  }
  
  removeItem(id: string): boolean {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    return this.items.length < initialLength;
  }
  
  updateItem(id: string, updates: Partial<DatasetItem>): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.items[index] = { ...this.items[index], ...updates };
    return true;
  }
  
  getStats(): DatasetStats | null {
    return this.stats;
  }
  
  getItems(): DatasetItem[] {
    return [...this.items];
  }
  
  getItemCount(): number {
    return this.items.length;
  }
  
  clear(): void {
    this.items = [];
    this.stats = null;
  }
  
  async exportToJSON(): Promise<string> {
    return JSON.stringify({
      name: this.name,
      items: this.items,
      stats: this.stats,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
  
  async importFromJSON(json: string): Promise<void> {
    const data = JSON.parse(json);
    this.name = data.name || 'imported';
    this.items = data.items || [];
    this.stats = data.stats || null;
    
    if (!this.stats) {
      await this.calculateStats();
    }
  }
  
  private generateMockData(count: number): DatasetItem[] {
    const mockTexts = [
      "The quick brown fox jumps over the lazy dog.",
      "Artificial intelligence is transforming the world.",
      "Machine learning models require large datasets.",
      "Natural language processing enables human-computer interaction.",
      "Deep learning has revolutionized computer vision.",
      "The future of AI is both exciting and uncertain.",
      "Ethical considerations in AI development are crucial.",
      "Neural networks mimic the human brain's structure.",
      "Transfer learning allows models to adapt to new tasks.",
      "Reinforcement learning enables agents to learn from interactions."
    ];
    
    const labels = ['positive', 'negative', 'neutral'];
    
    const items: DatasetItem[] = [];
    for (let i = 0; i < count; i++) {
      items.push({
        id: `mock_${i}`,
        text: mockTexts[Math.floor(Math.random() * mockTexts.length)],
        label: labels[Math.floor(Math.random() * labels.length)],
        metadata: {
          timestamp: new Date(Date.now() - Math.random() * 10000000000),
          source: 'mock',
          length: Math.floor(Math.random() * 500) + 50
        }
      });
    }
    
    return items;
  }
}