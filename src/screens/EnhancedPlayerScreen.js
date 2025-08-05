// EnhancedPlayerScreen.js - Video player with advanced features
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';
import { Video } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useKeepAwake } from 'expo-keep-awake';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';

// Components
import VideoControls from '../components/VideoPlayer/VideoControls';
import EnhancedGestureHandler from '../components/VideoPlayer/EnhancedGestureHandler';
import SubtitleOverlay from '../components/SubtitleOverlay/SubtitleOverlay';
import ResumeDialog from '../components/ResumeDialog/ResumeDialog';
import VideoFilters from '../components/VideoPlayer/VideoFilters';
import PlaylistManager from '../components/Playlist/PlaylistManager';
import PiPHandler from '../components/VideoPlayer/PiPHandler';
import NetworkQualityMonitor from '../components/VideoPlayer/NetworkQualityMonitor';
import CastButton from '../components/VideoPlayer/CastButton';

// Services
import usePlayerStore from '../store/playerStore';
import backgroundAudioService from '../services/backgroundAudioService';
import { extractVideoUrl } from '../services/videoExtractor';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function EnhancedPlayerScreen({ route, navigation }) {
  useKeepAwake();

  const { video, playlist } = route.params;
  const videoRef = useRef(null);
  const pipHandler = useRef(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoUrl, setVideoUrl] = useState(video.uri);
  const [error, setError] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedPosition, setSavedPosition] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(1);
  
  // Advanced features state
  const [showFilters, setShowFilters] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isPiPMode, setIsPiPMode] = useState(false);
  const [backgroundPlayback, setBackgroundPlayback] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
    speed: 1,
  });
  
  // Playlist state
  const [currentPlaylist, setCurrentPlaylist] = useState(playlist || null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Store
  const { 
    playerSettings, 
    savePlaybackPosition, 
    getPlaybackPosition,
    updatePlayerSettings 
  } = usePlayerStore();

  // Control visibility timer
  const controlsTimer = useRef(null);

  useEffect(() => {
    // Initialize services
    ScreenOrientation.unlockAsync();
    backgroundAudioService.initialize(videoRef);
    pipHandler.current = new PiPHandler(videoRef);
    
    // Get saved position
    const saved = getPlaybackPosition(video.uri);
    if (saved > 0) {
      setSavedPosition(saved);
      setShowResumeDialog(true);
    }

    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });

    return () => {
      backHandler.remove();
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      backgroundAudioService.cleanup();
      saveCurrentPosition();
    };
  }, []);

  const saveCurrentPosition = async () => {
    if (videoRef.current && position > 0) {
      savePlaybackPosition(videoUrl, position);
    }
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setDuration(status.durationMillis / 1000);
      setPosition(status.positionMillis / 1000);
      setIsBuffering(status.isBuffering);
    }
    if (status.error) {
      setError(status.error);
      Alert.alert('Playback Error', 'Failed to play video');
    }
    // Auto play next in playlist
    if (status.didJustFinish && currentPlaylist && currentIndex < currentPlaylist.videos.length - 1) {
      playNext();
    }
  };

  const handleExit = () => {
    saveCurrentPosition();
    navigation.goBack();
  };

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const handleSeek = async (value) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(value * 1000);
    }
  };

  const handleResumeChoice = (resume) => {
    setShowResumeDialog(false);
    if (resume && savedPosition > 0) {
      handleSeek(savedPosition);
    }
  };

  // Advanced features handlers
  const togglePiP = async () => {
    if (pipHandler.current) {
      if (isPiPMode) {
        await pipHandler.current.exitPiP();
        setIsPiPMode(false);
      } else {
        const success = await pipHandler.current.enterPiP();
        if (success) {
          setIsPiPMode(true);
          navigation.goBack();
        } else {
          Alert.alert('PiP Not Supported', 'Picture-in-Picture is not available on this device');
        }
      }
    }
  };

  const toggleBackgroundPlayback = () => {
    const newValue = !backgroundPlayback;
    setBackgroundPlayback(newValue);
    backgroundAudioService.setBackgroundPlayback(newValue);
    updatePlayerSettings({ backgroundPlayback: newValue });
  };

  const applyVideoFilters = async (filters) => {
    setCurrentFilters(filters);
    if (videoRef.current) {
      await videoRef.current.setRateAsync(filters.speed, true);
      // Note: Brightness, contrast, and saturation would require native modules
      // or overlays to implement properly
    }
  };

  const playNext = () => {
    if (currentPlaylist && currentIndex < currentPlaylist.videos.length - 1) {
      const nextVideo = currentPlaylist.videos[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      setVideoUrl(nextVideo.uri);
      // Reset video state
      setPosition(0);
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (currentPlaylist && currentIndex > 0) {
      const prevVideo = currentPlaylist.videos[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      setVideoUrl(prevVideo.uri);
      // Reset video state
      setPosition(0);
      setIsPlaying(true);
    }
  };

  const hideControlsAfterDelay = () => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    controlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) {
      hideControlsAfterDelay();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={isFullscreen} />
      
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={[styles.video, { transform: [{ scale: currentZoom }] }]}
            shouldPlay={isPlaying}
            isLooping={false}
            volume={1.0}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            resizeMode="contain"
            useNativeControls={false}
          />

          <SubtitleOverlay 
            videoRef={videoRef}
            currentTime={position}
            visible={true}
          />

          <NetworkQualityMonitor 
            videoRef={videoRef}
            visible={showControls && !isLocked}
          />

          {isBuffering && (
            <View style={styles.bufferingContainer}>
              <ActivityIndicator size="large" color="#ff6b6b" />
            </View>
          )}

          {showControls && !isLocked && (
            <View style={styles.controlsOverlay}>
              {/* Top controls */}
              <View style={styles.topControls}>
                <TouchableOpacity onPress={handleExit} style={styles.iconButton}>
                  <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.videoTitle} numberOfLines={1}>
                  {video.filename || 'Video Player'}
                </Text>
                <View style={styles.topRightControls}>
                  <CastButton 
                    videoUrl={videoUrl}
                    videoTitle={video.filename || 'Video'}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPlaylist(true)} 
                    style={styles.iconButton}
                  >
                    <Icon name="playlist-play" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowFilters(true)} 
                    style={styles.iconButton}
                  >
                    <Icon name="tune" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={togglePiP} style={styles.iconButton}>
                    <Icon name="picture-in-picture-alt" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Center controls */}
              <View style={styles.centerControls}>
                {currentPlaylist && (
                  <TouchableOpacity 
                    onPress={playPrevious}
                    disabled={currentIndex === 0}
                    style={[styles.iconButton, currentIndex === 0 && styles.disabled]}
                  >
                    <Icon name="skip-previous" size={40} color="#fff" />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
                  <Icon 
                    name={isPlaying ? "pause" : "play-arrow"} 
                    size={50} 
                    color="#fff" 
                  />
                </TouchableOpacity>

                {currentPlaylist && (
                  <TouchableOpacity 
                    onPress={playNext}
                    disabled={currentIndex >= currentPlaylist.videos.length - 1}
                    style={[styles.iconButton, 
                      currentIndex >= currentPlaylist.videos.length - 1 && styles.disabled
                    ]}
                  >
                    <Icon name="skip-next" size={40} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Bottom controls */}
              <View style={styles.bottomControls}>
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Slider
                    style={styles.progressBar}
                    value={position}
                    minimumValue={0}
                    maximumValue={duration}
                    onSlidingComplete={handleSeek}
                    minimumTrackTintColor="#ff6b6b"
                    maximumTrackTintColor="#444"
                    thumbTintColor="#ff6b6b"
                  />
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
                
                <View style={styles.bottomButtonRow}>
                  <TouchableOpacity
                    onPress={() => setIsLocked(!isLocked)}
                    style={styles.iconButton}
                  >
                    <Icon 
                      name={isLocked ? "lock" : "lock-open"} 
                      size={20} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={toggleBackgroundPlayback}
                    style={styles.iconButton}
                  >
                    <Icon 
                      name="headset" 
                      size={20} 
                      color={backgroundPlayback ? "#ff6b6b" : "#fff"} 
                    />
                  </TouchableOpacity>
                  
                  <Text style={styles.speedText}>
                    {currentFilters.speed}x
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Gesture handler overlay */}
          <EnhancedGestureHandler
            onSeek={handleSeek}
            onZoom={setCurrentZoom}
            duration={duration}
            currentTime={position}
            isLocked={isLocked}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Modals */}
      <ResumeDialog
        visible={showResumeDialog}
        onResume={() => handleResumeChoice(true)}
        onRestart={() => handleResumeChoice(false)}
        position={savedPosition}
      />

      <VideoFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={applyVideoFilters}
      />

      <PlaylistManager
        visible={showPlaylist}
        onClose={() => setShowPlaylist(false)}
        currentVideo={video}
        onSelectPlaylist={(playlist) => {
          setCurrentPlaylist(playlist);
          setShowPlaylist(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: screenWidth,
    height: screenHeight,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  topRightControls: {
    flexDirection: 'row',
  },
  videoTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 20,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
  },
  playButton: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    marginHorizontal: 20,
  },
  bufferingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  speedText: {
    color: '#ff6b6b',
    fontSize: 14,
    paddingHorizontal: 10,
  },
  disabled: {
    opacity: 0.5,
  },
});