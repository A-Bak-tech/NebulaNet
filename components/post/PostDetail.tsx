// File: /components/post/PostDetail.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PostDetail as PostDetailType, Media } from '../../types/app';
import { 
  HeartIcon, 
  HeartFilledIcon, 
  EchoIcon, 
  EchoFilledIcon,
  CommentIcon,
  ShareIcon,
  BookmarkIcon,
  BookmarkFilledIcon,
  MoreIcon,
  PlayIcon,
  ImageIcon,
  LinkIcon,
} from '../../assets/icons';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { currentTheme } from '../../constants/Colors';
import { formatDistanceToNow } from '../../utils/date';
import { SIZES } from '../../constants/Layout';

interface PostDetailProps {
  post: PostDetailType;
  onLike: () => Promise<void>;
  onEcho: () => Promise<void>;
  onBookmark: () => Promise<void>;
  onShare: () => void;
  onComment: () => void;
  onUserPress: () => void;
  onMorePress?: () => void;
  compact?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const PostDetail: React.FC<PostDetailProps> = ({
  post,
  onLike,
  onEcho,
  onBookmark,
  onShare,
  onComment,
  onUserPress,
  onMorePress,
  compact = false,
}) => {
  const router = useRouter();
  const [isLiking, setIsLiking] = useState(false);
  const [isEchoing, setIsEchoing] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  
  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleEcho = async () => {
    if (isEchoing) return;
    setIsEchoing(true);
    try {
      await onEcho();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to echo post');
    } finally {
      setIsEchoing(false);
    }
  };
  
  const handleBookmark = async () => {
    if (isBookmarking) return;
    setIsBookmarking(true);
    try {
      await onBookmark();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to bookmark post');
    } finally {
      setIsBookmarking(false);
    }
  };
  
  const handleTagPress = (tag: string) => {
    router.push(`/search?q=${encodeURIComponent(tag)}`);
  };
  
  const handleLinkPress = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', `Cannot open URL: ${url}`);
    }
  };
  
  const extractLinks = (text: string): Array<{ url: string, index: number }> => {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const links = [];
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      links.push({ url: match[0], index: match.index });
    }
    return links;
  };
  
  const renderContentWithLinks = (content: string) => {
    const links = extractLinks(content);
    if (links.length === 0) {
      return <Text className="text-text-primary text-base leading-6">{content}</Text>;
    }
    
    const parts = [];
    let lastIndex = 0;
    
    links.forEach((link, i) => {
      // Add text before link
      if (link.index > lastIndex) {
        parts.push(
          <Text key={`text-${i}`} className="text-text-primary text-base leading-6">
            {content.substring(lastIndex, link.index)}
          </Text>
        );
      }
      
      // Add link
      parts.push(
        <TouchableOpacity
          key={`link-${i}`}
          onPress={() => handleLinkPress(link.url)}
          className="inline"
        >
          <Text className="text-brand-primary text-base leading-6">
            {link.url}
          </Text>
        </TouchableOpacity>
      );
      
      lastIndex = link.index + link.url.length;
    });
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <Text key="text-end" className="text-text-primary text-base leading-6">
          {content.substring(lastIndex)}
        </Text>
      );
    }
    
    return <Text className="text-text-primary text-base leading-6">{parts}</Text>;
  };
  
  const renderMedia = (media: Media[]) => {
    if (!media || media.length === 0) return null;
    
    const isSingleImage = media.length === 1 && media[0].type === 'image';
    const isSingleVideo = media.length === 1 && media[0].type === 'video';
    
    if (isSingleImage && !compact) {
      return (
        <View className="mt-3 rounded-xl overflow-hidden">
          <Image
            source={{ uri: media[0].url }}
            style={{
              width: '100%',
              height: 300,
            }}
            resizeMode="cover"
          />
        </View>
      );
    }
    
    if (isSingleVideo && !compact) {
      return (
        <View className="mt-3 rounded-xl overflow-hidden bg-black">
          <View className="relative">
            <Image
              source={{ uri: media[0].thumbnail_url || media[0].url }}
              style={{
                width: '100%',
                height: 300,
              }}
              resizeMode="cover"
            />
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
                <PlayIcon size={32} color="#FFFFFF" />
              </View>
            </View>
            {media[0].duration && (
              <View className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded">
                <Text className="text-white text-xs">
                  {Math.floor(media[0].duration / 60)}:{(media[0].duration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }
    
    // Grid layout for multiple media
    if (media.length > 1 && !compact) {
      const gridSize = media.length === 2 ? 2 : 3;
      const itemSize = screenWidth / gridSize - 16;
      
      return (
        <View className="mt-3">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="py-2"
          >
            {media.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                className="mr-2 rounded-lg overflow-hidden"
                onPress={() => {
                  // Navigate to media viewer
                  router.push(`/media/${post.id}?index=${index}`);
                }}
              >
                <View 
                  className="relative bg-gray-200"
                  style={{ width: itemSize, height: itemSize }}
                >
                  {item.type === 'image' ? (
                    <Image
                      source={{ uri: item.url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <Image
                        source={{ uri: item.thumbnail_url || item.url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <View className="absolute inset-0 items-center justify-center">
                        <View className="w-10 h-10 rounded-full bg-black/50 items-center justify-center">
                          <PlayIcon size={24} color="#FFFFFF" />
                        </View>
                      </View>
                    </>
                  )}
                  {media.length > 1 && (
                    <View className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded">
                      <Text className="text-white text-xs">
                        {index + 1}/{media.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }
    
    return null;
  };
  
  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return null;
    
    return (
      <View className="flex-row flex-wrap mt-2 gap-2">
        {tags.map((tag, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleTagPress(tag)}
            className="px-3 py-1 bg-surface rounded-full"
          >
            <Text className="text-brand-primary text-sm">#{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  return (
    <View className={`${compact ? 'px-0' : 'px-4'} py-3`}>
      {/* User Header */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity
          className="flex-row items-center flex-1"
          onPress={onUserPress}
          activeOpacity={0.7}
        >
          <Avatar
            source={post.user.avatar_url ? { uri: post.user.avatar_url } : undefined}
            size={compact ? 40 : 48}
            placeholder={post.user.display_name || post.user.username}
            isVerified={post.user.is_verified}
          />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="text-text-primary font-semibold text-base">
                {post.user.display_name || post.user.username}
              </Text>
              {post.user.is_verified && (
                <Text className="text-brand-primary ml-1 text-sm">✓</Text>
              )}
            </View>
            <Text className="text-text-secondary text-sm">
              @{post.user.username} · {formatDistanceToNow(new Date(post.created_at))}
            </Text>
          </View>
        </TouchableOpacity>
        
        {onMorePress && (
          <TouchableOpacity onPress={onMorePress}>
            <MoreIcon size={SIZES.ICON.MD} color={currentTheme.icon.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Post Content */}
      <View className="mb-3">
        {renderContentWithLinks(post.content)}
        
        {/* Enhanced content badge */}
        {post.is_enhanced && (
          <View className="flex-row items-center mt-2">
            <View className="px-2 py-1 bg-brand-primary/10 rounded-full">
              <Text className="text-brand-primary text-xs font-medium">
                ✨ Enhanced with Nebula AI
              </Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Media */}
      {renderMedia(post.media || [])}
      
      {/* Tags */}
      {renderTags(post.tags || [])}
      
      {/* Stats */}
      <View className={`flex-row items-center justify-between mt-3 ${compact ? 'px-0' : ''}`}>
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity className="flex-row items-center">
            <HeartFilledIcon size={16} color={currentTheme.icon.secondary} />
            <Text className="text-text-secondary text-sm ml-1">
              {post.likes_count?.toLocaleString() || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center">
            <EchoIcon size={16} color={currentTheme.icon.secondary} />
            <Text className="text-text-secondary text-sm ml-1">
              {post.echoes_count?.toLocaleString() || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center">
            <CommentIcon size={16} color={currentTheme.icon.secondary} />
            <Text className="text-text-secondary text-sm ml-1">
              {post.comments_count?.toLocaleString() || 0}
            </Text>
          </TouchableOpacity>
        </View>
        
        {!compact && (
          <Text className="text-text-tertiary text-sm">
            {new Date(post.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        )}
      </View>
      
      {/* Action Buttons */}
      <View className={`flex-row items-center justify-between mt-3 ${compact ? 'px-0' : ''}`}>
        <TouchableOpacity
          className="flex-row items-center"
          onPress={handleLike}
          disabled={isLiking}
        >
          {post.is_liked ? (
            <HeartFilledIcon size={24} color="#FF3B30" />
          ) : (
            <HeartIcon size={24} color={currentTheme.icon.primary} />
          )}
          {!compact && (
            <Text className={`ml-2 ${post.is_liked ? 'text-[#FF3B30]' : 'text-text-secondary'}`}>
              Like
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-row items-center"
          onPress={onComment}
        >
          <CommentIcon size={24} color={currentTheme.icon.primary} />
          {!compact && (
            <Text className="ml-2 text-text-secondary">Comment</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-row items-center"
          onPress={handleEcho}
          disabled={isEchoing || !post.can_echo}
        >
          {post.is_echoed ? (
            <EchoFilledIcon size={24} color="#4CD964" />
          ) : (
            <EchoIcon size={24} color={post.can_echo ? currentTheme.icon.primary : currentTheme.icon.disabled} />
          )}
          {!compact && (
            <Text className={`ml-2 ${post.is_echoed ? 'text-[#4CD964]' : post.can_echo ? 'text-text-secondary' : 'text-text-disabled'}`}>
              Echo
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-row items-center"
          onPress={handleBookmark}
          disabled={isBookmarking}
        >
          {post.is_bookmarked ? (
            <BookmarkFilledIcon size={24} color="#FF9500" />
          ) : (
            <BookmarkIcon size={24} color={currentTheme.icon.primary} />
          )}
          {!compact && (
            <Text className={`ml-2 ${post.is_bookmarked ? 'text-[#FF9500]' : 'text-text-secondary'}`}>
              Save
            </Text>
          )}
        </TouchableOpacity>
        
        {!compact && (
          <TouchableOpacity
            className="flex-row items-center"
            onPress={onShare}
          >
            <ShareIcon size={24} color={currentTheme.icon.primary} />
            <Text className="ml-2 text-text-secondary">Share</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Post visibility badge */}
      {post.visibility !== 'public' && (
        <View className="flex-row items-center mt-3">
          <View className="px-3 py-1 bg-surface rounded-full">
            <Text className="text-text-secondary text-sm">
              {post.visibility === 'private' ? '🔒 Private' : 
               post.visibility === 'followers' ? '👥 Followers only' : 
               '🌍 Public'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default PostDetail;