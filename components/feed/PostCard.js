// components/feed/PostCard.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/constants';

const PostCard = ({ 
  post, 
  onLikePress, 
  onCommentPress, 
  onSharePress, 
  onProfilePress 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const handleShare = async () => {
    try {
      const shareUrl = `https://nebulanet.space/post/${post.id}`;
      await Share.share({
        message: `Check out this post on NebulaNet: ${post.content?.substring(0, 100)}... ${shareUrl}`,
        url: shareUrl,
        title: 'NebulaNet Post',
      });
      
      if (onSharePress) onSharePress();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const likeCount = post.likes?.[0]?.count || 0;
  const commentCount = post.comments?.[0]?.count || 0;
  const isLiked = post.user_liked && post.user_liked.length > 0;
  const hasMedia = post.media_urls && post.media_urls.length > 0;

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <TouchableOpacity 
        style={styles.header}
        onPress={onProfilePress}
        activeOpacity={0.7}
      >
        {post.author?.avatar_url ? (
          <Image 
            source={{ uri: post.author.avatar_url }} 
            style={styles.avatar}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {post.author?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {post.author?.username || 'Unknown'}
          </Text>
          <Text style={styles.timestamp}>
            {formatDate(post.created_at)}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Post Content */}
      <View style={styles.content}>
        <Text style={styles.postText}>{post.content}</Text>
        
        {/* Media */}
        {hasMedia && !imageError && (
          <View style={styles.mediaContainer}>
            <Image 
              source={{ uri: post.media_urls[0] }} 
              style={styles.mediaImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statText}>
          {likeCount} likes · {commentCount} comments
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onLikePress}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={22} 
            color={isLiked ? COLORS.error : COLORS.text.secondary} 
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onCommentPress}
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.text.secondary} />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Ionicons name="arrow-redo-outline" size={22} color={COLORS.text.secondary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  moreButton: {
    padding: 4,
  },
  content: {
    marginBottom: 12,
  },
  postText: {
    fontSize: 15,
    color: COLORS.text.primary,
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  mediaImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  stats: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  statText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  likedText: {
    color: COLORS.error,
    fontWeight: '600',
  },
});

export default PostCard;