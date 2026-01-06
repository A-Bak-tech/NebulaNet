// screens/post/CommentsScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

const CommentsScreen = ({ route, navigation }) => {
  const { postId, post } = route.params || {};
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentPost, setCurrentPost] = useState(post || null);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchUser();
    if (!currentPost && postId) {
      fetchPost();
    }
    fetchComments();
  }, [postId]);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users(id, username, name, avatar_url),
          likes:post_likes(count),
          comments:post_comments(count)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      setCurrentPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert('Error', 'Failed to load post');
    }
  };

  const fetchComments = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      }

      const start = reset ? 0 : page * 20;
      
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:users(id, username, name, avatar_url),
          likes:comment_likes(count),
          user_liked:comment_likes!inner(user_id)
        `)
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false })
        .range(start, start + 19);

      if (error) throw error;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const { data: replies } = await supabase
            .from('post_comments')
            .select(`
              *,
              author:users(id, username, name, avatar_url),
              likes:comment_likes(count),
              user_liked:comment_likes!inner(user_id)
            `)
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          return {
            ...comment,
            replies: replies || [],
            liked: comment.user_liked && comment.user_liked.length > 0,
          };
        })
      );

      if (reset) {
        setComments(commentsWithReplies);
      } else {
        setComments(prev => [...prev, ...commentsWithReplies]);
      }

      setHasMore(data.length === 20);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
          parent_comment_id: replyingTo || null,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          author:users(id, username, name, avatar_url),
          likes:comment_likes(count)
        `)
        .single();

      if (error) throw error;

      // Add to comments list
      if (replyingTo) {
        // Add as reply
        setComments(prev => prev.map(comment => {
          if (comment.id === replyingTo) {
            return {
              ...comment,
              replies: [...(comment.replies || []), { ...data, replies: [], liked: false }]
            };
          }
          return comment;
        }));
      } else {
        // Add as top-level comment
        setComments(prev => [{ ...data, replies: [], liked: false }, ...prev]);
      }

      // Update post comment count
      if (currentPost) {
        setCurrentPost(prev => ({
          ...prev,
          comments: [{ count: (prev.comments[0]?.count || 0) + 1 }]
        }));
      }

      setNewComment('');
      setReplyingTo(null);

      // Scroll to top for new comment
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId, isReply = false, parentId = null) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like comments');
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);

        // Update UI
        updateCommentLike(commentId, isReply, parentId, false);
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          });

        // Update UI
        updateCommentLike(commentId, isReply, parentId, true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const updateCommentLike = (commentId, isReply, parentId, liked) => {
    if (isReply && parentId) {
      setComments(prev => prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === commentId 
                ? { 
                    ...reply, 
                    likes: [{ count: (reply.likes[0]?.count || 0) + (liked ? 1 : -1) }],
                    liked 
                  }
                : reply
            )
          };
        }
        return comment;
      }));
    } else {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              likes: [{ count: (comment.likes[0]?.count || 0) + (liked ? 1 : -1) }],
              liked 
            }
          : comment
      ));
    }
  };

  const handleReply = (commentId, username) => {
    setReplyingTo(commentId);
    setNewComment(`@${username} `);
  };

  const renderComment = ({ item: comment, isReply = false, parentId = null }) => {
    const likeCount = comment.likes?.[0]?.count || 0;
    const replyCount = comment.replies?.length || 0;

    return (
      <View style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <View style={styles.commentHeader}>
          {comment.author?.avatar_url ? (
            <Image 
              source={{ uri: comment.author.avatar_url }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          
          <View style={styles.commentInfo}>
            <Text style={styles.username}>
              @{comment.author?.username || 'unknown'}
            </Text>
            <Text style={styles.timestamp}>
              {formatDate(comment.created_at)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.commentContent}>{comment.content}</Text>
        
        <View style={styles.commentActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLikeComment(comment.id, isReply, parentId)}
          >
            <Ionicons 
              name={comment.liked ? "heart" : "heart-outline"} 
              size={18} 
              color={comment.liked ? "#EF476F" : "#657786"} 
            />
            <Text style={[styles.actionText, comment.liked && styles.likedActionText]}>
              {likeCount}
            </Text>
          </TouchableOpacity>
          
          {!isReply && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleReply(comment.id, comment.author?.username)}
            >
              <Ionicons name="arrow-undo-outline" size={18} color="#657786" />
              <Text style={styles.actionText}>
                {replyCount > 0 ? `${replyCount} replies` : 'Reply'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && !isReply && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => (
              <View key={reply.id}>
                {renderComment({ item: reply, isReply: true, parentId: comment.id })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1DA1F2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.separator} />

      {currentPost && (
        <View style={styles.postContent}>
          <View style={styles.postHeaderInfo}>
            {currentPost.author?.avatar_url ? (
              <Image 
                source={{ uri: currentPost.author.avatar_url }} 
                style={styles.postAvatar}
              />
            ) : (
              <View style={styles.postAvatar}>
                <Text style={styles.postAvatarText}>
                  {currentPost.author?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.postAuthor}>
                @{currentPost.author?.username || 'unknown'}
              </Text>
              <Text style={styles.postDate}>
                {formatDate(currentPost.created_at)}
              </Text>
            </View>
          </View>
          <Text style={styles.postTitle}>{currentPost.title || 'Post'}</Text>
          <Text style={styles.postBody}>{currentPost.content}</Text>
        </View>
      )}

      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>
          {currentPost?.comments?.[0]?.count || 0} comments
        </Text>
      </View>
    </View>
  );

  if (loading && !comments.length) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DA1F2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={comments}
          renderItem={renderComment}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => hasMore && fetchComments(false)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading ? <ActivityIndicator style={styles.footerLoader} color="#1DA1F2" /> : null
          }
        />

        {/* Reply indicator */}
        {replyingTo && (
          <View style={styles.replyingIndicator}>
            <Text style={styles.replyingText}>
              Replying to @{
                comments.find(c => c.id === replyingTo)?.author?.username || 
                comments.flatMap(c => c.replies || []).find(r => r?.id === replyingTo)?.author?.username || 
                'user'
              }
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Ionicons name="close" size={20} color="#657786" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={user ? "Add comment..." : "Sign in to comment"}
            placeholderTextColor="#AAB8C2"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            editable={!!user}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              (!newComment.trim() || submitting || !user) && styles.sendButtonDisabled
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submitting || !user}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15202B',
  },
  placeholder: {
    width: 40,
  },
  separator: {
    height: 1,
    backgroundColor: '#E1E8ED',
    marginHorizontal: 16,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F9FA',
  },
  postHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1DA1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  postAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#15202B',
  },
  postDate: {
    fontSize: 13,
    color: '#657786',
    marginTop: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15202B',
    marginBottom: 8,
  },
  postBody: {
    fontSize: 15,
    color: '#15202B',
    lineHeight: 20,
  },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15202B',
  },
  listContent: {
    paddingBottom: 80,
  },
  commentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F9FA',
  },
  replyContainer: {
    paddingLeft: 48,
    borderLeftWidth: 2,
    borderLeftColor: '#E1E8ED',
    marginLeft: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#657786',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15202B',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#AAB8C2',
  },
  commentContent: {
    fontSize: 15,
    color: '#15202B',
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#657786',
    marginLeft: 6,
  },
  likedActionText: {
    color: '#EF476F',
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 12,
  },
  replyingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  replyingText: {
    fontSize: 14,
    color: '#657786',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F7F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#15202B',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1DA1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#AAB8C2',
  },
  footerLoader: {
    paddingVertical: 20,
  },
});

export default CommentsScreen;