import { ReactNode, ButtonHTMLAttributes } from 'react';
import { THEME_COLORS } from '../constants/colors';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
}

const getVariantStyles = (variant: ButtonProps['variant'], disabled: boolean) => {
  const baseOpacity = disabled ? 0.5 : 1;
  const cursor = disabled ? 'not-allowed' : 'pointer';
  
  switch (variant) {
    case 'primary':
      return {
        color: THEME_COLORS.textInverse,
        backgroundColor: THEME_COLORS.primary,
        borderColor: 'transparent',
        boxShadow: `0 4px 12px rgba(76, 175, 80, 0.3)`,
        hoverColor: THEME_COLORS.textInverse,
        hoverBackgroundColor: disabled ? THEME_COLORS.primary : THEME_COLORS.hover.primary,
        hoverBoxShadow: disabled ? `0 4px 12px rgba(76, 175, 80, 0.3)` : `0 6px 16px rgba(76, 175, 80, 0.4)`,
        opacity: baseOpacity,
        cursor,
      };
    case 'secondary':
      return {
        color: THEME_COLORS.textSecondary,
        backgroundColor: THEME_COLORS.background,
        borderColor: THEME_COLORS.border.light,
        boxShadow: 'none',
        hoverColor: disabled ? THEME_COLORS.textSecondary : THEME_COLORS.textPrimary,
        hoverBackgroundColor: disabled ? THEME_COLORS.background : THEME_COLORS.hover.secondary,
        hoverBoxShadow: 'none',
        opacity: baseOpacity,
        cursor,
      };
    case 'danger':
      return {
        color: THEME_COLORS.textInverse,
        backgroundColor: THEME_COLORS.danger,
        borderColor: 'transparent',
        boxShadow: `0 2px 8px rgba(244, 67, 54, 0.3)`,
        hoverColor: THEME_COLORS.textInverse,
        hoverBackgroundColor: disabled ? THEME_COLORS.danger : THEME_COLORS.hover.danger,
        hoverBoxShadow: disabled ? `0 2px 8px rgba(244, 67, 54, 0.3)` : `0 4px 12px rgba(244, 67, 54, 0.4)`,
        opacity: baseOpacity,
        cursor,
      };
    case 'warning':
      return {
        color: THEME_COLORS.textPrimary,
        backgroundColor: THEME_COLORS.warning,
        borderColor: 'transparent',
        boxShadow: `0 2px 8px rgba(255, 235, 59, 0.3)`,
        hoverColor: THEME_COLORS.textPrimary,
        hoverBackgroundColor: disabled ? THEME_COLORS.warning : THEME_COLORS.hover.warning,
        hoverBoxShadow: disabled ? `0 2px 8px rgba(255, 235, 59, 0.3)` : `0 4px 12px rgba(255, 235, 59, 0.4)`,
        opacity: baseOpacity,
        cursor,
      };
    default:
      return getVariantStyles('primary', disabled);
  }
};

const getSizeStyles = (size: ButtonProps['size']) => {
  switch (size) {
    case 'small':
      return {
        fontSize: '14px',
        padding: '8px 16px',
        minWidth: '100px',
      };
    case 'large':
      return {
        fontSize: '20px',
        padding: '16px 32px',
        minWidth: '220px',
      };
    case 'medium':
    default:
      return {
        fontSize: '16px',
        padding: '12px 20px',
        minWidth: '120px',
      };
  }
};

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  fullWidth = false,
  onMouseOver,
  onMouseOut,
  ...props 
}: ButtonProps) => {
  const variantStyles = getVariantStyles(variant, disabled);
  const sizeStyles = getSizeStyles(size);

  const baseStyle = {
    fontWeight: 'bold',
    border: variant === 'secondary' ? `2px solid ${variantStyles.borderColor}` : 'none',
    borderRadius: variant === 'secondary' ? '8px' : '12px',
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : 'auto',
    ...sizeStyles,
    ...variantStyles,
  };

  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = variantStyles.hoverBackgroundColor;
      e.currentTarget.style.color = variantStyles.hoverColor;
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = variantStyles.hoverBoxShadow;
      if (variant === 'secondary') {
        e.currentTarget.style.borderColor = THEME_COLORS.border.dark;
      }
    }
    onMouseOver?.(e);
  };

  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = variantStyles.backgroundColor;
      e.currentTarget.style.color = variantStyles.color;
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = variantStyles.boxShadow;
      if (variant === 'secondary') {
        e.currentTarget.style.borderColor = variantStyles.borderColor;
      }
    }
    onMouseOut?.(e);
  };

  return (
    <button
      style={baseStyle}
      disabled={disabled}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      {...props}
    >
      {children}
    </button>
  );
};