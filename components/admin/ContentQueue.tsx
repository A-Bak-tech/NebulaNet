import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Check, X, Clock, AlertTriangle } from 'lucide-react-native';

interface ContentItem {
  id: string;
  type: 'post' | 'comment';
  content: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected';
  flags: string[];
  submittedAt: string;
  aiConfidence: number;
}

export const ContentQueue: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Mock data
  const contentItems: ContentItem[] = [
    {
      id: '1',
      type: 'post',
      content: 'This is a sample post that needs moderation...',
      author: 'john_doe',
      status: 'pending',
      flags: ['potential_spam', 'language'],
      submittedAt: '2024-01-20T10:30:00Z',
      aiConfidence: 0.76,
    },
    // Add more items as needed
  ];

  const handleApprove = (id: string) => {
    console.log('Approved:', id);
  };

  const handleReject = (id: string) => {
    console.log('Rejected:', id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return Check;
      case 'rejected': return X;
      default: return AlertTriangle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <View className="flex-1">
      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row px-4 py-2 space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setSelectedStatus(status as any)}
              className={cn(
                'px-4 py-2 rounded-full flex-row items-center space-x-2',
                selectedStatus === status
                  ? 'bg-primary-500'
                  : 'bg-gray-100 dark:bg-gray-800'
              )}
            >
              <Text
                className={cn(
                  'text-sm font-medium',
                  selectedStatus === status
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
              <Badge variant={selectedStatus === status ? 'secondary' : 'default'} size="sm">
                {contentItems.filter(item => status === 'all' || item.status === status).length}
              </Badge>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content List */}
      <ScrollView className="flex-1">
        {contentItems
          .filter(item => selectedStatus === 'all' || item.status === selectedStatus)
          .map((item) => (
            <View
              key={item.id}
              className="p-4 border-b border-gray-200 dark:border-gray-700"
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center space-x-2 mb-2">
                    <Badge variant="outline" size="sm">
                      {item.type}
                    </Badge>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      @{item.author}
                    </Text>
                    <Text className="text-gray-400 dark:text-gray-500 text-xs">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <Text className="text-gray-700 dark:text-gray-300 text-sm leading-5">
                    {item.content}
                  </Text>
                </View>
                
                <View className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(item.status))}>
                  <Text className="text-xs font-medium">
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Flags */}
              {item.flags.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {item.flags.map((flag, index) => (
                    <Badge key={index} variant="destructive" size="sm">
                      {flag}
                    </Badge>
                  ))}
                </View>
              )}

              {/* AI Confidence */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    AI Confidence: {Math.round(item.aiConfidence * 100)}%
                  </Text>
                  <View className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <View 
                      className={cn(
                        'h-1 rounded-full',
                        item.aiConfidence > 0.7 ? 'bg-green-500' : 
                        item.aiConfidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${item.aiConfidence * 100}%` }}
                    />
                  </View>
                </View>

                {/* Actions */}
                {item.status === 'pending' && (
                  <View className="flex-row space-x-2 ml-4">
                    <Button
                      title="Approve"
                      variant="outline"
                      size="sm"
                      onPress={() => handleApprove(item.id)}
                      icon={Check}
                    />
                    <Button
                      title="Reject"
                      variant="destructive"
                      size="sm"
                      onPress={() => handleReject(item.id)}
                      icon={X}
                    />
                  </View>
                )}
              </View>
            </View>
          ))}
      </ScrollView>
    </View>
  );
};