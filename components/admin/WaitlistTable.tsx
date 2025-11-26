import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Search, Filter, Mail, Check, X, Clock } from 'lucide-react-native';

interface WaitlistEntry {
  id: string;
  email: string;
  position: number;
  status: 'pending' | 'approved' | 'rejected';
  referredBy?: string;
  createdAt: string;
  approvedAt?: string;
}

export const WaitlistTable: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Mock data
  const waitlistEntries: WaitlistEntry[] = [
    {
      id: '1',
      email: 'user1@example.com',
      position: 1,
      status: 'approved',
      referredBy: 'friend',
      createdAt: '2024-01-15T10:30:00Z',
      approvedAt: '2024-01-16T14:20:00Z',
    },
    {
      id: '2',
      email: 'user2@example.com',
      position: 2,
      status: 'pending',
      createdAt: '2024-01-16T09:15:00Z',
    },
    {
      id: '3',
      email: 'user3@example.com',
      position: 3,
      status: 'pending',
      referredBy: 'social_media',
      createdAt: '2024-01-16T11:45:00Z',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return Check;
      case 'rejected': return X;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleApprove = (id: string) => {
    console.log('Approved:', id);
  };

  const handleReject = (id: string) => {
    console.log('Rejected:', id);
  };

  const filteredEntries = waitlistEntries.filter(entry => {
    const matchesSearch = entry.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || entry.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <View className="flex-1 p-4">
      {/* Search and Filters */}
      <View className="space-y-4 mb-6">
        <Input
          placeholder="Search waitlist entries..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={Search}
        />
        
        <View className="flex-row space-x-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            <View className="flex-row space-x-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setSelectedStatus(status as any)}
                  className={cn(
                    'px-3 py-2 rounded-full',
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
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <TouchableOpacity className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Filter size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Waitlist Table */}
      <ScrollView className="flex-1">
        <View className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table Header */}
          <View className="flex-row bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <Text className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">Position</Text>
            <Text className="flex-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email</Text>
            <Text className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">Status</Text>
            <Text className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">Referred By</Text>
            <Text className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</Text>
          </View>

          {/* Table Rows */}
          {filteredEntries.map((entry) => (
            <View
              key={entry.id}
              className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700"
            >
              <Text className="flex-1 text-sm text-gray-900 dark:text-white font-mono">
                #{entry.position}
              </Text>
              
              <View className="flex-2">
                <Text className="text-sm text-gray-900 dark:text-white">
                  {entry.email}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  Joined {new Date(entry.createdAt).toLocaleDateString()}
                </Text>
              </View>
              
              <View className="flex-1">
                <Badge variant={getStatusColor(entry.status)} size="sm">
                  {entry.status}
                </Badge>
              </View>
              
              <Text className="flex-1 text-sm text-gray-500 dark:text-gray-400">
                {entry.referredBy || 'Direct'}
              </Text>
              
              <View className="flex-1 flex-row space-x-2">
                {entry.status === 'pending' && (
                  <>
                    <Button
                      title=""
                      variant="outline"
                      size="sm"
                      onPress={() => handleApprove(entry.id)}
                      icon={Check}
                    />
                    <Button
                      title=""
                      variant="destructive"
                      size="sm"
                      onPress={() => handleReject(entry.id)}
                      icon={X}
                    />
                  </>
                )}
                <TouchableOpacity className="p-1">
                  <Mail size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {filteredEntries.length === 0 && (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500 dark:text-gray-400 text-lg">
              No waitlist entries found
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Summary */}
      <View className="flex-row justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Total: {filteredEntries.length} entries
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {waitlistEntries.filter(e => e.status === 'pending').length} pending
        </Text>
      </View>
    </View>
  );
};