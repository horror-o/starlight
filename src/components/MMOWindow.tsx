import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, STYLES, FONTS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface MMOWindowProps {
  title: string;
  children: React.ReactNode;
  style?: any;
  onClose?: () => void;
  icon?: string;
  hasScroll?: boolean; // If content should scroll
}

export const MMOWindow: React.FC<MMOWindowProps> = ({ title, children, style, onClose, icon }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Title Bar */}
      <View style={styles.titleBar}>
        <View style={styles.titleContent}>
          {icon && (
            <Ionicons name={icon as any} size={16} color={COLORS.text} style={{ marginRight: 6 }} />
          )}
          <Text style={styles.titleText}>[{title}]</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={14} color={COLORS.text} />
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#dcdde1', // Fallback
  },
  titleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  closeButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 2,
  },
  content: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Slightly lighter content area
  },
});
