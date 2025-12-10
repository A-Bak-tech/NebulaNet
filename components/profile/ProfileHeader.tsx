// File: /components/profile/ProfileHeader.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User } from '../../types/app';
import { 
  EditIcon, 
  CalendarIcon, 
  LinkIcon, 
  LocationIcon,
  MessageIcon,
  CheckIcon 
} from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';
import { SIZES } from '../../constants/Layout';
import { followers } from '../../lib/followers';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
  onFollow?: () => Promise<void>;
  onUnfollow?: () => Promise<void>;
  isFollowing?: boolean;
  onMessage?: () => void;
  mutualFollowers?: User[];
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isOwnProfile,
  onEditProfile,
  onFollow,
  onUnfollow,
  isFollowing = false,
  onMessage,
  mutualFollowers = [],
}) => {
  const router = useRouter();
  const [followStatus, setFollowStatus] = useState<'following' | 'pending' | 'not-following'>(
    isFollowing ? 'following' : 'not-following'
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOwnProfile) {
      checkFollowStatus();
    }
  }, [user.id, isOwnProfile]);

  const checkFollowStatus = async () => {
    try {
      const status = await followers.checkFollowing(user.id);
      setFollowStatus(
        status === 'accepted' ? 'following' :
        status === 'pending' ? 'pending' : 'not-following'
      );
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (followStatus === 'following' || followStatus === 'pending') {
        await followers.unfollowUser(user.id);
        setFollowStatus('not-following');
        onUnfollow?.();
      } else {
        const result = await followers.followUser(user.id);
        setFollowStatus(result?.status === 'pending' ? 'pending' : 'following');
        onFollow?.();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = () => {
    if (user.is_private && followStatus !== 'following') {
      Alert.alert(
        'Private Account',
        'You need to follow this user to send messages.'
      );
      return;
    }
    onMessage?.();
  };

  const handleWebsitePress = () => {
    if (!user.website) return;
    
    const url = user.website.startsWith('http') 
      ? user.website 
      : `https://${user.website}`;
    
    // Use Linking.openURL in production
    Alert.alert('Open Website', `Would you like to open ${url}?`);
  };

  const getFollowButtonText = () => {
    switch (followStatus) {
      case 'following': return 'Following';
      case 'pending': return 'Requested';
      default: return 'Follow';
    }
  };

  const getFollowButtonVariant = () => {
    switch (followStatus) {
      case 'following': return 'outline';
      case 'pending': return 'secondary';
      default: return 'primary';
    }
  };

  return (
    <View className="relative">
      {/* Profile Banner */}
      <View className="h-48 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent relative">
        {isOwnProfile && (
          <TouchableOpacity
            className="absolute top-4 right-4 p-2 bg-black/40 rounded-full"
            onPress={onEditProfile}
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }}
          >
            <EditIcon size={SIZES.ICON.MD} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Profile Info */}
      <View className="px-4 -mt-16">
        <View className="flex-row justify-between items-end">
          {/* Avatar */}
          <View className="relative">
            <View className="w-32 h-32 rounded-full border-4 border-background bg-surface overflow-hidden">
              <Avatar
                source={user.avatar_url ? { uri: user.avatar_url } : undefined}
                size={120}
                placeholder={user.display_name?.[0] || user.username?.[0] || 'U'}
                className="w-full h-full"
              />
            </View>
            
            {/* Mutual followers indicator */}
            {mutualFollowers.length > 0 && !isOwnProfile && (
              <View className="absolute -bottom-2 -right-2 flex-row">
                {mutualFollowers.slice(0, 2).map((mutual, index) => (
                  <View 
                    key={mutual.id}
                    className={`w-8 h-8 rounded-full border-2 border-background overflow-hidden ${
                      index === 1 ? '-ml-3' : ''
                    }`}
                    style={{ zIndex: 2 - index }}
                  >
                    <Avatar
                      source={mutual.avatar_url ? { uri: mutual.avatar_url } : undefined}
                      size={32}
                      placeholder={mutual.display_name?.[0] || mutual.username?.[0]}
                    />
                  </View>
                ))}
                {mutualFollowers.length > 2 && (
                  <View className="w-8 h-8 rounded-full border-2 border-background bg-brand-primary items-center justify-center -ml-3">
                    <Text className="text-white text-xs font-bold">
                      +{mutualFollowers.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          
          {/* Action Buttons */}
          <View className="flex-row space-x-2 pb-2">
            {!isOwnProfile ? (
              <>
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-border"
                  onPress={handleMessage}
                >
                  <MessageIcon size={20} color={currentTheme.icon.primary} />
                </TouchableOpacity>
                
                <Button
                  variant={getFollowButtonVariant()}
                  size="sm"
                  onPress={handleFollowToggle}
                  loading={isLoading}
                  disabled={isLoading}
                  className="min-w-[100]"
                  leftIcon={followStatus === 'following' ? <CheckIcon size={16} /> : undefined}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={currentTheme.brand.primary} />
                  ) : (
                    getFollowButtonText()
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onPress={onEditProfile}
                className="min-w-[100]"
                leftIcon={<EditIcon size={16} color={currentTheme.icon.primary} />}
              >
                Edit Profile
              </Button>
            )}
          </View>
        </View>
        
        {/* User Info */}
        <View className="mt-4">
          <View className="flex-row items-center">
            <Text className="text-text-primary text-2xl font-bold">
              {user.display_name || user.username}
            </Text>
            {user.is_verified && (
              <View className="ml-2 w-5 h-5 rounded-full bg-brand-primary items-center justify-center">
                <Text className="text-white text-xs font-bold">✓</Text>
              </View>
            )}
          </View>
          
          <Text className="text-text-secondary mt-1">
            @{user.username}
          </Text>
          
          {/* Mutual followers text */}
          {mutualFollowers.length > 0 && !isOwnProfile && (
            <View className="mt-2">
              <Text className="text-text-secondary text-sm">
                Followed by {mutualFollowers.slice(0, 2).map(m => m.display_name || m.username).join(', ')}
                {mutualFollowers.length > 2 ? ` and ${mutualFollowers.length - 2} others` : ''}
              </Text>
            </View>
          )}
          
          {/* Bio */}
          {user.bio && (
            <Text className="text-text-primary mt-3 text-base leading-5">
              {user.bio}
            </Text>
          )}
          
          {/* Additional Info */}
          <View className="flex-row flex-wrap mt-3 gap-4">
            {user.location && (
              <View className="flex-row items-center">
                <LocationIcon size={SIZES.ICON.SM} color={currentTheme.text.secondary} />
                <Text className="text-text-secondary text-sm ml-1">
                  {user.location}
                </Text>
              </View>
            )}
            
            {user.website && (
              <TouchableOpacity 
                className="flex-row items-center"
                onPress={handleWebsitePress}
                activeOpacity={0.7}
              >
                <LinkIcon size={SIZES.ICON.SM} color={currentTheme.text.secondary} />
                <Text className="text-brand-primary text-sm ml-1 max-w-[150]" numberOfLines={1}>
                  {user.website.replace(/^https?:\/\//, '')}
                </Text>
              </TouchableOpacity>
            )}
            
            <View className="flex-row items-center">
              <CalendarIcon size={SIZES.ICON.SM} color={currentTheme.text.secondary} />
              <Text className="text-text-secondary text-sm ml-1">
                Joined {new Date(user.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          </View>
          
          {/* Private account badge */}
          {user.is_private && (
            <View className="mt-2 flex-row items-center bg-surface-light px-3 py-1 rounded-full self-start">
              <Text className="text-text-secondary text-xs">
                🔒 Private Account
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default ProfileHeader;