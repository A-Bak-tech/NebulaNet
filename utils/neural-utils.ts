// Neural network utility functions

/**
 * Activation functions
 */
export const activations = {
  relu: (x: number): number => Math.max(0, x),
  
  sigmoid: (x: number): number => 1 / (1 + Math.exp(-x)),
  
  tanh: (x: number): number => Math.tanh(x),
  
  softmax: (x: number[]): number[] => {
    const max = Math.max(...x);
    const exps = x.map(val => Math.exp(val - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(exp => exp / sum);
  },
  
  gelu: (x: number): number => {
    // Gaussian Error Linear Unit
    return 0.5 * x * (1 + Math.tanh(
      Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))
    ));
  },
  
  leakyRelu: (x: number, alpha: number = 0.01): number => {
    return x > 0 ? x : alpha * x;
  },
  
  elu: (x: number, alpha: number = 1.0): number => {
    return x >= 0 ? x : alpha * (Math.exp(x) - 1);
  },
  
  swish: (x: number): number => {
    return x * (1 / (1 + Math.exp(-x)));
  }
};

/**
 * Loss functions
 */
export const losses = {
  mse: (yTrue: number[], yPred: number[]): number => {
    let sum = 0;
    for (let i = 0; i < yTrue.length; i++) {
      const diff = yTrue[i] - yPred[i];
      sum += diff * diff;
    }
    return sum / yTrue.length;
  },
  
  mae: (yTrue: number[], yPred: number[]): number => {
    let sum = 0;
    for (let i = 0; i < yTrue.length; i++) {
      sum += Math.abs(yTrue[i] - yPred[i]);
    }
    return sum / yTrue.length;
  },
  
  crossEntropy: (yTrue: number[], yPred: number[]): number => {
    let loss = 0;
    for (let i = 0; i < yTrue.length; i++) {
      const p = Math.max(Math.min(yPred[i], 1 - 1e-10), 1e-10);
      loss -= yTrue[i] * Math.log(p);
    }
    return loss;
  },
  
  binaryCrossEntropy: (yTrue: number, yPred: number): number => {
    const p = Math.max(Math.min(yPred, 1 - 1e-10), 1e-10);
    return -(yTrue * Math.log(p) + (1 - yTrue) * Math.log(1 - p));
  },
  
  huber: (yTrue: number[], yPred: number[], delta: number = 1.0): number => {
    let loss = 0;
    for (let i = 0; i < yTrue.length; i++) {
      const diff = Math.abs(yTrue[i] - yPred[i]);
      if (diff <= delta) {
        loss += 0.5 * diff * diff;
      } else {
        loss += delta * (diff - 0.5 * delta);
      }
    }
    return loss / yTrue.length;
  }
};

/**
 * Optimization functions
 */
export const optimizers = {
  sgd: (
    weights: number[][],
    gradients: number[][],
    learningRate: number
  ): number[][] => {
    const updated = weights.map((row, i) =>
      row.map((w, j) => w - learningRate * (gradients[i]?.[j] || 0))
    );
    return updated;
  },
  
  adam: (
    weights: number[][],
    gradients: number[][],
    learningRate: number,
    m: number[][],
    v: number[][],
    beta1: number = 0.9,
    beta2: number = 0.999,
    epsilon: number = 1e-8,
    t: number = 1
  ): { weights: number[][]; m: number[][]; v: number[][] } => {
    const updatedM = m.map((row, i) =>
      row.map((val, j) => beta1 * val + (1 - beta1) * (gradients[i]?.[j] || 0))
    );
    
    const updatedV = v.map((row, i) =>
      row.map((val, j) => {
        const grad = gradients[i]?.[j] || 0;
        return beta2 * val + (1 - beta2) * grad * grad;
      })
    );
    
    const mHat = updatedM.map(row => row.map(val => val / (1 - Math.pow(beta1, t))));
    const vHat = updatedV.map(row => row.map(val => val / (1 - Math.pow(beta2, t))));
    
    const updatedWeights = weights.map((row, i) =>
      row.map((w, j) => {
        const m = mHat[i][j];
        const v = vHat[i][j];
        return w - learningRate * m / (Math.sqrt(v) + epsilon);
      })
    );
    
    return {
      weights: updatedWeights,
      m: updatedM,
      v: updatedV
    };
  },
  
  rmsprop: (
    weights: number[][],
    gradients: number[][],
    learningRate: number,
    cache: number[][],
    decayRate: number = 0.9,
    epsilon: number = 1e-8
  ): { weights: number[][]; cache: number[][] } => {
    const updatedCache = cache.map((row, i) =>
      row.map((val, j) => decayRate * val + (1 - decayRate) * Math.pow(gradients[i]?.[j] || 0, 2))
    );
    
    const updatedWeights = weights.map((row, i) =>
      row.map((w, j) => {
        const grad = gradients[i]?.[j] || 0;
        const cacheVal = updatedCache[i][j];
        return w - learningRate * grad / (Math.sqrt(cacheVal) + epsilon);
      })
    );
    
    return {
      weights: updatedWeights,
      cache: updatedCache
    };
  }
};

