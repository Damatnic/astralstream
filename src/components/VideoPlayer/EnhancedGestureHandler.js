// EnhancedGestureHandler.js - Advanced gestures including pinch-to-zoom for AstralStream
import React, { useRef, useState } from 'react';
import {
  View,
  PanResponder,
  Dimensions,
  StyleSheet,
  Animated,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function EnhancedGestureHandler({
  onSeekForward,
  onSeekBackward,
  onVolumeChange,
  onBrightnessChange,
  onZoomChange,
  children,
}) {
  const [gestureType, setGestureType] = useState(null);
  const initialValue = useRef(0);
  const currentValue = useRef(0);
  
  // Pinch-to-zoom state
  const [isPinching, setIsPinching] = useState(false);
  const initialDistance = useRef(0);
  const currentZoom = useRef(1);
  const zoomAnimation = useRef(new Animated.Value(1)).current;

  // Calculate distance between two touch points
  const getDistance = (touches) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return evt.nativeEvent.touches.length >= 1;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Activate if user moved finger more than 5 pixels or using 2 fingers
        return Math.abs(gestureState.dx) > 5 || 
               Math.abs(gestureState.dy) > 5 || 
               evt.nativeEvent.touches.length >= 2;
      },
      
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        
        // Check for pinch gesture (2 fingers)
        if (touches.length >= 2) {
          setIsPinching(true);
          initialDistance.current = getDistance(touches);
          setGestureType('zoom');
          return;
        }
        
        // Single finger gestures
        const touch = touches[0];
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
        const touches = evt.nativeEvent.touches;
        
        // Handle pinch zoom
        if (isPinching && touches.length >= 2) {
          const distance = getDistance(touches);
          const scale = distance / initialDistance.current;
          const newZoom = Math.max(1, Math.min(3, currentZoom.current * scale));
          
          Animated.timing(zoomAnimation, {
            toValue: newZoom,
            duration: 0,
            useNativeDriver: true,
          }).start();
          
          if (onZoomChange) {
            onZoomChange(newZoom);
          }
          return;
        }
        
        // Handle single finger gestures
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
        if (isPinching) {
          // Save the current zoom level
          currentZoom.current = zoomAnimation._value;
          setIsPinching(false);
        } else if (gestureType === 'seek') {
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
      
      onPanResponderTerminate: () => {
        setIsPinching(false);
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

  // Reset zoom
  const resetZoom = () => {
    Animated.timing(zoomAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    currentZoom.current = 1;
    if (onZoomChange) {
      onZoomChange(1);
    }
  };

  return (
    <View 
      style={styles.container}
      {...panResponder.panHandlers}
      onTouchEnd={handleTap}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: zoomAnimation }]
          }
        ]}
      >
        {children}
      </Animated.View>
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
  content: {
    flex: 1,
  },
});