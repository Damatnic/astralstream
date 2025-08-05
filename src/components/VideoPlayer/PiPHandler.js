import { Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

export class PiPHandler {
  constructor(videoRef) {
    this.videoRef = videoRef;
    this.isPiPSupported = this.checkPiPSupport();
  }

  checkPiPSupport() {
    // PiP is only supported on Android 8.0+ (API level 26+)
    if (Platform.OS === 'android') {
      return Platform.Version >= 26;
    }
    return false;
  }

  async enterPiP() {
    if (!this.isPiPSupported || !this.videoRef.current) {
      return false;
    }

    try {
      // For Android, we need to use native modules
      // This is a placeholder - actual implementation would require native module
      console.log('Entering PiP mode');
      
      // Lock to current orientation before entering PiP
      const orientation = await ScreenOrientation.getOrientationAsync();
      await ScreenOrientation.lockAsync(orientation);
      
      return true;
    } catch (error) {
      console.error('Failed to enter PiP:', error);
      return false;
    }
  }

  async exitPiP() {
    try {
      // Unlock orientation when exiting PiP
      await ScreenOrientation.unlockAsync();
      console.log('Exiting PiP mode');
      return true;
    } catch (error) {
      console.error('Failed to exit PiP:', error);
      return false;
    }
  }
}

export default PiPHandler;