import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on a standard 375x812 (iPhone X) design scale
const scale = SCREEN_WIDTH / 375;

// Responsive scaling function
export function responsiveSize(size: number): number {
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}

// Twitter-like spacing system (responsive)
export const SPACING = {
  xs: responsiveSize(4),     // 4
  sm: responsiveSize(8),     // 8
  md: responsiveSize(16),    // 16 (Twitter's default)
  lg: responsiveSize(24),    // 24
  xl: responsiveSize(32),    // 32
  xxl: responsiveSize(48),   // 48
};

// Responsive component sizes
export const SIZES = {
  // Navigation
  BOTTOM_TAB_HEIGHT: responsiveSize(60),
  BOTTOM_TAB_ICON_SIZE: responsiveSize(28),
  HEADER_HEIGHT: responsiveSize(56),
  
  // Typography
  H1: responsiveSize(32),
  H2: responsiveSize(24),
  H3: responsiveSize(20),
  BODY_LARGE: responsiveSize(18),
  BODY: responsiveSize(16),
  BODY_SMALL: responsiveSize(14),
  CAPTION: responsiveSize(12),
  
  // Components
  AVATAR: {
    XS: responsiveSize(32),
    SM: responsiveSize(40),
    MD: responsiveSize(48),
    LG: responsiveSize(56),
    XL: responsiveSize(64),
  },
  
  BUTTON: {
    HEIGHT: responsiveSize(48),
    HEIGHT_SM: responsiveSize(40),
  },
  
  // Inputs
  INPUT_HEIGHT: responsiveSize(48),
  
  // Cards & Containers
  BORDER_RADIUS: responsiveSize(12),
  CARD_RADIUS: responsiveSize(16),
  
  // Icons
  ICON: {
    XS: responsiveSize(16),
    SM: responsiveSize(20),
    MD: responsiveSize(24),
    LG: responsiveSize(32),
  },
};

// Device type detection
export const isSmallDevice = SCREEN_WIDTH < 375;  // iPhone SE, small Android
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414; // Most phones
export const isLargeDevice = SCREEN_WIDTH >= 414; // Plus/Pro Max phones
export const isTablet = SCREEN_WIDTH >= 768;

// Platform-specific adjustments
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

// Safe area insets (will be overridden by useSafeAreaInsets)
export const SAFE_AREA = {
  top: Platform.select({ ios: 44, android: statusbar.currentHeight || 24 }),
  bottom: Platform.select({ ios: 34, android: 0 }),
};

export default {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SPACING,
  SIZES,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  IS_IOS,
  IS_ANDROID,
  SAFE_AREA,
  responsiveSize,
};