// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname, {
  // Enable CSS support
  isCSSEnabled: true,
});

// 1. Enable SVG support
const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg', 'mjs', 'cjs'],
  
  // Resolve modules from your custom directories
  extraNodeModules: {
    ...resolver.extraNodeModules,
    '@components': path.resolve(__dirname, 'components'),
    '@lib': path.resolve(__dirname, 'lib'),
    '@types': path.resolve(__dirname, 'types'),
    '@constants': path.resolve(__dirname, 'constants'),
    '@utils': path.resolve(__dirname, 'utils'),
    '@hooks': path.resolve(__dirname, 'hooks'),
    '@contexts': path.resolve(__dirname, 'contexts'),
    '@assets': path.resolve(__dirname, 'assets'),
  },
};

// 2. Watch all relevant folders
config.watchFolders = [
  __dirname,
  path.resolve(__dirname, '..'), // Parent directory if needed
];

// 3. Increase max workers for better performance
config.maxWorkers = 4;

// 4. Reset cache on demand
config.resetCache = process.env.EXPO_RESET_CACHE === 'true';

// 5. Cache configuration
config.cacheStores = [
  {
    get: async (key) => {
      // Custom cache implementation if needed
      return null;
    },
    set: async (key, value) => {
      // Custom cache implementation if needed
    },
  },
];

// 6. Server configuration
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add custom middleware if needed
      if (req.url.startsWith('/models/')) {
        // Handle model file requests
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      return middleware(req, res, next);
    };
  },
  port: process.env.METRO_PORT || 8081,
};

// 7. Transformer options
config.transformer.minifierPath = require.resolve('metro-minify-terser');
config.transformer.minifierConfig = {
  compress: {
    drop_console: process.env.NODE_ENV === 'production',
  },
};

// 8. Resolver options for TypeScript
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Custom module resolution if needed
  if (moduleName.startsWith('@/')) {
    const modulePath = path.resolve(
      __dirname,
      moduleName.replace('@/', '')
    );
    return {
      filePath: modulePath,
      type: 'sourceFile',
    };
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;