/**
 * Regularization functions
 */
export const regularizations = {
  l2: (weights: number[][], lambda: number): number => {
    let sum = 0;
    for (const row of weights) {
      for (const w of row) {
        sum += w * w;
      }
    }
    return 0.5 * lambda * sum;
  },
  
  l1: (weights: number[][], lambda: number): number => {
    let sum = 0;
    for (const row of weights) {
      for (const w of row) {
        sum += Math.abs(w);
      }
    }
    return lambda * sum;
  },
  
  dropout: (activations: number[], dropoutRate: number): { output: number[]; mask: boolean[] } => {
    const mask = activations.map(() => Math.random() > dropoutRate);
    const output = activations.map((a, i) => mask[i] ? a / (1 - dropoutRate) : 0);
    return { output, mask };
  },
  
  batchNorm: (
    x: number[],
    gamma: number = 1,
    beta: number = 0,
    epsilon: number = 1e-8
  ): { normalized: number[]; mean: number; variance: number } => {
    const mean = x.reduce((a, b) => a + b, 0) / x.length;
    const variance = x.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / x.length;
    
    const normalized = x.map(val => 
      gamma * (val - mean) / Math.sqrt(variance + epsilon) + beta
    );
    
    return { normalized, mean, variance };
  }
};

/**
 * Neural network layers
 */
export const layers = {
  dense: (
    inputs: number[],
    weights: number[][],
    biases: number[],
    activation: keyof typeof activations = 'relu'
  ): number[] => {
    const output = new Array(biases.length).fill(0);
    
    for (let i = 0; i < biases.length; i++) {
      let sum = biases[i];
      for (let j = 0; j < inputs.length; j++) {
        sum += inputs[j] * (weights[j]?.[i] || 0);
      }
      output[i] = sum;
    }
    
    if (activation) {
      const activate = activations[activation];
      return output.map(val => activate(val));
    }
    
    return output;
  },
  
  conv1d: (
    inputs: number[],
    filters: number[][],
    stride: number = 1,
    padding: 'same' | 'valid' = 'valid'
  ): number[][] => {
    const inputLength = inputs.length;
    const filterLength = filters[0].length;
    const numFilters = filters.length;
    
    let outputLength: number;
    if (padding === 'same') {
      outputLength = Math.ceil(inputLength / stride);
    } else {
      outputLength = Math.floor((inputLength - filterLength) / stride) + 1;
    }
    
    const output = Array(numFilters).fill(0).map(() => new Array(outputLength).fill(0));
    
    for (let f = 0; f < numFilters; f++) {
      for (let i = 0; i < outputLength; i++) {
        let sum = 0;
        const start = i * stride;
        for (let j = 0; j < filterLength; j++) {
          const inputIdx = start + j;
          if (inputIdx < inputLength) {
            sum += inputs[inputIdx] * filters[f][j];
          }
        }
        output[f][i] = sum;
      }
    }
    
    return output;
  },
  
  maxPool1d: (
    inputs: number[],
    poolSize: number = 2,
    stride: number = 2
  ): number[] => {
    const outputLength = Math.floor((inputs.length - poolSize) / stride) + 1;
    const output = new Array(outputLength).fill(0);
    
    for (let i = 0; i < outputLength; i++) {
      const start = i * stride;
      let max = -Infinity;
      for (let j = 0; j < poolSize; j++) {
        const inputIdx = start + j;
        if (inputIdx < inputs.length) {
          max = Math.max(max, inputs[inputIdx]);
        }
      }
      output[i] = max;
    }
    
    return output;
  },
  
  attention: (
    query: number[],
    key: number[],
    value: number[],
    scale: boolean = true
  ): { output: number[]; attentionWeights: number[] } => {
    // Scaled dot-product attention
    const scaleFactor = scale ? Math.sqrt(query.length) : 1;
    const scores = query.map((q, i) => q * (key[i] || 0) / scaleFactor);
    
    // Softmax
    const maxScore = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - maxScore));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const attentionWeights = exps.map(exp => exp / sumExps);
    
    // Apply to values
    const output = new Array(value.length).fill(0);
    for (let i = 0; i < value.length; i++) {
      for (let j = 0; j < attentionWeights.length; j++) {
        output[i] += attentionWeights[j] * (value[i] || 0);
      }
    }
    
    return { output, attentionWeights };
  }
};

/**
 * Neural network initialization
 */
export const initializers = {
  zeros: (rows: number, cols: number): number[][] => {
    return Array(rows).fill(0).map(() => Array(cols).fill(0));
  },
  
  ones: (rows: number, cols: number): number[][] => {
    return Array(rows).fill(0).map(() => Array(cols).fill(1));
  },
  
  random: (rows: number, cols: number, min: number = -1, max: number = 1): number[][] => {
    return Array(rows).fill(0).map(() =>
      Array(cols).fill(0).map(() => min + Math.random() * (max - min))
    );
  },
  
  xavier: (rows: number, cols: number): number[][] => {
    const limit = Math.sqrt(6 / (rows + cols));
    return initializers.random(rows, cols, -limit, limit);
  },
  
  he: (rows: number, cols: number): number[][] => {
    const std = Math.sqrt(2 / rows);
    return initializers.random(rows, cols, -std, std);
  }
};

