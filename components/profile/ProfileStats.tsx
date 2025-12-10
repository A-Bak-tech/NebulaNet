// File: /components/profile/ProfileStats.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FollowersList } from './FollowersList';
import { User } from '../../types/app';
import { currentTheme } from '../../constants/Colors';

interface ProfileStatsProps {
  userId: string;
  followingCount: number;
  followersCount: number;
  postsCount: number;
  echoesCount?: number;
  likesCount?: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  userId,
  followingCount = 0,
  followersCount = 0,
  postsCount = 0,
  echoesCount = 0,
  likesCount = 0,
  onPressFollowers,
  onPressFollowing,
}) => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following'>('followers');

  const handleFollowersPress = () => {
    if (onPressFollowers) {
      onPressFollowers();
    } else {
      setModalType('followers');
      setModalVisible(true);
    }
  };

  const handleFollowingPress = () => {
    if (onPressFollowing) {
      onPressFollowing();
    } else {
      setModalType('following');
      setModalVisible(true);
    }
  };

  const handleUserPress = (targetUserId: string) => {
    setModalVisible(false);
    router.push(`/profile?id=${targetUserId}`);
  };

  const stats = [
    {
      label: 'Posts',
      value: postsCount,
      onPress: () => {},
      interactive: false,
    },
    {
      label: 'Echoes',
      value: echoesCount,
      onPress: () => {},
      interactive: false,
    },
    {
      label: 'Likes',
      value: likesCount,
      onPress: () => {},
      interactive: false,
    },
    {
      label: 'Followers',
      value: followersCount,
      onPress: handleFollowersPress,
      interactive: true,
    },
    {
      label: 'Following',
      value: followingCount,
      onPress: handleFollowingPress,
      interactive: true,
    },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <>
      <View className="flex-row justify-around py-6 border-y border-border mt-4">
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.label}
            className="items-center"
            onPress={stat.onPress}
            disabled={!stat.interactive}
            activeOpacity={stat.interactive ? 0.7 : 1}
          >
            <Text className="text-2xl font-bold text-text-primary">
              {formatNumber(stat.value)}
            </Text>
            <Text className={`text-sm mt-1 ${
              stat.interactive 
                ? 'text-brand-primary font-medium' 
                : 'text-text-secondary'
            }`}>
              {stat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Followers/Following Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.background.primary }]}>
          {/* Modal Header */}
          <View className="px-4 py-3 border-b border-border">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-xl font-semibold text-text-primary">
                  {modalType === 'followers' ? 'Followers' : 'Following'}
                </Text>
                <Text className="text-text-secondary text-sm ml-2">
                  ({modalType === 'followers' ? followersCount : followingCount})
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full bg-surface items-center justify-center"
              >
                <Text className="text-text-primary text-lg">×</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Modal Content */}
          <ScrollView className="flex-1">
            <FollowersList
              userId={userId}
              type={modalType}
              onUserPress={handleUserPress}
            />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
});

export default ProfileStats;