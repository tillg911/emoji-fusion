import { SelectingPowerUp } from '../types';
import { GameButton } from './GameButton';
import { DESIGN_TOKENS } from '../constants/design-system';

interface SelectionBannerProps {
  selectingPowerUp: SelectingPowerUp;
  onCancel: () => void;
  gridWidth: number;
}

const getSelectionText = (selectingPowerUp: SelectingPowerUp): string => {
  if (!selectingPowerUp) return '';
  
  const remaining = selectingPowerUp.required - selectingPowerUp.picked.length;
  
  switch (selectingPowerUp.type) {
    case 'swap':
      if (remaining === 2) return 'Power-Up aktiv: Zwei Tiles wählen zum Vertauschen.';
      if (remaining === 1) return 'Zweites Tile zum Vertauschen wählen.';
      return 'Tiles werden vertauscht...';
    case 'delete':
      if (remaining === 1) return 'Power-Up aktiv: Ein Tile wählen zum Entfernen.';
      return 'Tile wird entfernt...';
    case 'freeze':
      if (remaining === 1) return 'Power-Up aktiv: Ein Tile wählen zum Einfrieren (3 Züge).';
      return 'Tile wird eingefroren...';
    default:
      return '';
  }
};

export const SelectionBanner = ({ selectingPowerUp, onCancel, gridWidth }: SelectionBannerProps) => {
  if (!selectingPowerUp) return null;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: `${gridWidth}px`,
      margin: '0 auto',
      marginBottom: DESIGN_TOKENS.spacing.md,
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      border: '2px solid #D97706',
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.2)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: DESIGN_TOKENS.spacing.md,
      }}>
        <div style={{
          flex: 1,
          color: '#92400E',
          fontSize: 'clamp(13px, 2.8vw, 15px)',
          fontWeight: '600',
          lineHeight: 1.3,
        }}>
          {getSelectionText(selectingPowerUp)}
        </div>
        
        <GameButton
          variant="secondary"
          size="sm"
          onClick={onCancel}
          style={{
            minWidth: '80px',
            padding: '6px 12px',
            fontSize: 'clamp(12px, 2.5vw, 14px)',
            fontWeight: '600',
          }}
        >
          Abbrechen
        </GameButton>
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
          color: '#92400E',
          fontWeight: '500',
        }}>
          {selectingPowerUp.picked.length} / {selectingPowerUp.required} ausgewählt
        </span>
        <div style={{
          flex: 1,
          height: '4px',
          backgroundColor: 'rgba(146, 64, 14, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(selectingPowerUp.picked.length / selectingPowerUp.required) * 100}%`,
            height: '100%',
            backgroundColor: '#D97706',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </div>
  );
};