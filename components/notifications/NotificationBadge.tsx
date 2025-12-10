// File: /components/notifications/NotificationBadge.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BellIcon } from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationBadgeProps {
  showCount?: boolean;
  maxCount?: number;
  animated?: boolean;
  onPress?: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  showCount = true,
  maxCount = 99,
  animated = true,
  onPress,
}) => {
  const router = useRouter();
  const { unreadCount } = useNotifications({ autoLoad: true });
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(0));
  
  const hasUnread = unreadCount > 0;
  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();
  
  // Pulse animation for new notifications
  useEffect(() => {
    if (hasUnread && animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }
  }, [hasUnread, animated]);
  
  // Bounce animation on count change
  useEffect(() => {
    if (animated && hasUnread) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [unreadCount]);
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/notifications');
    }
  };
  
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });
  
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <BellIcon 
          size={24} 
          color={hasUnread ? currentTheme.brand.primary : currentTheme.icon.primary} 
        />
        
        {/* Pulse effect */}
        {hasUnread && animated && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
        )}
        
        {/* Badge */}
        {hasUnread && (
          <Animated.View
            style={[
              styles.badge,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {showCount ? (
              <Text style={styles.badgeText}>
                {displayCount}
              </Text>
            ) : (
              <View style={styles.dot} />
            )}
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: currentTheme.brand.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: currentTheme.background.primary,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});

export default NotificationBadge;