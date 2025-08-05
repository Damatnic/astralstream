// ApiKeySettings.js - API key configuration component
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiKeyManager, checkApiConfiguration } from '../../config/apiConfig';

export default function ApiKeySettings() {
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    googleTranslate: '',
    libretranslateUrl: 'https://libretranslate.de',
  });
  
  const [showKeys, setShowKeys] = useState({
    openai: false,
    googleTranslate: false,
  });
  
  const [testing, setTesting] = useState({});
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const keys = await apiKeyManager.getKeys();
      setApiKeys(keys);
      
      // Check status
      const apiStatus = await checkApiConfiguration();
      setStatus(apiStatus);
    } catch (error) {
      console.log('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyChange = (service, value) => {
    setApiKeys(prev => ({
      ...prev,
      [service]: value
    }));
  };

  const saveKey = async (service) => {
    const key = apiKeys[service];
    
    if (!key) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    if (!apiKeyManager.validateKey(service, key)) {
      Alert.alert('Error', 'Invalid API key format');
      return;
    }

    try {
      await apiKeyManager.setKey(service, key);
      Alert.alert('Success', 'API key saved successfully');
      
      // Refresh status
      const apiStatus = await checkApiConfiguration();
      setStatus(apiStatus);
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const testKey = async (service) => {
    const key = apiKeys[service];
    
    if (!key) {
      Alert.alert('Error', 'Please enter an API key first');
      return;
    }

    setTesting(prev => ({ ...prev, [service]: true }));

    try {
      const isValid = await apiKeyManager.testKey(service, key);
      
      if (isValid) {
        Alert.alert('Success', 'API key is valid and working!');
      } else {
        Alert.alert('Error', 'API key test failed. Please check the key.');
      }
    } catch (error) {
      Alert.alert('Error', `Test failed: ${error.message}`);
    } finally {
      setTesting(prev => ({ ...prev, [service]: false }));
    }
  };

  const clearKeys = async () => {
    Alert.alert(
      'Clear API Keys',
      'This will remove all saved API keys. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await apiKeyManager.clearKeys();
            setApiKeys({
              openai: '',
              googleTranslate: '',
              libretranslateUrl: 'https://libretranslate.de',
            });
            setStatus({});
            Alert.alert('Success', 'API keys cleared');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading API configuration...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>AI Services Configuration</Text>
      <Text style={styles.description}>
        Configure API keys for AI transcription and translation features.
      </Text>

      {/* OpenAI Whisper */}
      <View style={styles.apiSection}>
        <View style={styles.apiHeader}>
          <Text style={styles.apiTitle}>OpenAI Whisper (Transcription)</Text>
          {status.whisperReady && (
            <Icon name="check-circle" size={20} color="#4CAF50" />
          )}
        </View>
        
        <Text style={styles.apiDescription}>
          Required for automatic video transcription. Get your key at platform.openai.com
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={apiKeys.openai}
            onChangeText={(text) => handleKeyChange('openai', text)}
            placeholder="sk-..."
            placeholderTextColor="#666"
            secureTextEntry={!showKeys.openai}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowKeys(prev => ({ ...prev, openai: !prev.openai }))}
          >
            <Icon 
              name={showKeys.openai ? "visibility-off" : "visibility"} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => saveKey('openai')}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => testKey('openai')}
            disabled={testing.openai}
          >
            {testing.openai ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.testButtonText}>Test</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Google Translate */}
      <View style={styles.apiSection}>
        <View style={styles.apiHeader}>
          <Text style={styles.apiTitle}>Google Translate (Optional)</Text>
          {status.translationReady && (
            <Icon name="check-circle" size={20} color="#4CAF50" />
          )}
        </View>
        
        <Text style={styles.apiDescription}>
          Optional. Falls back to free LibreTranslate. Get key at console.cloud.google.com
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={apiKeys.googleTranslate}
            onChangeText={(text) => handleKeyChange('googleTranslate', text)}
            placeholder="AIza..."
            placeholderTextColor="#666"
            secureTextEntry={!showKeys.googleTranslate}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowKeys(prev => ({ ...prev, googleTranslate: !prev.googleTranslate }))}
          >
            <Icon 
              name={showKeys.googleTranslate ? "visibility-off" : "visibility"} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => saveKey('googleTranslate')}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => testKey('googleTranslate')}
            disabled={testing.googleTranslate}
          >
            {testing.googleTranslate ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.testButtonText}>Test</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* LibreTranslate URL */}
      <View style={styles.apiSection}>
        <Text style={styles.apiTitle}>LibreTranslate Server</Text>
        <Text style={styles.apiDescription}>
          Free translation service. Uses public instance by default.
        </Text>
        
        <TextInput
          style={styles.input}
          value={apiKeys.libretranslateUrl}
          onChangeText={(text) => handleKeyChange('libretranslateUrl', text)}
          placeholder="https://libretranslate.de"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => saveKey('libretranslateUrl')}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.statusSection}>
        <Text style={styles.statusTitle}>Service Status</Text>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Transcription:</Text>
          <Text style={[styles.statusValue, { color: status.whisperReady ? '#4CAF50' : '#f44336' }]}>
            {status.whisperReady ? 'Ready' : 'Not configured'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Translation:</Text>
          <Text style={[styles.statusValue, { color: status.translationReady ? '#4CAF50' : '#f44336' }]}>
            {status.translationReady ? 'Ready' : 'Using free service'}
          </Text>
        </View>
      </View>

      {/* Clear Button */}
      <TouchableOpacity style={styles.clearButton} onPress={clearKeys}>
        <Icon name="delete-outline" size={20} color="#f44336" />
        <Text style={styles.clearButtonText}>Clear All Keys</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    color: '#888',
    fontSize: 14,
    marginBottom: 30,
    lineHeight: 20,
  },
  apiSection: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
  },
  apiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  apiTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  apiDescription: {
    color: '#888',
    fontSize: 12,
    marginBottom: 15,
    lineHeight: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 5,
    fontSize: 14,
    marginRight: 10,
  },
  toggleButton: {
    padding: 15,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
  },
  testButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  statusSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 20,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusLabel: {
    color: '#888',
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    gap: 10,
  },
  clearButtonText: {
    color: '#f44336',
    fontSize: 16,
  },
});