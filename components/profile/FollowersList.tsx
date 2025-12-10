// File: /components/profile/FollowersList.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { followers } from '../../lib/followers';
import { Follower, User } from '../../types/app';
import { useAuth } from '../../hooks/useAuth';
import { currentTheme } from '../../constants/Colors';

interface FollowersListProps {
  userId: string;
  type: 'followers' | 'following';
  onUserPress?: (userId: string) => void;
  showActions?: boolean;
}

export const FollowersList: React.FC<FollowersListProps> = ({
  userId,
  type,
  onUserPress,
  showActions = true,
}) => {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followStatuses, setFollowStatuses] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      let result: Follower[] = [];
      
      if (type === 'followers') {
        result = await followers.getFollowers(userId);
      } else {
        result = await followers.getFollowing(userId);
      }
      
      setData(result);
      
      // Check follow status for each user
      if (currentUser && showActions) {
        const statusPromises = result.map(async (item) => {
          const user = type === 'followers' ? item.follower : item.following;
          if (user && user.id !== currentUser.id) {
            const status = await followers.checkFollowing(user.id);
            return { userId: user.id, status };
          }
          return null;
        });
        
        const statusResults = await Promise.all(statusPromises);
        const statusMap: Record<string, string> = {};
        statusResults.forEach(result => {
          if (result) {
            statusMap[result.userId] = result.status || 'not-following';
          }
        });
        setFollowStatuses(statusMap);
      }
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleFollowToggle = async (targetUserId: string, currentStatus?: string) => {
    try {
      if (currentStatus === 'accepted') {
        await followers.unfollowUser(targetUserId);
        setFollowStatuses(prev => ({ ...prev, [targetUserId]: 'not-following' }));
      } else if (!currentStatus || currentStatus === 'not-following') {
        const result = await followers.followUser(targetUserId);
        setFollowStatuses(prev => ({ 
          ...prev, 
          [targetUserId]: result?.status || 'pending' 
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, type]);

  const renderItem = ({ item }: { item: Follower }) => {
    const targetUser = type === 'followers' ? item.follower : item.following;
    if (!targetUser) return null;

    const isCurrentUser = currentUser?.id === targetUser.id;
    const status = followStatuses[targetUser.id];
    const isFollowing = status === 'accepted';
    const isPending = status === 'pending';

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onUserPress?.(targetUser.id)}
        activeOpacity={onUserPress ? 0.7 : 1}
      >
        <View style={styles.userInfo}>
          <Avatar
            source={targetUser.avatar_url ? { uri: targetUser.avatar_url } : undefined}
            size={50}
            placeholder={targetUser.display_name || targetUser.username}
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>
              {targetUser.display_name || targetUser.username}
            </Text>
            <Text style={styles.handle}>@{targetUser.username}</Text>
            {targetUser.bio && (
              <Text style={styles.bio} numberOfLines={1}>
                {targetUser.bio}
              </Text>
            )}
          </View>
        </View>

        {!isCurrentUser && showActions && (
          <Button
            variant={isFollowing ? 'outline' : isPending ? 'secondary' : 'primary'}
            size="sm"
            onPress={() => handleFollowToggle(targetUser.id, status)}
            style={styles.followButton}
            compact
          >
            {isFollowing ? 'Following' : isPending ? 'Requested' : 'Follow'}
          </Button>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={currentTheme.brand.primary} />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
        </Text>
        <Text style={styles.emptyDescription}>
          {type === 'followers' 
            ? 'When people follow this account, they will appear here.'
            : 'When this account follows people, they will appear here.'
          }
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: currentTheme.text.primary,
  },
  handle: {
    fontSize: 14,
    color: currentTheme.text.secondary,
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: currentTheme.text.secondary,
    marginTop: 4,
  },
  followButton: {
    minWidth: 90,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: currentTheme.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: currentTheme.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});