import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ToastProps {
  message: string;
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, visible }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start invisible

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // Slightly longer fade out
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible && (fadeAnim as any)._value === 0) return null; // Optimization

  return (
    <View style={styles.centeredWrapper} pointerEvents="none">
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      elevation: 10,
  },
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    maxWidth: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
