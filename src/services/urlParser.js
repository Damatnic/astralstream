// urlParser.js - Parse video URLs from various sources
import 'react-native-url-polyfill/auto';

// URL patterns for different platforms
const patterns = {
  direct: /\.(mp4|m4v|mov|avi|mkv|webm|flv|wmv|mpg|mpeg|m3u8)$/i,
  m3u8: /\.m3u8/i,
  youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  pornhub: /pornhub\.com\/view_video\.php\?viewkey=([a-zA-Z0-9]+)/,
  xvideos: /xvideos\.com\/video(\d+)/,
  xnxx: /xnxx\.com\/video-([a-zA-Z0-9]+)/,
  spankbang: /spankbang\.com\/([a-zA-Z0-9]+)\/video/,
  xhamster: /xhamster\.com\/videos\/([a-zA-Z0-9-]+)/,
  redtube: /redtube\.com\/(\d+)/,
};

export const parseVideoUrl = async (inputUrl) => {
  try {
    const url = new URL(inputUrl.trim());
    const hostname = url.hostname.toLowerCase();
    
    console.log('Parsing URL from hostname:', hostname);

    // Check if it's a direct video URL
    if (patterns.direct.test(url.pathname)) {
      return {
        uri: inputUrl,
        filename: url.pathname.split('/').pop() || 'Direct Stream',
        isLocal: false,
        type: 'direct',
        originalUrl: inputUrl,
      };
    }

    // Check if it's an M3U8/HLS stream
    if (patterns.m3u8.test(url.pathname)) {
      return {
        uri: inputUrl,
        filename: 'HLS Stream',
        isLocal: false,
        type: 'hls',
        originalUrl: inputUrl,
      };
    }

    // Handle specific platforms
    if (hostname.includes('pornhub.com')) {
      return await parsePornhub(inputUrl);
    }
    
    if (hostname.includes('spankbang.com')) {
      return await parseSpankbang(inputUrl);
    }

    if (hostname.includes('xvideos.com')) {
      return await parseXvideos(inputUrl);
    }

    if (hostname.includes('xnxx.com')) {
      return await parseXnxx(inputUrl);
    }

    if (hostname.includes('xhamster.com')) {
      return await parseXhamster(inputUrl);
    }

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return {
        error: 'YouTube videos require special handling. Use YouTube downloader apps instead.',
      };
    }

    // For other URLs, try to fetch and detect video
    return await parseGenericUrl(inputUrl);

  } catch (error) {
    console.log('URL parse error:', error);
    return {
      error: 'Invalid URL or unsupported format',
    };
  }
};

// Parse Pornhub URLs
const parsePornhub = async (url) => {
  try {
    // Extract video ID
    const match = url.match(patterns.pornhub);
    if (!match) {
      return { error: 'Invalid Pornhub URL' };
    }

    const videoId = match[1];
    
    // Note: In a real implementation, you would need to:
    // 1. Fetch the page HTML
    // 2. Parse the video configuration
    // 3. Extract the actual video URL
    
    // For now, return a placeholder that indicates the platform
    return {
      uri: url,
      filename: `Pornhub Video ${videoId}`,
      isLocal: false,
      type: 'pornhub',
      originalUrl: url,
      requiresExtraction: true,
      platform: 'pornhub',
      videoId: videoId,
    };
  } catch (error) {
    console.log('Pornhub parse error:', error);
    return { error: 'Failed to parse Pornhub URL' };
  }
};

// Parse Spankbang URLs
const parseSpankbang = async (url) => {
  try {
    const match = url.match(patterns.spankbang);
    if (!match) {
      return { error: 'Invalid Spankbang URL' };
    }

    const videoId = match[1];
    
    return {
      uri: url,
      filename: `Spankbang Video ${videoId}`,
      isLocal: false,
      type: 'spankbang',
      originalUrl: url,
      requiresExtraction: true,
      platform: 'spankbang',
      videoId: videoId,
    };
  } catch (error) {
    console.log('Spankbang parse error:', error);
    return { error: 'Failed to parse Spankbang URL' };
  }
};

// Parse Xvideos URLs
const parseXvideos = async (url) => {
  try {
    const match = url.match(patterns.xvideos);
    if (!match) {
      return { error: 'Invalid Xvideos URL' };
    }

    const videoId = match[1];
    
    return {
      uri: url,
      filename: `Xvideos ${videoId}`,
      isLocal: false,
      type: 'xvideos',
      originalUrl: url,
      requiresExtraction: true,
      platform: 'xvideos',
      videoId: videoId,
    };
  } catch (error) {
    console.log('Xvideos parse error:', error);
    return { error: 'Failed to parse Xvideos URL' };
  }
};

// Parse XNXX URLs
const parseXnxx = async (url) => {
  try {
    const match = url.match(patterns.xnxx);
    if (!match) {
      return { error: 'Invalid XNXX URL' };
    }

    const videoId = match[1];
    
    return {
      uri: url,
      filename: `XNXX ${videoId}`,
      isLocal: false,
      type: 'xnxx',
      originalUrl: url,
      requiresExtraction: true,
      platform: 'xnxx',
      videoId: videoId,
    };
  } catch (error) {
    console.log('XNXX parse error:', error);
    return { error: 'Failed to parse XNXX URL' };
  }
};

// Parse Xhamster URLs
const parseXhamster = async (url) => {
  try {
    const match = url.match(patterns.xhamster);
    if (!match) {
      return { error: 'Invalid Xhamster URL' };
    }

    const videoId = match[1];
    
    return {
      uri: url,
      filename: `Xhamster ${videoId}`,
      isLocal: false,
      type: 'xhamster',
      originalUrl: url,
      requiresExtraction: true,
      platform: 'xhamster',
      videoId: videoId,
    };
  } catch (error) {
    console.log('Xhamster parse error:', error);
    return { error: 'Failed to parse Xhamster URL' };
  }
};

// Generic URL parser for unknown sites
const parseGenericUrl = async (url) => {
  try {
    // Check if the URL might contain a video
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('video')) {
      return {
        uri: url,
        filename: url.split('/').pop() || 'Stream',
        isLocal: false,
        type: 'direct',
        originalUrl: url,
      };
    }

    // If not a direct video, might need extraction
    return {
      uri: url,
      filename: new URL(url).hostname,
      isLocal: false,
      type: 'generic',
      originalUrl: url,
      requiresExtraction: true,
    };

  } catch (error) {
    console.log('Generic parse error:', error);
    return {
      uri: url,
      filename: 'Unknown Stream',
      isLocal: false,
      type: 'unknown',
      originalUrl: url,
    };
  }
};