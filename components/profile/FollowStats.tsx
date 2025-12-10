// File: /components/profile/FollowStats.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FollowStatsProps {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

export const FollowStats: React.FC<FollowStatsProps> = ({
  followersCount,
  followingCount,
  postsCount,
  onFollowersPress,
  onFollowingPress
}) => {
  return (
    <View style={styles.container}>
      <StatItem
        label="Posts"
        value={postsCount}
        onPress={() => {}}
        disabled
      />
      <StatItem
        label="Followers"
        value={followersCount}
        onPress={onFollowersPress}
      />
      <StatItem
        label="Following"
        value={followingCount}
        onPress={onFollowingPress}
      />
    </View>
  );
};

const StatItem: React.FC<{
  label: string;
  value: number;
  onPress: () => void;
  disabled?: boolean;
}> = ({ label, value, onPress, disabled }) => (
  <TouchableOpacity
    style={styles.statItem}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.statValue}>{value.toLocaleString()}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});