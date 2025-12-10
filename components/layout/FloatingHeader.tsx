// components/layout/FloatingHeader.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Animated, ScrollView, ViewStyle } from 'react-native';
import Header from './Header';

interface FloatingHeaderProps {
  children: React.ReactNode;
  headerProps?: React.ComponentProps<typeof Header>;
  scrollViewProps?: React.ComponentProps<typeof ScrollView>;
  floating?: boolean;
  showOnScrollUp?: boolean;
  hideOnScrollDown?: boolean;
  style?: ViewStyle;
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  children,
  headerProps,
  scrollViewProps,
  floating = true,
  showOnScrollUp = true,
  hideOnScrollDown = true,
  style,
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');
  
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        
        // Determine scroll direction
        if (currentScrollY > lastScrollY.current) {
          scrollDirection.current = 'down';
          if (hideOnScrollDown && currentScrollY > 100) {
            setIsHeaderVisible(false);
          }
        } else if (currentScrollY < lastScrollY.current) {
          scrollDirection.current = 'up';
          if (showOnScrollUp) {
            setIsHeaderVisible(true);
          }
        }
        
        lastScrollY.current = currentScrollY;
      },
    }
  );
  
  // Animate header opacity based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });
  
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });
  
  if (!floating) {
    return (
      <>
        <Header {...headerProps} />
        <ScrollView {...scrollViewProps}>
          {children}
        </ScrollView>
      </>
    );
  }
  
  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            opacity: isHeaderVisible ? headerOpacity : 0,
            transform: [{ translateY: isHeaderVisible ? headerTranslateY : -100 }],
          },
          style,
        ]}
      >
        <Header {...headerProps} transparent={true} />
      </Animated.View>
      
      <ScrollView
        {...scrollViewProps}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          { paddingTop: 60 }, // Make room for floating header
          scrollViewProps?.contentContainerStyle,
        ]}
      >
        {children}
      </ScrollView>
    </>
  );
};

export default FloatingHeader;