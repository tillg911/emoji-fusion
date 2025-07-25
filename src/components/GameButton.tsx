import { ReactNode, ButtonHTMLAttributes } from 'react';
import { DESIGN_TOKENS, BUTTON_SIZES, BUTTON_VARIANTS } from '../constants/design-system';

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
}

export const GameButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = true,
  style,
  onMouseOver,
  onMouseOut,
  onMouseDown,
  onMouseUp,
  ...props 
}: GameButtonProps) => {
  const variantStyles = BUTTON_VARIANTS[variant];
  const sizeStyles = BUTTON_SIZES[size];

  const baseStyle = {
    // Layout and dimensions
    width: fullWidth ? '100%' : 'auto',
    maxWidth: fullWidth ? DESIGN_TOKENS.layout.buttonMaxWidth : 'none',
    minHeight: sizeStyles.minHeight,
    
    // Typography
    fontSize: sizeStyles.fontSize,
    fontWeight: 'bold' as const,
    fontFamily: 'inherit',
    
    // Colors and appearance
    color: disabled ? 'rgba(255, 255, 255, 0.6)' : variantStyles.color,
    backgroundColor: disabled ? 'rgba(76, 175, 80, 0.4)' : variantStyles.background,
    border: disabled ? 'none' : variantStyles.border,
    borderRadius: sizeStyles.borderRadius,
    
    // Layout
    padding: sizeStyles.padding,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    gap: DESIGN_TOKENS.spacing.sm,
    
    // Interaction
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    
    // Animation and effects
    boxShadow: disabled ? 'none' : variantStyles.shadow,
    transition: `all ${DESIGN_TOKENS.transition.smooth}`,
    transform: 'translateY(0)',
    
    // Accessibility
    outline: 'none',
    
    // Prevent text selection and image dragging
    userSelect: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
  };

  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const button = e.currentTarget;
      button.style.backgroundColor = variantStyles.backgroundHover;
      button.style.color = variantStyles.colorHover;
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = variantStyles.shadowHover;
      
      if (variant === 'secondary') {
        button.style.borderColor = '#6c757d';
      }
    }
    onMouseOver?.(e);
  };

  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const button = e.currentTarget;
      button.style.backgroundColor = variantStyles.background;
      button.style.color = variantStyles.color;
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = variantStyles.shadow;
      
      if (variant === 'secondary') {
        button.style.borderColor = '#e9ecef';
      }
    }
    onMouseOut?.(e);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
    }
    onMouseDown?.(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
    }
    onMouseUp?.(e);
  };

  // Focus handling for keyboard accessibility
  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.outline = '2px solid rgba(76, 175, 80, 0.5)';
      e.currentTarget.style.outlineOffset = '2px';
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = 'none';
  };

  return (
    <button
      style={{ ...baseStyle, ...style }}
      disabled={disabled}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {children}
    </button>
  );
};