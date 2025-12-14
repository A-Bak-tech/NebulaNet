// babel.config.js
module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      ['babel-preset-expo', {
        jsxRuntime: 'automatic',
      }]
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@lib': './lib',
            '@types': './types',
            '@constants': './constants',
            '@utils': './utils',
            '@hooks': './hooks',
            '@contexts': './contexts',
            '@assets': './assets',
            '@app': './app',
          },
        },
      ],
      'react-native-reanimated/plugin', // If using Reanimated
      'nativewind/babel', // If using NativeWind/Tailwind
    ],
  };
};