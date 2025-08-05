import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookmarkManager = ({
  visible,
  onClose,
  videoUrl,
  videoTitle,
  currentTime,
  duration,
  onSeekToBookmark,
  thumbnail,
}) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [newBookmarkName, setNewBookmarkName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadBookmarks();
  }, [videoUrl]);

  const loadBookmarks = async () => {
    try {
      const key = `bookmarks_${videoUrl}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setBookmarks(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const saveBookmarks = async (newBookmarks) => {
    try {
      const key = `bookmarks_${videoUrl}`;
      await AsyncStorage.setItem(key, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };

  const addBookmark = () => {
    if (!newBookmarkName.trim()) {
      Alert.alert('Error', 'Please enter a bookmark name');
      return;
    }

    const newBookmark = {
      id: Date.now().toString(),
      name: newBookmarkName.trim(),
      time: currentTime,
      createdAt: new Date().toISOString(),
      thumbnail: thumbnail,
    };

    const updatedBookmarks = [...bookmarks, newBookmark].sort((a, b) => a.time - b.time);
    saveBookmarks(updatedBookmarks);
    setNewBookmarkName('');
    setShowAddForm(false);
  };

  const deleteBookmark = (id) => {
    Alert.alert(
      'Delete Bookmark',
      'Are you sure you want to delete this bookmark?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedBookmarks = bookmarks.filter((b) => b.id !== id);
            saveBookmarks(updatedBookmarks);
          },
        },
      ]
    );
  };

  const updateBookmark = (id) => {
    if (!editingName.trim()) return;

    const updatedBookmarks = bookmarks.map((b) =>
      b.id === id ? { ...b, name: editingName.trim() } : b
    );
    saveBookmarks(updatedBookmarks);
    setEditingId(null);
    setEditingName('');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekToBookmark = (time) => {
    onSeekToBookmark(time);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Bookmarks</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => setShowAddForm(!showAddForm)}
                style={styles.addButton}
              >
                <Icon name="add" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {showAddForm && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="Bookmark name..."
                placeholderTextColor="#666"
                value={newBookmarkName}
                onChangeText={setNewBookmarkName}
                autoFocus
              />
              <View style={styles.addFormButtons}>
                <TouchableOpacity
                  style={styles.formButton}
                  onPress={() => {
                    setShowAddForm(false);
                    setNewBookmarkName('');
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.saveButton]}
                  onPress={addBookmark}
                >
                  <Text style={styles.saveText}>Add at {formatTime(currentTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <ScrollView style={styles.bookmarkList}>
            {bookmarks.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="bookmark-border" size={48} color="#666" />
                <Text style={styles.emptyText}>No bookmarks yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap the + button to add a bookmark at the current time
                </Text>
              </View>
            ) : (
              bookmarks.map((bookmark) => (
                <TouchableOpacity
                  key={bookmark.id}
                  style={styles.bookmarkItem}
                  onPress={() => handleSeekToBookmark(bookmark.time)}
                >
                  <View style={styles.bookmarkThumbnail}>
                    {bookmark.thumbnail ? (
                      <Image source={{ uri: bookmark.thumbnail }} style={styles.thumbnail} />
                    ) : (
                      <Icon name="bookmark" size={24} color="#ff6b6b" />
                    )}
                  </View>
                  <View style={styles.bookmarkInfo}>
                    {editingId === bookmark.id ? (
                      <TextInput
                        style={styles.editInput}
                        value={editingName}
                        onChangeText={setEditingName}
                        onBlur={() => updateBookmark(bookmark.id)}
                        onSubmitEditing={() => updateBookmark(bookmark.id)}
                        autoFocus
                      />
                    ) : (
                      <Text style={styles.bookmarkName}>{bookmark.name}</Text>
                    )}
                    <Text style={styles.bookmarkTime}>
                      {formatTime(bookmark.time)} / {formatTime(duration)}
                    </Text>
                  </View>
                  <View style={styles.bookmarkActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingId(bookmark.id);
                        setEditingName(bookmark.name);
                      }}
                      style={styles.actionButton}
                    >
                      <Icon name="edit" size={20} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteBookmark(bookmark.id)}
                      style={styles.actionButton}
                    >
                      <Icon name="delete" size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    padding: 5,
    backgroundColor: '#ff6b6b',
    borderRadius: 20,
  },
  closeButton: {
    padding: 5,
  },
  addForm: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  addFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formButton: {
    padding: 10,
  },
  saveButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 5,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: '#888',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bookmarkList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bookmarkThumbnail: {
    width: 50,
    height: 50,
    backgroundColor: '#2a2a2a',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkName: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  bookmarkTime: {
    color: '#888',
    fontSize: 12,
  },
  editInput: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#333',
    padding: 5,
    borderRadius: 5,
    marginBottom: 5,
  },
  bookmarkActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 5,
  },
});

export default BookmarkManager;