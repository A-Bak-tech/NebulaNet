// components/feed/StoryRing.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { COLORS } from '../../config/constants';

const StoryRing = ({ username, hasStory, isOwn, onPress, image }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.ring,
        hasStory && styles.hasStoryRing,
        isOwn && styles.ownStoryRing,
      ]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.avatar} />
        ) : (
          <View style={[
            styles.avatar,
            isOwn && styles.ownAvatar
          ]}>
            {isOwn ? (
              <Text style={styles.plusIcon}>+</Text>
            ) : (
              <Text style={styles.avatarText}>
                {username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
        )}
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {isOwn ? 'Your Story' : username}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 70,
    marginHorizontal: 4,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  hasStoryRing: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ownStoryRing: {
    borderColor: COLORS.text.secondary,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownAvatar: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  plusIcon: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 12,
    color: COLORS.text.primary,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 64,
  },
});

export default StoryRing;