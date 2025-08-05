// performance.js - Performance optimization utilities for AstralStream
import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Thumbnail cache management
const THUMBNAIL_CACHE_KEY = '@thumbnail_cache';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const thumbnailCache = {
  async get(uri) {
    try {
      const cache = await AsyncStorage.getItem(THUMBNAIL_CACHE_KEY);
      if (!cache) return null;
      
      const cacheData = JSON.parse(cache);
      const entry = cacheData[uri];
      
      if (!entry) return null;
      
      // Check expiry
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        delete cacheData[uri];
        await AsyncStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(cacheData));
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.log('Thumbnail cache get error:', error);
      return null;
    }
  },
  
  async set(uri, data) {
    try {
      const cache = await AsyncStorage.getItem(THUMBNAIL_CACHE_KEY);
      const cacheData = cache ? JSON.parse(cache) : {};
      
      cacheData[uri] = {
        data,
        timestamp: Date.now(),
        size: data.length
      };
      
      // Clean old entries if cache is too large
      let totalSize = 0;
      const entries = Object.entries(cacheData);
      
      for (const [key, value] of entries) {
        totalSize += value.size || 0;
      }
      
      if (totalSize > MAX_CACHE_SIZE) {
        // Remove oldest entries
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        while (totalSize > MAX_CACHE_SIZE && entries.length > 0) {
          const [key, value] = entries.shift();
          totalSize -= value.size || 0;
          delete cacheData[key];
        }
      }
      
      await AsyncStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.log('Thumbnail cache set error:', error);
    }
  },
  
  async clear() {
    try {
      await AsyncStorage.removeItem(THUMBNAIL_CACHE_KEY);
    } catch (error) {
      console.log('Thumbnail cache clear error:', error);
    }
  }
};

// Preload images for better performance
export const preloadImages = async (images) => {
  const promises = images.map(image => {
    return Image.prefetch(image).catch(err => {
      console.log('Image prefetch error:', err);
    });
  });
  
  return Promise.all(promises);
};

// Memory management for video player
export const videoMemoryManager = {
  maxVideosInMemory: 2,
  videoRefs: new Map(),
  
  registerVideo(uri, ref) {
    this.videoRefs.set(uri, ref);
    
    // Clean up old videos if too many
    if (this.videoRefs.size > this.maxVideosInMemory) {
      const oldestUri = this.videoRefs.keys().next().value;
      const oldestRef = this.videoRefs.get(oldestUri);
      
      if (oldestRef && oldestRef.current) {
        oldestRef.current.unloadAsync();
      }
      
      this.videoRefs.delete(oldestUri);
    }
  },
  
  unregisterVideo(uri) {
    const ref = this.videoRefs.get(uri);
    if (ref && ref.current) {
      ref.current.unloadAsync();
    }
    this.videoRefs.delete(uri);
  },
  
  clearAll() {
    for (const [uri, ref] of this.videoRefs) {
      if (ref && ref.current) {
        ref.current.unloadAsync();
      }
    }
    this.videoRefs.clear();
  }
};

// Debounce function for performance
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Optimize video list rendering
export const getOptimizedVideoList = (videos, viewportHeight, itemHeight = 120) => {
  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  const bufferCount = 5; // Buffer items above and below viewport
  
  return {
    initialNumToRender: visibleCount + bufferCount,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 50,
    getItemLayout: (data, index) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
  };
};

// Clean up old cache and temporary files
export const performMaintenance = async () => {
  try {
    // Clean thumbnail cache
    const cache = await AsyncStorage.getItem(THUMBNAIL_CACHE_KEY);
    if (cache) {
      const cacheData = JSON.parse(cache);
      const now = Date.now();
      let hasChanges = false;
      
      for (const uri in cacheData) {
        if (now - cacheData[uri].timestamp > CACHE_EXPIRY) {
          delete cacheData[uri];
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        await AsyncStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(cacheData));
      }
    }
    
    // Clean old playback positions (older than 30 days)
    const positions = await AsyncStorage.getItem('@playback_positions');
    if (positions) {
      const positionData = JSON.parse(positions);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let hasChanges = false;
      
      for (const uri in positionData) {
        if (positionData[uri].timestamp < thirtyDaysAgo) {
          delete positionData[uri];
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        await AsyncStorage.setItem('@playback_positions', JSON.stringify(positionData));
      }
    }
    
    console.log('Maintenance completed successfully');
  } catch (error) {
    console.log('Maintenance error:', error);
  }
};

// Performance monitoring
export const performanceMonitor = {
  markers: new Map(),
  
  mark(name) {
    this.markers.set(name, Date.now());
  },
  
  measure(name, startMark, endMark = null) {
    const start = this.markers.get(startMark);
    const end = endMark ? this.markers.get(endMark) : Date.now();
    
    if (start) {
      const duration = end - start;
      console.log(`Performance [${name}]: ${duration}ms`);
      return duration;
    }
    
    return null;
  },
  
  clear() {
    this.markers.clear();
  }
};