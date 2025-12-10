import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';

interface NebulaLoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  showMessage?: boolean;
}

export const NebulaLoadingIndicator: React.FC<NebulaLoadingIndicatorProps> = ({
  message = 'Thinking...',
  size = 'medium',
  color = '#8B5CF6',
  showMessage = true
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  };

  const dotSize = sizeMap[size];

  useEffect(() => {
    // Spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    // Pulsing animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const pulse = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2]
  });

  const nebulaColors = [
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444'  // Red
  ];

  return (
    <View className="items-center justify-center p-6">
      <View className="relative items-center justify-center">
        {/* Outer ring */}
        <Animated.View
          style={{
            width: dotSize * 2,
            height: dotSize * 2,
            borderRadius: dotSize,
            borderWidth: 2,
            borderColor: `${color}20`,
            transform: [{ rotate: spin }]
          }}
        />

        {/* Orbiting dots */}
        {nebulaColors.map((dotColor, index) => {
          const angle = (index * (2 * Math.PI)) / nebulaColors.length;
          const radius = dotSize * 0.8;

          return (
            <Animated.View
              key={index}
              style={{
                position: 'absolute',
                width: dotSize / 3,
                height: dotSize / 3,
                borderRadius: dotSize / 6,
                backgroundColor: dotColor,
                left: Math.cos(angle) * radius + dotSize - dotSize / 6,
                top: Math.sin(angle) * radius + dotSize - dotSize / 6,
                transform: [{ scale: pulse }]
              }}
            />
          );
        })}

        {/* Center dot */}
        <Animated.View
          style={{
            position: 'absolute',
            width: dotSize / 2,
            height: dotSize / 2,
            borderRadius: dotSize / 4,
            backgroundColor: color,
            transform: [{ scale: pulse }]
          }}
        />
      </View>

      {showMessage && (
        <View className="mt-4">
          <Text className="text-gray-300 text-center font-medium">
            {message}
          </Text>
          <Text className="text-gray-500 text-center text-xs mt-1">
            Nebula AI is processing your request
          </Text>
        </View>
      )}

      {/* Dots animation for "Thinking..." */}
      {showMessage && (
        <View className="flex-row mt-2">
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: color,
                marginHorizontal: 2,
                opacity: pulseValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1]
                }),
                transform: [
                  {
                    translateY: pulseValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4]
                    })
                  }
                ]
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Variant for inline loading
export const InlineNebulaLoader: React.FC<{ size?: number }> = ({ size = 16 }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: '#8B5CF6',
        borderRightColor: 'transparent',
        transform: [{ rotate: spin }]
      }}
    />
  );
};

// Variant for button loading
export const ButtonNebulaLoader: React.FC = () => {
  return (
    <View className="flex-row items-center">
      <View className="w-4 h-4 rounded-full border-2 border-white border-r-transparent animate-spin mr-2" />
      <Text className="text-white">Processing...</Text>
    </View>
  );
};

// Variant for full screen loading
export const FullScreenNebulaLoader: React.FC<{
  title?: string;
  subtitle?: string;
}> = ({ title = 'Nebula AI', subtitle = 'Loading your AI experience...' }) => {
  return (
    <View className="flex-1 bg-gray-900 items-center justify-center">
      <View className="items-center">
        <NebulaLoadingIndicator size="large" showMessage={false} />
        <Text className="text-white text-2xl font-bold mt-6">{title}</Text>
        <Text className="text-gray-400 text-center mt-2 max-w-xs">
          {subtitle}
        </Text>
      </View>
      
      {/* Loading steps animation */}
      <View className="mt-8">
        {['Initializing models', 'Loading datasets', 'Warming up AI', 'Ready in moments'].map((step, index) => (
          <View key={index} className="flex-row items-center mb-3">
            <View className="w-2 h-2 rounded-full bg-purple-500 mr-3" />
            <Text className="text-gray-300">{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};