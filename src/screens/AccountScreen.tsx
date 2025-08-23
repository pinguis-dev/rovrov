import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Post } from '@/types';

type AccountTab = 'journal' | 'rove' | 'pinning' | 'favorite';

export const AccountScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AccountTab>('journal');
  const [posts, setPosts] = useState<Post[]>([]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'journal':
        return (
          <FlatList
            data={posts}
            renderItem={({ item }) => (
              <View style={styles.postItem}>
                <Text style={styles.postCaption}>{item.caption}</Text>
              </View>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No posts yet</Text>
            }
          />
        );
      case 'rove':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>Map view coming soon</Text>
          </View>
        );
      case 'pinning':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>No pinned locations yet</Text>
          </View>
        );
      case 'favorite':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>No favorites yet</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerImageContainer}>
            {user?.header_url ? (
              <Image source={{ uri: user.header_url }} style={styles.headerImage} />
            ) : (
              <View style={[styles.headerImage, styles.headerPlaceholder]} />
            )}
          </View>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>@{user?.username || 'username'}</Text>
            <Text style={styles.displayName}>{user?.display_name || 'Display Name'}</Text>
            {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {(['journal', 'rove', 'pinning', 'favorite'] as AccountTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#f9f9f9',
  },
  headerImageContainer: {
    height: 150,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerPlaceholder: {
    backgroundColor: '#e0e0e0',
  },
  profileContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: -40,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  editButton: {
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    minHeight: 300,
  },
  listContent: {
    padding: 20,
  },
  postItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  postCaption: {
    fontSize: 14,
    color: '#333',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});