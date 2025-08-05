// HomeScreen.js - File browser for local videos
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';
import Icon from 'react-native-vector-icons/MaterialIcons';
import usePlayerStore from '../store/playerStore';

export default function HomeScreen({ navigation }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const { videoHistory, addToHistory, loadSavedData } = usePlayerStore();

  useEffect(() => {
    loadSavedData();
    requestPermission();
  }, []);

  const requestPermission = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        loadVideos();
      } else {
        Alert.alert(
          'Permission Required',
          'Please grant media library permission to browse videos.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Permission error:', error);
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      
      // Get all video assets
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        first: 1000,
        sortBy: MediaLibrary.SortBy.modificationTime,
      });
      
      console.log(`Found ${media.assets.length} videos`);
      setVideos(media.assets);
    } catch (error) {
      console.log('Error loading videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVideos();
  };

  const formatDuration = (duration) => {
    if (!duration) return '00:00';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const playVideo = (video) => {
    const videoData = {
      uri: video.uri,
      filename: video.filename,
      duration: video.duration,
      isLocal: true,
    };
    
    addToHistory(videoData);
    navigation.navigate('Player', { video: videoData });
  };

  const renderVideo = ({ item }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => playVideo(item)}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        <Icon name="play-circle-outline" size={40} color="#fff" style={styles.playIcon} />
        <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
      </View>
      
      <View style={styles.videoInfo}>
        <Text style={styles.filename} numberOfLines={2}>
          {item.filename}
        </Text>
        <View style={styles.metadata}>
          <Text style={styles.metaText}>
            {new Date(item.modificationTime).toLocaleDateString()}
          </Text>
          <Text style={styles.metaText}>
            {item.width}x{item.height}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentVideo = ({ item }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => navigation.navigate('Player', { video: item })}
    >
      <Icon name="history" size={20} color="#ff6b6b" />
      <Text style={styles.recentText} numberOfLines={1}>
        {item.filename}
      </Text>
    </TouchableOpacity>
  );

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="lock" size={60} color="#666" />
        <Text style={styles.messageText}>Permission required to access videos</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {videoHistory.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <FlatList
            horizontal
            data={videoHistory.slice(0, 5)}
            renderItem={renderRecentVideo}
            keyExtractor={(item) => item.uri}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
      
      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ff6b6b"
          />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Icon name="video-library" size={60} color="#666" />
            <Text style={styles.messageText}>No videos found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  messageText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
  },
  recentText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    maxWidth: 150,
  },
  listContent: {
    paddingBottom: 20,
  },
  videoItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  thumbnailContainer: {
    width: 120,
    height: 80,
    backgroundColor: '#333',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  playIcon: {
    position: 'absolute',
  },
  duration: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    color: '#fff',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  filename: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  metadata: {
    flexDirection: 'row',
    gap: 15,
  },
  metaText: {
    color: '#888',
    fontSize: 12,
  },
});