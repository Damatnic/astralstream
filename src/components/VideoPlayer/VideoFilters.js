import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Slider,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const VideoFilters = ({ visible, onClose, onApplyFilters }) => {
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [speed, setSpeed] = useState(1);

  const filters = [
    { name: 'Brightness', value: brightness, setter: setBrightness, min: 0.5, max: 1.5 },
    { name: 'Contrast', value: contrast, setter: setContrast, min: 0.5, max: 1.5 },
    { name: 'Saturation', value: saturation, setter: setSaturation, min: 0, max: 2 },
    { name: 'Playback Speed', value: speed, setter: setSpeed, min: 0.5, max: 2 },
  ];

  const resetFilters = () => {
    setBrightness(1);
    setContrast(1);
    setSaturation(1);
    setSpeed(1);
  };

  const applyFilters = () => {
    onApplyFilters({
      brightness,
      contrast,
      saturation,
      speed,
    });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Video Adjustments</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {filters.map((filter) => (
            <View key={filter.name} style={styles.filterItem}>
              <Text style={styles.filterName}>{filter.name}</Text>
              <Slider
                style={styles.slider}
                minimumValue={filter.min}
                maximumValue={filter.max}
                value={filter.value}
                onValueChange={filter.setter}
                minimumTrackTintColor="#ff6b6b"
                maximumTrackTintColor="#444"
                thumbTintColor="#ff6b6b"
              />
              <Text style={styles.filterValue}>
                {filter.name === 'Playback Speed' 
                  ? `${filter.value.toFixed(1)}x`
                  : Math.round(filter.value * 100) + '%'
                }
              </Text>
            </View>
          ))}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={resetFilters}>
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.applyButton]} 
              onPress={applyFilters}
            >
              <Text style={styles.buttonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterItem: {
    marginBottom: 20,
  },
  filterName: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  filterValue: {
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
    marginTop: -5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#333',
    marginHorizontal: 5,
  },
  applyButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default VideoFilters;