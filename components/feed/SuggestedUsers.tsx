import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Users } from 'lucide-react-native';

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  isFollowing: boolean;
  mutualFollowers: number;
}

interface SuggestedUsersProps {
  users: SuggestedUser[];
  onFollow?: (userId: string) => void;
  onUserPress?: (userId: string) => void;
}

export const SuggestedUsers: React.FC<SuggestedUsersProps> = ({
  users,
  onFollow,
  onUserPress,
}) => {
  if (users.length === 0) return null;

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <View className="flex-row items-center mb-4">
        <Users size={20} color="#6b7280" />
        <Text className="font-semibold text-gray-900 dark:text-white ml-2">
          Suggested Users
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-4">
          {users.map((user) => (
            <View
              key={user.id}
              className="w-48 bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            >
              <View className="items-center mb-3">
                <Avatar
                  source={user.avatar}
                  name={user.name}
                  size="lg"
                  className="mb-2"
                />
                <TouchableOpacity onPress={() => onUserPress?.(user.id)}>
                  <Text className="font-semibold text-gray-900 dark:text-white text-center">
                    {user.name}
                  </Text>
                </TouchableOpacity>
                <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  @{user.username}
                </Text>
              </View>

              {user.bio && (
                <Text 
                  className="text-gray-600 dark:text-gray-300 text-xs text-center mb-3"
                  numberOfLines={2}
                >
                  {user.bio}
                </Text>
              )}

              {user.mutualFollowers > 0 && (
                <Text className="text-gray-500 dark:text-gray-400 text-xs text-center mb-3">
                  {user.mutualFollowers} mutual followers
                </Text>
              )}

              <Button
                title={user.isFollowing ? "Following" : "Follow"}
                variant={user.isFollowing ? "outline" : "primary"}
                size="sm"
                onPress={() => onFollow?.(user.id)}
                className="w-full"
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};