import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

const LoadingScreen = () => {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.primary,
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.ui.primary} />
    </View>
  );
};

export default LoadingScreen;