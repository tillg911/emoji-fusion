import { useTranslation } from 'react-i18next';
import { hasSavedGame } from '../utils/storage';
import { GameButton } from './GameButton';
import { GlobalHighScore } from './GlobalHighScore';
import { ResponsiveContainer } from './ResponsiveContainer';
import { DESIGN_TOKENS } from '../constants/design-system';
import { CELL_GAP } from '../constants/styles';

interface StartScreenProps {
  onStartGame: () => void;
  onContinueGame: () => void;
  onShowLeaderboard: () => void;
}

export const StartScreen = ({ onStartGame, onContinueGame, onShowLeaderboard }: StartScreenProps) => {
  const { t } = useTranslation();
  const hasActiveSave = hasSavedGame();

  // Calculate button width based on game grid dimensions for consistency
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

  const gridButtonWidth = calculateGridButtonWidth();

  return (
    <ResponsiveContainer>
      {/* Game Title */}
      <div style={{
        fontSize: DESIGN_TOKENS.fontSize['4xl'],
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        margin: '0',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}>
{t('app.title')}
      </div>

      {/* Game Description */}
      <div style={{
        fontSize: DESIGN_TOKENS.fontSize.base,
        color: '#666',
        textAlign: 'center',
        maxWidth: '90%',
        lineHeight: '1.5',
        margin: '0',
      }}>
{t('app.description')}
      </div>

      {/* Action Buttons and High Score */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: DESIGN_TOKENS.spacing.lg,
        alignItems: 'center',
        width: '100%',
        maxWidth: `${gridButtonWidth}px`,
      }}>
        {/* Global High Score Display - positioned above buttons */}
        <GlobalHighScore />
        <GameButton 
          onClick={onStartGame}
          variant="primary"
          style={{
            width: `${gridButtonWidth}px`,
            minWidth: '280px',
            maxWidth: '500px',
          }}
        >
{t('startScreen.startNewGame')}
        </GameButton>

        <GameButton
          onClick={onContinueGame}
          disabled={!hasActiveSave}
          variant="secondary"
          style={{
            width: `${gridButtonWidth}px`,
            minWidth: '280px',
            maxWidth: '500px',
          }}
        >
{t('startScreen.continueGame')}
        </GameButton>

        <GameButton 
          onClick={onShowLeaderboard}
          variant="secondary"
          style={{
            width: `${gridButtonWidth}px`,
            minWidth: '280px',
            maxWidth: '500px',
          }}
        >
{t('startScreen.leaderboard')}
        </GameButton>
      </div>
    </ResponsiveContainer>
  );
};