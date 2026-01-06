// services/imageUpload.js
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import errorHandler from './errorHandler';
import logger from './logger';

class ImageUploadService {
  constructor() {
    this.maxImageSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  }

  async requestPermissions() {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Sorry, we need camera roll permissions to make this work!');
        }
      }
      return true;
    } catch (error) {
      errorHandler.showAlert(error, 'Permission Required');
      return false;
    }
  }

  async pickImage(options = {}) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
        base64: options.base64 || false,
        exif: options.exif || false,
        ...options,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      errorHandler.log(error, { context: 'pickImage' });
      return null;
    }
  }

  async takePhoto(options = {}) {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Sorry, we need camera permissions to make this work!');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
        base64: options.base64 || false,
        exif: options.exif || false,
        ...options,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      errorHandler.showAlert(error, 'Camera Error');
      return null;
    }
  }

  async validateImage(image) {
    if (!image || !image.uri) {
      throw new Error('Invalid image file');
    }

    // Check file size
    if (image.fileSize && image.fileSize > this.maxImageSize) {
      throw new Error(`Image size must be less than ${this.maxImageSize / 1024 / 1024}MB`);
    }

    // Check file type
    if (image.mimeType && !this.allowedTypes.includes(image.mimeType)) {
      throw new Error('Image must be JPEG, PNG, GIF, or WebP');
    }

    return true;
  }

  async uploadImage(image, bucket = 'posts') {
    try {
      await this.validateImage(image);
      logger.info('Uploading image', { bucket, size: image.fileSize });

      const startTime = Date.now();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate unique filename
      const fileExt = image.uri.split('.').pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${user.id}/${timestamp}-${randomString}.${fileExt}`;

      // Convert image to blob
      const response = await fetch(image.uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          contentType: image.mimeType || `image/${fileExt}`,
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const duration = Date.now() - startTime;
      logger.logPerformance(`Image upload to ${bucket}`, duration);

      return {
        success: true,
        path: data.path,
        url: publicUrl,
        fileName,
        size: blob.size,
        mimeType: blob.type,
      };
    } catch (error) {
      logger.error('Image upload failed', error);
      throw errorHandler.handleApiError(error, 'image upload');
    }
  }

  async uploadMultipleImages(images, bucket = 'posts') {
    try {
      const uploadPromises = images.map(image => this.uploadImage(image, bucket));
      const results = await Promise.all(uploadPromises);
      
      return {
        success: true,
        results,
        total: results.length,
        failed: results.filter(r => !r.success).length,
      };
    } catch (error) {
      logger.error('Multiple image upload failed', error);
      throw error;
    }
  }

  async deleteImage(path, bucket = 'posts') {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      
      logger.info('Image deleted', { bucket, path });
      return { success: true, data };
    } catch (error) {
      logger.error('Image deletion failed', error);
      throw errorHandler.handleApiError(error, 'image deletion');
    }
  }

  async getImageUrl(path, bucket = 'posts') {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return publicUrl;
    } catch (error) {
      logger.error('Failed to get image URL', error);
      return null;
    }
  }

  // Compress image on client side (for large images)
  async compressImage(uri, options = {}) {
    try {
      // TODO: Implement actual compression logic
      // In a real app, you'd use a compression library like:
      // expo-image-manipulator or react-native-image-resizer
      
      // For now, return the original URI
      // This is where you'd add compression logic
      return {
        uri,
        width: options.maxWidth || 1080,
        height: options.maxHeight || 1080,
        compress: options.compress || 0.8,
      };
    } catch (error) {
      logger.error('Image compression failed', error);
      return { uri }; // Return original if compression fails
    }
  }

  // Generate thumbnail URL
  getThumbnailUrl(url, width = 300, height = 300) {
    if (!url) return null;
    
    // Supabase Storage supports image transformations via query params
    return `${url}?width=${width}&height=${height}&resize=cover`;
  }
}

const imageUploadService = new ImageUploadService();
export default imageUploadService;