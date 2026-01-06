// screens/auth/CommunityOnboardingScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

const COMMUNITIES = [
  {
    id: 1,
    name: 'NebulaNet Photography',
    description: 'Where good energy flows and real people connect deeply - a space for authenticity, meaningful bonds, shared growth, open hearts, positive vibes, and true belonging.',
    members: '10.2k',
    image: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=400',
  },
  {
    id: 2,
    name: 'HeartLink Collective',
    description: 'A united community spreading kindness, organizing charity drives, sharing stories, and empowering each other to create lasting change through compassion and action.',
    members: '8.7k',
    image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400',
  },
  {
    id: 3,
    name: 'Artisan Collective',
    description: 'For creators and crafters. Share your work, learn new skills, and connect with fellow artists from around the world.',
    members: '15.3k',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w-400',
  },
];

export default function CommunityOnboardingScreen({ navigation }) {
  const [selectedCommunities, setSelectedCommunities] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleCommunity = (communityId) => {
    if (selectedCommunities.includes(communityId)) {
      setSelectedCommunities(selectedCommunities.filter(id => id !== communityId));
    } else {
      setSelectedCommunities([...selectedCommunities, communityId]);
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({ 
          onboarding_complete: true,
          onboarded_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Join selected communities
      for (const communityId of selectedCommunities) {
        await supabase
          .from('community_members')
          .insert({
            user_id: user.id,
            community_id: communityId,
            joined_at: new Date().toISOString()
          });
      }

      // Navigation handled by App.js auth state
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('profiles')
        .update({ 
          onboarding_complete: true,
          onboarded_at: new Date().toISOString()
        })
        .eq('id', user.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to skip onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} disabled={loading}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Join Your First Community</Text>
        <Text style={styles.subtitle}>
          Based on your interests, here are some recommended communities
        </Text>

        {COMMUNITIES.map((community) => {
          const isSelected = selectedCommunities.includes(community.id);
          return (
            <TouchableOpacity
              key={community.id}
              style={[
                styles.communityCard,
                isSelected && styles.communityCardSelected
              ]}
              onPress={() => toggleCommunity(community.id)}
            >
              <Image 
                source={{ uri: community.image }} 
                style={styles.communityImage} 
              />
              <View style={styles.communityContent}>
                <View style={styles.communityHeader}>
                  <Text style={styles.communityName}>{community.name}</Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#1DA1F2" />
                  )}
                </View>
                <Text style={styles.communityDescription}>
                  {community.description}
                </Text>
                <View style={styles.communityFooter}>
                  <Ionicons name="people" size={16} color="#657786" />
                  <Text style={styles.memberCount}>{community.members} members</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#1DA1F2" />
          <Text style={styles.infoText}>
            You can join more communities later from the Explore tab
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            (selectedCommunities.length === 0 || loading) && styles.continueButtonDisabled
          ]}
          onPress={handleCompleteOnboarding}
          disabled={selectedCommunities.length === 0 || loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Completing...' : `Join ${selectedCommunities.length} Community${selectedCommunities.length !== 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  skipButton: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#14171A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#657786',
    marginBottom: 30,
    lineHeight: 22,
  },
  communityCard: {
    backgroundColor: '#F5F8FA',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  communityCardSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: '#1DA1F2',
  },
  communityImage: {
    width: '100%',
    height: 160,
  },
  communityContent: {
    padding: 20,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14171A',
    flex: 1,
  },
  communityDescription: {
    fontSize: 14,
    color: '#657786',
    lineHeight: 20,
    marginBottom: 16,
  },
  communityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    marginLeft: 6,
    color: '#657786',
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#1DA1F2',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  continueButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#AAB8C2',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});