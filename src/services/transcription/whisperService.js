// whisperService.js - AI transcription using OpenAI Whisper for AstralStream
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiConfig, checkApiConfiguration } from '../../config/apiConfig';

const CACHE_PREFIX = '@transcription_cache_';

export class WhisperTranscriptionService {
  constructor() {
    this.isTranscribing = false;
  }

  // Check if we have a cached transcription
  async getCachedTranscription(videoUri, language = 'en') {
    try {
      const cacheKey = `${CACHE_PREFIX}${videoUri}_${language}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.log('Cache read error:', error);
      return null;
    }
  }

  // Save transcription to cache
  async cacheTranscription(videoUri, language, transcription) {
    try {
      const cacheKey = `${CACHE_PREFIX}${videoUri}_${language}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(transcription));
    } catch (error) {
      console.log('Cache write error:', error);
    }
  }

  // Extract audio from video
  async extractAudioFromVideo(videoUri) {
    try {
      // For local videos, we need to extract audio
      // For streams, we'll use the audio track directly
      
      if (videoUri.startsWith('http')) {
        // For streaming videos, return the URI directly
        // Whisper will handle the audio extraction
        return { uri: videoUri, isStream: true };
      }

      // For local files, create a temporary audio file
      const audioUri = `${FileSystem.cacheDirectory}temp_audio_${Date.now()}.m4a`;
      
      // Note: In production, you'd use FFmpeg or similar to extract audio
      // For now, we'll use the video URI directly
      console.log('Audio extraction needed for:', videoUri);
      
      return { uri: videoUri, isStream: false };
    } catch (error) {
      console.log('Audio extraction error:', error);
      throw error;
    }
  }

  // Transcribe audio using Whisper API
  async transcribeAudio(audioData, options = {}) {
    const {
      language = 'en',
      prompt = '',
      response_format = 'verbose_json',
      timestamp_granularities = ['segment', 'word']
    } = options;

    try {
      if (!this.apiKey) {
        throw new Error('Whisper API key not configured');
      }

      const formData = new FormData();
      
      // Add the audio file
      if (audioData.isStream) {
        // For streams, we need to download a chunk first
        formData.append('file', {
          uri: audioData.uri,
          type: 'audio/mpeg',
          name: 'audio.mp3'
        });
      } else {
        // For local files
        formData.append('file', {
          uri: audioData.uri,
          type: 'audio/mpeg',
          name: 'audio.mp3'
        });
      }

      // Add other parameters
      formData.append('model', 'whisper-1');
      formData.append('language', language);
      formData.append('response_format', response_format);
      formData.append('timestamp_granularities[]', 'segment');
      formData.append('timestamp_granularities[]', 'word');
      
      if (prompt) {
        formData.append('prompt', prompt);
      }

      console.log('Sending audio to Whisper API...');

      const response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Whisper API error: ${error}`);
      }

      const result = await response.json();
      console.log('Transcription complete');
      
      return result;
    } catch (error) {
      console.log('Transcription error:', error);
      throw error;
    }
  }

  // Convert Whisper segments to subtitle format
  convertToSubtitles(whisperResult) {
    const subtitles = [];
    
    if (whisperResult.segments) {
      whisperResult.segments.forEach((segment, index) => {
        subtitles.push({
          id: index + 1,
          start: segment.start,
          end: segment.end,
          text: segment.text.trim(),
          words: segment.words || []
        });
      });
    }

    return subtitles;
  }

  // Main transcription method
  async transcribeVideo(videoUri, options = {}) {
    if (this.isTranscribing) {
      throw new Error('Transcription already in progress');
    }

    this.isTranscribing = true;

    try {
      // Check cache first
      const cached = await this.getCachedTranscription(videoUri, options.language);
      if (cached) {
        console.log('Using cached transcription');
        return cached;
      }

      // Extract audio
      const audioData = await this.extractAudioFromVideo(videoUri);

      // Transcribe
      const whisperResult = await this.transcribeAudio(audioData, options);

      // Convert to subtitle format
      const subtitles = this.convertToSubtitles(whisperResult);

      // Create result object
      const result = {
        subtitles,
        language: whisperResult.language || options.language,
        duration: whisperResult.duration,
        text: whisperResult.text,
        timestamp: Date.now()
      };

      // Cache the result
      await this.cacheTranscription(videoUri, options.language, result);

      return result;
    } finally {
      this.isTranscribing = false;
    }
  }

  // Transcribe in chunks for long videos
  async transcribeInChunks(videoUri, options = {}) {
    // Implementation for chunked transcription
    // This would split long videos into smaller segments
    // and transcribe them separately
    console.log('Chunked transcription not yet implemented');
    return this.transcribeVideo(videoUri, options);
  }

  // Generate SRT file from transcription
  generateSRT(subtitles) {
    let srt = '';
    
    subtitles.forEach((subtitle, index) => {
      const startTime = this.formatSRTTime(subtitle.start);
      const endTime = this.formatSRTTime(subtitle.end);
      
      srt += `${index + 1}\n`;
      srt += `${startTime} --> ${endTime}\n`;
      srt += `${subtitle.text}\n\n`;
    });

    return srt;
  }

  // Format time for SRT
  formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  // Clear transcription cache
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const transcriptionKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(transcriptionKeys);
      console.log(`Cleared ${transcriptionKeys.length} cached transcriptions`);
    } catch (error) {
      console.log('Clear cache error:', error);
    }
  }
}

// Export singleton instance
export default new WhisperTranscriptionService();