export const COLORS = {
  deepVoid: '#050510',
  chromeMist: 'rgba(206, 217, 239, 0.2)',
  cyberMagenta: '#EA00D9',
  electricCyan: '#0ABDC6',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.7)',
  glassBackground: 'rgba(10, 11, 25, 0.6)',
};

export const FONTS = {
  header: 'Orbitron_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
};

export const STYLES = {
  glass: {
    backgroundColor: COLORS.glassBackground,
    borderColor: COLORS.chromeMist,
    borderWidth: 1,
    // Note: backdropFilter is web only, BlurView needed for native
    backdropFilter: 'blur(16px)', 
  },
  glow: {
    shadowColor: COLORS.electricCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  }
};
