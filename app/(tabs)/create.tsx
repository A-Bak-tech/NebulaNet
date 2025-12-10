import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenWrapper, Header } from '../../components/layout';
import { useAuth } from '../../hooks/useAuth';
import { usePosts } from '../../hooks/usePosts';
import { 
  ImageIcon, 
  VideoIcon, 
  SmileIcon, 
  GlobeIcon,
  LockIcon,
  UsersIcon,
  CheckCircleIcon,
  CloseIcon,
} from '../../assets/icons';
import { currentTheme } from '../../constants/Colors';
import { SPACING, SIZES } from '../../constants/Layout';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  name?: string;
  size?: number;
}

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { createPost } = usePosts();
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'friends'>('public');
  const [useNebula, setUseNebula] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showVisibilityOptions, setShowVisibilityOptions] = useState(false);
  
  const textInputRef = useRef<TextInput>(null);
  const MAX_CHARS = 280;
  const MAX_MEDIA = 4;
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  
  const handleContentChange = (text: string) => {
    setContent(text);
    setCharCount(text.length);
  };
  
  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }
    
    if (charCount > MAX_CHARS) {
      Alert.alert('Error', `Post must be less than ${MAX_CHARS} characters`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare media URLs (in production, upload to storage first)
      const mediaUrls = selectedMedia.map(media => media.uri);
      
      const result = await createPost({
        content,
        media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
        visibility,
        use_nebula: useNebula,
      });
      
      if (result.success) {
        Alert.alert('Success', 'Post created successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Reset form
              setContent('');
              setSelectedMedia([]);
              setCharCount(0);
              setUseNebula(false);
              router.back();
            }
          }
        ]);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Request permissions for media picking
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need media library permissions to upload photos and videos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };
  
  // Pick images from gallery
  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: true,
        selectionLimit: MAX_MEDIA - selectedMedia.length,
      });
      
      if (!result.canceled) {
        const newImages: MediaItem[] = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image',
          name: asset.fileName,
          size: asset.fileSize,
        }));
        
        // Check size limits
        const oversized = newImages.filter(img => img.size && img.size > MAX_IMAGE_SIZE);
        if (oversized.length > 0) {
          Alert.alert(
            'File Too Large',
            `Images must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`
          );
          return;
        }
        
        setSelectedMedia(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };
  
  // Pick videos from gallery
  const pickVideos = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false, // Usually one video per post
        quality: 1,
        allowsEditing: true,
        videoMaxDuration: 60, // 60 seconds max
      });
      
      if (!result.canceled && result.assets.length > 0) {
        const video = result.assets[0];
        const videoItem: MediaItem = {
          uri: video.uri,
          type: 'video',
          name: video.fileName,
          size: video.fileSize,
        };
        
        // Check size limit
        if (videoItem.size && videoItem.size > MAX_VIDEO_SIZE) {
          Alert.alert(
            'File Too Large',
            `Videos must be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`
          );
          return;
        }
        
        // Remove existing media if adding video (usually one video per post)
        setSelectedMedia([videoItem]);
        setShowMediaPicker(false);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };
  
  // Capture photo from camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take photos.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });
      
      if (!result.canceled && result.assets.length > 0) {
        const photo = result.assets[0];
        const newImage: MediaItem = {
          uri: photo.uri,
          type: 'image',
          name: 'camera_photo.jpg',
          size: photo.fileSize,
        };
        
        setSelectedMedia(prev => [...prev, newImage]);
        setShowMediaPicker(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };
  
  // Capture video from camera
  const takeVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to record videos.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        allowsEditing: true,
        videoMaxDuration: 60,
      });
      
      if (!result.canceled && result.assets.length > 0) {
        const video = result.assets[0];
        const videoItem: MediaItem = {
          uri: video.uri,
          type: 'video',
          name: 'camera_video.mp4',
          size: video.fileSize,
        };
        
        // Remove existing media if adding video
        setSelectedMedia([videoItem]);
        setShowMediaPicker(false);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
    }
  };
  
  const handleRemoveMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };
  
  const getVisibilityLabel = () => {
    switch (visibility) {
      case 'public': return 'Everyone';
      case 'private': return 'Only me';
      case 'friends': return 'Friends only';
      default: return 'Everyone';
    }
  };
  
  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public': return <GlobeIcon size={SIZES.ICON.SM} color={currentTheme.text.secondary} />;
      case 'private': return <LockIcon size={SIZES.ICON.SM} color={currentTheme.text.secondary} />;
      case 'friends': return <UsersIcon size={SIZES.ICON.SM} color={currentTheme.text.secondary} />;
      default: return <GlobeIcon size={SIZES.ICON.SM} color={currentTheme.text.secondary} />;
    }
  };
  
  const MediaPickerModal = () => (
    <Modal
      visible={showMediaPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMediaPicker(false)}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-surface rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-text-primary text-xl font-bold">
              Add Media
            </Text>
            <TouchableOpacity onPress={() => setShowMediaPicker(false)}>
              <CloseIcon size={SIZES.ICON.MD} color={currentTheme.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View className="space-y-4">
            <TouchableOpacity 
              className="flex-row items-center p-4 bg-surface-light rounded-xl"
              onPress={pickImages}
            >
              <View className="w-12 h-12 rounded-lg bg-brand-primary/20 items-center justify-center mr-4">
                <ImageIcon size={SIZES.ICON.LG} color={currentTheme.brand.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary text-lg font-semibold">
                  Choose from Gallery
                </Text>
                <Text className="text-text-secondary text-sm">
                  Select photos from your device
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center p-4 bg-surface-light rounded-xl"
              onPress={takePhoto}
            >
              <View className="w-12 h-12 rounded-lg bg-brand-secondary/20 items-center justify-center mr-4">
                <ImageIcon size={SIZES.ICON.LG} color={currentTheme.brand.secondary} />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary text-lg font-semibold">
                  Take Photo
                </Text>
                <Text className="text-text-secondary text-sm">
                  Use your camera to take a new photo
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center p-4 bg-surface-light rounded-xl"
              onPress={pickVideos}
            >
              <View className="w-12 h-12 rounded-lg bg-status-success/20 items-center justify-center mr-4">
                <VideoIcon size={SIZES.ICON.LG} color={currentTheme.status.success} />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary text-lg font-semibold">
                  Choose Video
                </Text>
                <Text className="text-text-secondary text-sm">
                  Select a video from your gallery
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center p-4 bg-surface-light rounded-xl"
              onPress={takeVideo}
            >
              <View className="w-12 h-12 rounded-lg bg-status-warning/20 items-center justify-center mr-4">
                <VideoIcon size={SIZES.ICON.LG} color={currentTheme.status.warning} />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary text-lg font-semibold">
                  Record Video
                </Text>
                <Text className="text-text-secondary text-sm">
                  Record a new video (up to 60 seconds)
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            className="mt-6 py-3 bg-surface-light rounded-xl items-center"
            onPress={() => setShowMediaPicker(false)}
          >
            <Text className="text-text-secondary font-medium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  const VisibilityOptionsModal = () => (
    <Modal
      visible={showVisibilityOptions}
      transparent
      animationType="slide"
      onRequestClose={() => setShowVisibilityOptions(false)}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-surface rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-text-primary text-xl font-bold">
              Post Visibility
            </Text>
            <TouchableOpacity onPress={() => setShowVisibilityOptions(false)}>
              <CloseIcon size={SIZES.ICON.MD} color={currentTheme.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <Text className="text-text-secondary text-sm mb-4">
            Choose who can see this post
          </Text>
          
          <View className="space-y-3">
            <TouchableOpacity 
              className={`flex-row items-center p-4 rounded-xl ${
                visibility === 'public' ? 'bg-brand-primary/20' : 'bg-surface-light'
              }`}
              onPress={() => {
                setVisibility('public');
                setShowVisibilityOptions(false);
              }}
            >
              <View className="w-10 h-10 rounded-full bg-brand-primary/20 items-center justify-center mr-3">
                <GlobeIcon size={SIZES.ICON.MD} color={currentTheme.brand.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary font-semibold">Everyone</Text>
                <Text className="text-text-secondary text-sm">
                  Anyone on NebulaNet can see this post
                </Text>
              </View>
              {visibility === 'public' && (
                <CheckCircleIcon 
                  size={SIZES.ICON.MD} 
                  color={currentTheme.brand.primary} 
                  filled 
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-row items-center p-4 rounded-xl ${
                visibility === 'friends' ? 'bg-brand-primary/20' : 'bg-surface-light'
              }`}
              onPress={() => {
                setVisibility('friends');
                setShowVisibilityOptions(false);
              }}
            >
              <View className="w-10 h-10 rounded-full bg-brand-primary/20 items-center justify-center mr-3">
                <UsersIcon size={SIZES.ICON.MD} color={currentTheme.brand.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary font-semibold">Friends only</Text>
                <Text className="text-text-secondary text-sm">
                  Only people you follow back can see this post
                </Text>
              </View>
              {visibility === 'friends' && (
                <CheckCircleIcon 
                  size={SIZES.ICON.MD} 
                  color={currentTheme.brand.primary} 
                  filled 
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-row items-center p-4 rounded-xl ${
                visibility === 'private' ? 'bg-brand-primary/20' : 'bg-surface-light'
              }`}
              onPress={() => {
                setVisibility('private');
                setShowVisibilityOptions(false);
              }}
            >
              <View className="w-10 h-10 rounded-full bg-brand-primary/20 items-center justify-center mr-3">
                <LockIcon size={SIZES.ICON.MD} color={currentTheme.brand.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary font-semibold">Only me</Text>
                <Text className="text-text-secondary text-sm">
                  Only you can see this post
                </Text>
              </View>
              {visibility === 'private' && (
                <CheckCircleIcon 
                  size={SIZES.ICON.MD} 
                  color={currentTheme.brand.primary} 
                  filled 
                />
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            className="mt-6 py-3 bg-surface-light rounded-xl items-center"
            onPress={() => setShowVisibilityOptions(false)}
          >
            <Text className="text-text-secondary font-medium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <ScreenWrapper 
      withBottomNav={false}
      withKeyboardAvoiding={true}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header
        title="Create Post"
        showBackButton={true}
        rightAction={{
          text: isSubmitting ? 'Posting...' : 'Post',
          onPress: handleSubmit,
        }}
      />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-4">
          {/* User Info */}
          <View className="flex-row items-start mb-4">
            <View className="w-12 h-12 rounded-full bg-brand-primary items-center justify-center mr-3">
              {user?.avatar_url ? (
                <Image 
                  source={{ uri: user.avatar_url }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-white text-xl font-bold">
                  {user?.display_name?.[0] || user?.username?.[0] || 'U'}
                </Text>
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-text-primary font-semibold text-lg">
                {user?.display_name || user?.username || 'User'}
              </Text>
              <TouchableOpacity 
                className="flex-row items-center mt-1"
                onPress={() => setShowVisibilityOptions(true)}
              >
                {getVisibilityIcon()}
                <Text className="text-text-secondary text-sm ml-1">
                  {getVisibilityLabel()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Text Input */}
          <TextInput
            ref={textInputRef}
            className="text-text-primary text-lg min-h-[120px]"
            placeholder="What's on your mind?"
            placeholderTextColor={currentTheme.text.tertiary}
            value={content}
            onChangeText={handleContentChange}
            multiline
            maxLength={MAX_CHARS}
            autoFocus
            textAlignVertical="top"
            style={{
              fontSize: SIZES.BODY_LARGE,
              lineHeight: SIZES.BODY_LARGE * 1.4,
            }}
          />
          
          {/* Nebula AI Enhancement Toggle */}
          <TouchableOpacity 
            className="flex-row items-center p-3 bg-surface-light rounded-lg mt-4"
            onPress={() => setUseNebula(!useNebula)}
            activeOpacity={0.7}
          >
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
              useNebula ? 'bg-brand-primary border-brand-primary' : 'border-border'
            }`}>
              {useNebula && (
                <CheckCircleIcon size={SIZES.ICON.SM} color="#FFFFFF" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-medium">
                Enhance with Nebula AI
              </Text>
              <Text className="text-text-secondary text-sm mt-0.5">
                Improve grammar, clarity, and creativity
              </Text>
            </View>
            {useNebula && (
              <Text className="text-brand-primary text-sm font-medium">ON</Text>
            )}
          </TouchableOpacity>
          
          {/* Selected Media Preview */}
          {selectedMedia.length > 0 && (
            <View className="mt-4">
              <Text className="text-text-secondary text-sm mb-2">
                {selectedMedia.length} item{selectedMedia.length !== 1 ? 's' : ''} selected
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                  {selectedMedia.map((media, index) => (
                    <View key={index} className="relative mr-2">
                      {media.type === 'image' ? (
                        <Image
                          source={{ uri: media.uri }}
                          className="w-24 h-24 rounded-lg"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-24 h-24 rounded-lg bg-surface-light items-center justify-center">
                          <VideoIcon size={SIZES.ICON.XL} color={currentTheme.text.secondary} />
                          <Text className="text-text-secondary text-xs mt-1">Video</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        className="absolute -top-2 -right-2 w-6 h-6 bg-status-error rounded-full items-center justify-center"
                        onPress={() => handleRemoveMedia(index)}
                      >
                        <Text className="text-white text-xs font-bold">×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          
          {/* Character Count */}
          <View className="flex-row justify-end mt-4">
            <Text 
              className={`text-sm ${
                charCount > MAX_CHARS 
                  ? 'text-status-error' 
                  : charCount > MAX_CHARS * 0.9 
                  ? 'text-status-warning' 
                  : 'text-text-secondary'
              }`}
            >
              {charCount}/{MAX_CHARS}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Actions Bar */}
      <View className="border-t border-border px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            {/* Add Media Button */}
            <TouchableOpacity 
              className="p-2"
              onPress={() => setShowMediaPicker(true)}
              disabled={selectedMedia.length >= MAX_MEDIA}
            >
              <ImageIcon 
                size={SIZES.ICON.LG} 
                color={
                  selectedMedia.length >= MAX_MEDIA
                    ? currentTheme.icon.disabled 
                    : currentTheme.brand.primary
                } 
              />
            </TouchableOpacity>
            
            {/* Emoji Picker (Placeholder) */}
            <TouchableOpacity 
              className="p-2 ml-2"
              onPress={() => textInputRef.current?.focus()}
            >
              <SmileIcon size={SIZES.ICON.LG} color={currentTheme.icon.secondary} />
            </TouchableOpacity>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            className={`px-6 py-2 rounded-full ${
              charCount === 0 || charCount > MAX_CHARS || isSubmitting
                ? 'bg-surface-light opacity-50'
                : 'bg-brand-primary'
            }`}
            onPress={handleSubmit}
            disabled={charCount === 0 || charCount > MAX_CHARS || isSubmitting}
          >
            <Text className="text-white font-semibold">
              {isSubmitting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Modals */}
      <MediaPickerModal />
      <VisibilityOptionsModal />
    </ScreenWrapper>
  );
}