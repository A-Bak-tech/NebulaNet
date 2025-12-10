// assets/icons/trending-up.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface TrendingUpIconProps {
  size?: number;
  color?: string;
}

const TrendingUpIcon: React.FC<TrendingUpIconProps> = ({
  size = 24,
  color = '#FFFFFF',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6L13.5 15.5L8.5 10.5L1 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 6H23V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default TrendingUpIcon;