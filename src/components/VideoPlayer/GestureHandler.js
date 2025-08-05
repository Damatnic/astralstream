// GestureHandler.js - Handle swipe and pinch gestures for AstralStream
import React, { useRef, useState } from 'react';
import {
  View,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function GestureHandler({
  onSeekForward,
  onSeekBackward,
  onVolumeChange,
  onBrightnessChange,
  children,
}) {
  const [gestureType, setGestureType] = useState(null);
  const initialValue = useRef(0);
  const currentValue = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Activate if user moved finger more than 5 pixels
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      
      onPanResponderGrant: (evt) => {
        const touch = evt.nativeEvent;
        const x = touch.locationX;
        
        // Determine gesture type based on initial touch position
        if (x < screenWidth * 0.25) {
          // Left side - brightness
          setGestureType('brightness');
          initialValue.current = 0.5; // Get current brightness
        } else if (x > screenWidth * 0.75) {
          // Right side - volume
          setGestureType('volume');
          initialValue.current = 1.0; // Get current volume
        } else {
          // Center - seek
          setGestureType('seek');
        }
      },
      
      onPanResponderMove: (evt, gestureState) => {
        if (gestureType === 'seek') {
          // Horizontal swipe for seeking
          if (Math.abs(gestureState.dx) > 50) {
            // Seek threshold
          }
        } else if (gestureType === 'volume') {
          // Vertical swipe for volume (inverted - swipe up increases)
          const deltaY = -gestureState.dy / (screenHeight * 0.5);
          const newValue = Math.max(0, Math.min(1, initialValue.current + deltaY));
          currentValue.current = newValue;
          onVolumeChange(newValue);
        } else if (gestureType === 'brightness') {
          // Vertical swipe for brightness (inverted - swipe up increases)
          const deltaY = -gestureState.dy / (screenHeight * 0.5);
          const newValue = Math.max(0, Math.min(1, initialValue.current + deltaY));
          currentValue.current = newValue;
          onBrightnessChange(newValue);
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureType === 'seek') {
          // Check for horizontal swipe
          if (Math.abs(gestureState.dx) > 50) {
            if (gestureState.dx > 0) {
              onSeekForward();
            } else {
              onSeekBackward();
            }
          }
        }
        
        // Reset
        setGestureType(null);
      },
    })
  ).current;

  // Double tap detection
  const lastTap = useRef(0);
  const tapTimeout = useRef(null);
  const tapX = useRef(0);

  const handleTap = (evt) => {
    const now = Date.now();
    const x = evt.nativeEvent.locationX;
    
    if (lastTap.current && (now - lastTap.current) < 300) {
      // Double tap detected
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
      }
      
      if (x < screenWidth / 2) {
        onSeekBackward();
      } else {
        onSeekForward();
      }
      
      lastTap.current = 0;
    } else {
      // Single tap
      lastTap.current = now;
      tapX.current = x;
      
      tapTimeout.current = setTimeout(() => {
        lastTap.current = 0;
      }, 300);
    }
  };

  return (
    <View 
      style={styles.container}
      {...panResponder.panHandlers}
      onTouchEnd={handleTap}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});