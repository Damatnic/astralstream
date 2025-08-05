// SettingsScreen.js - App settings
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import usePlayerStore from '../store/playerStore';
import ApiKeySettings from '../components/Settings/ApiKeySettings';

export default function SettingsScreen() {
  const { playerSettings, updatePlayerSettings, saveSettings } = usePlayerStore();
  const [clearing, setClearing] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);

  const handleSettingChange = (key, value) => {
    updatePlayerSettings({ [key]: value });
    saveSettings();
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all playback positions and history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await AsyncStorage.multiRemove([
                '@playback_positions',
                '@video_history',
                '@subtitle_cache',
              ]);
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
            setClearing(false);
          },
        },
      ]
    );
  };

  const subtitleSizes = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
  ];

  const languages = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Korean', value: 'ko' },
    { label: 'Chinese', value: 'zh' },
    { label: 'Russian', value: 'ru' },
    { label: 'Arabic', value: 'ar' },
    { label: 'Portuguese', value: 'pt' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Playback</Text>
        
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Default Playback Speed</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{playerSettings.playbackSpeed}x</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2}
              step={0.25}
              value={playerSettings.playbackSpeed}
              onValueChange={(value) => handleSettingChange('playbackSpeed', value)}
              minimumTrackTintColor="#ff6b6b"
              maximumTrackTintColor="#333"
              thumbTintColor="#ff6b6b"
            />
          </View>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Default Brightness</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{Math.round(playerSettings.brightness * 100)}%</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={playerSettings.brightness}
              onValueChange={(value) => handleSettingChange('brightness', value)}
              minimumTrackTintColor="#ff6b6b"
              maximumTrackTintColor="#333"
              thumbTintColor="#ff6b6b"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Transcription</Text>
        
        <View style={styles.setting}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-Transcribe Videos</Text>
            <Switch
              value={playerSettings.enableAutoTranscription}
              onValueChange={(value) => handleSettingChange('enableAutoTranscription', value)}
              trackColor={{ false: '#333', true: '#ff6b6b' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.setting}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-Translate Transcription</Text>
            <Switch
              value={playerSettings.enableAutoTranslation}
              onValueChange={(value) => handleSettingChange('enableAutoTranslation', value)}
              trackColor={{ false: '#333', true: '#ff6b6b' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subtitles & Translation</Text>
        
        <View style={styles.setting}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Show Subtitles</Text>
            <Switch
              value={playerSettings.showSubtitles}
              onValueChange={(value) => handleSettingChange('showSubtitles', value)}
              trackColor={{ false: '#333', true: '#ff6b6b' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Target Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.optionsRow}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={[
                    styles.option,
                    playerSettings.targetLanguage === lang.value && styles.optionActive,
                  ]}
                  onPress={() => handleSettingChange('targetLanguage', lang.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      playerSettings.targetLanguage === lang.value && styles.optionTextActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Subtitle Size</Text>
          <View style={styles.optionsRow}>
            {subtitleSizes.map((size) => (
              <TouchableOpacity
                key={size.value}
                style={[
                  styles.option,
                  playerSettings.subtitleSize === size.value && styles.optionActive,
                ]}
                onPress={() => handleSettingChange('subtitleSize', size.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    playerSettings.subtitleSize === size.value && styles.optionTextActive,
                  ]}
                >
                  {size.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={clearCache}
          disabled={clearing}
        >
          <Icon name="delete-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {clearing ? 'Clearing...' : 'Clear Cache'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Services</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowApiSettings(true)}
        >
          <Icon name="vpn-key" size={20} color="#fff" />
          <Text style={styles.buttonText}>Configure API Keys</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>AstralStream v1.0.0</Text>
        <Text style={styles.aboutText}>Personal Video Player with AI Translation</Text>
      </View>
      
      {/* API Settings Modal */}
      <Modal
        visible={showApiSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowApiSettings(false)}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>API Configuration</Text>
            <View style={{ width: 24 }} />
          </View>
          <ApiKeySettings />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  setting: {
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    color: '#ff6b6b',
    fontSize: 14,
    width: 50,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  optionActive: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
  },
  optionTextActive: {
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  aboutText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
});