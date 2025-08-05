import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ProgressViewIOS,
  ProgressBarAndroid,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DownloadManager = ({
  visible,
  onClose,
  videoUrl,
  videoTitle,
  onDownloadComplete,
}) => {
  const [downloads, setDownloads] = useState([]);
  const [activeDownloads, setActiveDownloads] = useState({});
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0 });

  useEffect(() => {
    loadDownloads();
    checkStorage();
  }, []);

  const loadDownloads = async () => {
    try {
      const saved = await AsyncStorage.getItem('video_downloads');
      if (saved) {
        setDownloads(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
  };

  const saveDownloads = async (newDownloads) => {
    try {
      await AsyncStorage.setItem('video_downloads', JSON.stringify(newDownloads));
      setDownloads(newDownloads);
    } catch (error) {
      console.error('Error saving downloads:', error);
    }
  };

  const checkStorage = async () => {
    try {
      const info = await FileSystem.getFreeDiskStorageAsync();
      const total = await FileSystem.getTotalDiskCapacityAsync();
      setStorageInfo({
        used: total - info,
        total: total,
        free: info,
      });
    } catch (error) {
      console.error('Error checking storage:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const startDownload = async (quality = 'original') => {
    try {
      const fileName = `${videoTitle.replace(/[^a-z0-9]/gi, '_')}_${quality}.mp4`;
      const downloadPath = `${FileSystem.documentDirectory}downloads/${fileName}`;
      
      // Create downloads directory if it doesn't exist
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}downloads`,
        { intermediates: true }
      );

      const downloadId = Date.now().toString();
      const download = {
        id: downloadId,
        title: videoTitle,
        quality,
        url: videoUrl,
        path: downloadPath,
        progress: 0,
        status: 'downloading',
        size: 0,
        createdAt: new Date().toISOString(),
      };

      setActiveDownloads({ ...activeDownloads, [downloadId]: download });

      const downloadResumable = FileSystem.createDownloadResumable(
        videoUrl,
        downloadPath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setActiveDownloads(prev => ({
            ...prev,
            [downloadId]: { ...prev[downloadId], progress, size: downloadProgress.totalBytesExpectedToWrite }
          }));
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        const completedDownload = {
          ...download,
          status: 'completed',
          progress: 1,
          path: result.uri,
          size: result.headers['content-length'] || 0,
        };
        
        const newDownloads = [...downloads, completedDownload];
        saveDownloads(newDownloads);
        
        setActiveDownloads(prev => {
          const updated = { ...prev };
          delete updated[downloadId];
          return updated;
        });
        
        Alert.alert('Download Complete', `${videoTitle} has been downloaded successfully`);
        if (onDownloadComplete) {
          onDownloadComplete(completedDownload);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Unable to download video');
    }
  };

  const deleteDownload = async (downloadId) => {
    Alert.alert(
      'Delete Download',
      'Are you sure you want to delete this download?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const download = downloads.find(d => d.id === downloadId);
              if (download && download.path) {
                await FileSystem.deleteAsync(download.path, { idempotent: true });
              }
              const newDownloads = downloads.filter(d => d.id !== downloadId);
              saveDownloads(newDownloads);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete download');
            }
          },
        },
      ]
    );
  };

  const ProgressBar = ({ progress }) => {
    if (Platform.OS === 'ios') {
      return <ProgressViewIOS progress={progress} progressTintColor="#ff6b6b" />;
    }
    return (
      <ProgressBarAndroid
        styleAttr="Horizontal"
        indeterminate={false}
        progress={progress}
        color="#ff6b6b"
      />
    );
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
            <Text style={styles.title}>Download Manager</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Storage Info */}
          <View style={styles.storageInfo}>
            <Icon name="storage" size={24} color="#ff6b6b" />
            <View style={styles.storageDetails}>
              <Text style={styles.storageText}>
                Free: {formatBytes(storageInfo.free)}
              </Text>
              <View style={styles.storageBar}>
                <View
                  style={[
                    styles.storageUsed,
                    { width: `${(storageInfo.used / storageInfo.total) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.storageSubtext}>
                {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}
              </Text>
            </View>
          </View>

          {/* Download Options */}
          {videoUrl && (
            <View style={styles.downloadOptions}>
              <Text style={styles.sectionTitle}>Download Quality</Text>
              <View style={styles.qualityButtons}>
                {['1080p', '720p', '480p', '360p'].map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={styles.qualityButton}
                    onPress={() => startDownload(quality)}
                  >
                    <Icon name="download" size={20} color="#fff" />
                    <Text style={styles.qualityText}>{quality}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Active Downloads */}
          {Object.keys(activeDownloads).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Downloads</Text>
              {Object.values(activeDownloads).map((download) => (
                <View key={download.id} style={styles.downloadItem}>
                  <Icon name="movie" size={24} color="#ff6b6b" />
                  <View style={styles.downloadInfo}>
                    <Text style={styles.downloadTitle} numberOfLines={1}>
                      {download.title}
                    </Text>
                    <Text style={styles.downloadSize}>
                      {formatBytes(download.size * download.progress)} / {formatBytes(download.size)}
                    </Text>
                    <ProgressBar progress={download.progress} />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(download.progress * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Completed Downloads */}
          <ScrollView style={styles.downloadsList}>
            <Text style={styles.sectionTitle}>Downloaded Videos</Text>
            {downloads.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="cloud-download" size={48} color="#666" />
                <Text style={styles.emptyText}>No downloads yet</Text>
              </View>
            ) : (
              downloads.map((download) => (
                <TouchableOpacity
                  key={download.id}
                  style={styles.downloadItem}
                  onPress={() => {
                    onClose();
                    // Play downloaded video
                  }}
                >
                  <Icon name="movie" size={24} color="#ff6b6b" />
                  <View style={styles.downloadInfo}>
                    <Text style={styles.downloadTitle} numberOfLines={1}>
                      {download.title}
                    </Text>
                    <Text style={styles.downloadDetails}>
                      {download.quality} • {formatBytes(download.size)} • {new Date(download.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteDownload(download.id)}
                    style={styles.deleteButton}
                  >
                    <Icon name="delete" size={20} color="#888" />
                  </TouchableOpacity>
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
    maxHeight: '90%',
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
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2a2a2a',
    margin: 15,
    borderRadius: 10,
  },
  storageDetails: {
    flex: 1,
    marginLeft: 15,
  },
  storageText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  storageBar: {
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    marginVertical: 5,
  },
  storageUsed: {
    height: '100%',
    backgroundColor: '#ff6b6b',
    borderRadius: 2,
  },
  storageSubtext: {
    color: '#888',
    fontSize: 12,
  },
  downloadOptions: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  qualityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  qualityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
  },
  qualityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  downloadsList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    marginTop: 10,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    marginBottom: 10,
  },
  downloadInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  downloadTitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  downloadDetails: {
    color: '#888',
    fontSize: 12,
  },
  downloadSize: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  progressText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 10,
  },
});

export default DownloadManager;