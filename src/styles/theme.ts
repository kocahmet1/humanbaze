export const theme = {
  colors: {
    // Primary colors - Modern gradient-friendly palette
    primary: 'var(--color-primary)', // Deep purple
    primaryDark: 'var(--color-primary-dark)',
    primaryLight: 'var(--color-primary-light)',
    accent: 'var(--color-accent)', // Pink accent for highlights
    
    // Secondary colors
    secondary: '#10B981', // Emerald green
    secondaryLight: '#34D399',
    
    // Background colors - Sophisticated neutrals
    background: 'var(--color-background)', // Very light gray
    surface: 'var(--color-surface)',
    cardBackground: 'var(--color-card-background)', // Semi-transparent for glassmorphism
    overlay: 'var(--color-overlay)',
    darkBackground: '#0F172A', // For dark sections
    
    // Text colors - Better contrast
    text: 'var(--color-text)', // Almost black
    textSecondary: 'var(--color-text-secondary)',
    textLight: 'var(--color-text-light)',
    textMuted: 'var(--color-text-muted)',
    textOnDark: 'var(--color-text-on-dark)',
    
    // Status colors
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    warning: 'var(--color-warning)',
    info: 'var(--color-info)',
    
    // Border colors - More subtle
    border: 'var(--color-border)',
    borderLight: 'var(--color-border-light)',
    borderDark: 'var(--color-border-dark)',
    
    // Navigation - Modern dark theme
    navBackground: 'var(--color-nav-background)',
    navText: 'var(--color-nav-text)',
    navTextActive: 'var(--color-nav-text-active)',
    navHover: 'var(--color-nav-hover)',
    
    // Social colors
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    google: '#EA4335',
  },
  
  fonts: {
    regular: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Helvetica, Arial, sans-serif',
    sizes: {
      xs: 11,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 24,
      xxxl: 32,
      hero: 48,
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },
  
  animations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
      // Web shadow
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02)',
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 3,
      // Web shadow
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.02)',
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 8,
      // Web shadow
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.04)',
    },
    glow: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 0,
      // Web glow
      boxShadow: '0 0 40px rgba(124, 58, 237, 0.3)',
    },
  },
  
  breakpoints: {
    mobile: 768,
    tablet: 992,
    desktop: 1200,
    wide: 1570,
  },
  
  layout: {
    // Navigation
    navigationWidth: 65,
    navigationExpandedWidth: 180,
    
    // Main layout
    leftColumnWidth: '21%',
    centerColumnWidth: '58%',
    rightColumnWidth: '21%',
    
    // Responsive adjustments
    tabletCenterWidth: '73%',
    tabletRightWidth: '27%',
    
    // Heights
    headerHeight: 40,
    navigationMobileHeight: 78,
  },
  
  zIndex: {
    navigation: 100,
    modal: 1000,
    overlay: 999,
    dropdown: 99,
    tooltip: 98,
  },
};
