import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  PanResponder,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';

const ZoomControls = ({
  visible,
  onClose,
  onZoomChange,
  onCropChange,
  currentZoom = 1,
  currentCrop = { x: 0, y: 0, width: 1, height: 1 },
}) => {
  const [zoom, setZoom] = useState(currentZoom);
  const [cropMode, setCropMode] = useState('fill'); // fill, fit, stretch, custom
  const [customCrop, setCustomCrop] = useState(currentCrop);
  const [showGrid, setShowGrid] = useState(false);

  const pan = useState(new Animated.ValueXY({ x: 0, y: 0 }))[0];

  const cropModes = [
    { id: 'fill', label: 'Fill Screen', icon: 'fullscreen' },
    { id: 'fit', label: 'Fit Screen', icon: 'fit-screen' },
    { id: 'stretch', label: 'Stretch', icon: 'aspect-ratio' },
    { id: '16:9', label: '16:9', icon: 'crop-16-9' },
    { id: '4:3', label: '4:3', icon: 'crop-3-2' },
    { id: '1:1', label: 'Square', icon: 'crop-square' },
    { id: 'custom', label: 'Custom', icon: 'crop-free' },
  ];

  const presetZooms = [
    { label: '1x', value: 1 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 },
    { label: '3x', value: 3 },
    { label: '4x', value: 4 },
  ];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => cropMode === 'custom',
    onMoveShouldSetPanResponder: () => cropMode === 'custom',
    
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value,
      });
    },
    
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false }
    ),
    
    onPanResponderRelease: () => {
      pan.flattenOffset();
      const x = Math.max(-0.5, Math.min(0.5, pan.x._value / 100));
      const y = Math.max(-0.5, Math.min(0.5, pan.y._value / 100));
      setCustomCrop({ ...customCrop, x, y });
    },
  });

  const handleZoomChange = (value) => {
    setZoom(value);
  };

  const handleCropModeChange = (mode) => {
    setCropMode(mode);
    
    switch (mode) {
      case 'fill':
        setCustomCrop({ x: 0, y: 0, width: 1, height: 1 });
        break;
      case 'fit':
        setCustomCrop({ x: 0, y: 0, width: 1, height: 1 });
        break;
      case '16:9':
        setCustomCrop({ x: 0, y: 0, width: 1, height: 0.5625 });
        break;
      case '4:3':
        setCustomCrop({ x: 0, y: 0, width: 1, height: 0.75 });
        break;
      case '1:1':
        setCustomCrop({ x: 0, y: 0, width: 0.75, height: 0.75 });
        break;
    }
  };

  const handleApply = () => {
    onZoomChange(zoom);
    onCropChange({ mode: cropMode, crop: customCrop });
    onClose();
  };

  const handleReset = () => {
    setZoom(1);
    setCropMode('fill');
    setCustomCrop({ x: 0, y: 0, width: 1, height: 1 });
    pan.setValue({ x: 0, y: 0 });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Zoom & Crop</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Preview Area */}
          <View style={styles.previewContainer}>
            <Animated.View
              style={[
                styles.previewBox,
                {
                  transform: [
                    { scale: zoom },
                    { translateX: pan.x },
                    { translateY: pan.y },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.videoPreview}>
                <Icon name="movie" size={48} color="#666" />
                <Text style={styles.previewText}>Video Preview</Text>
              </View>
              {showGrid && (
                <View style={styles.gridOverlay}>
                  <View style={styles.gridLine} />
                  <View style={[styles.gridLine, styles.gridLineHorizontal]} />
                  <View style={[styles.gridLine, { left: '33.33%' }]} />
                  <View style={[styles.gridLine, { left: '66.66%' }]} />
                  <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '33.33%' }]} />
                  <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '66.66%' }]} />
                </View>
              )}
            </Animated.View>
            
            <TouchableOpacity
              style={styles.gridToggle}
              onPress={() => setShowGrid(!showGrid)}
            >
              <Icon name="grid-on" size={20} color={showGrid ? '#ff6b6b' : '#666'} />
            </TouchableOpacity>
          </View>

          {/* Zoom Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zoom Level</Text>
            <View style={styles.zoomPresets}>
              {presetZooms.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.presetButton,
                    zoom === preset.value && styles.activePreset,
                  ]}
                  onPress={() => setZoom(preset.value)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      zoom === preset.value && styles.activePresetText,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Slider
              style={styles.slider}
              value={zoom}
              minimumValue={1}
              maximumValue={5}
              onValueChange={handleZoomChange}
              minimumTrackTintColor="#ff6b6b"
              maximumTrackTintColor="#444"
              thumbTintColor="#ff6b6b"
            />
            <Text style={styles.zoomValue}>{zoom.toFixed(2)}x</Text>
          </View>

          {/* Crop Modes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crop Mode</Text>
            <View style={styles.cropModes}>
              {cropModes.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.cropButton,
                    cropMode === mode.id && styles.activeCrop,
                  ]}
                  onPress={() => handleCropModeChange(mode.id)}
                >
                  <Icon
                    name={mode.icon}
                    size={24}
                    color={cropMode === mode.id ? '#fff' : '#888'}
                  />
                  <Text
                    style={[
                      styles.cropLabel,
                      cropMode === mode.id && styles.activeCropLabel,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Crop Info */}
          {cropMode === 'custom' && (
            <View style={styles.customInfo}>
              <Icon name="info" size={16} color="#ff6b6b" />
              <Text style={styles.customInfoText}>
                Drag the preview to adjust crop position
              </Text>
            </View>
          )}

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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  previewContainer: {
    height: 200,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewBox: {
    width: 160,
    height: 90,
    backgroundColor: '#333',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreview: {
    alignItems: 'center',
  },
  previewText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 1,
    height: '100%',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
  },
  gridToggle: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  zoomPresets: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  presetButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#2a2a2a',
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
  slider: {
    height: 40,
    marginBottom: 5,
  },
  zoomValue: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  cropModes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cropButton: {
    width: '30%',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  activeCrop: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: '#ff6b6b',
    borderWidth: 1,
  },
  cropLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 5,
  },
  activeCropLabel: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  customInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  customInfoText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginLeft: 10,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
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

export default ZoomControls;