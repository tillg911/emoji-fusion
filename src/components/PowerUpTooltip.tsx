import { PowerUpType } from '../types';
import { DESIGN_TOKENS } from '../constants/design-system';

interface PowerUpTooltipProps {
  type: PowerUpType;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  position: { x: number; y: number };
}

const POWER_UP_DESCRIPTIONS: Record<PowerUpType, { title: string; description: string; emoji: string }> = {
  freeze: {
    emoji: '🧊',
    title: 'Freeze Tile',
    description: 'Friert ein Tile für 3 Züge ein. Kann nicht bewegt oder gemerged werden.'
  },
  swap: {
    emoji: '🔀',
    title: 'Swap Tiles',
    description: 'Vertauscht zwei beliebige Tiles miteinander.'
  },
  delete: {
    emoji: '🗑️',
    title: 'Delete Tile',
    description: 'Löscht ein beliebiges Tile vom Spielfeld.'
  },
  undo: {
    emoji: '⏪',
    title: 'Extra Undo',
    description: 'Gewährt einen zusätzlichen Undo-Versuch.'
  },
  slowmo: {
    emoji: '⏳',
    title: 'Slow Motion',
    description: 'Für die nächsten 5 Züge spawnen keine neuen Tiles.'
  }
};

export const PowerUpTooltip = ({ type, visible, onConfirm, onCancel, position }: PowerUpTooltipProps) => {
  if (!visible) return null;

  const powerUpInfo = POWER_UP_DESCRIPTIONS[type];
  
  // Responsive sizing
  const isMobile = window.innerWidth < 480;
  const tooltipWidth = isMobile ? Math.min(280, window.innerWidth - 32) : 240;
  const leftPos = Math.max(16, Math.min(position.x - tooltipWidth/2, window.innerWidth - tooltipWidth - 16));

  return (
    <div
      style={{
        position: 'fixed',
        left: leftPos,
        top: Math.max(16, position.y + 10),
        width: `${tooltipWidth}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: isMobile ? DESIGN_TOKENS.spacing.sm : DESIGN_TOKENS.spacing.md,
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        fontSize: isMobile ? DESIGN_TOKENS.fontSize.xs : DESIGN_TOKENS.fontSize.sm,
        lineHeight: '1.4',
      }}
    >
      {/* Header with emoji and title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: DESIGN_TOKENS.spacing.sm,
        marginBottom: DESIGN_TOKENS.spacing.sm,
        fontSize: DESIGN_TOKENS.fontSize.base,
        fontWeight: '600'
      }}>
        <span style={{ fontSize: '20px' }}>{powerUpInfo.emoji}</span>
        {powerUpInfo.title}
      </div>

      {/* Description */}
      <div style={{
        marginBottom: DESIGN_TOKENS.spacing.md,
        color: '#cccccc'
      }}>
        {powerUpInfo.description}
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: DESIGN_TOKENS.spacing.xs,
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onCancel}
          style={{
            padding: isMobile ? `${DESIGN_TOKENS.spacing.xs} ${DESIGN_TOKENS.spacing.sm}` : `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.md}`,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? DESIGN_TOKENS.fontSize.xs : DESIGN_TOKENS.fontSize.sm,
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: isMobile ? `${DESIGN_TOKENS.spacing.xs} ${DESIGN_TOKENS.spacing.sm}` : `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.md}`,
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? DESIGN_TOKENS.fontSize.xs : DESIGN_TOKENS.fontSize.sm,
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#45a049';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4CAF50';
          }}
        >
          Use Power-Up
        </button>
      </div>

      {/* Pointer triangle */}
      <div style={{
        position: 'absolute',
        top: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderBottom: '8px solid rgba(0, 0, 0, 0.9)'
      }} />
    </div>
  );
};