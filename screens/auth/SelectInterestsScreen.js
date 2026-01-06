// screens/auth/SelectInterestsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

const INTERESTS = [
  { id: 1, name: 'Art', icon: 'color-palette' },
  { id: 2, name: 'Gaming', icon: 'game-controller' },
  { id: 3, name: 'Books', icon: 'book' },
  { id: 4, name: 'Music', icon: 'musical-notes' },
  { id: 5, name: 'Fitness', icon: 'fitness' },
  { id: 6, name: 'Food', icon: 'restaurant' },
  { id: 7, name: 'Travel', icon: 'airplane' },
  { id: 8, name: 'Movies & TV', icon: 'film' },
  { id: 9, name: 'Wellness', icon: 'leaf' },
  { id: 10, name: 'Fashion', icon: 'shirt' },
  { id: 11, name: 'Environment', icon: 'earth' },
  { id: 12, name: 'Business', icon: 'business' },
  { id: 13, name: 'Tech', icon: 'hardware-chip' },
  { id: 14, name: 'Photography', icon: 'camera' },
  { id: 15, name: 'Events', icon: 'calendar' },
  { id: 16, name: 'Podcasts', icon: 'mic' },
  { id: 17, name: 'Startups', icon: 'rocket' },
  { id: 18, name: 'Mindfulness', icon: 'heart' },
  { id: 19, name: 'Inspiration', icon: 'flash' },
  { id: 20, name: 'Sports', icon: 'football' },
];

export default function SelectInterestsScreen({ navigation }) {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interestId) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      setSelectedInterests([...selectedInterests, interestId]);
    }
  };

  const handleContinue = async () => {
    if (selectedInterests.length < 3) {
      Alert.alert('Select More', 'Choose at least 3 interests to continue');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save interests to user profile
      await supabase
        .from('profiles')
        .update({ 
          interests: selectedInterests,
          onboarding_complete: false 
        })
        .eq('id', user.id);

      navigation.navigate('CommunityOnboarding');
    } catch (error) {
      Alert.alert('Error', 'Failed to save interests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1DA1F2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Interests</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {selectedInterests.length}/20 selected
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(selectedInterests.length / 20) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.interestsContainer}>
        <Text style={styles.title}>Select more interests</Text>
        <Text style={styles.subtitle}>Choose interests to refine your experience</Text>

        <View style={styles.interestsGrid}>
          {INTERESTS.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <TouchableOpacity
                key={interest.id}
                style={[
                  styles.interestCard,
                  isSelected && styles.interestCardSelected
                ]}
                onPress={() => toggleInterest(interest.id)}
              >
                <View style={[
                  styles.interestIconContainer,
                  isSelected && styles.interestIconContainerSelected
                ]}>
                  <Ionicons 
                    name={interest.icon} 
                    size={24} 
                    color={isSelected ? '#1DA1F2' : '#657786'} 
                  />
                </View>
                <Text style={[
                  styles.interestName,
                  isSelected && styles.interestNameSelected
                ]}>
                  {interest.name}
                </Text>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            (selectedInterests.length < 3 || loading) && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={selectedInterests.length < 3 || loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Saving...' : `Continue (${selectedInterests.length}/3)`}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#14171A',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressText: {
    textAlign: 'center',
    color: '#1DA1F2',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E1E8ED',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DA1F2',
    borderRadius: 2,
  },
  interestsContainer: {
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
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestCard: {
    width: '48%',
    backgroundColor: '#F5F8FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  interestCardSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: '#1DA1F2',
  },
  interestIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  interestIconContainerSelected: {
    backgroundColor: '#D4EDFF',
  },
  interestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171A',
  },
  interestNameSelected: {
    color: '#1DA1F2',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
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