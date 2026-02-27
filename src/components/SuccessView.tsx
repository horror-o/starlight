import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { COLORS, FONTS } from '../theme';

interface SuccessViewProps {
  message: string;
  primaryText: string;
  onPrimaryPress: () => void;
  secondaryText?: string;
  onSecondaryPress?: () => void;
  tertiaryText?: string;
  onTertiaryPress?: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ 
  message, 
  primaryText, 
  onPrimaryPress, 
  secondaryText, 
  onSecondaryPress,
  tertiaryText,
  onTertiaryPress
}) => {
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (confettiRef.current) {
        confettiRef.current.start();
    }
  }, []);

  return (
    <View style={styles.successContainer}>
        <ConfettiCannon 
            count={200} 
            origin={{x: -10, y: 0}} 
            autoStart={true} 
            ref={confettiRef} 
            fadeOut={true}
        />
        <View style={styles.successContent}>
            <Text style={styles.successTitle}>Success! ✓</Text>
            <Text style={styles.successMessage}>{message}</Text>
            
            {tertiaryText && onTertiaryPress && (
                <TouchableOpacity style={styles.tertiaryButton} onPress={onTertiaryPress}>
                    <Text style={styles.tertiaryButtonText}>{tertiaryText}</Text>
                </TouchableOpacity>
            )}

            {secondaryText && onSecondaryPress && (
                <TouchableOpacity style={styles.secondaryButton} onPress={onSecondaryPress}>
                    <Text style={styles.secondaryButtonText}>{secondaryText}</Text>
                </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.primaryButton} onPress={onPrimaryPress}>
                <Text style={styles.primaryButtonText}>{primaryText}</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  successContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: COLORS.deepVoid,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000, // Ensure it sits on top
  },
  successContent: {
      alignItems: 'center',
      padding: 30,
      width: '100%',
  },
  successTitle: {
      fontSize: 32,
      fontFamily: FONTS.header,
      color: COLORS.electricCyan,
      marginBottom: 10,
      textShadowColor: COLORS.electricCyan,
      textShadowRadius: 10,
  },
  successMessage: {
      fontSize: 18,
      color: COLORS.text,
      fontFamily: FONTS.body,
      marginBottom: 40,
      textAlign: 'center',
  },
  primaryButton: {
      backgroundColor: COLORS.electricCyan,
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
  },
  primaryButtonText: {
      color: '#000',
      fontSize: 18,
      fontFamily: FONTS.header,
  },
  secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: COLORS.cyberMagenta,
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
      marginBottom: 20,
  },
  secondaryButtonText: {
      color: COLORS.cyberMagenta,
      fontSize: 18,
      fontFamily: FONTS.header,
  },
  tertiaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: COLORS.text,
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
      marginBottom: 20,
  },
  tertiaryButtonText: {
      color: COLORS.text,
      fontSize: 18,
      fontFamily: FONTS.header,
  }
});
