import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Animated,
} from 'react-native';
import { Video } from 'expo-av';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FloatingVideo = ({
  videoUrl,
  isVisible,
  onClose,
  onExpand,
  initialPosition = { x: screenWidth - 170, y: 100 },
  videoRef: parentVideoRef,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [size, setSize] = useState({ width: 160, height: 90 });
  const videoRef = useRef(null);
  
  const pan = useRef(new Animated.ValueXY(initialPosition)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (parentVideoRef?.current && videoRef.current) {
      // Sync playback state
      syncWithParentVideo();
    }
  }, [parentVideoRef]);

  const syncWithParentVideo = async () => {
    try {
      const status = await parentVideoRef.current.getStatusAsync();
      if (status.isLoaded) {
        await videoRef.current.setPositionAsync(status.positionMillis);
        if (status.isPlaying) {
          await videoRef.current.playAsync();
        } else {
          await videoRef.current.pauseAsync();
        }
      }
    } catch (error) {
      console.error('Error syncing video:', error);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        
        Animated.spring(scale, {
          toValue: 0.95,
          useNativeDriver: true,
        }).start();
      },
      
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      
      onPanResponderRelease: () => {
        pan.flattenOffset();
        
        Animated.spring(scale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }).start();
        
        // Snap to edges
        const currentX = pan.x._value;
        const currentY = pan.y._value;
        
        let finalX = currentX;
        let finalY = currentY;
        
        // Horizontal edge snapping
        if (currentX < 20) {
          finalX = 10;
        } else if (currentX > screenWidth - size.width - 20) {
          finalX = screenWidth - size.width - 10;
        }
        
        // Vertical bounds
        if (currentY < 50) {
          finalY = 50;
        } else if (currentY > screenHeight - size.height - 100) {
          finalY = screenHeight - size.height - 100;
        }
        
        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const handleResize = () => {
    const sizes = [
      { width: 160, height: 90 },
      { width: 240, height: 135 },
      { width: 320, height: 180 },
    ];
    
    const currentIndex = sizes.findIndex(
      s => s.width === size.width && s.height === size.height
    );
    const nextIndex = (currentIndex + 1) % sizes.length;
    
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSize(sizes[nextIndex]);
  };

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size.width,
          height: size.height,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        shouldPlay={isPlaying}
        isLooping={false}
        volume={0}
        isMuted={true}
        resizeMode="cover"
      />
      
      <View style={styles.overlay}>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePlayPause}
          >
            <Icon
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleResize}
          >
            <Icon name="aspect-ratio" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onExpand}
          >
            <Icon name="fullscreen" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onClose}
          >
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 5,
  },
  controlButton: {
    padding: 5,
  },
});

export default FloatingVideo;