import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';

const RepeatMode = ({ 
  visible, 
  onClose, 
  repeatMode, 
  onRepeatModeChange,
  currentTime,
  duration,
  onSetABRepeat
}) => {
  const [abRepeatStart, setABRepeatStart] = useState(null);
  const [abRepeatEnd, setABRepeatEnd] = useState(null);
  const [isSettingAB, setIsSettingAB] = useState(false);

  const repeatModes = [
    { id: 'none', label: 'No Repeat', icon: 'repeat' },
    { id: 'single', label: 'Repeat One', icon: 'repeat-one' },
    { id: 'all', label: 'Repeat All', icon: 'repeat' },
    { id: 'ab', label: 'A-B Repeat', icon: 'compare-arrows' },
  ];

  const handleModeSelect = (mode) => {
    if (mode === 'ab') {
      setIsSettingAB(true);
    } else {
      onRepeatModeChange(mode);
      setIsSettingAB(false);
      setABRepeatStart(null);
      setABRepeatEnd(null);
    }
  };

  const handleSetPointA = () => {
    setABRepeatStart(currentTime);
  };

  const handleSetPointB = () => {
    if (abRepeatStart !== null && currentTime > abRepeatStart) {
      setABRepeatEnd(currentTime);
      onSetABRepeat(abRepeatStart, currentTime);
      onRepeatModeChange('ab');
      setIsSettingAB(false);
      onClose();
    }
  };

  const handleCancelAB = () => {
    setIsSettingAB(false);
    setABRepeatStart(null);
    setABRepeatEnd(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalContainer} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Repeat Mode</Text>

          {!isSettingAB ? (
            <View style={styles.modesContainer}>
              {repeatModes.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeButton,
                    repeatMode === mode.id && styles.activeModeButton,
                  ]}
                  onPress={() => handleModeSelect(mode.id)}
                >
                  <Icon 
                    name={mode.icon} 
                    size={24} 
                    color={repeatMode === mode.id ? '#ff6b6b' : '#888'} 
                  />
                  <Text 
                    style={[
                      styles.modeLabel,
                      repeatMode === mode.id && styles.activeModeLabel,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.abRepeatContainer}>
              <Text style={styles.abTitle}>Set A-B Repeat Points</Text>
              
              <View style={styles.abControls}>
                {abRepeatStart === null ? (
                  <TouchableOpacity 
                    style={styles.abButton} 
                    onPress={handleSetPointA}
                  >
                    <Icon name="flag" size={24} color="#fff" />
                    <Text style={styles.abButtonText}>Set Point A</Text>
                    <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.abPointSet}>
                    <Icon name="flag" size={24} color="#4caf50" />
                    <Text style={styles.abPointText}>Point A: {formatTime(abRepeatStart)}</Text>
                  </View>
                )}

                {abRepeatStart !== null && (
                  <TouchableOpacity 
                    style={[
                      styles.abButton,
                      currentTime <= abRepeatStart && styles.disabledButton
                    ]} 
                    onPress={handleSetPointB}
                    disabled={currentTime <= abRepeatStart}
                  >
                    <Icon name="flag" size={24} color="#fff" />
                    <Text style={styles.abButtonText}>Set Point B</Text>
                    <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.abSlider}>
                <Slider
                  style={styles.slider}
                  value={currentTime}
                  minimumValue={0}
                  maximumValue={duration}
                  disabled={true}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                {abRepeatStart !== null && (
                  <View 
                    style={[
                      styles.abMarker, 
                      { left: `${(abRepeatStart / duration) * 100}%` }
                    ]} 
                  />
                )}
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAB}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeButton: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeModeButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: '#ff6b6b',
    borderWidth: 1,
  },
  modeLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  activeModeLabel: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  abRepeatContainer: {
    alignItems: 'center',
  },
  abTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  abControls: {
    width: '100%',
    marginBottom: 20,
  },
  abButton: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  abButtonText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
  currentTime: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  abPointSet: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 10,
    marginBottom: 10,
  },
  abPointText: {
    color: '#4caf50',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  abSlider: {
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  abMarker: {
    position: 'absolute',
    top: 15,
    width: 2,
    height: 10,
    backgroundColor: '#4caf50',
  },
  cancelButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 10,
    width: '100%',
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default RepeatMode;