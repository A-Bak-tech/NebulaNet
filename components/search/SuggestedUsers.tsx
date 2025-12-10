// File: /components/search/SuggestedUsers.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User } from '../../types/app';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { currentTheme } from '../../constants/Colors';
import { followers } from '../../lib/followers';

interface SuggestedUsersProps {
  users: User[];
  title?: string;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  maxItems?: number;
  showMutualCount?: boolean;
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({
  users,
  title = 'Suggested for you',
  onFollow,
  onUnfollow,
  maxItems = 10,
  showMutualCount = true,
}) => {
  const router = useRouter();

  if (users.length === 0) {
    return null;
  }

  const displayedUsers = users.slice(0, maxItems);

  const handleUserPress = (userId: string) => {
    router.push(`/profile?id=${userId}`);
  };

  const handleFollowToggle = async (user: User) => {
    try {
      if (user.is_following) {
        await followers.unfollowUser(user.id);
        onUnfollow?.(user.id);
      } else {
        await followers.followUser(user.id);
        onFollow?.(user.id);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
    }
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-text-primary font-semibold text-lg">
          {title}
        </Text>
        <TouchableOpacity>
          <Text className="text-brand-primary text-sm">See all</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {displayedUsers.map((user) => (
          <View
            key={user.id}
            className="mr-4 bg-surface rounded-xl p-4 border border-border min-w-[160]"
          >
            <TouchableOpacity
              className="items-center"
              onPress={() => handleUserPress(user.id)}
              activeOpacity={0.7}
            >
              <Avatar
                source={user.avatar_url ? { uri: user.avatar_url } : undefined}
                size={64}
                placeholder={user.display_name?.[0] || user.username?.[0]}
                isVerified={user.is_verified}
              />
              
              <View className="items-center mt-3">
                <Text 
                  className="text-text-primary font-semibold text-center"
                  numberOfLines={1}
                >
                  {user.display_name || user.username}
                </Text>
                <Text className="text-text-secondary text-sm mt-1">
                  @{user.username}
                </Text>
                
                {showMutualCount && user.mutual_followers_count > 0 && (
                  <Text className="text-text-tertiary text-xs mt-1">
                    {user.mutual_followers_count} mutual follower
                    {user.mutual_followers_count !== 1 ? 's' : ''}
                  </Text>
                )}
                
                {user.bio && (
                  <Text 
                    className="text-text-secondary text-xs text-center mt-2"
                    numberOfLines={2}
                  >
                    {user.bio}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            
            <View className="mt-3">
              <Button
                variant={user.is_following ? 'outline' : 'primary'}
                size="sm"
                fullWidth
                onPress={() => handleFollowToggle(user)}
              >
                {user.is_following ? 'Following' : 'Follow'}
              </Button>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default SuggestedUsers;