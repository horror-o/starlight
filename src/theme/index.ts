export const COLORS = {
  // MMO Theme - Juicy Watery Pink
  deepVoid: '#fff5f9', // Very light airy pink
  glassBackground: 'rgba(255, 240, 245, 0.85)', // Translucent pale pink
  chromeMist: '#f3d0df', // Soft pink border
  electricCyan: '#d63384', // Changed to "Juicy Pink" for accents
  cyberMagenta: '#e84393', // Red/Alert kept as a vibrant pink/red
  text: '#5e2a40', // Dark grape/wine for main text
  textDim: '#9c6b84', // Muted grape for secondary text

  // Specific UI Colors
  windowHeader: '#fadadd', // Fallback
  headerGradientStart: '#fceef4', // Light pink top
  headerGradientEnd: '#f4bdd0',   // Deeper pink bottom

  windowBorderLight: '#ffffff', // Highlight
  windowBorderDark: '#d9a7b9', // Shadow (dusty pink)
  inputBackground: '#ffffff',
  slotBackground: 'rgba(255, 255, 255, 0.6)',

  // Retro Status Colors
  success: '#6ab04c', // Kept similar but softer
  warning: '#f0932b',
  error: '#eb3b5a',
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
    borderRightColor: '#d9a7b9', // Darker shadow (dusty pink)
    borderBottomColor: '#d9a7b9',
    backgroundColor: '#fff0f5', // Lavender blush
  },
  bevelIn: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#d9a7b9', // Inner shadow top
    borderLeftColor: '#d9a7b9', // Inner shadow left
    borderRightColor: '#ffffff',
    borderBottomColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  windowHeader: {
    // backgroundColor removed here as it will be handled by LinearGradient
    borderBottomWidth: 1,
    borderBottomColor: '#d98fab', // Pinkish border for header
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
    shadowColor: '#d63384',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  }
};
