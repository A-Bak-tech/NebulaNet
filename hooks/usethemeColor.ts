import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

export function useThemeColor(
  colorName: keyof typeof Colors.light,
  theme?: 'light' | 'dark'
) {
  const { theme: currentTheme } = useTheme();
  const targetTheme = theme || currentTheme;
  
  return Colors[targetTheme][colorName];
}

// Hook for getting entire color scheme
export function useColorScheme() {
  const { theme } = useTheme();
  return Colors[theme];
}