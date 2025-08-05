// WebViewExtractor.js - Extract video URLs using WebView for AstralStream
import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewExtractor = forwardRef((props, ref) => {
  const webViewRef = useRef(null);
  const [extractedUrls, setExtractedUrls] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // JavaScript to inject into the WebView
  const injectedJavaScript = `
    (function() {
      let foundUrls = [];
      let checkInterval;
      
      // Function to extract video URLs
      function extractVideoUrls() {
        // Look for HTML5 video elements
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          if (video.src && !foundUrls.includes(video.src)) {
            foundUrls.push({
              url: video.src,
              type: 'video',
              source: 'video_element'
            });
          }
          
          // Check source elements
          const sources = video.querySelectorAll('source');
          sources.forEach(source => {
            if (source.src && !foundUrls.includes(source.src)) {
              foundUrls.push({
                url: source.src,
                type: 'video',
                source: 'source_element'
              });
            }
          });
        });

        // Look for iframes that might contain video
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          if (iframe.src && (iframe.src.includes('embed') || iframe.src.includes('player'))) {
            foundUrls.push({
              url: iframe.src,
              type: 'iframe',
              source: 'iframe_embed'
            });
          }
        });

        // Intercept XHR requests
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
          if (url && (url.includes('.m3u8') || url.includes('.mp4') || url.includes('.mkv'))) {
            foundUrls.push({
              url: url,
              type: 'xhr',
              source: 'xhr_request'
            });
          }
          return originalOpen.apply(this, arguments);
        };

        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(url) {
          if (typeof url === 'string' && (url.includes('.m3u8') || url.includes('.mp4'))) {
            foundUrls.push({
              url: url,
              type: 'fetch',
              source: 'fetch_request'
            });
          }
          return originalFetch.apply(this, arguments);
        };

        // Look for video URLs in scripts
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          const content = script.innerHTML;
          
          // Common patterns for video URLs
          const patterns = [
            /https?:\\/\\/[^\\s"']+\\.m3u8[^\\s"']*/gi,
            /https?:\\/\\/[^\\s"']+\\.mp4[^\\s"']*/gi,
            /"video_url"\\s*:\\s*"([^"]+)"/gi,
            /"source"\\s*:\\s*"([^"]+)"/gi,
            /setVideoUrl\\(['"]([^'"]+)['"]/gi,
            /"file"\\s*:\\s*"([^"]+)"/gi,
            /"url"\\s*:\\s*"([^"]+\\.(?:mp4|m3u8|mkv))"/gi
          ];

          patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
              const url = match[1] || match[0];
              if (url && !foundUrls.some(item => item.url === url)) {
                foundUrls.push({
                  url: url.replace(/\\\\/g, ''),
                  type: 'script',
                  source: 'script_content'
                });
              }
            }
          });
        });
      }

      // Function to send results back to React Native
      function sendResults() {
        if (foundUrls.length > 0) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'video_urls_found',
            urls: foundUrls,
            pageUrl: window.location.href,
            title: document.title
          }));
        }
      }

      // Monitor for dynamic content
      function startMonitoring() {
        // Initial extraction
        extractVideoUrls();
        
        // Set up mutation observer
        const observer = new MutationObserver(() => {
          extractVideoUrls();
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['src', 'href']
        });

        // Check periodically
        checkInterval = setInterval(() => {
          extractVideoUrls();
          sendResults();
        }, 2000);

        // Send initial results
        setTimeout(sendResults, 1000);
      }

      // Wait for page to load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitoring);
      } else {
        startMonitoring();
      }

      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      });
      
      // Indicate injection success
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'injection_complete'
      }));
    })();
    
    true; // Required for injection to work
  `;

  // Platform-specific extraction scripts
  const platformScripts = {
    pornhub: `
      // Pornhub specific extraction
      const flashvars = window.flashvars_${Date.now()} || window.flashvars;
      if (flashvars && flashvars.mediaDefinitions) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'platform_data',
          platform: 'pornhub',
          data: flashvars.mediaDefinitions
        }));
      }
    `,
    xvideos: `
      // Xvideos specific extraction
      if (window.html5player && window.html5player.url_high) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'platform_data',
          platform: 'xvideos',
          data: {
            high: window.html5player.url_high,
            low: window.html5player.url_low
          }
        }));
      }
    `
  };

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'video_urls_found':
          console.log('Found video URLs:', message.urls);
          setExtractedUrls(message.urls);
          if (props.onUrlsFound) {
            props.onUrlsFound(message.urls);
          }
          break;
          
        case 'platform_data':
          console.log('Platform data:', message.platform, message.data);
          if (props.onPlatformData) {
            props.onPlatformData(message.platform, message.data);
          }
          break;
          
        case 'injection_complete':
          console.log('JavaScript injection complete');
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.log('Message parsing error:', error);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    extractFromUrl: async (url) => {
      setIsExtracting(true);
      setExtractedUrls([]);
      
      return new Promise((resolve) => {
        // Set a timeout to resolve even if no URLs found
        const timeout = setTimeout(() => {
          setIsExtracting(false);
          resolve(extractedUrls);
        }, 15000); // 15 second timeout

        // Set up one-time URL found handler
        const originalOnUrlsFound = props.onUrlsFound;
        props.onUrlsFound = (urls) => {
          clearTimeout(timeout);
          setIsExtracting(false);
          if (originalOnUrlsFound) originalOnUrlsFound(urls);
          resolve(urls);
        };
      });
    },
    
    getExtractedUrls: () => extractedUrls,
    
    reload: () => {
      webViewRef.current?.reload();
    }
  }));

  if (!props.visible) {
    return null;
  }

  return (
    <View style={[styles.container, props.style]}>
      <WebView
        ref={webViewRef}
        source={{ uri: props.url }}
        style={styles.webview}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        userAgent={props.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        onLoadEnd={() => {
          // Inject platform-specific scripts if needed
          const platform = detectPlatform(props.url);
          if (platform && platformScripts[platform]) {
            webViewRef.current?.injectJavaScript(platformScripts[platform]);
          }
        }}
        onError={(error) => {
          console.log('WebView error:', error);
          setIsExtracting(false);
        }}
      />
    </View>
  );
});

// Detect platform from URL
function detectPlatform(url) {
  if (url.includes('pornhub.com')) return 'pornhub';
  if (url.includes('xvideos.com')) return 'xvideos';
  if (url.includes('xnxx.com')) return 'xnxx';
  if (url.includes('spankbang.com')) return 'spankbang';
  if (url.includes('xhamster.com')) return 'xhamster';
  return null;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -1000, // Hide offscreen
    left: 0,
    width: 1,
    height: 1,
  },
  webview: {
    flex: 1,
    opacity: 0,
  },
});

export default WebViewExtractor;