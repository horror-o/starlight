export const COLORS = {
  // MMO Theme - Mint Green
  deepVoid: '#e8f5e9', // Very light airy green (matches the light squares)
  glassBackground: 'rgba(232, 245, 233, 0.85)', // Translucent pale green
  chromeMist: '#c8e6c9', // Soft green border (matches the darker squares)
  electricCyan: '#388e3c', // Changed to dark green for accents
  cyberMagenta: '#d32f2f', // Red/Alert kept for warnings but softened slightly
  text: '#1b5e20', // Dark green for main text
  textDim: '#4caf50', // Muted green for secondary text

  // Specific UI Colors
  windowHeader: '#c8e6c9', // Fallback
  headerGradientStart: '#e8f5e9', // Light green top
  headerGradientEnd: '#c8e6c9',   // Deeper green bottom

  windowBorderLight: '#ffffff', // Highlight
  windowBorderDark: '#a5d6a7', // Shadow (dusty green)
  inputBackground: '#ffffff',
  slotBackground: 'rgba(255, 255, 255, 0.6)',

  // Retro Status Colors
  success: '#388e3c', // Dark green success
  warning: '#f57c00', // Orange warning
  error: '#d32f2f',   // Red error
};

export const FONTS = {
  header: 'System',
  body: 'System',
  bodyMedium: 'System',
};

export const STYLES = {
  // Windows 95 / MMO Style Bevels
  bevelOut: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightColor: '#a5d6a7', // Darker shadow (dusty green)
    borderBottomColor: '#a5d6a7',
    backgroundColor: '#e8f5e9', // Mint green background
  },
  bevelIn: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#a5d6a7', // Inner shadow top
    borderLeftColor: '#a5d6a7', // Inner shadow left
    borderRightColor: '#ffffff',
    borderBottomColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  windowHeader: {
    // backgroundColor removed here as it will be handled by LinearGradient
    borderBottomWidth: 1,
    borderBottomColor: '#81c784', // Mint green border for header
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  glass: {
    backgroundColor: COLORS.glassBackground,
    borderColor: COLORS.chromeMist,
    borderWidth: 1,
    // Note: backdropFilter is web only, BlurView needed for native
    backdropFilter: 'blur(10px)',
  },
  glow: {
    // Subtle shadow instead of neon glow
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  }
};
