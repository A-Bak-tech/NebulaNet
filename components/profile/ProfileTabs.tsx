import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { currentTheme } from '../../constants/Colors';

interface ProfileTabsProps {
  activeTab: 'posts' | 'likes' | 'echoes';
  onTabChange: (tab: 'posts' | 'likes' | 'echoes') => void;
  postsCount?: number;
  likesCount?: number;
  echoesCount?: number;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  postsCount = 0,
  likesCount = 0,
  echoesCount = 0,
}) => {
  const tabs = [
    { id: 'posts', label: 'Posts', count: postsCount },
    { id: 'likes', label: 'Likes', count: likesCount },
    { id: 'echoes', label: 'Echoes', count: echoesCount },
  ] as const;
  
  return (
    <View className="flex-row border-b border-border mt-6">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          className={`flex-1 py-3 items-center ${
            activeTab === tab.id ? 'border-b-2 border-brand-primary' : ''
          }`}
          onPress={() => onTabChange(tab.id)}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Text
              className={`text-base font-medium ${
                activeTab === tab.id ? 'text-brand-primary' : 'text-text-secondary'
              }`}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View 
                className={`ml-2 px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-brand-primary/20' 
                    : 'bg-surface-light'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    activeTab === tab.id 
                      ? 'text-brand-primary' 
                      : 'text-text-secondary'
                  }`}
                >
                  {tab.count > 99 ? '99+' : tab.count}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ProfileTabs;