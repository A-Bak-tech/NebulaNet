import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface ThemeIconProps {
  size?: number;
  color?: string;
  theme?: 'light' | 'dark';
}

export function ThemeIcon({ size = 24, color = '#000', theme = 'light' }: ThemeIconProps) {
  if (theme === 'dark') {
    // Moon icon for dark mode
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          fill={color}
        />
      </Svg>
    );
  }

  // Sun icon for light mode
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" fill={color} />
      <Path stroke={color} strokeWidth="2" strokeLinecap="round" d="M12 1v2" />
      <Path stroke={color} strokeWidth="2" strokeLinecap="round" d="M12 21v2" />
      <Path stroke={color} strokeWidth="2" strokeLinecap="round" d="M4.22 4.22l1.42 1.42" />
      <Path stroke={color} strokeWidth="2" strokeLinecap="round" d="M18.36 18.36l1.42 1.42" />
      <Path stroke={color} strokeWidth="2" strokeLinecap="round" d="M1 12h2" />
      <Path stroke={color} strokeWidth="2" strokeLinecap="round" d="M21 12h2" />
      <Path stroke={color} strokeWidth="2" strokeLinecap="round" d="M4.22 19.78l1.42-1.42" />
      <Path stroke={color} strokeWidth="2" strokeLinecap="round" d="M18.36 5.64l1.42-1.42" />
    </Svg>
  );
}