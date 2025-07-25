// ===========================================
// DESIGN SYSTEM - Unified styling constants
// ===========================================

export const DESIGN_TOKENS = {
  // Spacing scale (based on 4px grid)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    '4xl': '3rem',    // 48px
  },

  // Typography scale
  fontSize: {
    xs: 'clamp(0.75rem, 1.5vh, 0.875rem)',    // 12-14px
    sm: 'clamp(0.875rem, 2vh, 1rem)',         // 14-16px
    base: 'clamp(1rem, 2.5vh, 1.125rem)',     // 16-18px
    lg: 'clamp(1.125rem, 3vh, 1.25rem)',      // 18-20px
    xl: 'clamp(1.25rem, 3.5vh, 1.5rem)',      // 20-24px
    '2xl': 'clamp(1.5rem, 4vh, 1.875rem)',    // 24-30px
    '3xl': 'clamp(1.875rem, 5vh, 2.25rem)',   // 30-36px
    '4xl': 'clamp(2.25rem, 6vh, 3rem)',       // 36-48px
  },

  // Border radius
  borderRadius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    
    // Game-specific shadows
    button: '0 6px 20px rgba(76, 175, 80, 0.3)',
    buttonHover: '0 8px 25px rgba(76, 175, 80, 0.4)',
    overlay: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },

  // Transitions
  transition: {
    fast: '0.15s ease',
    base: '0.2s ease',
    slow: '0.3s ease',
    smooth: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Responsive breakpoints
  breakpoints: {
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },

  // Layout dimensions
  layout: {
    maxContainerWidth: '600px',
    gameGridMaxSize: '450px',
    buttonMaxWidth: '320px',
    buttonMinHeight: 'clamp(56px, 8vh, 64px)',
  },
} as const;

// Button size variants
export const BUTTON_SIZES = {
  sm: {
    fontSize: DESIGN_TOKENS.fontSize.sm,
    padding: `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.lg}`,
    minHeight: 'clamp(40px, 6vh, 48px)',
    borderRadius: DESIGN_TOKENS.borderRadius.md,
  },
  md: {
    fontSize: DESIGN_TOKENS.fontSize.base,
    padding: `${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl}`,
    minHeight: DESIGN_TOKENS.layout.buttonMinHeight,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
  },
  lg: {
    fontSize: DESIGN_TOKENS.fontSize.lg,
    padding: `${DESIGN_TOKENS.spacing.lg} ${DESIGN_TOKENS.spacing['2xl']}`,
    minHeight: 'clamp(64px, 10vh, 72px)',
    borderRadius: DESIGN_TOKENS.borderRadius.xl,
  },
} as const;

// Button variant styles
export const BUTTON_VARIANTS = {
  primary: {
    background: '#4CAF50',
    backgroundHover: '#45a049',
    color: '#FFFFFF',
    colorHover: '#FFFFFF',
    shadow: DESIGN_TOKENS.boxShadow.button,
    shadowHover: DESIGN_TOKENS.boxShadow.buttonHover,
    border: 'none',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.9)',
    backgroundHover: '#f8f9fa',
    color: '#666666',
    colorHover: '#333333',
    shadow: DESIGN_TOKENS.boxShadow.base,
    shadowHover: DESIGN_TOKENS.boxShadow.md,
    border: '2px solid #e9ecef',
  },
  danger: {
    background: '#F44336',
    backgroundHover: '#E04949',
    color: '#FFFFFF',
    colorHover: '#FFFFFF',
    shadow: '0 6px 20px rgba(244, 67, 54, 0.3)',
    shadowHover: '0 8px 25px rgba(244, 67, 54, 0.4)',
    border: 'none',
  },
  warning: {
    background: '#FFEB3B',
    backgroundHover: '#E6B800',
    color: '#333333',
    colorHover: '#333333',
    shadow: '0 6px 20px rgba(255, 235, 59, 0.3)',
    shadowHover: '0 8px 25px rgba(255, 235, 59, 0.4)',
    border: 'none',
  },
} as const;