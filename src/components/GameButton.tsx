import { ReactNode, ButtonHTMLAttributes } from 'react';

interface GameButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  children: ReactNode;
  disabled?: boolean;
}

export const GameButton = ({ 
  children, 
  disabled = false,
  onMouseOver,
  onMouseOut,
  ...props 
}: GameButtonProps) => {
  const baseStyle = {
    // Responsive dimensions for consistency
    width: '100%',
    maxWidth: '320px',
    minHeight: 'clamp(56px, 8vh, 64px)',
    
    // Responsive typography
    fontSize: 'clamp(16px, 2.5vh, 20px)',
    fontWeight: 'bold' as const,
    
    // Colors and appearance
    color: disabled ? 'rgba(255, 255, 255, 0.6)' : 'white',
    backgroundColor: disabled ? 'rgba(76, 175, 80, 0.4)' : '#4CAF50',
    border: 'none',
    borderRadius: '16px',
    
    // Responsive layout
    padding: 'clamp(12px, 2vh, 16px) clamp(20px, 3vh, 24px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    
    // Interaction
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    
    // Animation
    boxShadow: disabled ? 'none' : '0 6px 20px rgba(76, 175, 80, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'translateY(0)',
    
    // Responsive font sizing
    '@media (max-width: 480px)': {
      fontSize: '18px',
      minHeight: '56px',
      padding: '14px 20px',
    }
  };

  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = '#45a049';
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.4)';
    }
    onMouseOver?.(e);
  };

  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = '#4CAF50';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.3)';
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