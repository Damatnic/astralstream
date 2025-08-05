import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ChapterMarkers = ({ 
  visible, 
  onClose, 
  chapters = [], 
  currentTime, 
  onSeekToChapter,
  duration 
}) => {
  const [activeChapter, setActiveChapter] = useState(null);

  useEffect(() => {
    // Find active chapter based on current time
    const active = chapters.findIndex((chapter, index) => {
      const nextChapter = chapters[index + 1];
      const chapterEnd = nextChapter ? nextChapter.time : duration;
      return currentTime >= chapter.time && currentTime < chapterEnd;
    });
    setActiveChapter(active);
  }, [currentTime, chapters, duration]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const defaultChapters = chapters.length === 0 ? [
    { id: '1', title: 'Introduction', time: 0, thumbnail: null },
    { id: '2', title: 'Main Content', time: duration * 0.1, thumbnail: null },
    { id: '3', title: 'Conclusion', time: duration * 0.8, thumbnail: null },
  ] : chapters;

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
            <Text style={styles.title}>Chapters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chapterList}>
            {defaultChapters.map((chapter, index) => (
              <TouchableOpacity
                key={chapter.id || index}
                style={[
                  styles.chapterItem,
                  activeChapter === index && styles.activeChapter
                ]}
                onPress={() => {
                  onSeekToChapter(chapter.time);
                  onClose();
                }}
              >
                <View style={styles.chapterThumbnail}>
                  {chapter.thumbnail ? (
                    <Image source={{ uri: chapter.thumbnail }} style={styles.thumbnail} />
                  ) : (
                    <Icon name="movie" size={30} color="#666" />
                  )}
                </View>
                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterTitle} numberOfLines={2}>
                    {chapter.title}
                  </Text>
                  <Text style={styles.chapterTime}>
                    {formatTime(chapter.time)}
                  </Text>
                </View>
                {activeChapter === index && (
                  <Icon name="play-circle-filled" size={24} color="#ff6b6b" />
                )}
              </TouchableOpacity>
            ))}
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
    maxHeight: '70%',
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
  closeButton: {
    padding: 5,
  },
  chapterList: {
    padding: 10,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#2a2a2a',
  },
  activeChapter: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: '#ff6b6b',
    borderWidth: 1,
  },
  chapterThumbnail: {
    width: 60,
    height: 40,
    backgroundColor: '#333',
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
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  chapterTime: {
    color: '#888',
    fontSize: 12,
  },
});

export default ChapterMarkers;