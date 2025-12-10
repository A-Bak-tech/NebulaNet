#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const CONFIG = {
  datasets: [
    {
      name: 'text-generation',
      sources: [
        'data/raw/books.txt',
        'data/raw/articles.txt',
        'data/raw/social-posts.txt'
      ],
      output: 'data/training/text-generation.jsonl',
      minLength: 50,
      maxLength: 500
    },
    {
      name: 'sentiment-analysis',
      sources: [
        'data/raw/reviews.txt',
        'data/raw/tweets.txt',
        'data/raw/comments.txt'
      ],
      output: 'data/training/sentiment-analysis.jsonl',
      labels: ['positive', 'negative', 'neutral']
    },
    {
      name: 'content-classification',
      sources: [
        'data/raw/moderation-samples.txt'
      ],
      output: 'data/training/content-classification.jsonl',
      categories: ['safe', 'spam', 'harassment', 'hate_speech', 'explicit']
    }
  ],
  validationSplit: 0.2,
  testSplit: 0.1
};

async function prepareDatasets() {
  console.log('📊 Preparing Nebula AI training datasets...');
  console.log('============================================\n');

  try {
    // Create directories
    const dirs = [
      'data/raw',
      'data/training',
      'data/validation',
      'data/test'
    ];
    
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
      }
    });

    // Check if source files exist, create sample data if not
    await checkAndCreateSampleData();

    // Process each dataset
    for (const dataset of CONFIG.datasets) {
      console.log(`\n🔧 Processing ${dataset.name} dataset...`);
      
      try {
        const processed = await processDataset(dataset);
        
        // Split into train/val/test
        const { train, val, test } = splitDataset(processed);
        
        // Save splits
        await saveDataset(train, dataset.output);
        await saveDataset(val, dataset.output.replace('.jsonl', '.val.jsonl'));
        await saveDataset(test, dataset.output.replace('.jsonl', '.test.jsonl'));
        
        console.log(`  ✓ Training samples: ${train.length}`);
        console.log(`  ✓ Validation samples: ${val.length}`);
        console.log(`  ✓ Test samples: ${test.length}`);
        console.log(`  ✓ Total samples: ${processed.length}`);
        
      } catch (error) {
        console.error(`  ❌ Failed to process ${dataset.name}:`, error.message);
      }
    }

    console.log('\n============================================');
    console.log('✅ All datasets prepared successfully!');
    console.log('📁 Data saved to: data/training/');
    
    // Generate dataset report
    await generateDatasetReport();
    
  } catch (error) {
    console.error('❌ Dataset preparation failed:', error);
    process.exit(1);
  }
}

async function checkAndCreateSampleData() {
  // Check if raw data exists, create sample data if not
  for (const dataset of CONFIG.datasets) {
    for (const source of dataset.sources) {
      const sourcePath = path.join(__dirname, '..', source);
      if (!fs.existsSync(sourcePath)) {
        console.log(`⚠️ Creating sample data for: ${source}`);
        await createSampleData(sourcePath, dataset.name);
      }
    }
  }
}

async function createSampleData(filePath, datasetType) {
  const sampleData = {
    'text-generation': [
      "The quick brown fox jumps over the lazy dog.",
      "Artificial intelligence is transforming our world in unprecedented ways.",
      "The future belongs to those who believe in the beauty of their dreams.",
      "In the midst of winter, I found there was, within me, an invincible summer.",
      "Technology is best when it brings people together."
    ],
    'sentiment-analysis': [
      { text: "I absolutely love this product! It's amazing.", label: "positive" },
      { text: "This is the worst experience I've ever had.", label: "negative" },
      { text: "The weather is sunny today.", label: "neutral" },
      { text: "The service was excellent and staff were friendly.", label: "positive" },
      { text: "I'm very disappointed with the quality.", label: "negative" }
    ],
    'content-classification': [
      { text: "This is a normal post about daily life.", category: "safe" },
      { text: "Buy now! Limited time offer!!! Click here!!!", category: "spam" },
      { text: "I hate everyone from that group.", category: "hate_speech" },
      { text: "Let's meet up and have a drink.", category: "safe" },
      { text: "Explicit content warning here.", category: "explicit" }
    ]
  };

  const samples = sampleData[datasetType] || [];
  const content = samples.map(s => JSON.stringify(s)).join('\n');
  
  fs.writeFileSync(filePath, content);
}

async function processDataset(dataset) {
  const allData = [];
  
  for (const source of dataset.sources) {
    const sourcePath = path.join(__dirname, '..', source);
    
    if (!fs.existsSync(sourcePath)) {
      console.log(`  ⚠️ Source not found: ${source}`);
      continue;
    }
    
    const fileStream = fs.createReadStream(sourcePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    for await (const line of rl) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line);
          
          // Validate and format based on dataset type
          const processed = processDataItem(data, dataset);
          if (processed) {
            allData.push(processed);
          }
        } catch (error) {
          // If not JSON, treat as plain text
          if (dataset.name === 'text-generation') {
            const text = line.trim();
            if (text.length >= dataset.minLength && text.length <= dataset.maxLength) {
              allData.push({ text });
            }
          }
        }
      }
    }
  }
  
  return allData;
}

function processDataItem(data, dataset) {
  switch (dataset.name) {
    case 'text-generation':
      return {
        text: typeof data === 'string' ? data : data.text,
        length: data.length || 0
      };
      
    case 'sentiment-analysis':
      if (!dataset.labels.includes(data.label)) {
        return null;
      }
      return {
        text: data.text,
        label: data.label
      };
      
    case 'content-classification':
      if (!dataset.categories.includes(data.category)) {
        return null;
      }
      return {
        text: data.text,
        category: data.category
      };
      
    default:
      return data;
  }
}

function splitDataset(data) {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const valSize = Math.floor(data.length * CONFIG.validationSplit);
  const testSize = Math.floor(data.length * CONFIG.testSplit);
  
  return {
    train: shuffled.slice(valSize + testSize),
    val: shuffled.slice(testSize, testSize + valSize),
    test: shuffled.slice(0, testSize)
  };
}

async function saveDataset(data, outputPath) {
  const fullPath = path.join(__dirname, '..', outputPath);
  const content = data.map(item => JSON.stringify(item)).join('\n');
  fs.writeFileSync(fullPath, content);
}

async function generateDatasetReport() {
  const report = {
    timestamp: new Date().toISOString(),
    datasets: CONFIG.datasets.map(dataset => {
      const trainPath = path.join(__dirname, '..', dataset.output);
      const valPath = trainPath.replace('.jsonl', '.val.jsonl');
      const testPath = trainPath.replace('.jsonl', '.test.jsonl');
      
      const countSamples = (path) => {
        if (!fs.existsSync(path)) return 0;
        const content = fs.readFileSync(path, 'utf-8');
        return content.split('\n').filter(line => line.trim()).length;
      };
      
      return {
        name: dataset.name,
        trainSamples: countSamples(trainPath),
        valSamples: countSamples(valPath),
        testSamples: countSamples(testPath),
        totalSamples: countSamples(trainPath) + countSamples(valPath) + countSamples(testPath),
        sources: dataset.sources
      };
    }),
    config: CONFIG
  };

  const reportPath = path.join(__dirname, '../dataset-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Dataset report saved to: ${reportPath}`);
}

// Run if called directly
if (require.main === module) {
  prepareDatasets();
}

module.exports = { prepareDatasets };