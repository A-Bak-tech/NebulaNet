// screens/ChatScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

const RECENT_CHATS = [
  {
    id: 1,
    name: 'Gia Monroe',
    username: '@gia.monroe_',
    lastMessage: 'This weather is crazy! 😊',
    time: '10:30 AM',
    unread: 2,
    avatar: 'https://i.pravatar.cc/150?img=1',
    online: true,
  },
  {
    id: 2,
    name: 'Luca Holland',
    username: '@lucahldn',
    lastMessage: 'What are you doing in?',
    time: 'Yesterday',
    unread: 0,
    avatar: 'https://i.pravatar.cc/150?img=2',
    online: false,
  },
  {
    id: 3,
    name: 'Valerie Azer',
    username: '@valerieazr90',
    lastMessage: 'New episode dropped! 💤',
    time: '2 days ago',
    unread: 0,
    avatar: 'https://i.pravatar.cc/150?img=3',
    online: true,
  },
  {
    id: 4,
    name: 'Benny Blankon',
    username: '@bennyblankon',
    lastMessage: 'You free this weekend?',
    time: '3 days ago',
    unread: 1,
    avatar: 'https://i.pravatar.cc/150?img=4',
    online: false,
  },
];

export default function ChatScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState(RECENT_CHATS);
  const [filteredChats, setFilteredChats] = useState(RECENT_CHATS);

  useEffect(() => {
    if (searchQuery) {
      const filtered = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [searchQuery, chats]);

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatDetail', { chatId: item.id })}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <Text style={styles.chatUsername}>{item.username}</Text>
        <Text style={styles.chatMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Ionicons name="create-outline" size={24} color="#1DA1F2" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#657786" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#657786" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Active Now */}
      <View style={styles.activeNowSection}>
        <Text style={styles.sectionTitle}>Active Now</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {chats.filter(chat => chat.online).map((chat) => (
            <TouchableOpacity key={chat.id} style={styles.activeUser}>
              <View style={styles.activeAvatarContainer}>
                <Image source={{ uri: chat.avatar }} style={styles.activeAvatar} />
                <View style={styles.activeIndicator} />
              </View>
              <Text style={styles.activeName}>{chat.name.split(' ')[0]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recent Chats */}
      <View style={styles.chatsSection}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={60} color="#CCD6DD" />
              <Text style={styles.emptyText}>No messages found</Text>
            </View>
          }
        />
      </View>

      {/* Start New Chat FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="create" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Add ScrollView import
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1DA1F2',
  },
  newMessageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#14171A',
  },
  activeNowSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14171A',
    marginBottom: 12,
  },
  activeUser: {
    alignItems: 'center',
    marginRight: 16,
  },
  activeAvatarContainer: {
    position: 'relative',
  },
  activeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C851',
    borderWidth: 2,
    borderColor: '#fff',
  },
  activeName: {
    marginTop: 6,
    fontSize: 12,
    color: '#657786',
  },
  chatsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8FA',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C851',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14171A',
  },
  chatTime: {
    fontSize: 12,
    color: '#657786',
  },
  chatUsername: {
    fontSize: 14,
    color: '#657786',
    marginBottom: 4,
  },
  chatMessage: {
    fontSize: 14,
    color: '#657786',
  },
  unreadBadge: {
    alignSelf: 'center',
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#657786',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});