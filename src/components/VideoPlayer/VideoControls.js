// VideoControls.js - Player control overlay for AstralStream
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';

const { width: screenWidth } = Dimensions.get('window');

export default function VideoControls({
  isPlaying,
  duration,
  position,
  onPlayPause,
  onSeek,
  onSeekForward,
  onSeekBackward,
  onFullscreen,
  onExit,
  formatTime,
  title,
  playbackSpeed,
  onSpeedChange,
  isLocked,
  onLockToggle,
}) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  
  // If controls are locked, only show unlock button
  if (isLocked) {
    return (
      <View style={styles.lockedContainer}>
        <TouchableOpacity 
          style={styles.unlockButton}
          onPress={onLockToggle}
        >
          <Icon name="lock-open" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onExit} style={styles.iconButton}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        
        <View style={styles.topRightButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="subtitles" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="more-vert" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Center controls */}
      <View style={styles.centerControls}>
        <TouchableOpacity onPress={onSeekBackward} style={styles.seekButton}>
          <Icon name="replay-10" size={40} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
          <Icon 
            name={isPlaying ? "pause" : "play-arrow"} 
            size={60} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onSeekForward} style={styles.seekButton}>
          <Icon name="forward-10" size={40} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          
          <Slider
            style={styles.progressBar}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={onSeek}
            minimumTrackTintColor="#ff6b6b"
            maximumTrackTintColor="#333"
            thumbTintColor="#ff6b6b"
          />
          
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <View style={styles.leftControls}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowSpeedMenu(!showSpeedMenu)}
            >
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="skip-next" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.rightControls}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={onLockToggle}
            >
              <Icon name="lock-outline" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onFullscreen} style={styles.iconButton}>
              <Icon name="fullscreen" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Speed menu */}
        {showSpeedMenu && (
          <View style={styles.speedMenu}>
            {speedOptions.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedOption,
                  playbackSpeed === speed && styles.speedOptionActive
                ]}
                onPress={() => {
                  onSpeedChange(speed);
                  setShowSpeedMenu(false);
                }}
              >
                <Text style={[
                  styles.speedOptionText,
                  playbackSpeed === speed && styles.speedOptionTextActive
                ]}>
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
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
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 40,
    paddingBottom: 10,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 10,
  },
  topRightButtons: {
    flexDirection: 'row',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    marginHorizontal: 30,
  },
  seekButton: {
    padding: 10,
  },
  bottomBar: {
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
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftControls: {
    flexDirection: 'row',
  },
  rightControls: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 10,
  },
  speedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  speedMenu: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 5,
    padding: 5,
  },
  speedOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  speedOptionActive: {
    backgroundColor: 'rgba(255,107,107,0.3)',
  },
  speedOptionText: {
    color: '#fff',
    fontSize: 14,
  },
  speedOptionTextActive: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  lockedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 30,
  },
});