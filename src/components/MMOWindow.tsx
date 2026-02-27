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
          {onClose ? (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={14} color={COLORS.text} />
            </TouchableOpacity>
          ) : (
            // If no onClose, show info icon or nothing.
            // Based on requirements: "remove 'X' buttons; replace with an 'Information' icon for context, or remove entirely"
            // We'll show an info icon by default if no onClose is provided, but only for certain windows?
            // Actually, let's just leave it empty if no onClose, unless we decide to add a help tooltip later.
            // But requirement said "replace with an 'Information' icon". Let's add a small info icon that doesn't do anything for now, purely aesthetic?
            // Or better yet, just leave it clean if it's not closable.
            // Wait, "replace with an 'Information' icon for context... or remove entirely".
            // Let's remove entirely for now to keep it clean, as "Information" usually implies a modal or tooltip.
            null
          )}
        </View>
      </LinearGradient>

      {/* Content Area */}
      <View style={styles.content}>
        {children}
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
    borderColor: '#bdc3c7',
    borderRadius: 2,
    marginLeft: 8,
  },
  content: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Slightly lighter content area
  },
});
