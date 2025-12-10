export interface LayerConfig {
  type: 'dense' | 'conv1d' | 'lstm' | 'attention';
  units: number;
  activation?: 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear';
  dropout?: number;
  returnSequences?: boolean;
}

export class NeuralNetwork {
  private layers: LayerConfig[] = [];
  private weights: Map<string, number[][]> = new Map();
  private biases: Map<string, number[]> = new Map();
  
  constructor(layers: LayerConfig[]) {
    this.layers = layers;
    this.initializeWeights();
  }
  
  private initializeWeights(): void {
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const inputSize = i === 0 ? 768 : this.layers[i - 1].units;
      
      // Xavier/Glorot initialization
      const std = Math.sqrt(2 / (inputSize + layer.units));
      
      // Initialize weights
      const weights: number[][] = [];
      for (let j = 0; j < inputSize; j++) {
        weights[j] = [];
        for (let k = 0; k < layer.units; k++) {
          weights[j][k] = (Math.random() * 2 - 1) * std;
        }
      }
      
      // Initialize biases
      const biases = new Array(layer.units).fill(0.1);
      
      this.weights.set(`layer_${i}`, weights);
      this.biases.set(`layer_${i}`, biases);
    }
  }
  
  async forward(input: number[]): Promise<number[]> {
    let current = input;
    
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const weights = this.weights.get(`layer_${i}`)!;
      const biases = this.biases.get(`layer_${i}`)!;
      
      switch (layer.type) {
        case 'dense':
          current = this.denseForward(current, weights, biases);
          break;
        case 'lstm':
          current = await this.lstmForward(current, i);
          break;
        case 'attention':
          current = this.attentionForward(current, i);
          break;
      }
      
      // Apply activation
      if (layer.activation) {
        current = this.applyActivation(current, layer.activation);
      }
      
      // Apply dropout during training
      if (layer.dropout && Math.random() < layer.dropout) {
        current = current.map(x => Math.random() > 0.5 ? x : 0);
      }
    }
    
    return current;
  }
  
  private denseForward(
    input: number[], 
    weights: number[][], 
    biases: number[]
  ): number[] {
    const output = new Array(biases.length).fill(0);
    
    for (let i = 0; i < biases.length; i++) {
      let sum = biases[i];
      for (let j = 0; j < input.length; j++) {
        sum += input[j] * (weights[j]?.[i] || 0);
      }
      output[i] = sum;
    }
    
    return output;
  }
  
  private async lstmForward(input: number[], layerIndex: number): Promise<number[]> {
    // Simplified LSTM implementation
    const weights = this.weights.get(`layer_${layerIndex}`)!;
    const biases = this.biases.get(`layer_${layerIndex}`)!;
    
    const hiddenSize = biases.length / 4; // For i, f, o, g gates
    
    // Initialize hidden and cell states
    let h = new Array(hiddenSize).fill(0);
    let c = new Array(hiddenSize).fill(0);
    
    // LSTM gates computation
    const gateInput = this.denseForward(input, weights, biases);
    
    // Split into gates
    const i = gateInput.slice(0, hiddenSize).map(x => this.sigmoid(x));
    const f = gateInput.slice(hiddenSize, 2 * hiddenSize).map(x => this.sigmoid(x));
    const o = gateInput.slice(2 * hiddenSize, 3 * hiddenSize).map(x => this.sigmoid(x));
    const g = gateInput.slice(3 * hiddenSize).map(x => Math.tanh(x));
    
    // Update cell state
    const newC = c.map((cell, idx) => 
      f[idx] * cell + i[idx] * g[idx]
    );
    
    // Update hidden state
    const newH = newC.map((cell, idx) => 
      o[idx] * Math.tanh(cell)
    );
    
    return newH;
  }
  
  private attentionForward(input: number[], layerIndex: number): number[] {
    // Self-attention mechanism
    const seqLength = Math.sqrt(input.length);
    const dModel = seqLength;
    
    // Reshape input to [seqLength, dModel]
    const reshaped: number[][] = [];
    for (let i = 0; i < seqLength; i++) {
      reshaped[i] = input.slice(i * dModel, (i + 1) * dModel);
    }
    
    // Compute Q, K, V (simplified)
    const Q = reshaped.map(vec => vec.map(x => x * 0.1));
    const K = reshaped.map(vec => vec.map(x => x * 0.2));
    const V = reshaped.map(vec => vec.map(x => x * 0.3));
    
    // Compute attention scores
    const scores: number[][] = [];
    for (let i = 0; i < seqLength; i++) {
      scores[i] = [];
      for (let j = 0; j < seqLength; j++) {
        let score = 0;
        for (let k = 0; k < dModel; k++) {
          score += Q[i][k] * K[j][k];
        }
        scores[i][j] = score / Math.sqrt(dModel);
      }
    }
    
    // Apply softmax
    for (let i = 0; i < seqLength; i++) {
      const maxScore = Math.max(...scores[i]);
      const exps = scores[i].map(s => Math.exp(s - maxScore));
      const sumExps = exps.reduce((a, b) => a + b, 0);
      scores[i] = exps.map(exp => exp / sumExps);
    }
    
    // Compute output
    const output: number[][] = [];
    for (let i = 0; i < seqLength; i++) {
      output[i] = new Array(dModel).fill(0);
      for (let j = 0; j < seqLength; j++) {
        for (let k = 0; k < dModel; k++) {
          output[i][k] += scores[i][j] * V[j][k];
        }
      }
    }
    
    // Flatten output
    return output.flat();
  }
  
  private applyActivation(x: number[], activation: string): number[] {
    switch (activation) {
      case 'relu':
        return x.map(val => Math.max(0, val));
      case 'sigmoid':
        return x.map(this.sigmoid);
      case 'tanh':
        return x.map(Math.tanh);
      case 'softmax':
        const max = Math.max(...x);
        const exps = x.map(val => Math.exp(val - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(exp => exp / sum);
      case 'linear':
      default:
        return x;
    }
  }
  
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
  
  // Training methods
  async backward(
    input: number[], 
    target: number[], 
    learningRate: number = 0.001
  ): Promise<number> {
    // Forward pass
    const output = await this.forward(input);
    
    // Compute loss (Mean Squared Error)
    let loss = 0;
    const error = output.map((out, i) => {
      const diff = out - (target[i] || 0);
      loss += diff * diff;
      return diff;
    });
    
    loss /= output.length;
    
    // Backward pass (simplified)
    // In a full implementation, you'd compute gradients for each layer
    this.updateWeights(error, learningRate);
    
    return loss;
  }
  
  private updateWeights(error: number[], learningRate: number): void {
    // Simplified weight update
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const weights = this.weights.get(`layer_${i}`)!;
      const biases = this.biases.get(`layer_${i}`)!;
      
      // Update biases
      for (let j = 0; j < biases.length; j++) {
        biases[j] -= learningRate * (error[j] || 0);
      }
      
      // Update weights
      for (let j = 0; j < weights.length; j++) {
        for (let k = 0; k < weights[j].length; k++) {
          weights[j][k] -= learningRate * (error[k] || 0) * 0.1;
        }
      }
      
      this.weights.set(`layer_${i}`, weights);
      this.biases.set(`layer_${i}`, biases);
    }
  }
  
  getLayerWeights(layerIndex: number): { weights: number[][], biases: number[] } {
    return {
      weights: this.weights.get(`layer_${layerIndex}`) || [],
      biases: this.biases.get(`layer_${layerIndex}`) || []
    };
  }
  
  setLayerWeights(
    layerIndex: number, 
    weights: number[][], 
    biases: number[]
  ): void {
    this.weights.set(`layer_${layerIndex}`, weights);
    this.biases.set(`layer_${layerIndex}`, biases);
  }
}