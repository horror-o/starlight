import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { COLORS, STYLES, FONTS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface MMOWindowProps {
  title: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onClose?: () => void;
  icon?: string;
  hasScroll?: boolean; // If content should scroll
  headerRight?: React.ReactNode; // Optional custom right-side content
}

export const MMOWindow: React.FC<MMOWindowProps> = ({
  title,
  children,
  style,
  onClose,
  icon,
  headerRight
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Title Bar */}
      <LinearGradient
        colors={[COLORS.headerGradientStart, COLORS.headerGradientEnd]}
        style={styles.titleBar}
      >
        <View style={styles.titleContent}>
          {icon && (
            <Ionicons name={icon as any} size={16} color={COLORS.text} style={{ marginRight: 6 }} />
          )}
          <Text style={styles.titleText}>[{title}]</Text>
        </View>

        <View style={styles.headerControls}>
          {headerRight}
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={14} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Content Area */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Retro Resize Grip (Aesthetic Only) */}
      <View style={styles.resizeGripContainer} pointerEvents="none">
        <View style={[styles.gripLine, { right: 0, bottom: 0, width: 6 }]} />
        <View style={[styles.gripLine, { right: 2, bottom: 2, width: 10 }]} />
        <View style={[styles.gripLine, { right: 4, bottom: 4, width: 14 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...STYLES.bevelOut, // Use outer bevel for the window frame
    backgroundColor: COLORS.glassBackground, // Translucent background
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative', // For resize grip absolute positioning
    paddingBottom: 2, // Ensure content doesn't overlap grip too much if tight
  },
  titleBar: {
    ...STYLES.windowHeader,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32, // Classic header height
    // backgroundColor handled by LinearGradient
  },
  titleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleText: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)', // Slightly translucent button
    borderWidth: 1,
    borderColor: COLORS.windowBorderDark,
    borderRadius: 2,
    marginLeft: 8,
  },
  content: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Slightly lighter content area
    flex: 1, // Allow content to expand
  },
  resizeGripContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    zIndex: 10,
  },
  gripLine: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: COLORS.windowBorderDark,
    transform: [{ rotate: '-45deg' }],
    opacity: 0.6,
  }
});
