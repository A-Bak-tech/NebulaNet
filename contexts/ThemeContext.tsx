import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme, ColorSchemeName, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme types
export type ThemeType = 'light' | 'dark' | 'system';
export type ThemeMode = 'light' | 'dark';

// Theme interface
export interface Theme {
  mode: ThemeMode;
  colors: {
    // Background colors
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    
    // Text colors
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
      placeholder: string;
      disabled: string;
    };
    
    // UI colors
    ui: {
      primary: string;
      primaryLight: string;
      secondary: string;
      tertiary: string;
      border: string;
      separator: string;
      shadow: string;
      overlay: string;
    };
    
    // Status colors
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    
    // Special colors
    special: {
      accent: string;
      highlight: string;
    };
    
    // Icon colors
    icon: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
      accent: string;
    };
  };
  
  // Typography
  typography: {
    fontFamily: {
      regular: string;
      medium: string;
      semiBold: string;
      bold: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
  };
  
  // Spacing
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  // Border radius
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

// Theme definitions
const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      tertiary: '#F1F3F5',
      inverse: '#1A1A1A',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      tertiary: '#999999',
      inverse: '#FFFFFF',
      placeholder: '#C7C7CC',
      disabled: '#D1D1D6',
    },
    ui: {
      primary: '#007AFF',
      primaryLight: '#C7EBFF',
      secondary: '#5856D6',
      tertiary: '#34C759',
      border: '#E5E5EA',
      separator: '#C6C6C8',
      shadow: '#000000',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    status: {
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
      info: '#007AFF',
    },
    special: {
      accent: '#FF2D55',
      highlight: '#FFD60A',
    },
    icon: {
      primary: '#1A1A1A',
      secondary: '#666666',
      tertiary: '#999999',
      inverse: '#FFFFFF',
      accent: '#007AFF',
    },
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: {
      primary: '#000000',
      secondary: '#1C1C1E',
      tertiary: '#2C2C2E',
      inverse: '#FFFFFF',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#EBEBF5',
      tertiary: '#98989D',
      inverse: '#1A1A1A',
      placeholder: '#8E8E93',
      disabled: '#636366',
    },
    ui: {
      primary: '#0A84FF',
      primaryLight: '#003A70',
      secondary: '#5E5CE6',
      tertiary: '#30D158',
      border: '#38383A',
      separator: '#464648',
      shadow: '#000000',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    status: {
      success: '#30D158',
      warning: '#FF9F0A',
      error: '#FF453A',
      info: '#0A84FF',
    },
    special: {
      accent: '#FF375F',
      highlight: '#FFD60A',
    },
    icon: {
      primary: '#FFFFFF',
      secondary: '#EBEBF5',
      tertiary: '#98989D',
      inverse: '#1A1A1A',
      accent: '#0A84FF',
    },
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Context interface
interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  themeMode: ThemeMode;
  isDark: boolean;
  setTheme: (type: ThemeType) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage keys
const THEME_STORAGE_KEY = '@NebulaNet/theme';

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeType;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'system' 
}) => {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>(defaultTheme);
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    defaultTheme === 'system' ? (systemColorScheme || 'light') : defaultTheme
  );

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Update theme mode when system color scheme changes
  useEffect(() => {
    if (themeType === 'system' && systemColorScheme) {
      setThemeMode(systemColorScheme);
    }
  }, [systemColorScheme, themeType]);

  // Load theme from storage
  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme) as ThemeType;
        setThemeType(parsedTheme);
        setThemeMode(
          parsedTheme === 'system' ? (systemColorScheme || 'light') : parsedTheme
        );
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      // Use default theme if there's an error
      setThemeType(defaultTheme);
    }
  };

  // Save theme to storage
  const saveTheme = async (type: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(type));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Set theme
  const setTheme = async (type: ThemeType) => {
    setThemeType(type);
    
    // Update theme mode
    if (type === 'system') {
      setThemeMode(systemColorScheme || 'light');
    } else {
      setThemeMode(type);
    }
    
    // Save to storage
    await saveTheme(type);
  };

  // Toggle between light and dark (ignoring system)
  const toggleTheme = async () => {
    if (themeType === 'system') {
      // If currently on system, toggle to opposite of current system mode
      const newMode = themeMode === 'light' ? 'dark' : 'light';
      await setTheme(newMode);
    } else {
      // Toggle between light and dark
      const newType = themeType === 'light' ? 'dark' : 'light';
      await setTheme(newType);
    }
  };

  // Get current theme based on mode
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;
  const isDark = themeMode === 'dark';

  // Context value
  const contextValue: ThemeContextType = {
    theme,
    themeType,
    themeMode,
    isDark,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to get theme colors directly
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

// Hook to get theme spacing
export const useThemeSpacing = () => {
  const { theme } = useTheme();
  return theme.spacing;
};

// Hook to get theme typography
export const useThemeTypography = () => {
  const { theme } = useTheme();
  return theme.typography;
};

// Hook to check if dark mode
export const useIsDark = () => {
  const { isDark } = useTheme();
  return isDark;
};

// Hook to get current theme type
export const useThemeType = () => {
  const { themeType } = useTheme();
  return themeType;
};

// Hook to set theme
export const useSetTheme = () => {
  const { setTheme } = useTheme();
  return setTheme;
};

// Hook to toggle theme
export const useToggleTheme = () => {
  const { toggleTheme } = useTheme();
  return toggleTheme;
};