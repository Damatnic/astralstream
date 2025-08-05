import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SubtitleSettings = ({ visible, onClose, onApplySettings }) => {
  const [settings, setSettings] = useState({
    enabled: true,
    fontSize: 16,
    fontColor: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.7,
    position: 'bottom', // bottom, top, center
    offset: 50,
    fontFamily: 'default',
    bold: false,
    italic: false,
    outline: true,
    outlineColor: '#000000',
    outlineWidth: 2,
  });

  const fontColors = [
    '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  ];

  const backgroundColors = [
    '#000000', '#FFFFFF', '#333333', '#666666', 'transparent',
  ];

  const fontFamilies = [
    { id: 'default', name: 'Default' },
    { id: 'serif', name: 'Serif' },
    { id: 'sans-serif', name: 'Sans Serif' },
    { id: 'monospace', name: 'Monospace' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('subtitleSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading subtitle settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('subtitleSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving subtitle settings:', error);
    }
  };

  const handleApply = () => {
    saveSettings(settings);
    onApplySettings(settings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      enabled: true,
      fontSize: 16,
      fontColor: '#FFFFFF',
      backgroundColor: '#000000',
      backgroundOpacity: 0.7,
      position: 'bottom',
      offset: 50,
      fontFamily: 'default',
      bold: false,
      italic: false,
      outline: true,
      outlineColor: '#000000',
      outlineWidth: 2,
    };
    setSettings(defaultSettings);
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const PreviewBox = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewVideo}>
        <Text
          style={[
            styles.previewSubtitle,
            {
              fontSize: settings.fontSize,
              color: settings.fontColor,
              backgroundColor:
                settings.backgroundColor === 'transparent'
                  ? 'transparent'
                  : settings.backgroundColor + Math.round(settings.backgroundOpacity * 255).toString(16),
              fontFamily: settings.fontFamily === 'default' ? undefined : settings.fontFamily,
              fontWeight: settings.bold ? 'bold' : 'normal',
              fontStyle: settings.italic ? 'italic' : 'normal',
              textShadowColor: settings.outline ? settings.outlineColor : 'transparent',
              textShadowOffset: settings.outline ? { width: settings.outlineWidth, height: settings.outlineWidth } : { width: 0, height: 0 },
              textShadowRadius: settings.outline ? settings.outlineWidth : 0,
              position: 'absolute',
              bottom: settings.position === 'bottom' ? settings.offset : undefined,
              top: settings.position === 'top' ? settings.offset : undefined,
              alignSelf: 'center',
            },
          ]}
        >
          This is a subtitle preview
        </Text>
      </View>
    </View>
  );

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
            <Text style={styles.title}>Subtitle Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Preview */}
            <PreviewBox />

            {/* Enable/Disable */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Subtitles</Text>
              <Switch
                value={settings.enabled}
                onValueChange={(value) => updateSetting('enabled', value)}
                trackColor={{ false: '#333', true: '#ff6b6b' }}
                thumbColor={settings.enabled ? '#fff' : '#666'}
              />
            </View>

            {/* Font Size */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Font Size: {settings.fontSize}px</Text>
              <Slider
                style={styles.slider}
                value={settings.fontSize}
                minimumValue={12}
                maximumValue={32}
                step={1}
                onValueChange={(value) => updateSetting('fontSize', value)}
                minimumTrackTintColor="#ff6b6b"
                maximumTrackTintColor="#444"
                thumbTintColor="#ff6b6b"
              />
            </View>

            {/* Font Color */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Font Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorPicker}>
                  {fontColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        settings.fontColor === color && styles.selectedColor,
                      ]}
                      onPress={() => updateSetting('fontColor', color)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Background Color */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Background Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorPicker}>
                  {backgroundColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { 
                          backgroundColor: color === 'transparent' ? '#333' : color,
                          borderWidth: color === 'transparent' ? 2 : 0,
                          borderColor: '#666',
                        },
                        settings.backgroundColor === color && styles.selectedColor,
                      ]}
                      onPress={() => updateSetting('backgroundColor', color)}
                    >
                      {color === 'transparent' && (
                        <Icon name="close" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Background Opacity */}
            {settings.backgroundColor !== 'transparent' && (
              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>
                  Background Opacity: {Math.round(settings.backgroundOpacity * 100)}%
                </Text>
                <Slider
                  style={styles.slider}
                  value={settings.backgroundOpacity}
                  minimumValue={0}
                  maximumValue={1}
                  onValueChange={(value) => updateSetting('backgroundOpacity', value)}
                  minimumTrackTintColor="#ff6b6b"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#ff6b6b"
                />
              </View>
            )}

            {/* Position */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Position</Text>
              <View style={styles.positionOptions}>
                {['top', 'center', 'bottom'].map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.positionButton,
                      settings.position === pos && styles.activePosition,
                    ]}
                    onPress={() => updateSetting('position', pos)}
                  >
                    <Text
                      style={[
                        styles.positionText,
                        settings.position === pos && styles.activePositionText,
                      ]}
                    >
                      {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Style Options */}
            <View style={styles.styleOptions}>
              <TouchableOpacity
                style={[styles.styleButton, settings.bold && styles.activeStyle]}
                onPress={() => updateSetting('bold', !settings.bold)}
              >
                <Icon name="format-bold" size={24} color={settings.bold ? '#ff6b6b' : '#888'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.styleButton, settings.italic && styles.activeStyle]}
                onPress={() => updateSetting('italic', !settings.italic)}
              >
                <Icon name="format-italic" size={24} color={settings.italic ? '#ff6b6b' : '#888'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.styleButton, settings.outline && styles.activeStyle]}
                onPress={() => updateSetting('outline', !settings.outline)}
              >
                <Icon name="text-fields" size={24} color={settings.outline ? '#ff6b6b' : '#888'} />
              </TouchableOpacity>
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
    padding: 20,
  },
  previewContainer: {
    marginBottom: 20,
  },
  previewVideo: {
    height: 150,
    backgroundColor: '#000',
    borderRadius: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewSubtitle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingSection: {
    marginBottom: 20,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  slider: {
    height: 40,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#ff6b6b',
  },
  positionOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  positionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  activePosition: {
    backgroundColor: '#ff6b6b',
  },
  positionText: {
    color: '#888',
  },
  activePositionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  styleOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  styleButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
  },
  activeStyle: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
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

export default SubtitleSettings;