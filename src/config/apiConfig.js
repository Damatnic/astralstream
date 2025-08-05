// apiConfig.js - API configuration for AstralStream
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEYS_STORAGE = '@api_keys';

// Default API endpoints
export const API_ENDPOINTS = {
  WHISPER: 'https://api.openai.com/v1/audio/transcriptions',
  LIBRETRANSLATE: 'https://libretranslate.de/translate',
  GOOGLE_TRANSLATE: 'https://translation.googleapis.com/language/translate/v2',
};

// API key management
export const apiKeyManager = {
  // Get stored API keys
  async getKeys() {
    try {
      const keys = await AsyncStorage.getItem(API_KEYS_STORAGE);
      return keys ? JSON.parse(keys) : {
        openai: '',
        googleTranslate: '',
        libretranslateUrl: API_ENDPOINTS.LIBRETRANSLATE,
      };
    } catch (error) {
      console.log('Error getting API keys:', error);
      return {
        openai: '',
        googleTranslate: '',
        libretranslateUrl: API_ENDPOINTS.LIBRETRANSLATE,
      };
    }
  },

  // Save API keys
  async setKeys(keys) {
    try {
      const currentKeys = await this.getKeys();
      const updatedKeys = { ...currentKeys, ...keys };
      await AsyncStorage.setItem(API_KEYS_STORAGE, JSON.stringify(updatedKeys));
      return true;
    } catch (error) {
      console.log('Error saving API keys:', error);
      return false;
    }
  },

  // Get specific key
  async getKey(service) {
    const keys = await this.getKeys();
    return keys[service] || '';
  },

  // Set specific key
  async setKey(service, key) {
    const keys = await this.getKeys();
    keys[service] = key;
    return await this.setKeys(keys);
  },

  // Validate API key format
  validateKey(service, key) {
    switch (service) {
      case 'openai':
        return key.startsWith('sk-') && key.length > 20;
      case 'googleTranslate':
        return key.length > 10;
      case 'libretranslateUrl':
        return key.startsWith('http');
      default:
        return false;
    }
  },

  // Test API key validity
  async testKey(service, key) {
    try {
      switch (service) {
        case 'openai':
          // Test with a simple API call
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
          });
          return response.ok;

        case 'googleTranslate':
          // Test Google Translate API
          const gtResponse = await fetch(
            `${API_ENDPOINTS.GOOGLE_TRANSLATE}?key=${key}&q=hello&target=es&source=en`,
            { method: 'POST' }
          );
          return gtResponse.ok;

        case 'libretranslateUrl':
          // Test LibreTranslate endpoint
          const ltResponse = await fetch(`${key}/languages`);
          return ltResponse.ok;

        default:
          return false;
      }
    } catch (error) {
      console.log(`Error testing ${service} key:`, error);
      return false;
    }
  },

  // Clear all keys
  async clearKeys() {
    try {
      await AsyncStorage.removeItem(API_KEYS_STORAGE);
      return true;
    } catch (error) {
      console.log('Error clearing API keys:', error);
      return false;
    }
  }
};

// Check if required APIs are configured
export const checkApiConfiguration = async () => {
  const keys = await apiKeyManager.getKeys();
  
  return {
    whisperReady: keys.openai && keys.openai.length > 0,
    translationReady: keys.googleTranslate || keys.libretranslateUrl,
    hasAnyKey: keys.openai || keys.googleTranslate,
  };
};

// Get API configuration for services
export const getApiConfig = async () => {
  const keys = await apiKeyManager.getKeys();
  
  return {
    whisper: {
      apiKey: keys.openai,
      endpoint: API_ENDPOINTS.WHISPER,
      enabled: Boolean(keys.openai),
    },
    translation: {
      googleKey: keys.googleTranslate,
      libretranslateUrl: keys.libretranslateUrl || API_ENDPOINTS.LIBRETRANSLATE,
      useGoogle: Boolean(keys.googleTranslate),
      enabled: Boolean(keys.googleTranslate || keys.libretranslateUrl),
    },
  };
};