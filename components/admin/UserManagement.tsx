import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, Filter, MoreVertical, Mail, Shield, Ban } from 'lucide-react-native';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'inactive';
  post_count: number;
  joined_date: string;
}

export const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'user' | 'admin' | 'moderator'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');

  // Mock data
  const users: User[] = [
    {
      id: '1',
      email: 'user1@example.com',
      username: 'john_doe',
      full_name: 'John Doe',
      role: 'user',
      status: 'active',
      post_count: 24,
      joined_date: '2024-01-15',
    },
    {
      id: '2',
      email: 'admin@nebulanet.space',
      username: 'admin',
      full_name: 'System Admin',
      role: 'admin',
      status: 'active',
      post_count: 5,
      joined_date: '2024-01-01',
    },
    // Add more mock users as needed
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <View className="flex-1">
      {/* Search and Filters */}
      <View className="p-4 space-y-4">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={Search}
        />
        
        <View className="flex-row space-x-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            <View className="flex-row space-x-2">
              {['all', 'user', 'admin', 'moderator'].map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setSelectedRole(role as any)}
                  className={cn(
                    'px-3 py-2 rounded-full',
                    selectedRole === role
                      ? 'bg-primary-500'
                      : 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      selectedRole === role
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
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

      {/* Users List */}
      <ScrollView className="flex-1">
        {users.map((user) => (
          <View
            key={user.id}
            className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-700"
          >
            <Avatar
              source={undefined}
              name={user.full_name}
              size="md"
            />
            
            <View className="flex-1 ml-3">
              <View className="flex-row items-center space-x-2 mb-1">
                <Text className="font-semibold text-gray-900 dark:text-white">
                  {user.full_name}
                </Text>
                <Badge variant={getRoleColor(user.role)} size="sm">
                  {user.role}
                </Badge>
                <Badge variant={getStatusColor(user.status)} size="sm">
                  {user.status}
                </Badge>
              </View>
              
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                @{user.username} • {user.email}
              </Text>
              
              <View className="flex-row items-center space-x-4 mt-1">
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  {user.post_count} posts
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  Joined {new Date(user.joined_date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View className="flex-row space-x-1">
              <TouchableOpacity className="p-2">
                <Mail size={16} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity className="p-2">
                <Shield size={16} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity className="p-2">
                <MoreVertical size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};