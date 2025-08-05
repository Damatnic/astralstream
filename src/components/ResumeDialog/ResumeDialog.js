// ResumeDialog.js - Resume playback dialog for AstralStream
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ResumeDialog({
  visible,
  onResume,
  onRestart,
  position,
  formatTime,
}) {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onResume}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Icon name="play-circle-outline" size={60} color="#ff6b6b" />
          
          <Text style={styles.title}>Resume Playback?</Text>
          
          <Text style={styles.message}>
            You were at {formatTime(position)}
          </Text>
          
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.restartButton]}
              onPress={onRestart}
            >
              <Icon name="replay" size={20} color="#666" />
              <Text style={styles.restartText}>Start Over</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.resumeButton]}
              onPress={onResume}
            >
              <Icon name="play-arrow" size={20} color="#fff" />
              <Text style={styles.resumeText}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  message: {
    color: '#888',
    fontSize: 16,
    marginBottom: 25,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
    gap: 8,
  },
  restartButton: {
    backgroundColor: '#333',
  },
  resumeButton: {
    backgroundColor: '#ff6b6b',
  },
  restartText: {
    color: '#888',
    fontSize: 16,
  },
  resumeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});