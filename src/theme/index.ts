export const COLORS = {
  // MMO Theme
  deepVoid: '#f0f4f8', // Changed to light airy blue-grey
  glassBackground: 'rgba(230, 240, 255, 0.85)', // Light translucent pastel blue
  chromeMist: '#c8d6e5', // Soft blue-grey for borders
  electricCyan: '#2d98da', // Darker blue for accents/active states
  cyberMagenta: '#eb3b5a', // Soft red for alerts/actions
  text: '#2c3e50', // Dark blue-grey for main text
  textDim: '#7f8fa6', // Muted blue-grey for secondary text

  // Specific UI Colors
  windowHeader: '#dfe6e9', // Fallback
  headerGradientStart: '#dae9f5', // Light blue top
  headerGradientEnd: '#b0cbe8',   // Slightly darker blue bottom

  windowBorderLight: '#ffffff', // Bevel highlight
  windowBorderDark: '#bdc3c7', // Bevel shadow
  inputBackground: '#ffffff',
  slotBackground: 'rgba(255, 255, 255, 0.5)',

  // Retro Status Colors
  success: '#20bf6b',
  warning: '#fa8231',
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
    borderRightColor: '#bdc3c7', // Darker shadow
    borderBottomColor: '#bdc3c7',
    backgroundColor: '#ecf0f1',
  },
  bevelIn: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#bdc3c7', // Inner shadow top
    borderLeftColor: '#bdc3c7', // Inner shadow left
    borderRightColor: '#ffffff',
    borderBottomColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  windowHeader: {
    // backgroundColor removed here as it will be handled by LinearGradient
    borderBottomWidth: 1,
    borderBottomColor: '#7f9db9', // Blueish border for header
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
    shadowColor: '#2d98da',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  }
};
