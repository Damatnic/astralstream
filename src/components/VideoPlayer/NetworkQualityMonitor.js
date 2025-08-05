import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const NetworkQualityMonitor = ({ videoRef, visible = true }) => {
  const [bandwidth, setBandwidth] = useState(0);
  const [quality, setQuality] = useState('auto');
  const [bufferHealth, setBufferHealth] = useState(100);

  useEffect(() => {
    if (!videoRef?.current) return;

    const interval = setInterval(async () => {
      try {
        const status = await videoRef.current.getStatusAsync();
        if (status.isLoaded) {
          // Calculate buffer health
          const bufferedPosition = status.playableDurationMillis || 0;
          const currentPosition = status.positionMillis || 0;
          const bufferAhead = (bufferedPosition - currentPosition) / 1000; // seconds
          
          // Update buffer health (0-100%)
          const health = Math.min(100, (bufferAhead / 30) * 100); // 30s = 100%
          setBufferHealth(health);
          
          // Estimate quality based on buffer health
          if (health > 80) {
            setQuality('HD');
          } else if (health > 50) {
            setQuality('SD');
          } else {
            setQuality('Low');
          }
        }
      } catch (error) {
        console.log('Network monitor error:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [videoRef]);

  if (!visible) return null;

  const getQualityColor = () => {
    if (bufferHealth > 80) return '#4caf50';
    if (bufferHealth > 50) return '#ff9800';
    return '#f44336';
  };

  const getSignalBars = () => {
    if (bufferHealth > 80) return 3;
    if (bufferHealth > 50) return 2;
    return 1;
  };

  return (
    <View style={styles.container}>
      <View style={styles.qualityIndicator}>
        <Icon name="signal-cellular-4-bar" size={16} color={getQualityColor()} />
        <Text style={[styles.qualityText, { color: getQualityColor() }]}>
          {quality}
        </Text>
      </View>
      <View style={styles.bufferBar}>
        <View 
          style={[
            styles.bufferFill, 
            { 
              width: `${bufferHealth}%`,
              backgroundColor: getQualityColor()
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 5,
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  qualityText: {
    fontSize: 12,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  bufferBar: {
    width: 60,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bufferFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default NetworkQualityMonitor;