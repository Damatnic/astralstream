import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AudioEqualizer = ({ visible, onClose, onApplyEQ }) => {
  const [preset, setPreset] = useState('Normal');
  const [customEQ, setCustomEQ] = useState({
    bass: 0,
    midrange: 0,
    treble: 0,
    virtualizer: 0,
    loudness: 0,
  });

  const presets = {
    Normal: { bass: 0, midrange: 0, treble: 0, virtualizer: 0, loudness: 0 },
    'Bass Boost': { bass: 6, midrange: 0, treble: 0, virtualizer: 3, loudness: 2 },
    Classical: { bass: -2, midrange: 0, treble: 4, virtualizer: 2, loudness: 0 },
    Dance: { bass: 5, midrange: 2, treble: 3, virtualizer: 4, loudness: 3 },
    Flat: { bass: 0, midrange: 0, treble: 0, virtualizer: 0, loudness: 0 },
    Jazz: { bass: 3, midrange: -2, treble: 3, virtualizer: 2, loudness: 0 },
    Pop: { bass: 1, midrange: 3, treble: 4, virtualizer: 2, loudness: 1 },
    Rock: { bass: 5, midrange: -2, treble: 5, virtualizer: 3, loudness: 2 },
    Vocal: { bass: -2, midrange: 4, treble: 3, virtualizer: 1, loudness: 0 },
  };

  const handlePresetChange = (presetName) => {
    setPreset(presetName);
    setCustomEQ(presets[presetName]);
  };

  const handleSliderChange = (key, value) => {
    setCustomEQ({ ...customEQ, [key]: value });
    setPreset('Custom');
  };

  const handleApply = () => {
    onApplyEQ(customEQ);
    onClose();
  };

  const handleReset = () => {
    handlePresetChange('Normal');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Audio Equalizer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Presets */}
            <View style={styles.presetsContainer}>
              <Text style={styles.sectionTitle}>Presets</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Object.keys(presets).map((presetName) => (
                  <TouchableOpacity
                    key={presetName}
                    style={[
                      styles.presetButton,
                      preset === presetName && styles.activePreset,
                    ]}
                    onPress={() => handlePresetChange(presetName)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        preset === presetName && styles.activePresetText,
                      ]}
                    >
                      {presetName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* EQ Sliders */}
            <View style={styles.equalizerContainer}>
              <Text style={styles.sectionTitle}>Equalizer</Text>
              
              <View style={styles.sliderRow}>
                <Icon name="graphic-eq" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Bass</Text>
                <Slider
                  style={styles.slider}
                  value={customEQ.bass}
                  minimumValue={-10}
                  maximumValue={10}
                  onValueChange={(value) => handleSliderChange('bass', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{customEQ.bass.toFixed(1)}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Icon name="equalizer" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Midrange</Text>
                <Slider
                  style={styles.slider}
                  value={customEQ.midrange}
                  minimumValue={-10}
                  maximumValue={10}
                  onValueChange={(value) => handleSliderChange('midrange', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{customEQ.midrange.toFixed(1)}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Icon name="music-note" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Treble</Text>
                <Slider
                  style={styles.slider}
                  value={customEQ.treble}
                  minimumValue={-10}
                  maximumValue={10}
                  onValueChange={(value) => handleSliderChange('treble', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{customEQ.treble.toFixed(1)}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Icon name="surround-sound" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Virtualizer</Text>
                <Slider
                  style={styles.slider}
                  value={customEQ.virtualizer}
                  minimumValue={0}
                  maximumValue={10}
                  onValueChange={(value) => handleSliderChange('virtualizer', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{customEQ.virtualizer.toFixed(1)}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Icon name="volume-up" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Loudness</Text>
                <Slider
                  style={styles.slider}
                  value={customEQ.loudness}
                  minimumValue={0}
                  maximumValue={10}
                  onValueChange={(value) => handleSliderChange('loudness', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{customEQ.loudness.toFixed(1)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  presetsContainer: {
    padding: 20,
  },
  presetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    marginRight: 10,
  },
  activePreset: {
    backgroundColor: '#ff6b6b',
  },
  presetText: {
    color: '#888',
    fontSize: 14,
  },
  activePresetText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  equalizerContainer: {
    padding: 20,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sliderLabel: {
    color: '#fff',
    fontSize: 14,
    width: 80,
    marginLeft: 10,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  sliderValue: {
    color: '#888',
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  resetButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AudioEqualizer;