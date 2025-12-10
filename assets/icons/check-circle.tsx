// assets/icons/check-circle.tsx
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface CheckCircleIconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

const CheckCircleIcon: React.FC<CheckCircleIconProps> = ({
  size = 24,
  color = '#FFFFFF',
  filled = false,
}) => {
  return filled ? (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
    </Svg>
  ) : (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12L11 14L15 10M21 12C21 17.5228 16.5228 22 12 22C7.47715 22 3 17.5228 3 12C3 6.47715 7.47715 3 12 3C16.5228 3 21 6.47715 21 12Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default CheckCircleIcon;