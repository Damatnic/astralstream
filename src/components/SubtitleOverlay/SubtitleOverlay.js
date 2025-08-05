// SubtitleOverlay.js - Display subtitles on video for AstralStream
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { loadSubtitles, getSubtitleAtTime } from '../../services/subtitleService';

const { width: screenWidth } = Dimensions.get('window');

export default function SubtitleOverlay({ 
  videoUri, 
  currentTime, 
  settings = {},
  subtitles: providedSubtitles,
  isTranscribing
}) {
  const [localSubtitles, setLocalSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use provided subtitles (from AI) or local ones
  const activeSubtitles = providedSubtitles || localSubtitles;

  useEffect(() => {
    // Only load local subtitles if none provided
    if (!providedSubtitles) {
      loadVideoSubtitles();
    } else {
      setLoading(false);
    }
  }, [videoUri, providedSubtitles]);

  useEffect(() => {
    if (activeSubtitles && activeSubtitles.length > 0) {
      const subtitle = getSubtitleAtTime(activeSubtitles, currentTime);
      setCurrentSubtitle(subtitle);
    }
  }, [currentTime, activeSubtitles]);

  const loadVideoSubtitles = async () => {
    try {
      setLoading(true);
      const subs = await loadSubtitles(videoUri, settings.targetLanguage);
      setLocalSubtitles(subs);
    } catch (error) {
      console.log('Subtitle load error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!settings.showSubtitles) {
    return null;
  }
  
  if (isTranscribing) {
    return (
      <View style={styles.container} pointerEvents="none">
        <View style={styles.transcribingBox}>
          <Text style={styles.transcribingText}>Transcribing audio...</Text>
        </View>
      </View>
    );
  }
  
  if (!currentSubtitle || loading) {
    return null;
  }

  const getFontSize = () => {
    switch (settings.subtitleSize) {
      case 'small': return 14;
      case 'large': return 22;
      default: return 18;
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[
        styles.subtitleBox,
        { backgroundColor: settings.subtitleBackground || 'rgba(0,0,0,0.7)' }
      ]}>
        <Text style={[
          styles.subtitleText,
          {
            color: settings.subtitleColor || '#fff',
            fontSize: getFontSize(),
          }
        ]}>
          {currentSubtitle.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  subtitleBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    maxWidth: screenWidth * 0.9,
  },
  subtitleText: {
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  transcribingBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  transcribingText: {
    color: '#fff',
    fontSize: 16,
    fontStyle: 'italic',
  },
});