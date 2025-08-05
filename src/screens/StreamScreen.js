// StreamScreen.js - Handle streaming video URLs
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import usePlayerStore from '../store/playerStore';
import { parseVideoUrl } from '../services/urlParser';

export default function StreamScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { videoHistory, addToHistory } = usePlayerStore();

  const popularSites = [
    { name: 'Direct URL', icon: 'link', example: 'https://example.com/video.mp4' },
    { name: 'M3U8/HLS', icon: 'live-tv', example: 'https://example.com/playlist.m3u8' },
    { name: 'YouTube', icon: 'play-circle-outline', example: 'https://youtube.com/watch?v=...' },
    { name: 'Other Platforms', icon: 'ondemand-video', example: 'Various streaming sites' },
  ];

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) {
        setUrl(text);
      }
    } catch (error) {
      console.log('Paste error:', error);
    }
  };

  const handlePlay = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a video URL');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Parsing URL:', url);
      const videoData = await parseVideoUrl(url);
      
      if (videoData.error) {
        Alert.alert('Error', videoData.error);
        setLoading(false);
        return;
      }

      // Add to history and navigate to player
      addToHistory(videoData);
      navigation.navigate('Player', { video: videoData });
      
      // Clear the input
      setUrl('');
    } catch (error) {
      console.log('Stream error:', error);
      Alert.alert(
        'Error',
        'Failed to process URL. Make sure it\'s a valid video link.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const playFromHistory = (video) => {
    navigation.navigate('Player', { video });
  };

  const streamHistory = videoHistory.filter(v => !v.isLocal);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputSection}>
        <Text style={styles.title}>Stream Video</Text>
        <Text style={styles.subtitle}>
          Enter a video URL to stream directly
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter video URL..."
            placeholderTextColor="#666"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity
            style={styles.pasteButton}
            onPress={handlePaste}
          >
            <Icon name="content-paste" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.playButton, loading && styles.disabledButton]}
          onPress={handlePlay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="play-arrow" size={24} color="#fff" />
              <Text style={styles.playButtonText}>Play Stream</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supported Formats</Text>
        {popularSites.map((site, index) => (
          <View key={index} style={styles.formatItem}>
            <Icon name={site.icon} size={24} color="#ff6b6b" />
            <View style={styles.formatInfo}>
              <Text style={styles.formatName}>{site.name}</Text>
              <Text style={styles.formatExample}>{site.example}</Text>
            </View>
          </View>
        ))}
      </View>

      {streamHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Streams</Text>
          {streamHistory.slice(0, 10).map((video, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyItem}
              onPress={() => playFromHistory(video)}
            >
              <Icon name="history" size={20} color="#888" />
              <Text style={styles.historyText} numberOfLines={1}>
                {video.filename || video.uri}
              </Text>
              <Icon name="play-arrow" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.infoSection}>
        <Icon name="info-outline" size={20} color="#666" />
        <Text style={styles.infoText}>
          AstralStream supports direct video URLs, HLS/M3U8 streams, and various streaming platforms. 
          The app will automatically detect and parse supported URLs.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  inputSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 15,
    borderRadius: 5,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  pasteButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 5,
    marginLeft: 10,
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  formatInfo: {
    marginLeft: 15,
    flex: 1,
  },
  formatName: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 2,
  },
  formatExample: {
    color: '#666',
    fontSize: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  historyText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginHorizontal: 10,
  },
  infoSection: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});