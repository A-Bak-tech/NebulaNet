import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabase';

const EditProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    username: '',
    location: '',
    bio: '', // EMPTY for real users
    avatar_url: null,
    website: '',
  });

  // Form validation
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || '',
            username: profileData.username || '',
            location: profileData.location || '',
            bio: profileData.bio || '', // Empty or existing bio
            avatar_url: profileData.avatar_url || null,
            website: profileData.website || '',
          });
        } else {
          // Create empty profile if doesn't exist
          setProfile({
            full_name: user.user_metadata?.full_name || '',
            username: '',
            location: '',
            bio: '', // Empty for new users
            avatar_url: null,
            website: '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant camera roll permissions to change your profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Upload image to Supabase Storage
        setSaving(true);
        
        // Convert to blob
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], {
          type: 'image/jpeg',
        });
        
        // Upload to Supabase
        const fileName = `avatars/${user.id}/${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('media')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        // Update local state
        setProfile(prev => ({
          ...prev,
          avatar_url: publicUrl,
        }));

        setSaving(false);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
      setSaving(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!profile.full_name.trim()) {
      newErrors.full_name = 'Name is required';
    }

    if (!profile.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(profile.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (profile.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (profile.username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    }

    if (profile.bio.length > 150) {
      newErrors.bio = 'Bio must be 150 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);

      // Check if username is available (if changed)
      if (user) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', profile.username.trim().toLowerCase())
          .neq('id', user.id)
          .single();

        if (existingUser) {
          Alert.alert('Username taken', 'This username is already taken. Please choose another.');
          setSaving(false);
          return;
        }
      }

      // Update profile in Supabase
      const updates = {
        id: user?.id,
        full_name: profile.full_name.trim(),
        username: profile.username.trim().toLowerCase(),
        location: profile.location.trim(),
        bio: profile.bio.trim(), // Can be empty
        avatar_url: profile.avatar_url,
        website: profile.website.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates, {
          onConflict: 'id',
        });

      if (error) throw error;

      // Update auth metadata if needed
      await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name.trim(),
          username: profile.username.trim(),
        },
      });

      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Error saving profile:', error);
      
      if (error.code === '23505') {
        Alert.alert('Error', 'Username already taken. Please choose another.');
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async () => {
    Alert.alert(
      'Remove Profile Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setProfile(prev => ({
                ...prev,
                avatar_url: null,
              }));
            } catch (error) {
              console.error('Error removing photo:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving}>
          <Ionicons name="close" size={24} color={saving ? '#C7C7CC' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={48} color="#8E8E93" />
              </View>
            )}
            
            {profile.avatar_url && (
              <TouchableOpacity
                style={styles.deletePhotoButton}
                onPress={handleDeletePhoto}
                disabled={saving}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={pickImage}
            disabled={saving}
          >
            <Ionicons name="camera" size={20} color="#007AFF" />
            <Text style={styles.changePhotoText}>
              {profile.avatar_url ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={[styles.input, errors.full_name && styles.inputError]}
              value={profile.full_name}
              onChangeText={(text) => {
                setProfile(prev => ({ ...prev, full_name: text }));
                if (errors.full_name) setErrors(prev => ({ ...prev, full_name: '' }));
              }}
              placeholder="Enter your full name"
              placeholderTextColor="#8E8E93"
              editable={!saving}
            />
            {errors.full_name && (
              <Text style={styles.errorText}>{errors.full_name}</Text>
            )}
          </View>

          {/* Username Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Username *</Text>
            <View style={styles.usernameContainer}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={[styles.input, styles.usernameInput, errors.username && styles.inputError]}
                value={profile.username}
                onChangeText={(text) => {
                  // Remove @ if user types it
                  const cleanText = text.replace('@', '');
                  setProfile(prev => ({ ...prev, username: cleanText }));
                  if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                }}
                placeholder="Choose a username"
                placeholderTextColor="#8E8E93"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
            </View>
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
            <Text style={styles.hintText}>
              This will be your unique identifier on NebulaNet
            </Text>
          </View>

          {/* Location Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={profile.location}
              onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
              placeholder="City, Country"
              placeholderTextColor="#8E8E93"
              editable={!saving}
            />
          </View>

          {/* Bio Field - EMPTY for new users */}
          <View style={styles.fieldContainer}>
            <View style={styles.bioHeader}>
              <Text style={styles.label}>Bio</Text>
              <Text style={styles.charCount}>
                {profile.bio.length}/150
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.bioInput, errors.bio && styles.inputError]}
              value={profile.bio}
              onChangeText={(text) => {
                setProfile(prev => ({ ...prev, bio: text }));
                if (errors.bio) setErrors(prev => ({ ...prev, bio: '' }));
              }}
              placeholder="Tell people about yourself (optional)"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={150}
              editable={!saving}
            />
            {errors.bio && (
              <Text style={styles.errorText}>{errors.bio}</Text>
            )}
            <Text style={styles.hintText}>
              Optional - share your interests, passions, or what you're looking for
            </Text>
          </View>

          {/* Website Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={profile.website}
              onChangeText={(text) => setProfile(prev => ({ ...prev, website: text }))}
              placeholder="https://your-website.com"
              placeholderTextColor="#8E8E93"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!saving}
            />
          </View>
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.helpText}>
            Your profile helps others discover and connect with you. You can update this anytime.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#C7C7CC',
  },
  scrollView: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF10',
    borderRadius: 20,
  },
  changePhotoText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 6,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    marginLeft: 4,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  atSign: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    marginRight: 8,
  },
  usernameInput: {
    flex: 1,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 32,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default EditProfileScreen;