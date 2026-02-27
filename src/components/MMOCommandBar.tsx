import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STYLES, FONTS } from '../theme';
import { BlurView } from 'expo-blur';

export const MMOCommandBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.barContainer}>
        {Platform.OS === 'web' ? (
            <View style={[styles.background, styles.webGlass]}>
                {renderTabs(state, descriptors, navigation)}
            </View>
        ) : (
            <BlurView intensity={20} tint="light" style={styles.background}>
                {renderTabs(state, descriptors, navigation)}
            </BlurView>
        )}
    </View>
  );
};

const renderTabs = (state: any, descriptors: any, navigation: any) => {
    return (
        <View style={styles.tabsRow}>
            {state.routes.map((route: any, index: number) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                };

                let label = route.name;
                // Add brackets for style
                label = `[${label}]`;

                return (
                  <TouchableOpacity
                    key={index}
                    accessibilityRole="button"
                    accessibilityState={isFocused ? { selected: true } : {}}
                    accessibilityLabel={options.tabBarAccessibilityLabel}
                    onPress={onPress}
                    style={[styles.tabButton, isFocused && styles.activeTabButton]}
                  >
                    <Text style={[styles.tabText, isFocused && styles.activeTabText]}>
                        {label}
                    </Text>
                  </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60, // Fixed height for command bar
    backgroundColor: 'transparent',
  },
  background: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COLORS.chromeMist,
    backgroundColor: 'rgba(236, 240, 241, 0.9)', // Light grey background
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webGlass: {
    // @ts-ignore
    backdropFilter: 'blur(10px)',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around', // Spread evenly
    width: '100%',
    paddingHorizontal: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: COLORS.windowHeader, // Active highlight
    borderColor: COLORS.windowBorderDark,
    ...STYLES.bevelIn, // Pressed look
  },
  tabText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.electricCyan, // Highlight text color
  }
});
