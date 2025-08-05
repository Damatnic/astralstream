import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CastButton = ({ videoUrl, videoTitle }) => {
  const [isCasting, setIsCasting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if casting is available
    // This would require a native module or library like react-native-google-cast
    checkCastAvailability();
  }, []);

  const checkCastAvailability = () => {
    // Placeholder - actual implementation would check for Chromecast devices
    // For now, we'll simulate availability
    setIsAvailable(Platform.OS === 'android');
  };

  const handleCast = () => {
    if (!isAvailable) {
      Alert.alert(
        'Cast Not Available',
        'No cast devices found. Make sure you are on the same WiFi network as your casting device.'
      );
      return;
    }

    if (isCasting) {
      // Stop casting
      Alert.alert(
        'Stop Casting',
        'Do you want to stop casting?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Stop', 
            onPress: () => {
              setIsCasting(false);
              // Actual implementation would disconnect from cast device
            }
          }
        ]
      );
    } else {
      // Start casting
      Alert.alert(
        'Cast Device',
        'Select a device to cast to:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Living Room TV', 
            onPress: () => {
              setIsCasting(true);
              // Actual implementation would connect to cast device
              // and start streaming videoUrl
            }
          },
          { 
            text: 'Bedroom Chromecast', 
            onPress: () => {
              setIsCasting(true);
            }
          }
        ]
      );
    }
  };

  if (!isAvailable) return null;

  return (
    <TouchableOpacity onPress={handleCast} style={styles.castButton}>
      <Icon 
        name={isCasting ? "cast-connected" : "cast"} 
        size={24} 
        color={isCasting ? "#ff6b6b" : "#fff"} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  castButton: {
    padding: 10,
  },
});

export default CastButton;