// constants/Colors.ts
export const Colors = {
  // NebulaNet dark theme
  dark: {
    // Backgrounds
    background: '#0A0A0F',
    surface: '#12121A',
    surfaceLight: '#1A1A25',
    surfaceElevated: '#1E1E2A',
    card: '#1A1A25',
    modal: '#1E1E2A',
    
    // Borders
    border: '#2A2A3A',
    borderLight: '#3A3A4A',
    divider: '#2A2A3A',
    
    // Text
    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0B0',
      tertiary: '#707080',
      disabled: '#505060',
      inverse: '#0A0A0F',
    },
    
    // Brand Colors (NebulaNet Palette)
    brand: {
      primary: '#7C3AED',    // Purple (main brand)
      primaryLight: '#8B5CF6',
      primaryDark: '#6D28D9',
      secondary: '#3B82F6',  // Blue
      accent: '#10B981',     // Emerald
      nebula: '#8B5CF6',     // Nebula glow
    },
    
    // Functional Colors
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    
    // Buttons
    button: {
      primary: '#7C3AED',
      primaryHover: '#8B5CF6',
      secondary: '#2A2A3A',
      secondaryHover: '#3A3A4A',
      outline: '#3A3A4A',
      outlineHover: '#4A4A5A',
      ghost: 'transparent',
      ghostHover: 'rgba(124, 58, 237, 0.1)',
    },
    
    // Icons
    icon: {
      primary: '#FFFFFF',
      secondary: '#A0A0B0',
      active: '#7C3AED',
      disabled: '#505060',
    },
    
    // Gradients
    gradient: {
      primary: ['#7C3AED', '#8B5CF6'],
      nebula: ['#7C3AED', '#3B82F6'],
      dark: ['#12121A', '#1A1A25'],
    },
  },
  
  // Light theme (if you add later)
  light: {
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceLight: '#F1F5F9',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    modal: '#FFFFFF',
    
    border: '#E2E8F0',
    borderLight: '#CBD5E1',
    divider: '#E2E8F0',
    
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      tertiary: '#94A3B8',
      disabled: '#CBD5E1',
      inverse: '#FFFFFF',
    },
    
    brand: {
      primary: '#7C3AED',
      primaryLight: '#8B5CF6',
      primaryDark: '#6D28D9',
      secondary: '#3B82F6',
      accent: '#10B981',
      nebula: '#8B5CF6',
    },
    
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    
    button: {
      primary: '#7C3AED',
      primaryHover: '#8B5CF6',
      secondary: '#F1F5F9',
      secondaryHover: '#E2E8F0',
      outline: '#CBD5E1',
      outlineHover: '#94A3B8',
      ghost: 'transparent',
      ghostHover: 'rgba(124, 58, 237, 0.1)',
    },
    
    icon: {
      primary: '#1E293B',
      secondary: '#64748B',
      active: '#7C3AED',
      disabled: '#CBD5E1',
    },
    
    gradient: {
      primary: ['#7C3AED', '#8B5CF6'],
      nebula: ['#7C3AED', '#3B82F6'],
      light: ['#F8FAFC', '#F1F5F9'],
    },
  },
};

// Current theme (dark mode)
export const currentTheme = Colors.dark;
export default Colors;