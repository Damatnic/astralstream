import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlaylistManager = ({ visible, onClose, onSelectPlaylist, currentVideo }) => {
  const [playlists, setPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const saved = await AsyncStorage.getItem('playlists');
      if (saved) {
        setPlaylists(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  };

  const savePlaylists = async (updatedPlaylists) => {
    try {
      await AsyncStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
      setPlaylists(updatedPlaylists);
    } catch (error) {
      console.error('Failed to save playlists:', error);
    }
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    const newPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      videos: currentVideo ? [currentVideo] : [],
      createdAt: new Date().toISOString(),
    };

    savePlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const addToPlaylist = (playlistId) => {
    if (!currentVideo) return;

    const updatedPlaylists = playlists.map(playlist => {
      if (playlist.id === playlistId) {
        const videoExists = playlist.videos.some(v => v.uri === currentVideo.uri);
        if (!videoExists) {
          return { ...playlist, videos: [...playlist.videos, currentVideo] };
        }
      }
      return playlist;
    });

    savePlaylists(updatedPlaylists);
    Alert.alert('Success', 'Video added to playlist');
    onClose();
  };

  const deletePlaylist = (playlistId) => {
    Alert.alert(
      'Delete Playlist',
      'Are you sure you want to delete this playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
            savePlaylists(updatedPlaylists);
          },
        },
      ]
    );
  };

  const renderPlaylist = ({ item }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => currentVideo ? addToPlaylist(item.id) : onSelectPlaylist(item)}
      onLongPress={() => deletePlaylist(item.id)}
    >
      <Icon name="playlist-play" size={24} color="#ff6b6b" />
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName}>{item.name}</Text>
        <Text style={styles.playlistCount}>{item.videos.length} videos</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {currentVideo ? 'Add to Playlist' : 'Playlists'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Icon name="add" size={24} color="#ff6b6b" />
            <Text style={styles.createButtonText}>Create New Playlist</Text>
          </TouchableOpacity>

          <FlatList
            data={playlists}
            renderItem={renderPlaylist}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No playlists yet</Text>
            }
          />

          {/* Create Playlist Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showCreateModal}
            onRequestClose={() => setShowCreateModal(false)}
          >
            <View style={styles.createModalContainer}>
              <View style={styles.createModalContent}>
                <Text style={styles.createModalTitle}>New Playlist</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Playlist name"
                  placeholderTextColor="#666"
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                />
                <View style={styles.createModalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowCreateModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={createPlaylist}
                  >
                    <Text style={styles.modalButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  createButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginLeft: 10,
  },
  list: {
    paddingBottom: 20,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playlistName: {
    color: '#fff',
    fontSize: 16,
  },
  playlistCount: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  createModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  createModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  createModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  createModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 10,
  },
  modalButtonPrimary: {
    backgroundColor: '#ff6b6b',
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PlaylistManager;