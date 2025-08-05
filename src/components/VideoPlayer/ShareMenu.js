import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

const ShareMenu = ({
  visible,
  onClose,
  videoUrl,
  videoTitle,
  currentTime,
  duration,
}) => {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleShareVideo = async () => {
    try {
      // Share video info
      const message = `Check out "${videoTitle}"\n\nVideo: ${videoUrl}`;
      
      const result = await Share.share({
        message,
        title: videoTitle,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share video');
    }
  };

  const handleShareTimestamp = async () => {
    try {
      const timestamp = formatTime(currentTime);
      const message = `"${videoTitle}" at ${timestamp}\n\nVideo: ${videoUrl}&t=${Math.floor(currentTime)}`;
      
      await Share.share({
        message,
        title: `${videoTitle} - ${timestamp}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share timestamp');
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(videoUrl);
      Alert.alert('Success', 'Video link copied to clipboard');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleCopyTimestampLink = async () => {
    try {
      const timestampUrl = `${videoUrl}&t=${Math.floor(currentTime)}`;
      await Clipboard.setStringAsync(timestampUrl);
      Alert.alert('Success', 'Timestamp link copied to clipboard');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to copy timestamp link');
    }
  };

  const handleGenerateQRCode = () => {
    setIsGeneratingLink(true);
    // Simulate QR code generation
    setTimeout(() => {
      setIsGeneratingLink(false);
      Alert.alert('QR Code', 'QR code generation would be implemented here');
    }, 1000);
  };

  const handleShareFile = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Check if the video is a local file
      if (videoUrl.startsWith('file://')) {
        await Sharing.shareAsync(videoUrl);
      } else {
        Alert.alert('Info', 'This feature is only available for local files');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const shareOptions = [
    {
      id: 'video',
      icon: 'movie',
      label: 'Share Video',
      onPress: handleShareVideo,
    },
    {
      id: 'timestamp',
      icon: 'access-time',
      label: 'Share with Timestamp',
      onPress: handleShareTimestamp,
    },
    {
      id: 'copyLink',
      icon: 'link',
      label: 'Copy Link',
      onPress: handleCopyLink,
    },
    {
      id: 'copyTimestamp',
      icon: 'content-copy',
      label: 'Copy Timestamp Link',
      onPress: handleCopyTimestampLink,
    },
    {
      id: 'qr',
      icon: 'qr-code',
      label: 'Generate QR Code',
      onPress: handleGenerateQRCode,
    },
    {
      id: 'file',
      icon: 'folder',
      label: 'Share File',
      onPress: handleShareFile,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalContainer}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Share</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {videoTitle}
            </Text>
            <Text style={styles.videoTime}>
              Current: {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionButton}
                onPress={option.onPress}
                disabled={isGeneratingLink && option.id === 'qr'}
              >
                <View style={styles.optionIcon}>
                  <Icon name={option.icon} size={24} color="#ff6b6b" />
                </View>
                <Text style={styles.optionLabel}>{option.label}</Text>
                {isGeneratingLink && option.id === 'qr' && (
                  <ActivityIndicator size="small" color="#ff6b6b" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.socialShare}>
            <Text style={styles.socialTitle}>Share to:</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="chat" size={24} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="telegram" size={24} color="#0088cc" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="email" size={24} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="more-horiz" size={24} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
    paddingBottom: 20,
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
  videoInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  videoTime: {
    color: '#888',
    fontSize: 14,
  },
  optionsContainer: {
    padding: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    marginBottom: 10,
  },
  optionIcon: {
    width: 40,
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  socialShare: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  socialTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ShareMenu;