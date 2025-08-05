import { Audio } from 'expo-av';
import { AppState } from 'react-native';

export class BackgroundAudioService {
  constructor() {
    this.isBackgroundEnabled = false;
    this.appStateSubscription = null;
    this.videoRef = null;
  }

  async initialize(videoRef) {
    this.videoRef = videoRef;
    
    // Configure audio to play in background
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    });

    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  handleAppStateChange = async (nextAppState) => {
    if (!this.videoRef?.current || !this.isBackgroundEnabled) return;

    if (nextAppState === 'background') {
      // App is going to background
      try {
        const status = await this.videoRef.current.getStatusAsync();
        if (status.isPlaying) {
          // Continue playing audio only
          console.log('Continuing audio playback in background');
        }
      } catch (error) {
        console.error('Background audio error:', error);
      }
    } else if (nextAppState === 'active') {
      // App is coming to foreground
      console.log('App returned to foreground');
    }
  };

  setBackgroundPlayback(enabled) {
    this.isBackgroundEnabled = enabled;
  }

  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

export default new BackgroundAudioService();