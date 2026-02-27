import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STYLES } from '../theme';
import { BlurView } from 'expo-blur';

export const FloatingDock: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.dockContainer}>
      {Platform.OS === 'web' ? (
        <View style={[styles.glassContainer, styles.webGlass]}>
          {renderTabs(state, descriptors, navigation)}
        </View>
      ) : (
        <BlurView intensity={20} tint="dark" style={styles.glassContainer}>
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

        let iconName: any;
        if (route.name === 'Search') iconName = isFocused ? 'search' : 'search-outline';
        else if (route.name === 'Collection') iconName = isFocused ? 'library' : 'library-outline';
        else if (route.name === 'Decks') iconName = isFocused ? 'layers' : 'layers-outline';
        else if (route.name === 'Wishlist') iconName = isFocused ? 'heart' : 'heart-outline';

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                <Ionicons 
                    name={iconName} 
                    size={24} 
                    color={isFocused ? COLORS.electricCyan : COLORS.textDim} 
                    style={isFocused ? styles.glow : undefined}
                />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassContainer: {
    borderRadius: 30,
    overflow: 'hidden',
    borderColor: COLORS.chromeMist,
    borderWidth: 1,
    backgroundColor: 'rgba(5, 5, 16, 0.7)', // Fallback / Base
  },
  webGlass: {
    // @ts-ignore - Web only style
    backdropFilter: 'blur(16px)',
    backgroundColor: 'rgba(5, 5, 16, 0.4)',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  iconContainer: {
      padding: 5,
      borderRadius: 12,
  },
  activeIconContainer: {
      // Optional: Add background glow to container?
  },
  glow: {
    textShadowColor: COLORS.electricCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  }
});
