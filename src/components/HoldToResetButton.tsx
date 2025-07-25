import { useResetHold } from '../hooks/useResetHold';
import { THEME_COLORS } from '../constants/colors';
import { DESIGN_TOKENS, BUTTON_SIZES } from '../constants/design-system';

interface HoldToResetButtonProps {
  onReset: () => void;
  disabled?: boolean;
}

// Helper function to convert hex to RGB values
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
};

// Color interpolation utility: smooth primary → warning → danger transition
const getProgressColor = (progress: number): string => {
  // Clamp progress between 0 and 1
  const t = Math.max(0, Math.min(1, progress));
  
  if (t <= 0.5) {
    // Primary to Warning (0% to 50%)
    const localT = t * 2; // Convert 0-0.5 to 0-1
    const [r1, g1, b1] = hexToRgb(THEME_COLORS.primary);    // #4CAF50 (green)
    const [r2, g2, b2] = hexToRgb(THEME_COLORS.warning);    // #FFEB3B (yellow)
    
    const r = Math.round(r1 + (r2 - r1) * localT);
    const g = Math.round(g1 + (g2 - g1) * localT);
    const b = Math.round(b1 + (b2 - b1) * localT);
    
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Warning to Danger (50% to 100%)
    const localT = (t - 0.5) * 2; // Convert 0.5-1 to 0-1
    const [r1, g1, b1] = hexToRgb(THEME_COLORS.warning);    // #FFEB3B (yellow)
    const [r2, g2, b2] = hexToRgb(THEME_COLORS.danger);     // #F44336 (red)
    
    const r = Math.round(r1 + (r2 - r1) * localT);
    const g = Math.round(g1 + (g2 - g1) * localT);
    const b = Math.round(b1 + (b2 - b1) * localT);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
};

export const HoldToResetButton = ({ onReset, disabled = false }: HoldToResetButtonProps) => {
  // Use the unified reset hold hook
  const { isHolding, progress, startMouseHold, cancelMouseHold, startTouchHold, cancelTouchHold } = useResetHold({
    onReset,
    duration: 1000, // 1 second
    disabled
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startMouseHold();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    cancelMouseHold();
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    cancelMouseHold();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startTouchHold();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    cancelTouchHold();
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    e.preventDefault();
    cancelTouchHold();
  };

  const progressPercentage = Math.max(0, Math.min(100, progress * 100));
  const fillColor = getProgressColor(progress);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        disabled={disabled}
        style={{
          position: 'relative',
          fontSize: BUTTON_SIZES.sm.fontSize,
          padding: BUTTON_SIZES.sm.padding,
          minWidth: 'clamp(80px, 15vw, 140px)',
          minHeight: BUTTON_SIZES.sm.minHeight,
          fontWeight: 'bold',
          border: `2px solid ${THEME_COLORS.border.light}`,
          borderRadius: BUTTON_SIZES.sm.borderRadius,
          backgroundColor: disabled ? THEME_COLORS.background : THEME_COLORS.background,
          color: disabled ? THEME_COLORS.uiGray : THEME_COLORS.textSecondary,
          cursor: disabled ? 'not-allowed' : 'pointer',
          overflow: 'hidden',
          userSelect: 'none',
          transition: `all ${DESIGN_TOKENS.transition.base}`,
          opacity: disabled ? 0.5 : 1,
          boxShadow: isHolding ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : 'none',
        }}
        onMouseOver={(e) => {
          if (!disabled && !isHolding) {
            e.currentTarget.style.backgroundColor = THEME_COLORS.hover.secondary;
            e.currentTarget.style.color = THEME_COLORS.textPrimary;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = THEME_COLORS.border.dark;
          }
        }}
        onMouseOut={(e) => {
          if (!disabled && !isHolding) {
            e.currentTarget.style.backgroundColor = THEME_COLORS.background;
            e.currentTarget.style.color = THEME_COLORS.textSecondary;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = THEME_COLORS.border.light;
          }
        }}
      >
        {/* Progress Fill Background - only show when holding */}
        {isHolding && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${progressPercentage}%`,
              height: '100%',
              backgroundColor: fillColor,
              zIndex: 1,
              borderRadius: '6px',
            }}
          />
        )}
        
        {/* Button Text */}
        <span style={{
          position: 'relative',
          zIndex: 2,
          color: progressPercentage > 30 ? THEME_COLORS.textInverse : (disabled ? THEME_COLORS.uiGray : THEME_COLORS.textSecondary),
          textShadow: progressPercentage > 30 ? '0 1px 2px rgba(0,0,0,0.8)' : 'none',
        }}>
          🔁 Reset (R)
        </span>
      </button>
    </div>
  );
};