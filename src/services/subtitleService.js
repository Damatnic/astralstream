// subtitleService.js - Handle subtitle loading and parsing for AstralStream
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Subtitle formats
const SUBTITLE_EXTENSIONS = ['.srt', '.vtt', '.ass', '.ssa'];

export const loadSubtitles = async (videoUri, targetLanguage) => {
  try {
    // Check if subtitles are cached
    const cachedKey = `@subtitle_${videoUri}_${targetLanguage}`;
    const cached = await AsyncStorage.getItem(cachedKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Check for local subtitle files
    const localSubtitles = await findLocalSubtitles(videoUri);
    if (localSubtitles) {
      const parsed = await parseSubtitleFile(localSubtitles);
      await AsyncStorage.setItem(cachedKey, JSON.stringify(parsed));
      return parsed;
    }

    // If no local subtitles and autoTranslate is enabled
    // This is where AI transcription would happen
    // For now, return empty array
    return [];
    
  } catch (error) {
    console.log('Subtitle loading error:', error);
    return [];
  }
};

// Find local subtitle files
const findLocalSubtitles = async (videoUri) => {
  try {
    if (videoUri.startsWith('http')) {
      return null; // No local subtitles for streams
    }

    // Get video file path without extension
    const videoPath = videoUri.replace(/\.[^/.]+$/, '');
    
    // Check for subtitle files with same name
    for (const ext of SUBTITLE_EXTENSIONS) {
      const subtitlePath = videoPath + ext;
      const info = await FileSystem.getInfoAsync(subtitlePath);
      
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(subtitlePath);
        return { path: subtitlePath, content, format: ext };
      }
    }
    
    return null;
  } catch (error) {
    console.log('Find subtitles error:', error);
    return null;
  }
};

// Parse subtitle file content
export const parseSubtitleFile = async (subtitleData) => {
  const { content, format } = subtitleData;
  
  switch (format) {
    case '.srt':
      return parseSRT(content);
    case '.vtt':
      return parseVTT(content);
    case '.ass':
    case '.ssa':
      return parseASS(content);
    default:
      return [];
  }
};

// Parse SRT format
const parseSRT = (content) => {
  const subtitles = [];
  const blocks = content.trim().split(/\n\s*\n/);
  
  blocks.forEach(block => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const times = lines[1].split(' --> ');
      if (times.length === 2) {
        subtitles.push({
          start: parseTime(times[0].trim()),
          end: parseTime(times[1].trim()),
          text: lines.slice(2).join('\n').trim()
        });
      }
    }
  });
  
  return subtitles;
};

// Parse VTT format
const parseVTT = (content) => {
  // Remove WEBVTT header
  const lines = content.replace(/^WEBVTT\s*\n/, '').trim().split('\n');
  const subtitles = [];
  
  let i = 0;
  while (i < lines.length) {
    // Skip empty lines and cue identifiers
    while (i < lines.length && (!lines[i] || !lines[i].includes('-->'))) {
      i++;
    }
    
    if (i < lines.length) {
      const times = lines[i].split(' --> ');
      if (times.length === 2) {
        const text = [];
        i++;
        
        while (i < lines.length && lines[i] && !lines[i].includes('-->')) {
          text.push(lines[i]);
          i++;
        }
        
        subtitles.push({
          start: parseTime(times[0].trim()),
          end: parseTime(times[1].trim()),
          text: text.join('\n').trim()
        });
      }
    }
  }
  
  return subtitles;
};

// Parse ASS/SSA format (simplified)
const parseASS = (content) => {
  const subtitles = [];
  const lines = content.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('Dialogue:')) {
      const parts = line.split(',');
      if (parts.length >= 10) {
        const start = parseASSTime(parts[1].trim());
        const end = parseASSTime(parts[2].trim());
        const text = parts.slice(9).join(',').replace(/\\N/g, '\n').trim();
        
        subtitles.push({ start, end, text });
      }
    }
  });
  
  return subtitles;
};

// Parse time string to seconds
const parseTime = (timeStr) => {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const [hours, minutes, secondsAndMs] = parts;
    const [seconds, ms = '0'] = secondsAndMs.split(/[,.]/);
    
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(seconds) +
      parseInt(ms.padEnd(3, '0')) / 1000
    );
  }
  return 0;
};

// Parse ASS time format
const parseASSTime = (timeStr) => {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseFloat(seconds)
    );
  }
  return 0;
};

// Get subtitle at current time
export const getSubtitleAtTime = (subtitles, currentTime) => {
  return subtitles.find(sub => 
    currentTime >= sub.start && currentTime <= sub.end
  );
};

// Format subtitle for display
export const formatSubtitle = (subtitle) => {
  if (!subtitle) return '';
  
  // Remove HTML tags if any
  let text = subtitle.text.replace(/<[^>]*>/g, '');
  
  // Replace special characters
  text = text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
  
  return text;
};