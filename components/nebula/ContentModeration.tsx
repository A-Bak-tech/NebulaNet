import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { useNebula } from '@/hooks/useNebula';
import { NebulaLoadingIndicator } from './NebulaLoadingIndicator';

interface ContentModerationProps {
  content?: string;
  onModerationComplete?: (result: ModerationResult) => void;
  autoModerate?: boolean;
  showDetails?: boolean;
}

interface ModerationResult {
  isSafe: boolean;
  score: number;
  flags: string[];
  recommendations: string[];
  moderatedContent?: string;
}

export const ContentModeration: React.FC<ContentModerationProps> = ({
  content: initialContent = '',
  onModerationComplete,
  autoModerate = false,
  showDetails = true
}) => {
  const [content, setContent] = useState(initialContent);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  const [isModerating, setIsModerating] = useState(false);
  const [showModerated, setShowModerated] = useState(false);
  const [strictness, setStrictness] = useState<'low' | 'medium' | 'high'>('medium');
  
  const { moderateContent } = useNebula();

  React.useEffect(() => {
    if (autoModerate && content.trim()) {
      handleModerate();
    }
  }, [autoModerate, content]);

  const handleModerate = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content to moderate');
      return;
    }

    setIsModerating(true);
    try {
      const result = await moderateContent(content);
      setModerationResult(result);
      onModerationComplete?.(result);
    } catch (error) {
      Alert.alert('Moderation Failed', 'Unable to moderate content');
      console.error('Moderation error:', error);
    } finally {
      setIsModerating(false);
    }
  };

  const getSafetyColor = (score: number) => {
    if (score < 0.3) return 'bg-green-500';
    if (score < 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSafetyText = (score: number) => {
    if (score < 0.3) return 'Safe';
    if (score < 0.7) return 'Review Needed';
    return 'Unsafe';
  };

  const handleApprove = () => {
    Alert.alert('Approved', 'Content has been approved');
    setModerationResult(null);
  };

  const handleReject = () => {
    Alert.alert('Rejected', 'Content has been rejected');
    setContent('');
    setModerationResult(null);
  };

  const handleModerateAndFix = () => {
    if (moderationResult?.moderatedContent) {
      setContent(moderationResult.moderatedContent);
      setShowModerated(true);
    }
  };

  return (
    <View className="bg-gray-800 rounded-xl p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-2">
            <Text className="text-white font-bold">🛡️</Text>
          </View>
          <Text className="text-white text-lg font-bold">Content Moderation</Text>
        </View>
        
        {moderationResult && (
          <View className={`px-3 py-1 rounded-full ${getSafetyColor(moderationResult.score)}`}>
            <Text className="text-white text-sm font-semibold">
              {getSafetyText(moderationResult.score)}
            </Text>
          </View>
        )}
      </View>

      {/* Content Input */}
      <TextInput
        className="bg-gray-700 text-white rounded-lg p-3 mb-4 min-h-[100px]"
        placeholder="Enter content to check for moderation..."
        placeholderTextColor="#9CA3AF"
        value={showModerated && moderationResult?.moderatedContent 
          ? moderationResult.moderatedContent 
          : content
        }
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      {/* Strictness Settings */}
      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Moderation Strictness</Text>
        <View className="flex-row space-x-2">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              className={`px-4 py-2 rounded-lg ${
                strictness === level
                  ? 'bg-blue-600'
                  : 'bg-gray-700'
              }`}
              onPress={() => setStrictness(level)}
            >
              <Text className="text-white capitalize">{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Moderate Button */}
      <TouchableOpacity
        className="bg-blue-600 py-3 rounded-xl items-center mb-4"
        onPress={handleModerate}
        disabled={isModerating || !content.trim()}
      >
        {isModerating ? (
          <NebulaLoadingIndicator size="small" showMessage={false} />
        ) : (
          <Text className="text-white font-bold">
            Check Content Safety
          </Text>
        )}
      </TouchableOpacity>

      {/* Moderation Results */}
      {moderationResult && showDetails && (
        <View className="mt-4">
          {/* Safety Score */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-300">Safety Score</Text>
              <Text className="text-white font-bold">
                {(moderationResult.score * 100).toFixed(1)}%
              </Text>
            </View>
            <View className="h-3 bg-gray-700 rounded-full">
              <View 
                className={`h-full rounded-full ${getSafetyColor(moderationResult.score)}`}
                style={{ width: `${moderationResult.score * 100}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-green-400 text-xs">Safe</Text>
              <Text className="text-yellow-400 text-xs">Review</Text>
              <Text className="text-red-400 text-xs">Unsafe</Text>
            </View>
          </View>

          {/* Flags */}
          {moderationResult.flags.length > 0 && (
            <View className="mb-4">
              <Text className="text-gray-300 mb-2">⚠️ Issues Found</Text>
              <View className="flex-row flex-wrap gap-2">
                {moderationResult.flags.map((flag, index) => (
                  <View
                    key={index}
                    className="px-3 py-1 bg-red-900/30 rounded-lg"
                  >
                    <Text className="text-red-300 capitalize">{flag.replace('_', ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recommendations */}
          {moderationResult.recommendations.length > 0 && (
            <View className="mb-4">
              <Text className="text-gray-300 mb-2">📋 Recommendations</Text>
              <View className="bg-gray-900 rounded-lg p-3">
                {moderationResult.recommendations.map((rec, index) => (
                  <View key={index} className="flex-row items-start mb-2 last:mb-0">
                    <Text className="text-blue-400 mr-2">•</Text>
                    <Text className="text-gray-300 flex-1">{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="flex-1 bg-green-600 py-3 rounded-xl items-center"
              onPress={handleApprove}
            >
              <Text className="text-white font-semibold">Approve</Text>
            </TouchableOpacity>
            
            {moderationResult.moderatedContent && (
              <TouchableOpacity
                className="flex-1 bg-yellow-600 py-3 rounded-xl items-center"
                onPress={handleModerateAndFix}
              >
                <Text className="text-white font-semibold">Auto-Fix</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              className="flex-1 bg-red-600 py-3 rounded-xl items-center"
              onPress={handleReject}
            >
              <Text className="text-white font-semibold">Reject</Text>
            </TouchableOpacity>
          </View>

          {/* Toggle moderated content */}
          {moderationResult.moderatedContent && (
            <TouchableOpacity
              className="mt-3 items-center"
              onPress={() => setShowModerated(!showModerated)}
            >
              <Text className="text-blue-400 text-sm">
                {showModerated ? 'Show Original' : 'Show Auto-Fixed Version'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Quick Safety Check */}
      {!moderationResult && (
        <View className="mt-4">
          <Text className="text-gray-300 mb-2">🔍 Quick Checks</Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              className="px-3 py-2 bg-gray-700 rounded-lg"
              onPress={() => setContent(content + ' Check for explicit language.')}
            >
              <Text className="text-gray-300 text-sm">Explicit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-2 bg-gray-700 rounded-lg"
              onPress={() => setContent(content + ' Check for hate speech.')}
            >
              <Text className="text-gray-300 text-sm">Hate Speech</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-2 bg-gray-700 rounded-lg"
              onPress={() => setContent(content + ' Check for spam.')}
            >
              <Text className="text-gray-300 text-sm">Spam</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// Compact badge for showing moderation status inline
export const ModerationBadge: React.FC<{
  score: number;
  size?: 'small' | 'medium';
}> = ({ score, size = 'medium' }) => {
  const getColor = (score: number) => {
    if (score < 0.3) return 'bg-green-500';
    if (score < 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getIcon = (score: number) => {
    if (score < 0.3) return '✅';
    if (score < 0.7) return '⚠️';
    return '🚫';
  };

  const sizeClass = size === 'small' ? 'px-2 py-1' : 'px-3 py-1.5';

  return (
    <View className={`${sizeClass} ${getColor(score)} rounded-full flex-row items-center`}>
      <Text className="text-white mr-1">{getIcon(score)}</Text>
      <Text className="text-white text-xs font-semibold">
        {score < 0.3 ? 'Safe' : score < 0.7 ? 'Review' : 'Flagged'}
      </Text>
    </View>
  );
};

// Real-time moderation indicator
export const RealTimeModeration: React.FC<{
  content: string;
  onChange: (content: string) => void;
  onModerationResult?: (result: ModerationResult) => void;
}> = ({ content, onChange, onModerationResult }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<ModerationResult | null>(null);

  // Debounced moderation check
  React.useEffect(() => {
    if (!content.trim()) return;

    const timeoutId = setTimeout(async () => {
      setIsChecking(true);
      try {
        // Simulate moderation check
        // In production, call your moderation API
        const result: ModerationResult = {
          isSafe: Math.random() > 0.3,
          score: Math.random(),
          flags: Math.random() > 0.7 ? ['spam'] : [],
          recommendations: ['Content appears appropriate']
        };
        
        setLastResult(result);
        onModerationResult?.(result);
      } finally {
        setIsChecking(false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [content]);

  return (
    <View className="relative">
      <TextInput
        className="bg-gray-800 text-white rounded-lg p-3 min-h-[100px]"
        placeholder="Type your content..."
        placeholderTextColor="#9CA3AF"
        value={content}
        onChangeText={onChange}
        multiline
        textAlignVertical="top"
      />
      
      {/* Real-time indicator */}
      <View className="absolute bottom-2 right-2 flex-row items-center">
        {isChecking ? (
          <View className="flex-row items-center bg-gray-900/80 px-2 py-1 rounded">
            <View className="w-3 h-3 rounded-full border-2 border-blue-400 border-r-transparent animate-spin mr-1" />
            <Text className="text-blue-300 text-xs">Checking...</Text>
          </View>
        ) : lastResult ? (
          <ModerationBadge score={lastResult.score} size="small" />
        ) : null}
      </View>
    </View>
  );
};