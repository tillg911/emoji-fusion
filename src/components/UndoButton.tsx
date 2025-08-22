import { useTranslation } from 'react-i18next';
import { GameButton } from './GameButton';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { DESIGN_TOKENS } from '../constants/design-system';
import { playUndo } from '../utils/sound';

interface UndoButtonProps {
  onUndo: () => void;
  canUndo: boolean;
  disabled?: boolean;
  allowUndoWhenDisabled?: boolean;
  gridWidth: number; // Width of the game grid to match
  extraUndos?: number; // Number of extra undos available
}

export const UndoButton = ({ 
  onUndo, 
  canUndo, 
  disabled = false,
  allowUndoWhenDisabled = false,
  gridWidth,
  extraUndos = 0
}: UndoButtonProps) => {
  const { t } = useTranslation();
  const { hasPhysicalKeyboard } = useDeviceDetection();

  // Sound-enhanced handler for undo action
  const handleUndo = () => {
    playUndo(); // Play specific undo sound
    onUndo();
  };
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      // Remove marginTop since spacing is now handled by parent container
    }}>
      <GameButton
        variant="warning"
        size="sm"
        fullWidth={false}
        onClick={handleUndo}
        disabled={!canUndo || (disabled && !allowUndoWhenDisabled)}
        style={{ 
          width: `${gridWidth}px`,
          minWidth: '280px',
          maxWidth: '500px',
          minHeight: DESIGN_TOKENS.layout.buttonMinHeight, // Match standard button height
          padding: `clamp(${DESIGN_TOKENS.spacing.sm}, 1.5vh, ${DESIGN_TOKENS.spacing.md}) ${DESIGN_TOKENS.spacing.lg}`,
          fontSize: 'clamp(14px, 3vw, 16px)',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span>
          {hasPhysicalKeyboard ? t('gameControls.undoShortcut') : t('gameControls.undo')}
        </span>
        {extraUndos > 0 && (
          <span style={{
            marginLeft: DESIGN_TOKENS.spacing.sm,
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            color: '#B45309',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: 'clamp(10px, 2.5vw, 12px)',
            fontWeight: 'bold'
          }}>
            +{extraUndos}
          </span>
        )}
      </GameButton>
    </div>
  );
};