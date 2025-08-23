import { useState } from 'react';
import { PowerUp, PowerUpType } from '../types';
import { PowerUpTooltip } from './PowerUpTooltip';
import { DESIGN_TOKENS } from '../constants/design-system';

interface PowerUpBarProps {
  powerUps: PowerUp[];
  onUsePowerUp: (powerUpId: string) => void;
  disabled?: boolean;
  gridWidth?: number; // Width to match other UI elements
  slowMotionTurns?: number; // Active slowmo turns count
}

const POWER_UP_EMOJIS: Record<PowerUpType, string> = {
  freeze: '🧊',
  swap: '🔀',
  delete: '🗑️',
  undo: '⏪',
  slowmo: '⏳'
};

const POWER_UP_COLORS: Record<PowerUpType, string> = {
  freeze: '#60A5FA', // Blue
  swap: '#34D399', // Green
  delete: '#F87171', // Red
  undo: '#FBBF24', // Yellow
  slowmo: '#A78BFA'  // Purple
};

export const PowerUpBar = ({ powerUps, onUsePowerUp, disabled = false, gridWidth, slowMotionTurns = 0 }: PowerUpBarProps) => {
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    type: PowerUpType | null;
    powerUpId: string | null;
    position: { x: number; y: number };
  }>({
    visible: false,
    type: null,
    powerUpId: null,
    position: { x: 0, y: 0 }
  });

  const handleSlotClick = (powerUp: PowerUp, event: React.MouseEvent) => {
    if (disabled) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.bottom;

    setTooltipState({
      visible: true,
      type: powerUp.type,
      powerUpId: powerUp.id,
      position: { x, y }
    });
  };

  const handleConfirm = () => {
    if (tooltipState.powerUpId) {
      onUsePowerUp(tooltipState.powerUpId);
    }
    setTooltipState({ visible: false, type: null, powerUpId: null, position: { x: 0, y: 0 } });
  };

  const handleCancel = () => {
    setTooltipState({ visible: false, type: null, powerUpId: null, position: { x: 0, y: 0 } });
  };

  // Create 4 slots, fill with power-ups or show empty
  const slots = Array.from({ length: 4 }, (_, index) => {
    const powerUp = powerUps[index];
    return { powerUp, index };
  });

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: DESIGN_TOKENS.spacing.sm,
        padding: DESIGN_TOKENS.spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '12px',
        border: '2px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        width: gridWidth ? `${gridWidth}px` : 'fit-content',
        minWidth: '280px',
        maxWidth: '500px',
      }}>
        {/* Slowmo Indicator */}
        {slowMotionTurns > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '8px',
            backgroundColor: '#A78BFA',
            border: '2px solid rgba(167, 139, 250, 0.3)',
            fontSize: '28px',
            animation: 'pulse-slowmo 2s ease-in-out infinite',
            position: 'relative',
            transition: 'all 0.2s ease',
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              ⏳
              {/* Counter badge */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#FBB040',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}>
                {slowMotionTurns}
              </div>
            </div>
          </div>
        )}
        
        {slots.map(({ powerUp, index }) => (
          <div
            key={index}
            onClick={powerUp ? (e) => handleSlotClick(powerUp, e) : undefined}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              border: '2px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: powerUp && !disabled ? 'pointer' : 'default',
              backgroundColor: powerUp 
                ? POWER_UP_COLORS[powerUp.type]
                : 'rgba(0, 0, 0, 0.05)',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.2s ease',
              position: 'relative',
              fontSize: '28px',
            }}
            onMouseEnter={(e) => {
              if (powerUp && !disabled) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title={powerUp ? `${POWER_UP_EMOJIS[powerUp.type]} ${powerUp.type}` : 'Empty slot'}
          >
            {powerUp ? POWER_UP_EMOJIS[powerUp.type] : '⭕'}
            
            {/* Subtle glow effect for active power-ups */}
            {powerUp && (
              <div style={{
                position: 'absolute',
                inset: '-2px',
                borderRadius: '10px',
                background: `linear-gradient(45deg, ${POWER_UP_COLORS[powerUp.type]}, transparent)`,
                opacity: 0.3,
                zIndex: -1,
              }} />
            )}
          </div>
        ))}
      </div>


      {/* Tooltip */}
      {tooltipState.visible && tooltipState.type && (
        <PowerUpTooltip
          type={tooltipState.type}
          visible={tooltipState.visible}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          position={tooltipState.position}
        />
      )}
    </>
  );
};