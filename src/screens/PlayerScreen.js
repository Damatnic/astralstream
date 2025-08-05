// PlayerScreen.js - Main video player with controls and gestures
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
  PanResponder,
  Animated,
} from 'react-native';
import { Video } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useKeepAwake } from 'expo-keep-awake';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import usePlayerStore from '../store/playerStore';
import VideoControls from '../components/VideoPlayer/VideoControls';
import EnhancedGestureHandler from '../components/VideoPlayer/EnhancedGestureHandler';
import SubtitleOverlay from '../components/SubtitleOverlay/SubtitleOverlay';
import ResumeDialog from '../components/ResumeDialog/ResumeDialog';
import { extractVideoUrl } from '../services/videoExtractor';
import whisperService from '../services/transcription/whisperService';
import translationService from '../services/translation/translationService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PlayerScreen({ route, navigation }) {
  useKeepAwake(); // Keep screen awake while playing

  const { video } = route.params;
  const videoRef = useRef(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoUrl, setVideoUrl] = useState(video.uri);
  const [error, setError] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedPosition, setSavedPosition] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(1);
  
  // Gesture state
  const [brightness, setBrightness] = useState(0.5);
  const [volume, setVolume] = useState(1.0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);
  
  // AI state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [subtitles, setSubtitles] = useState(null);
  const [translatedSubtitles, setTranslatedSubtitles] = useState(null);
  
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
    // Set initial orientation
    ScreenOrientation.unlockAsync();
    
    // Extract video URL if needed
    if (video.requiresExtraction) {
      extractStreamUrl();
    }

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
      saveCurrentPosition();
    };
  }, []);

  const extractStreamUrl = async () => {
    setExtracting(true);
    try {
      const extractedUrl = await extractVideoUrl(video);
      if (extractedUrl) {
        setVideoUrl(extractedUrl);
      } else {
        setError('Failed to extract video URL');
      }
    } catch (error) {
      console.log('Extraction error:', error);
      setError('Failed to load video from this source');
    } finally {
      setExtracting(false);
    }
  };

  const handleExit = () => {
    saveCurrentPosition();
    navigation.goBack();
  };

  const saveCurrentPosition = async () => {
    if (position > 0 && duration > 0) {
      await savePlaybackPosition(video.uri, position);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
    resetControlsTimer();
  };

  const seekTo = async (time) => {
    await videoRef.current?.setPositionAsync(time);
    resetControlsTimer();
  };

  const seekForward = () => {
    const newPosition = Math.min(position + 10000, duration);
    seekTo(newPosition);
  };

  const seekBackward = () => {
    const newPosition = Math.max(position - 10000, 0);
    seekTo(newPosition);
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
    setIsFullscreen(!isFullscreen);
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);
    resetControlsTimer();
  };

  const handleZoomChange = (zoom) => {
    setCurrentZoom(zoom);
  };

  const handleResume = () => {
    setShowResumeDialog(false);
    seekTo(savedPosition);
  };

  const handleRestart = () => {
    setShowResumeDialog(false);
    seekTo(0);
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsBuffering(status.isBuffering);
      
      if (status.didJustFinish) {
        // Video ended
        handleExit();
      }
      
      // Start AI transcription if enabled and video is playing
      if (status.isPlaying && playerSettings.enableAutoTranscription && !isTranscribing && !subtitles) {
        startTranscription();
      }
    }
    
    if (status.error) {
      setError('Playback error occurred');
      console.log('Playback error:', status.error);
    }
  };

  const resetControlsTimer = () => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    
    setShowControls(true);
    
    if (isPlaying) {
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleScreenTap = () => {
    if (!isLocked) {
      setShowControls(!showControls);
      if (!showControls) {
        resetControlsTimer();
      }
    }
  };

  const startTranscription = async () => {
    if (playerSettings.enableAutoTranscription && !isTranscribing) {
      setIsTranscribing(true);
      try {
        const transcription = await whisperService.transcribeVideo(videoUrl, {
          language: playerSettings.transcriptionLanguage,
          onProgress: (progress) => {
            console.log('Transcription progress:', progress);
          }
        });
        
        if (transcription) {
          setSubtitles(transcription);
          
          // Auto-translate if enabled
          if (playerSettings.enableAutoTranslation && playerSettings.targetLanguage !== playerSettings.transcriptionLanguage) {
            const translated = await translationService.translateSubtitles(
              transcription,
              playerSettings.transcriptionLanguage,
              playerSettings.targetLanguage
            );
            setTranslatedSubtitles(translated);
          }
        }
      } catch (error) {
        console.error('Transcription error:', error);
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (extracting) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Extracting video stream...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={60} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={handleExit}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            shouldPlay={true}
            isLooping={false}
            volume={volume}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            resizeMode="contain"
            usePoster={false}
          />
          
          {isBuffering && (
            <View style={styles.bufferingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          
          <EnhancedGestureHandler
            onSeekForward={seekForward}
            onSeekBackward={seekBackward}
            onVolumeChange={(v) => {
              setVolume(v);
              setShowVolumeSlider(true);
              setTimeout(() => setShowVolumeSlider(false), 2000);
            }}
            onBrightnessChange={(b) => {
              setBrightness(b);
              setShowBrightnessSlider(true);
              setTimeout(() => setShowBrightnessSlider(false), 2000);
            }}
            onZoomChange={handleZoomChange}
          />
          
          {showControls && (
            <VideoControls
              isPlaying={isPlaying}
              duration={duration}
              position={position}
              onPlayPause={togglePlayPause}
              onSeek={seekTo}
              onSeekForward={seekForward}
              onSeekBackward={seekBackward}
              onFullscreen={toggleFullscreen}
              onExit={handleExit}
              formatTime={formatTime}
              title={video.filename}
              playbackSpeed={playerSettings.playbackSpeed}
              onSpeedChange={(speed) => {
                videoRef.current?.setRateAsync(speed, true);
                updatePlayerSettings({ playbackSpeed: speed });
              }}
              isLocked={isLocked}
              onLockToggle={toggleLock}
            />
          )}
          
          {/* Volume indicator */}
          {showVolumeSlider && (
            <View style={[styles.indicator, styles.volumeIndicator]}>
              <Icon name="volume-up" size={24} color="#fff" />
              <View style={styles.indicatorBar}>
                <View style={[styles.indicatorFill, { width: `${volume * 100}%` }]} />
              </View>
            </View>
          )}
          
          {/* Brightness indicator */}
          {showBrightnessSlider && (
            <View style={[styles.indicator, styles.brightnessIndicator]}>
              <Icon name="brightness-6" size={24} color="#fff" />
              <View style={styles.indicatorBar}>
                <View style={[styles.indicatorFill, { width: `${brightness * 100}%` }]} />
              </View>
            </View>
          )}
          
          <SubtitleOverlay
            videoUri={video.uri}
            currentTime={position / 1000}
            settings={playerSettings}
            subtitles={translatedSubtitles || subtitles}
            isTranscribing={isTranscribing}
          />
          
          {/* Resume Dialog */}
          <ResumeDialog
            visible={showResumeDialog}
            onResume={handleResume}
            onRestart={handleRestart}
            position={savedPosition}
            formatTime={formatTime}
          />
        </View>
      </TouchableWithoutFeedback>
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
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  bufferingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  indicator: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  volumeIndicator: {
    right: 20,
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  brightnessIndicator: {
    left: 20,
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  indicatorBar: {
    width: 100,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginLeft: 10,
    borderRadius: 2,
  },
  indicatorFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});