/**
 * Utility functions
 */
export const utils = {
  oneHot: (index: number, size: number): number[] => {
    const encoded = new Array(size).fill(0);
    encoded[index] = 1;
    return encoded;
  },
  
  flatten: (arrays: number[][]): number[] => {
    return arrays.reduce((acc, val) => acc.concat(val), []);
  },
  
  reshape: (array: number[], shape: number[]): number[][] => {
    const result: number[][] = [];
    let index = 0;
    for (let i = 0; i < shape[0]; i++) {
      const row: number[] = [];
      for (let j = 0; j < shape[1]; j++) {
        row.push(array[index++] || 0);
      }
      result.push(row);
    }
    return result;
  },
  
  pad: (array: number[], length: number, value: number = 0): number[] => {
    if (array.length >= length) return array.slice(0, length);
    return [...array, ...new Array(length - array.length).fill(value)];
  },
  
  normalize: (array: number[]): number[] => {
    const mean = array.reduce((a, b) => a + b, 0) / array.length;
    const std = Math.sqrt(array.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / array.length);
    return array.map(val => (val - mean) / (std || 1));
  },
  
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
  
  batch: <T>(array: T[], batchSize: number): T[][] => {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }
};

/**
 * Model evaluation metrics
 */
export const metrics = {
  accuracy: (yTrue: number[], yPred: number[]): number => {
    let correct = 0;
    for (let i = 0; i < yTrue.length; i++) {
      if (Math.round(yTrue[i]) === Math.round(yPred[i])) {
        correct++;
      }
    }
    return correct / yTrue.length;
  },
  
  precision: (yTrue: number[], yPred: number[], threshold: number = 0.5): number => {
    let truePositives = 0;
    let falsePositives = 0;
    
    for (let i = 0; i < yTrue.length; i++) {
      const predicted = yPred[i] >= threshold ? 1 : 0;
      const actual = yTrue[i] >= threshold ? 1 : 0;
      
      if (predicted === 1 && actual === 1) truePositives++;
      if (predicted === 1 && actual === 0) falsePositives++;
    }
    
    return truePositives + falsePositives === 0 ? 0 : truePositives / (truePositives + falsePositives);
  },
  
  recall: (yTrue: number[], yPred: number[], threshold: number = 0.5): number => {
    let truePositives = 0;
    let falseNegatives = 0;
    
    for (let i = 0; i < yTrue.length; i++) {
      const predicted = yPred[i] >= threshold ? 1 : 0;
      const actual = yTrue[i] >= threshold ? 1 : 0;
      
      if (predicted === 1 && actual === 1) truePositives++;
      if (predicted === 0 && actual === 1) falseNegatives++;
    }
    
    return truePositives + falseNegatives === 0 ? 0 : truePositives / (truePositives + falseNegatives);
  },
  
  f1: (yTrue: number[], yPred: number[], threshold: number = 0.5): number => {
    const p = metrics.precision(yTrue, yPred, threshold);
    const r = metrics.recall(yTrue, yPred, threshold);
    return p + r === 0 ? 0 : (2 * p * r) / (p + r);
  },
  
  confusionMatrix: (yTrue: number[], yPred: number[], threshold: number = 0.5): number[][] => {
    const matrix = [[0, 0], [0, 0]]; // [[TN, FP], [FN, TP]]
    
    for (let i = 0; i < yTrue.length; i++) {
      const predicted = yPred[i] >= threshold ? 1 : 0;
      const actual = yTrue[i] >= threshold ? 1 : 0;
      
      matrix[actual][predicted]++;
    }
    
    return matrix;
  },
  
  rocAuc: (yTrue: number[], yPred: number[]): number => {
    // Simplified ROC AUC calculation
    const pairs = yTrue.map((trueVal, i) => ({ true: trueVal, pred: yPred[i] }));
    pairs.sort((a, b) => b.pred - a.pred);
    
    let auc = 0;
    let prevFalsePositives = 0;
    let prevTruePositives = 0;
    const totalPositives = yTrue.filter(v => v >= 0.5).length;
    const totalNegatives = yTrue.filter(v => v < 0.5).length;
    
    if (totalPositives === 0 || totalNegatives === 0) return 0.5;
    
    for (const pair of pairs) {
      if (pair.true >= 0.5) {
        prevTruePositives++;
      } else {
        prevFalsePositives++;
      }
      
      const falsePositiveRate = prevFalsePositives / totalNegatives;
      const truePositiveRate = prevTruePositives / totalPositives;
      
      auc += (falsePositiveRate - (prevFalsePositives - 1) / totalNegatives) * truePositiveRate;
    }
    
    return auc;
  }
};

export default {
  activations,
  losses,
  optimizers,
  regularizations,
  layers,
  initializers,
  utils,
  metrics
};