// components/post/PostActions.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { CommentIcon, EchoIcon, LikeIcon, ShareIcon } from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';
import { SIZES, SPACING } from '../../constants/Layout';

interface PostActionsProps {
  postId: string;
  likesCount: number;
  echoesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isEchoed: boolean;
  onLikePress: () => void;
  onEchoPress: () => void;
  onCommentPress: () => void;
  onSharePress: () => void;
  compact?: boolean;
}

const PostActions: React.FC<PostActionsProps> = ({
  postId,
  likesCount,
  echoesCount,
  commentsCount,
  isLiked,
  isEchoed,
  onLikePress,
  onEchoPress,
  onCommentPress,
  onSharePress,
  compact = false,
}) => {
  const ActionButton = ({
    icon: Icon,
    count,
    isActive,
    onPress,
    activeColor = currentTheme.brand.primary,
  }: {
    icon: React.ComponentType<any>;
    count: number;
    isActive: boolean;
    onPress: () => void;
    activeColor?: string;
  }) => (
    <TouchableOpacity
      className="flex-row items-center"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon
        size={compact ? SIZES.ICON.SM : SIZES.ICON.MD}
        color={isActive ? activeColor : currentTheme.icon.secondary}
        filled={isActive}
      />
      {count > 0 && !compact && (
        <Text
          className={`ml-2 ${
            isActive ? 'text-brand-primary' : 'text-text-secondary'
          }`}
          style={{ fontSize: SIZES.BODY_SMALL }}
        >
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (compact) {
    return (
      <View className="flex-row justify-between max-w-[90%]">
        <ActionButton
          icon={CommentIcon}
          count={commentsCount}
          isActive={false}
          onPress={onCommentPress}
        />
        <ActionButton
          icon={EchoIcon}
          count={echoesCount}
          isActive={isEchoed}
          onPress={onEchoPress}
          activeColor={currentTheme.brand.secondary}
        />
        <ActionButton
          icon={LikeIcon}
          count={likesCount}
          isActive={isLiked}
          onPress={onLikePress}
          activeColor={currentTheme.status.error}
        />
        <ActionButton
          icon={ShareIcon}
          count={0}
          isActive={false}
          onPress={onSharePress}
        />
      </View>
    );
  }

  return (
    <View className="flex-row justify-between mt-4 max-w-[90%]">
      <ActionButton
        icon={CommentIcon}
        count={commentsCount}
        isActive={false}
        onPress={onCommentPress}
      />
      <ActionButton
        icon={EchoIcon}
        count={echoesCount}
        isActive={isEchoed}
        onPress={onEchoPress}
        activeColor={currentTheme.brand.secondary}
      />
      <ActionButton
        icon={LikeIcon}
        count={likesCount}
        isActive={isLiked}
        onPress={onLikePress}
        activeColor={currentTheme.status.error}
      />
      <ActionButton
        icon={ShareIcon}
        count={0}
        isActive={false}
        onPress={onSharePress}
      />
    </View>
  );
};

export default PostActions;