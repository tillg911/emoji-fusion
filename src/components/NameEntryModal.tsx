import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameButton } from './GameButton';
import { THEME_COLORS } from '../constants/colors';
import { DESIGN_TOKENS } from '../constants/design-system';
import { CELL_GAP } from '../constants/styles';
import { playButtonClick, playTop100 } from '../utils/sound';

interface NameEntryModalProps {
  isVisible: boolean;
  score: number;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export const NameEntryModal = ({ isVisible, score, onSubmit, onCancel }: NameEntryModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);

  // Calculate grid width for consistent button sizing
  const calculateGridButtonWidth = () => {
    const baseCellSize = 100;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    
    const availableWidth = Math.max(viewportWidth - 100, 320);
    const availableHeight = Math.max(viewportHeight - 350, 280);
    
    const cellSize = Math.min(
      baseCellSize,
      Math.floor((availableWidth - (3 * CELL_GAP)) / 4),
      Math.floor((availableHeight - (3 * CELL_GAP)) / 4)
    );
    
    const minCellSize = viewportWidth < 480 ? 50 : viewportWidth < 768 ? 65 : 75;
    const actualCellSize = Math.max(cellSize, minCellSize);
    
    return (actualCellSize + CELL_GAP) * 4 - CELL_GAP;
  };

  const gridWidth = calculateGridButtonWidth();

  // Handle animation visibility
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsAnimationVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimationVisible(false);
    }
  }, [isVisible]);

  // Reset name when modal opens
  useEffect(() => {
    if (isVisible) {
      setName('');
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTop100(); // Play celebration sound for high score submission
    const trimmedName = name.trim();
    onSubmit(trimmedName || t('common.anonymous'));
  };

  // Sound-enhanced handler for cancel action
  const handleCancel = () => {
    playButtonClick();
    onCancel();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit to 12 characters
    if (value.length <= 12) {
      setName(value);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        opacity: isAnimationVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)', // Match GameOverOverlay background
          borderRadius: DESIGN_TOKENS.borderRadius.xl,
          padding: DESIGN_TOKENS.layout.popupPadding,
          width: 'fit-content',
          minWidth: `${gridWidth}px`,
          maxWidth: `max(${gridWidth}px, min(90vw, 500px))`,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)', // Match GameOverOverlay shadow
          border: '2px solid rgba(255, 255, 255, 0.15)', // Match GameOverOverlay border
          color: 'white', // White text like GameOverOverlay
          textAlign: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: DESIGN_TOKENS.spacing.xl,
          }}
        >
          <h2
            style={{
              color: 'white', // Match GameOverOverlay text color
              fontSize: `clamp(${DESIGN_TOKENS.fontSize.lg}, 4vw, ${DESIGN_TOKENS.fontSize.xl})`,
              fontWeight: 'bold',
              margin: `0 0 ${DESIGN_TOKENS.spacing.lg} 0`,
            }}
          >
{t('nameEntry.newHighScore')}
          </h2>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white
              fontSize: `clamp(${DESIGN_TOKENS.fontSize.sm}, 3vw, ${DESIGN_TOKENS.fontSize.base})`,
              margin: `0 0 ${DESIGN_TOKENS.spacing.sm} 0`,
            }}
          >
{t('nameEntry.score', { score: score.toLocaleString() })}
          </p>
          <p
            style={{
              color: '#FFD700', // Gold color for instruction text like in GameOverOverlay
              fontSize: DESIGN_TOKENS.fontSize.sm,
              fontWeight: 'bold',
              margin: '0',
            }}
          >
{t('nameEntry.enterNamePrompt')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
placeholder={t('nameEntry.namePlaceholder')}
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              border: `2px solid ${THEME_COLORS.border.light}`,
              borderRadius: '8px',
              marginBottom: '20px',
              boxSizing: 'border-box',
              backgroundColor: THEME_COLORS.background,
              color: THEME_COLORS.textPrimary,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = THEME_COLORS.primary;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = THEME_COLORS.border.light;
            }}
          />

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}
          >
            <GameButton
              variant="secondary"
              size="sm"
              fullWidth={false}
              type="button"
              onClick={handleCancel}
              style={{ minWidth: '100px' }}
            >
{t('nameEntry.skip')}
            </GameButton>
            <GameButton
              variant="primary"
              size="sm"
              fullWidth={false}
              type="submit"
              style={{ minWidth: '100px' }}
            >
{t('nameEntry.saveScore')}
            </GameButton>
          </div>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '12px',
            color: THEME_COLORS.textSecondary,
          }}
        >
{t('nameEntry.charactersRemaining', { current: name.length, max: 12 })}
        </div>
      </div>
    </div>
  );
};