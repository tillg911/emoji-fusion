import { SelectingPowerUp } from '../types';
import { DESIGN_TOKENS } from '../constants/design-system';

interface PowerUpHintProps {
  selectingPowerUp: SelectingPowerUp;
  onCancel: () => void;
  gridWidth: number;
}

const getSelectionText = (selectingPowerUp: SelectingPowerUp): string => {
  if (!selectingPowerUp) return '';
  
  const remaining = selectingPowerUp.required - selectingPowerUp.picked.length;
  
  switch (selectingPowerUp.type) {
    case 'swap':
      if (remaining === 2) return 'Power-Up aktiv – wähle zwei Tiles zum Vertauschen.';
      if (remaining === 1) return 'Wähle das zweite Tile zum Vertauschen.';
      return 'Tiles werden vertauscht...';
    case 'delete':
      if (remaining === 1) return 'Power-Up aktiv – wähle ein Tile zum Entfernen.';
      return 'Tile wird entfernt...';
    case 'freeze':
      if (remaining === 1) return 'Power-Up aktiv – wähle ein Tile zum Einfrieren.';
      return 'Tile wird eingefroren...';
    default:
      return '';
  }
};

export const PowerUpHint = ({ selectingPowerUp, onCancel, gridWidth }: PowerUpHintProps) => {
  if (!selectingPowerUp) return null;

  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '10px' : '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: isMobile ? 'calc(100vw - 20px)' : '100%',
      maxWidth: isMobile ? '320px' : `${Math.max(gridWidth, 320)}px`,
      padding: isMobile ? '0 5px' : '0 10px',
      zIndex: 100, // Above game elements but below full overlays
      pointerEvents: 'none', // Allow clicks to pass through to game
      display: 'flex',
      justifyContent: 'center',
      animation: 'slideInFromTop 0.3s ease-out',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '100%', // Use full available width
        padding: isMobile ? DESIGN_TOKENS.spacing.xs : DESIGN_TOKENS.spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Same as PowerUpBar
        border: '2px solid rgba(0, 0, 0, 0.1)', // Same as PowerUpBar
        borderRadius: isMobile ? '8px' : '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // Similar to PowerUpBar but slightly stronger
        backdropFilter: 'blur(8px)', // Add blur effect for modern look
        pointerEvents: 'auto', // Re-enable clicks on the hint itself
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? DESIGN_TOKENS.spacing.xs : DESIGN_TOKENS.spacing.sm,
        }}>
          <div style={{
            flex: 1,
            color: '#333333', // Standard dark text color like other UI elements
            fontSize: isMobile ? 'clamp(10px, 2.2vw, 12px)' : 'clamp(12px, 2.5vw, 14px)',
            fontWeight: '600',
            lineHeight: 1.2,
            wordBreak: 'break-word', // Allow text to break if needed
          }}>
            {getSelectionText(selectingPowerUp)}
          </div>
          
          <button
            onClick={onCancel}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#F87171', // Red color
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              pointerEvents: 'auto',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EF4444'; // Darker red on hover
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F87171';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Progress indicator */}
        <div style={{
          marginTop: DESIGN_TOKENS.spacing.xs,
          display: 'flex',
          alignItems: 'center',
          gap: DESIGN_TOKENS.spacing.xs,
        }}>
          <span style={{
            fontSize: 'clamp(10px, 2vw, 12px)',
            color: '#666666', // Consistent secondary text color
            fontWeight: '500',
          }}>
            {selectingPowerUp.picked.length} / {selectingPowerUp.required} ausgewählt
          </span>
          <div style={{
            flex: 1,
            height: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)', // Neutral background like other UI elements
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(selectingPowerUp.picked.length / selectingPowerUp.required) * 100}%`,
              height: '100%',
              backgroundColor: '#4CAF50', // Primary green color from design tokens
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};