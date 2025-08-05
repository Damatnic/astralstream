// translationService.js - Subtitle translation for AstralStream
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiConfig, checkApiConfiguration } from '../../config/apiConfig';

const CACHE_PREFIX = '@translation_cache_';

export class TranslationService {
  constructor() {
    this.isTranslating = false;
  }

  // Get cached translation
  async getCachedTranslation(text, sourceLang, targetLang) {
    try {
      const cacheKey = `${CACHE_PREFIX}${sourceLang}_${targetLang}_${this.hashText(text)}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached;
    } catch (error) {
      console.log('Translation cache read error:', error);
      return null;
    }
  }

  // Save translation to cache
  async cacheTranslation(text, sourceLang, targetLang, translation) {
    try {
      const cacheKey = `${CACHE_PREFIX}${sourceLang}_${targetLang}_${this.hashText(text)}`;
      await AsyncStorage.setItem(cacheKey, translation);
    } catch (error) {
      console.log('Translation cache write error:', error);
    }
  }

  // Simple hash function for cache keys
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Translate text using LibreTranslate or Google Translate API
  async translateText(text, sourceLang = 'auto', targetLang = 'en') {
    if (!text || text.trim().length === 0) {
      return text;
    }

    // Check cache first
    const cached = await this.getCachedTranslation(text, sourceLang, targetLang);
    if (cached) {
      return cached;
    }

    try {
      // LibreTranslate API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang === 'auto' ? 'auto' : sourceLang,
          target: targetLang,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const result = await response.json();
      const translatedText = result.translatedText || result.text || text;

      // Cache the translation
      await this.cacheTranslation(text, sourceLang, targetLang, translatedText);

      return translatedText;
    } catch (error) {
      console.log('Translation error:', error);
      
      // Fallback to Google Translate (unofficial)
      return this.translateWithGoogleFallback(text, sourceLang, targetLang);
    }
  }

  // Google Translate fallback (unofficial API)
  async translateWithGoogleFallback(text, sourceLang, targetLang) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      // Extract translated text from Google's response format
      let translatedText = '';
      if (result && result[0]) {
        result[0].forEach(chunk => {
          if (chunk[0]) {
            translatedText += chunk[0];
          }
        });
      }

      if (translatedText) {
        await this.cacheTranslation(text, sourceLang, targetLang, translatedText);
        return translatedText;
      }

      return text; // Return original if translation fails
    } catch (error) {
      console.log('Google translate fallback error:', error);
      return text;
    }
  }

  // Translate subtitles array
  async translateSubtitles(subtitles, sourceLang = 'auto', targetLang = 'en', onProgress) {
    if (this.isTranslating) {
      throw new Error('Translation already in progress');
    }

    this.isTranslating = true;
    const translatedSubtitles = [];

    try {
      for (let i = 0; i < subtitles.length; i++) {
        const subtitle = subtitles[i];
        
        // Update progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: subtitles.length,
            percentage: Math.round(((i + 1) / subtitles.length) * 100)
          });
        }

        // Translate text
        const translatedText = await this.translateText(
          subtitle.text,
          sourceLang,
          targetLang
        );

        translatedSubtitles.push({
          ...subtitle,
          originalText: subtitle.text,
          text: translatedText,
          translated: true,
          targetLanguage: targetLang
        });

        // Small delay to avoid rate limiting
        if (i < subtitles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return translatedSubtitles;
    } finally {
      this.isTranslating = false;
    }
  }

  // Batch translate for better performance
  async batchTranslate(texts, sourceLang = 'auto', targetLang = 'en') {
    // Check which texts are already cached
    const results = [];
    const textsToTranslate = [];
    const indices = [];

    for (let i = 0; i < texts.length; i++) {
      const cached = await this.getCachedTranslation(texts[i], sourceLang, targetLang);
      if (cached) {
        results[i] = cached;
      } else {
        textsToTranslate.push(texts[i]);
        indices.push(i);
      }
    }

    // Translate uncached texts
    if (textsToTranslate.length > 0) {
      try {
        // Join texts with a delimiter for batch translation
        const delimiter = '\n<<SPLIT>>\n';
        const joinedText = textsToTranslate.join(delimiter);
        
        const translatedJoined = await this.translateText(
          joinedText,
          sourceLang,
          targetLang
        );
        
        // Split back the translations
        const translations = translatedJoined.split(delimiter);
        
        // Map translations back to original indices
        for (let i = 0; i < translations.length && i < indices.length; i++) {
          results[indices[i]] = translations[i].trim();
        }
      } catch (error) {
        console.log('Batch translation error:', error);
        // Fallback to individual translations
        for (let i = 0; i < indices.length; i++) {
          results[indices[i]] = await this.translateText(
            textsToTranslate[i],
            sourceLang,
            targetLang
          );
        }
      }
    }

    return results;
  }

  // Get supported languages
  async getSupportedLanguages() {
    try {
      const response = await fetch(`${this.apiUrl.replace('/translate', '/languages')}`);
      const languages = await response.json();
      return languages;
    } catch (error) {
      console.log('Get languages error:', error);
      // Return common languages as fallback
      return [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' }
      ];
    }
  }

  // Clear translation cache
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const translationKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(translationKeys);
      console.log(`Cleared ${translationKeys.length} cached translations`);
    } catch (error) {
      console.log('Clear translation cache error:', error);
    }
  }
}

// Export singleton instance
export default new TranslationService();