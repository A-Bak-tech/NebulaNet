import React from 'react';
import { View, Text } from 'react-native';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';

interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface ContentModerationProps {
  content: string;
  result?: ModerationResult;
  isLoading?: boolean;
}

export const ContentModeration: React.FC<ContentModerationProps> = ({
  content,
  result,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <View className="flex-row items-center">
          <Shield size={20} color="#f59e0b" />
          <Text className="font-medium text-yellow-800 dark:text-yellow-200 ml-2">
            Analyzing content...
          </Text>
        </View>
      </View>
    );
  }

  if (!result) return null;

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <View className={cn(
      'border rounded-lg p-4',
      result.isApproved 
        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    )}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          {result.isApproved ? (
            <CheckCircle size={20} color="#10b981" />
          ) : (
            <XCircle size={20} color="#ef4444" />
          )}
          <Text className={cn(
            'font-medium ml-2',
            result.isApproved 
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          )}>
            {result.isApproved ? 'Content Approved' : 'Content Flagged'}
          </Text>
        </View>
        
        <Text className={cn(
          'text-xs font-medium px-2 py-1 rounded-full',
          getRiskColor(result.riskLevel)
        )}>
          {result.riskLevel.toUpperCase()} RISK
        </Text>
      </View>

      {/* Confidence Score */}
      <View className="mb-3">
        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Confidence: {Math.round(result.confidence * 100)}%
        </Text>
        <View className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <View 
            className={cn(
              'h-2 rounded-full',
              result.confidence > 0.7 ? 'bg-green-500' : 
              result.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${result.confidence * 100}%` }}
          />
        </View>
      </View>

      {/* Flags */}
      {result.flags.length > 0 && (
        <View className="mb-3">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Flags:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {result.flags.map((flag, index) => (
              <Text
                key={index}
                className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded-full"
              >
                {flag}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <View>
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Suggestions:
          </Text>
          <View className="space-y-1">
            {result.suggestions.map((suggestion, index) => (
              <View key={index} className="flex-row items-start space-x-2">
                <AlertTriangle size={14} color="#f59e0b" className="mt-0.5" />
                <Text className="text-sm text-yellow-700 dark:text-yellow-200 flex-1">
                  {suggestion}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};