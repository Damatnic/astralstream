// playerStore.js - Zustand store for AstralStream
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const usePlayerStore = create((set, get) => ({
  // Current playing video
  currentVideo: null,
  videoHistory: [],
  
  // Player settings
  playerSettings: {
    brightness: 0.5,
    volume: 1.0,
    playbackSpeed: 1.0,
    subtitleSize: 'medium',
    subtitleColor: '#FFFFFF',
    subtitleBackground: 'rgba(0,0,0,0.7)',
    showSubtitles: true,
    autoTranslate: true,
    targetLanguage: 'en',
    enableAutoTranscription: true,
    enableAutoTranslation: true,
    transcriptionLanguage: 'auto',
    whisperApiKey: '',
    translationProvider: 'libretranslate',
  },
  
  // Playback positions
  playbackPositions: {},
  
  // Actions
  setCurrentVideo: (video) => set({ currentVideo: video }),
  
  addToHistory: (video) => set((state) => ({
    videoHistory: [video, ...state.videoHistory.filter(v => v.uri !== video.uri)].slice(0, 50)
  })),
  
  updatePlayerSettings: (settings) => set((state) => ({
    playerSettings: { ...state.playerSettings, ...settings }
  })),
  
  savePlaybackPosition: async (uri, position) => {
    const positions = get().playbackPositions;
    positions[uri] = {
      position,
      timestamp: Date.now()
    };
    set({ playbackPositions: positions });
    
    try {
      await AsyncStorage.setItem('@playback_positions', JSON.stringify(positions));
    } catch (error) {
      console.log('Error saving playback position:', error);
    }
  },
  
  getPlaybackPosition: (uri) => {
    const positions = get().playbackPositions;
    return positions[uri]?.position || 0;
  },
  
  // Load saved data
  loadSavedData: async () => {
    try {
      const [positions, settings, history] = await Promise.all([
        AsyncStorage.getItem('@playback_positions'),
        AsyncStorage.getItem('@player_settings'),
        AsyncStorage.getItem('@video_history')
      ]);
      
      if (positions) {
        set({ playbackPositions: JSON.parse(positions) });
      }
      if (settings) {
        set({ playerSettings: JSON.parse(settings) });
      }
      if (history) {
        set({ videoHistory: JSON.parse(history) });
      }
    } catch (error) {
      console.log('Error loading saved data:', error);
    }
  },
  
  // Save settings
  saveSettings: async () => {
    try {
      const settings = get().playerSettings;
      await AsyncStorage.setItem('@player_settings', JSON.stringify(settings));
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  }
}));

export default usePlayerStore;