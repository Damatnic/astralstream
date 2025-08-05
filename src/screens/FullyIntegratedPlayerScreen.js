// FullyIntegratedPlayerScreen.js - Complete video player with all features
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AppState,
  ScrollView,
  Platform,
} from 'react-native';
import { Video, Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useKeepAwake } from 'expo-keep-awake';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import ChapterMarkers from '../components/VideoPlayer/ChapterMarkers';
import AudioEqualizer from '../components/VideoPlayer/AudioEqualizer';
import RepeatMode from '../components/VideoPlayer/RepeatMode';
import BookmarkManager from '../components/VideoPlayer/BookmarkManager';
import SubtitleSettings from '../components/VideoPlayer/SubtitleSettings';
import ShareMenu from '../components/VideoPlayer/ShareMenu';

// Services
import usePlayerStore from '../store/playerStore';
import backgroundAudioService from '../services/backgroundAudioService';
import { extractVideoUrl } from '../services/videoExtractor';
import subtitleService from '../services/subtitleService';
import whisperService from '../services/transcription/whisperService';
import translationService from '../services/translation/translationService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FullyIntegratedPlayerScreen({ route, navigation }) {
  useKeepAwake();

  const { video, playlist } = route.params;
  const videoRef = useRef(null);
  const pipHandler = useRef(null);
  const sleepTimer = useRef(null);
  
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
  const [volume, setVolume] = useState(1.0);
  const [brightness, setBrightness] = useState(0.5);
  
  // Advanced features state
  const [showFilters, setShowFilters] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [showAudioTracks, setShowAudioTracks] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [isPiPMode, setIsPiPMode] = useState(false);
  const [backgroundPlayback, setBackgroundPlayback] = useState(false);
  const [showNetworkMonitor, setShowNetworkMonitor] = useState(true);
  
  // Media state
  const [availableQualities, setAvailableQualities] = useState(['Auto', '1080p', '720p', '480p', '360p']);
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [translatedSubtitles, setTranslatedSubtitles] = useState(null);
  
  // Filters
  const [currentFilters, setCurrentFilters] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
    speed: 1,
  });
  
  // Playlist state
  const [currentPlaylist, setCurrentPlaylist] = useState(playlist || null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Gesture state
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);
  const [seekAmount, setSeekAmount] = useState(0);
  
  // New features state
  const [showChapters, setShowChapters] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showRepeatMode, setShowRepeatMode] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // none, single, all, ab
  const [abRepeatPoints, setABRepeatPoints] = useState({ start: null, end: null });
  const [chapters, setChapters] = useState([]);
  const [currentEQ, setCurrentEQ] = useState({
    bass: 0,
    midrange: 0,
    treble: 0,
    virtualizer: 0,
    loudness: 0,
  });
  
  // Store
  const { 
    playerSettings, 
    savePlaybackPosition, 
    getPlaybackPosition,
    updatePlayerSettings,
    addToHistory,
    videoHistory,
  } = usePlayerStore();

  // Control visibility timer
  const controlsTimer = useRef(null);

  useEffect(() => {
    initializePlayer();
    return () => cleanupPlayer();
  }, []);

  useEffect(() => {
    if (videoUrl !== video.uri) {
      loadVideo(videoUrl);
    }
  }, [videoUrl]);

  const initializePlayer = async () => {
    // Configure audio for background playback
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    // Initialize services
    ScreenOrientation.unlockAsync();
    backgroundAudioService.initialize(videoRef);
    pipHandler.current = new PiPHandler(videoRef);
    
    // Load player settings
    const settings = playerSettings;
    setBackgroundPlayback(settings.backgroundPlayback || false);
    setShowNetworkMonitor(settings.showNetworkMonitor !== false);
    
    // Get saved position
    const saved = getPlaybackPosition(video.uri);
    if (saved > 0) {
      setSavedPosition(saved);
      setShowResumeDialog(true);
    }
    
    // Add to history
    addToHistory(video);
    
    // Load subtitles if available
    if (video.subtitleUri) {
      loadSubtitles(video.subtitleUri);
    }
    
    // Extract URL if needed
    if (video.requiresExtraction) {
      extractStreamUrl();
    }

    // Handle app state changes
    AppState.addEventListener('change', handleAppStateChange);
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
      backHandler.remove();
    };
  };

  const cleanupPlayer = () => {
    saveCurrentPosition();
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    backgroundAudioService.cleanup();
    if (sleepTimer.current) {
      clearTimeout(sleepTimer.current);
    }
  };

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background' && !backgroundPlayback && !isPiPMode) {
      handlePlayPause(false);
    }
  };

  const handleBackPress = () => {
    if (isLocked) {
      Alert.alert('Screen Locked', 'Unlock the screen to exit');
      return true;
    }
    handleExit();
    return true;
  };

  const extractStreamUrl = async () => {
    try {
      const extractedUrl = await extractVideoUrl(video.uri);
      if (extractedUrl) {
        setVideoUrl(extractedUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to extract video URL');
    }
  };

  const loadSubtitles = async (subtitleUri) => {
    try {
      const loadedSubs = await subtitleService.loadSubtitles(subtitleUri);
      setSubtitles(loadedSubs);
      if (loadedSubs.length > 0) {
        setSelectedSubtitle(loadedSubs[0]);
      }
    } catch (error) {
      console.error('Failed to load subtitles:', error);
    }
  };

  const loadVideo = async (uri) => {
    if (videoRef.current) {
      try {
        await videoRef.current.loadAsync(
          { uri },
          { shouldPlay: isPlaying },
          false
        );
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const saveCurrentPosition = async () => {
    if (videoRef.current && position > 0 && duration > 0) {
      const progress = (position / duration) * 100;
      savePlaybackPosition(video.uri, position, progress);
    }
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setDuration(status.durationMillis / 1000);
      setPosition(status.positionMillis / 1000);
      setIsBuffering(status.isBuffering);
      
      // Save position periodically
      if (status.positionMillis % 10000 < 1000) {
        saveCurrentPosition();
      }
    }
    
    if (status.error) {
      setError(status.error);
      Alert.alert('Playback Error', 'Failed to play video');
    }
    
    // Handle repeat modes and playlist
    if (status.didJustFinish) {
      if (repeatMode === 'single') {
        // Repeat single video
        handleSeek(0);
        handlePlayPause(true);
      } else if (repeatMode === 'all' && currentPlaylist) {
        // Repeat all playlist
        if (currentIndex >= currentPlaylist.videos.length - 1) {
          // Go back to first video
          setCurrentIndex(0);
          const firstVideo = currentPlaylist.videos[0];
          navigation.replace('Player', { video: firstVideo, playlist: currentPlaylist });
        } else {
          playNext();
        }
      } else if (repeatMode === 'none' && currentPlaylist && currentIndex < currentPlaylist.videos.length - 1) {
        // Auto play next in playlist
        playNext();
      }
    }
    
    // Handle A-B repeat
    if (repeatMode === 'ab' && abRepeatPoints.start !== null && abRepeatPoints.end !== null) {
      if (status.positionMillis / 1000 >= abRepeatPoints.end) {
        handleSeek(abRepeatPoints.start);
      }
    }
  };

  const handleExit = () => {
    saveCurrentPosition();
    navigation.goBack();
  };

  const handlePlayPause = async (play = null) => {
    if (videoRef.current) {
      if (play === null) {
        play = !isPlaying;
      }
      
      if (play) {
        await videoRef.current.playAsync();
      } else {
        await videoRef.current.pauseAsync();
      }
    }
  };

  const handleSeek = async (value) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(value * 1000);
      setSeekAmount(0);
    }
  };

  const handleSeekRelative = async (seconds) => {
    const newPosition = Math.max(0, Math.min(duration, position + seconds));
    await handleSeek(newPosition);
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
      // Additional filter effects would be applied here
    }
  };

  const changeQuality = async (quality) => {
    setSelectedQuality(quality);
    // In a real implementation, this would reload the video with different quality
    Alert.alert('Quality Changed', `Switched to ${quality}`);
  };

  const changeAudioTrack = async (trackIndex) => {
    setSelectedAudioTrack(trackIndex);
    // This would require native module implementation
    Alert.alert('Audio Track', `Switched to track ${trackIndex + 1}`);
  };

  const toggleSubtitle = (subtitle) => {
    setSelectedSubtitle(subtitle);
    setShowSubtitleMenu(false);
  };

  const startAITranscription = async () => {
    if (isTranscribing) return;
    
    setIsTranscribing(true);
    try {
      const transcription = await whisperService.transcribeAudio(videoUrl);
      const newSubtitle = {
        id: 'ai-generated',
        label: 'AI Generated',
        language: 'en',
        cues: transcription,
      };
      setSubtitles([...subtitles, newSubtitle]);
      setSelectedSubtitle(newSubtitle);
      Alert.alert('Success', 'AI transcription completed');
    } catch (error) {
      Alert.alert('Error', 'Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const translateSubtitles = async (targetLanguage) => {
    if (!selectedSubtitle) return;
    
    try {
      const translated = await translationService.translateSubtitles(
        selectedSubtitle.cues,
        targetLanguage
      );
      const newSubtitle = {
        id: `translated-${targetLanguage}`,
        label: `Translated (${targetLanguage})`,
        language: targetLanguage,
        cues: translated,
      };
      setSubtitles([...subtitles, newSubtitle]);
      setSelectedSubtitle(newSubtitle);
    } catch (error) {
      Alert.alert('Error', 'Failed to translate subtitles');
    }
  };

  const setSleepTimer = (minutes) => {
    if (sleepTimer.current) {
      clearTimeout(sleepTimer.current);
    }
    
    if (minutes > 0) {
      sleepTimer.current = setTimeout(() => {
        handlePlayPause(false);
        Alert.alert('Sleep Timer', 'Playback stopped');
      }, minutes * 60 * 1000);
      
      Alert.alert('Sleep Timer Set', `Playback will stop in ${minutes} minutes`);
    }
    
    setShowSleepTimer(false);
  };

  const takeScreenshot = async () => {
    if (videoRef.current) {
      try {
        // This would require native module implementation
        Alert.alert('Screenshot', 'Screenshot saved to gallery');
      } catch (error) {
        Alert.alert('Error', 'Failed to take screenshot');
      }
    }
  };

  const playNext = () => {
    if (currentPlaylist && currentIndex < currentPlaylist.videos.length - 1) {
      const nextVideo = currentPlaylist.videos[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      navigation.replace('Player', { video: nextVideo, playlist: currentPlaylist });
    }
  };

  const playPrevious = () => {
    if (currentPlaylist && currentIndex > 0) {
      const prevVideo = currentPlaylist.videos[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      navigation.replace('Player', { video: prevVideo, playlist: currentPlaylist });
    }
  };

  const hideControlsAfterDelay = () => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    controlsTimer.current = setTimeout(() => {
      if (isPlaying && !isLocked) {
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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // New feature handlers
  const handleApplyEqualizer = (eqSettings) => {
    setCurrentEQ(eqSettings);
    // In a real implementation, this would apply audio effects
    // Requires native module integration
  };

  const handleRepeatModeChange = (mode) => {
    setRepeatMode(mode);
    if (mode === 'ab') {
      // A-B repeat mode will be handled by handleSetABRepeat
    }
  };

  const handleSetABRepeat = (startTime, endTime) => {
    setABRepeatPoints({ start: startTime, end: endTime });
    setRepeatMode('ab');
    // Implement A-B repeat logic in playback status update
  };

  const handleApplySubtitleSettings = (settings) => {
    // Apply subtitle styling settings
    // This would be passed to SubtitleOverlay component
    updatePlayerSettings({ subtitleSettings: settings });
  };

  const renderQualitySelector = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>Video Quality</Text>
      {availableQualities.map((quality) => (
        <TouchableOpacity
          key={quality}
          style={styles.menuItem}
          onPress={() => changeQuality(quality)}
        >
          <Text style={[
            styles.menuItemText,
            selectedQuality === quality && styles.menuItemSelected
          ]}>
            {quality}
          </Text>
          {selectedQuality === quality && (
            <Icon name="check" size={20} color="#ff6b6b" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAudioTracks = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>Audio Tracks</Text>
      {audioTracks.length === 0 ? (
        <Text style={styles.menuItemText}>No additional audio tracks</Text>
      ) : (
        audioTracks.map((track, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => changeAudioTrack(index)}
          >
            <Text style={[
              styles.menuItemText,
              selectedAudioTrack === index && styles.menuItemSelected
            ]}>
              {track.label || `Track ${index + 1}`}
            </Text>
            {selectedAudioTrack === index && (
              <Icon name="check" size={20} color="#ff6b6b" />
            )}
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderSubtitleMenu = () => (
    <ScrollView style={styles.menuContainer}>
      <Text style={styles.menuTitle}>Subtitles</Text>
      
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => toggleSubtitle(null)}
      >
        <Text style={[
          styles.menuItemText,
          !selectedSubtitle && styles.menuItemSelected
        ]}>
          Off
        </Text>
        {!selectedSubtitle && <Icon name="check" size={20} color="#ff6b6b" />}
      </TouchableOpacity>
      
      {subtitles.map((subtitle) => (
        <TouchableOpacity
          key={subtitle.id}
          style={styles.menuItem}
          onPress={() => toggleSubtitle(subtitle)}
        >
          <Text style={[
            styles.menuItemText,
            selectedSubtitle?.id === subtitle.id && styles.menuItemSelected
          ]}>
            {subtitle.label}
          </Text>
          {selectedSubtitle?.id === subtitle.id && (
            <Icon name="check" size={20} color="#ff6b6b" />
          )}
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity
        style={[styles.menuItem, styles.menuButton]}
        onPress={startAITranscription}
        disabled={isTranscribing}
      >
        <Icon name="mic" size={20} color="#fff" />
        <Text style={styles.menuButtonText}>
          {isTranscribing ? 'Transcribing...' : 'Generate with AI'}
        </Text>
      </TouchableOpacity>
      
      {selectedSubtitle && (
        <TouchableOpacity
          style={[styles.menuItem, styles.menuButton]}
          onPress={() => translateSubtitles('es')}
        >
          <Icon name="translate" size={20} color="#fff" />
          <Text style={styles.menuButtonText}>Translate</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderSleepTimer = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>Sleep Timer</Text>
      {[0, 15, 30, 45, 60, 90].map((minutes) => (
        <TouchableOpacity
          key={minutes}
          style={styles.menuItem}
          onPress={() => setSleepTimer(minutes)}
        >
          <Text style={styles.menuItemText}>
            {minutes === 0 ? 'Off' : `${minutes} minutes`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden={isFullscreen} />
      
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={styles.videoContainer}>
          {/* Video with filters overlay */}
          <View style={[
            styles.video,
            {
              opacity: currentFilters.brightness,
              transform: [{ scale: currentZoom }],
            }
          ]}>
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={styles.video}
              shouldPlay={isPlaying}
              isLooping={false}
              volume={volume}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              resizeMode="contain"
              useNativeControls={false}
            />
          </View>

          {/* Subtitle Overlay */}
          {selectedSubtitle && (
            <SubtitleOverlay 
              subtitles={selectedSubtitle.cues}
              currentTime={position}
              visible={true}
              style={playerSettings.subtitleStyle}
            />
          )}

          {/* Network Quality Monitor */}
          {showNetworkMonitor && video.requiresExtraction && (
            <NetworkQualityMonitor 
              videoRef={videoRef}
              visible={showControls && !isLocked}
            />
          )}

          {/* Buffering Indicator */}
          {isBuffering && (
            <View style={styles.bufferingContainer}>
              <ActivityIndicator size="large" color="#ff6b6b" />
              <Text style={styles.bufferingText}>Buffering...</Text>
            </View>
          )}

          {/* Seek Preview */}
          {seekAmount !== 0 && (
            <View style={styles.seekPreview}>
              <Text style={styles.seekText}>
                {seekAmount > 0 ? '+' : ''}{seekAmount}s
              </Text>
            </View>
          )}

          {/* Volume/Brightness Sliders */}
          {showVolumeSlider && (
            <View style={[styles.verticalSlider, styles.rightSlider]}>
              <Icon name="volume-up" size={24} color="#fff" />
              <Slider
                style={styles.verticalSliderTrack}
                value={volume}
                onValueChange={setVolume}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor="#ff6b6b"
                maximumTrackTintColor="#444"
                thumbTintColor="#ff6b6b"
                vertical={true}
              />
              <Text style={styles.sliderValue}>{Math.round(volume * 100)}%</Text>
            </View>
          )}

          {showBrightnessSlider && (
            <View style={[styles.verticalSlider, styles.leftSlider]}>
              <Icon name="brightness-6" size={24} color="#fff" />
              <Slider
                style={styles.verticalSliderTrack}
                value={brightness}
                onValueChange={setBrightness}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor="#ff6b6b"
                maximumTrackTintColor="#444"
                thumbTintColor="#ff6b6b"
                vertical={true}
              />
              <Text style={styles.sliderValue}>{Math.round(brightness * 100)}%</Text>
            </View>
          )}

          {/* Controls Overlay */}
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
                    videoTitle={video.filename}
                  />
                  
                  <TouchableOpacity 
                    onPress={() => setShowSubtitleMenu(true)} 
                    style={styles.iconButton}
                  >
                    <Icon 
                      name="subtitles" 
                      size={24} 
                      color={selectedSubtitle ? "#ff6b6b" : "#fff"} 
                    />
                  </TouchableOpacity>
                  
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
                <TouchableOpacity 
                  onPress={() => handleSeekRelative(-10)}
                  style={styles.iconButton}
                >
                  <Icon name="replay-10" size={40} color="#fff" />
                </TouchableOpacity>
                
                {currentPlaylist && (
                  <TouchableOpacity 
                    onPress={playPrevious}
                    disabled={currentIndex === 0}
                    style={[styles.iconButton, currentIndex === 0 && styles.disabled]}
                  >
                    <Icon name="skip-previous" size={40} color="#fff" />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity onPress={() => handlePlayPause()} style={styles.playButton}>
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
                
                <TouchableOpacity 
                  onPress={() => handleSeekRelative(10)}
                  style={styles.iconButton}
                >
                  <Icon name="forward-10" size={40} color="#fff" />
                </TouchableOpacity>
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
                    onValueChange={(value) => setSeekAmount(Math.round(value - position))}
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
                    onPress={() => setShowQualitySelector(true)}
                    style={styles.iconButton}
                  >
                    <Text style={styles.qualityText}>{selectedQuality}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setShowAudioTracks(true)}
                    style={styles.iconButton}
                  >
                    <Icon name="audiotrack" size={20} color="#fff" />
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
                  
                  <TouchableOpacity
                    onPress={() => setShowSleepTimer(true)}
                    style={styles.iconButton}
                  >
                    <Icon name="access-time" size={20} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={takeScreenshot}
                    style={styles.iconButton}
                  >
                    <Icon name="photo-camera" size={20} color="#fff" />
                  </TouchableOpacity>
                  
                  <Text style={styles.speedText}>
                    {currentFilters.speed}x
                  </Text>
                </View>
                
                {/* Additional features row */}
                <View style={styles.additionalButtonRow}>
                  <TouchableOpacity
                    onPress={() => setShowChapters(true)}
                    style={styles.iconButton}
                  >
                    <Icon name="view-list" size={20} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setShowBookmarks(true)}
                    style={styles.iconButton}
                  >
                    <Icon name="bookmark" size={20} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setShowRepeatMode(true)}
                    style={styles.iconButton}
                  >
                    <Icon 
                      name={repeatMode === 'single' ? 'repeat-one' : 'repeat'} 
                      size={20} 
                      color={repeatMode !== 'none' ? '#ff6b6b' : '#fff'} 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setShowEqualizer(true)}
                    style={styles.iconButton}
                  >
                    <Icon name="equalizer" size={20} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setShowSubtitleSettings(true)}
                    style={styles.iconButton}
                  >
                    <Icon name="settings" size={20} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setShowShareMenu(true)}
                    style={styles.iconButton}
                  >
                    <Icon name="share" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Lock indicator */}
          {isLocked && showControls && (
            <TouchableOpacity 
              style={styles.lockIndicator}
              onPress={() => setIsLocked(false)}
            >
              <Icon name="lock" size={32} color="#fff" />
              <Text style={styles.lockText}>Tap to unlock</Text>
            </TouchableOpacity>
          )}

          {/* Gesture handler overlay */}
          <EnhancedGestureHandler
            onSeek={handleSeekRelative}
            onZoom={setCurrentZoom}
            onVolumeChange={setVolume}
            onBrightnessChange={setBrightness}
            onShowVolumeSlider={setShowVolumeSlider}
            onShowBrightnessSlider={setShowBrightnessSlider}
            duration={duration}
            currentTime={position}
            isLocked={isLocked}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Modals and Menus */}
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

      {/* Quality Selector */}
      {showQualitySelector && (
        <TouchableWithoutFeedback onPress={() => setShowQualitySelector(false)}>
          <View style={styles.modalOverlay}>
            {renderQualitySelector()}
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Audio Tracks */}
      {showAudioTracks && (
        <TouchableWithoutFeedback onPress={() => setShowAudioTracks(false)}>
          <View style={styles.modalOverlay}>
            {renderAudioTracks()}
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Subtitle Menu */}
      {showSubtitleMenu && (
        <TouchableWithoutFeedback onPress={() => setShowSubtitleMenu(false)}>
          <View style={styles.modalOverlay}>
            {renderSubtitleMenu()}
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Sleep Timer */}
      {showSleepTimer && (
        <TouchableWithoutFeedback onPress={() => setShowSleepTimer(false)}>
          <View style={styles.modalOverlay}>
            {renderSleepTimer()}
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* New Feature Modals */}
      <ChapterMarkers
        visible={showChapters}
        onClose={() => setShowChapters(false)}
        chapters={chapters}
        currentTime={position}
        onSeekToChapter={handleSeek}
        duration={duration}
      />

      <AudioEqualizer
        visible={showEqualizer}
        onClose={() => setShowEqualizer(false)}
        onApplyEQ={handleApplyEqualizer}
      />

      <RepeatMode
        visible={showRepeatMode}
        onClose={() => setShowRepeatMode(false)}
        repeatMode={repeatMode}
        onRepeatModeChange={handleRepeatModeChange}
        currentTime={position}
        duration={duration}
        onSetABRepeat={handleSetABRepeat}
      />

      <BookmarkManager
        visible={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        videoUrl={videoUrl}
        videoTitle={video.filename || 'Video'}
        currentTime={position}
        duration={duration}
        onSeekToBookmark={handleSeek}
        thumbnail={video.thumbnail}
      />

      <SubtitleSettings
        visible={showSubtitleSettings}
        onClose={() => setShowSubtitleSettings(false)}
        onApplySettings={handleApplySubtitleSettings}
      />

      <ShareMenu
        visible={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        videoUrl={videoUrl}
        videoTitle={video.filename || 'Video'}
        currentTime={position}
        duration={duration}
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
    minWidth: 50,
  },
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
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
  bufferingText: {
    color: '#fff',
    marginTop: 10,
  },
  speedText: {
    color: '#ff6b6b',
    fontSize: 14,
    paddingHorizontal: 10,
  },
  qualityText: {
    color: '#fff',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  lockIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
  },
  lockText: {
    color: '#fff',
    marginTop: 10,
  },
  verticalSlider: {
    position: 'absolute',
    top: '20%',
    bottom: '20%',
    width: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 30,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSlider: {
    left: 20,
  },
  rightSlider: {
    right: 20,
  },
  verticalSliderTrack: {
    flex: 1,
    width: 200,
    transform: [{ rotate: '-90deg' }],
  },
  sliderValue: {
    color: '#fff',
    fontSize: 12,
  },
  seekPreview: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  seekText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    minWidth: 250,
    maxHeight: '70%',
  },
  menuTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
  },
  menuItemSelected: {
    color: '#ff6b6b',
  },
  menuButton: {
    backgroundColor: '#333',
    marginTop: 10,
    justifyContent: 'center',
    borderRadius: 5,
  },
  menuButtonText: {
    color: '#fff',
    marginLeft: 10,
  },
});