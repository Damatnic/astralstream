import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';

const VideoEffects = ({ visible, onClose, onApplyEffects, currentEffects = {} }) => {
  const [effects, setEffects] = useState({
    blur: currentEffects.blur || 0,
    sharpen: currentEffects.sharpen || 0,
    sepia: currentEffects.sepia || 0,
    grayscale: currentEffects.grayscale || 0,
    hue: currentEffects.hue || 0,
    saturation: currentEffects.saturation || 1,
    brightness: currentEffects.brightness || 1,
    contrast: currentEffects.contrast || 1,
    negative: currentEffects.negative || false,
    mirror: currentEffects.mirror || false,
    flip: currentEffects.flip || false,
    ...currentEffects,
  });

  const [activePreset, setActivePreset] = useState('None');

  const presets = {
    None: { blur: 0, sharpen: 0, sepia: 0, grayscale: 0, hue: 0, saturation: 1, brightness: 1, contrast: 1 },
    Vivid: { saturation: 1.3, contrast: 1.2, brightness: 1.1, sharpen: 0.3 },
    'Black & White': { grayscale: 1, contrast: 1.2 },
    Sepia: { sepia: 0.8, brightness: 0.9 },
    Retro: { sepia: 0.4, saturation: 0.8, contrast: 1.1, hue: 20 },
    Cold: { hue: -30, saturation: 0.9, brightness: 1.05 },
    Warm: { hue: 30, saturation: 1.1, brightness: 1.05 },
    Drama: { contrast: 1.4, saturation: 1.2, brightness: 0.9 },
    Dreamy: { blur: 0.2, brightness: 1.1, saturation: 0.9 },
    Vintage: { sepia: 0.3, contrast: 0.9, brightness: 0.95, saturation: 0.8 },
  };

  const updateEffect = (key, value) => {
    setEffects({ ...effects, [key]: value });
    setActivePreset('Custom');
  };

  const applyPreset = (presetName) => {
    setActivePreset(presetName);
    setEffects({ ...effects, ...presets[presetName] });
  };

  const handleApply = () => {
    onApplyEffects(effects);
    onClose();
  };

  const handleReset = () => {
    applyPreset('None');
  };

  const toggleEffect = (key) => {
    setEffects({ ...effects, [key]: !effects[key] });
    setActivePreset('Custom');
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
            <Text style={styles.title}>Video Effects</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Presets */}
            <View style={styles.presetsContainer}>
              <Text style={styles.sectionTitle}>Presets</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.presetsList}>
                  {Object.keys(presets).map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        styles.presetButton,
                        activePreset === preset && styles.activePreset,
                      ]}
                      onPress={() => applyPreset(preset)}
                    >
                      <View style={[styles.presetPreview, { backgroundColor: getPresetColor(preset) }]} />
                      <Text style={styles.presetName}>{preset}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Color Adjustments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color Adjustments</Text>
              
              <View style={styles.sliderRow}>
                <Icon name="brightness-6" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Brightness</Text>
                <Slider
                  style={styles.slider}
                  value={effects.brightness}
                  minimumValue={0.5}
                  maximumValue={1.5}
                  onValueChange={(value) => updateEffect('brightness', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{effects.brightness.toFixed(2)}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Icon name="contrast" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Contrast</Text>
                <Slider
                  style={styles.slider}
                  value={effects.contrast}
                  minimumValue={0.5}
                  maximumValue={2}
                  onValueChange={(value) => updateEffect('contrast', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{effects.contrast.toFixed(2)}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Icon name="invert-colors" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Saturation</Text>
                <Slider
                  style={styles.slider}
                  value={effects.saturation}
                  minimumValue={0}
                  maximumValue={2}
                  onValueChange={(value) => updateEffect('saturation', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{effects.saturation.toFixed(2)}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Icon name="palette" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Hue</Text>
                <Slider
                  style={styles.slider}
                  value={effects.hue}
                  minimumValue={-180}
                  maximumValue={180}
                  onValueChange={(value) => updateEffect('hue', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{effects.hue.toFixed(0)}°</Text>
              </View>
            </View>

            {/* Special Effects */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Effects</Text>
              
              <View style={styles.sliderRow}>
                <Icon name="blur-on" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Blur</Text>
                <Slider
                  style={styles.slider}
                  value={effects.blur}
                  minimumValue={0}
                  maximumValue={1}
                  onValueChange={(value) => updateEffect('blur', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{(effects.blur * 100).toFixed(0)}%</Text>
              </View>

              <View style={styles.sliderRow}>
                <Icon name="details" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Sharpen</Text>
                <Slider
                  style={styles.slider}
                  value={effects.sharpen}
                  minimumValue={0}
                  maximumValue={1}
                  onValueChange={(value) => updateEffect('sharpen', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{(effects.sharpen * 100).toFixed(0)}%</Text>
              </View>

              <View style={styles.sliderRow}>
                <Icon name="filter-vintage" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Sepia</Text>
                <Slider
                  style={styles.slider}
                  value={effects.sepia}
                  minimumValue={0}
                  maximumValue={1}
                  onValueChange={(value) => updateEffect('sepia', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{(effects.sepia * 100).toFixed(0)}%</Text>
              </View>

              <View style={styles.sliderRow}>
                <Icon name="filter-b-and-w" size={20} color="#ff6b6b" />
                <Text style={styles.sliderLabel}>Grayscale</Text>
                <Slider
                  style={styles.slider}
                  value={effects.grayscale}
                  minimumValue={0}
                  maximumValue={1}
                  onValueChange={(value) => updateEffect('grayscale', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
                <Text style={styles.sliderValue}>{(effects.grayscale * 100).toFixed(0)}%</Text>
              </View>
            </View>

            {/* Transform Effects */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transform</Text>
              <View style={styles.toggleButtons}>
                <TouchableOpacity
                  style={[styles.toggleButton, effects.negative && styles.activeToggle]}
                  onPress={() => toggleEffect('negative')}
                >
                  <Icon name="invert-colors-off" size={24} color={effects.negative ? '#fff' : '#888'} />
                  <Text style={[styles.toggleText, effects.negative && styles.activeToggleText]}>
                    Negative
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleButton, effects.mirror && styles.activeToggle]}
                  onPress={() => toggleEffect('mirror')}
                >
                  <Icon name="flip" size={24} color={effects.mirror ? '#fff' : '#888'} />
                  <Text style={[styles.toggleText, effects.mirror && styles.activeToggleText]}>
                    Mirror
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleButton, effects.flip && styles.activeToggle]}
                  onPress={() => toggleEffect('flip')}
                >
                  <Icon name="swap-vert" size={24} color={effects.flip ? '#fff' : '#888'} />
                  <Text style={[styles.toggleText, effects.flip && styles.activeToggleText]}>
                    Flip
                  </Text>
                </TouchableOpacity>
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

const getPresetColor = (preset) => {
  const colors = {
    None: '#666',
    Vivid: '#ff6b6b',
    'Black & White': '#333',
    Sepia: '#8B7355',
    Retro: '#CD853F',
    Cold: '#4682B4',
    Warm: '#FF8C00',
    Drama: '#8B0000',
    Dreamy: '#DDA0DD',
    Vintage: '#8B7D6B',
  };
  return colors[preset] || '#666';
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
    maxHeight: '90%',
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
  section: {
    padding: 20,
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
  presetsList: {
    flexDirection: 'row',
    gap: 15,
  },
  presetButton: {
    alignItems: 'center',
    marginRight: 15,
  },
  activePreset: {
    transform: [{ scale: 1.1 }],
  },
  presetPreview: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetName: {
    color: '#888',
    fontSize: 12,
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
    width: 50,
    textAlign: 'right',
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#ff6b6b',
  },
  toggleText: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  activeToggleText: {
    color: '#fff',
    fontWeight: 'bold',
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

export default VideoEffects;