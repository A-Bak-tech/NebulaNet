import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CloseIcon, CameraIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { currentTheme } from '../../constants/Colors';
import { SIZES, SPACING } from '../../constants/Layout';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar_url || null);
  const [isSaving, setIsSaving] = useState(false);
  
  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to change your avatar.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take a photo.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };
  
  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const updates: any = {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
      };
      
      // If avatar changed, upload it first
      if (avatar && avatar !== user?.avatar_url) {
        // In production, upload to Supabase Storage here
        updates.avatar_url = avatar;
      }
      
      await onSave(updates);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-surface rounded-t-3xl max-h-[90%]">
          <View className="p-6 border-b border-border">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-text-primary text-2xl font-bold">
                Edit Profile
              </Text>
              <TouchableOpacity onPress={onClose}>
                <CloseIcon size={SIZES.ICON.MD} color={currentTheme.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            {/* Avatar Section */}
            <View className="items-center mb-6">
              <View className="relative">
                <View className="w-32 h-32 rounded-full bg-surface-light items-center justify-center">
                  {avatar ? (
                    <View className="w-full h-full rounded-full overflow-hidden">
                      {/* In production, use Image component */}
                      <View className="w-full h-full bg-brand-primary" />
                    </View>
                  ) : (
                    <Text className="text-white text-4xl font-bold">
                      {displayName?.[0] || user?.username?.[0] || 'U'}
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity
                  className="absolute bottom-0 right-0 w-10 h-10 bg-brand-primary rounded-full items-center justify-center border-4 border-surface"
                  onPress={handlePickAvatar}
                >
                  <CameraIcon size={SIZES.ICON.SM} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                className="mt-2"
                onPress={handleTakePhoto}
              >
                <Text className="text-brand-primary text-sm font-medium">
                  Take photo instead
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Form Fields */}
            <View className="space-y-4">
              <View>
                <Text className="text-text-secondary text-sm font-medium mb-1">
                  Display Name *
                </Text>
                <TextInput
                  className="bg-surface-light rounded-lg px-4 py-3 text-text-primary"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={currentTheme.text.tertiary}
                  maxLength={100}
                />
              </View>
              
              <View>
                <Text className="text-text-secondary text-sm font-medium mb-1">
                  Bio
                </Text>
                <TextInput
                  className="bg-surface-light rounded-lg px-4 py-3 text-text-primary min-h-[100px]"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell people about yourself"
                  placeholderTextColor={currentTheme.text.tertiary}
                  multiline
                  maxLength={160}
                  textAlignVertical="top"
                />
                <Text className="text-text-tertiary text-xs text-right mt-1">
                  {bio.length}/160
                </Text>
              </View>
              
              <View>
                <Text className="text-text-secondary text-sm font-medium mb-1">
                  Location
                </Text>
                <TextInput
                  className="bg-surface-light rounded-lg px-4 py-3 text-text-primary"
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, Country"
                  placeholderTextColor={currentTheme.text.tertiary}
                  maxLength={50}
                />
              </View>
              
              <View>
                <Text className="text-text-secondary text-sm font-medium mb-1">
                  Website
                </Text>
                <TextInput
                  className="bg-surface-light rounded-lg px-4 py-3 text-text-primary"
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="https://example.com"
                  placeholderTextColor={currentTheme.text.tertiary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            {/* Save Button */}
            <TouchableOpacity
              className={`mt-8 py-4 rounded-lg items-center ${
                isSaving ? 'bg-brand-primary/50' : 'bg-brand-primary'
              }`}
              onPress={handleSave}
              disabled={isSaving || !displayName.trim()}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-lg font-semibold">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              className="mt-4 py-3 items-center"
              onPress={onClose}
            >
              <Text className="text-text-secondary">Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;