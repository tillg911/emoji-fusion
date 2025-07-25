import { getHighScore, hasSavedGame } from '../utils/storage';
import { GameButton } from './GameButton';
import { ResponsiveContainer } from './ResponsiveContainer';
import { DESIGN_TOKENS } from '../constants/design-system';

interface StartScreenProps {
  onStartGame: () => void;
  onContinueGame: () => void;
  onShowLeaderboard: () => void;
}

export const StartScreen = ({ onStartGame, onContinueGame, onShowLeaderboard }: StartScreenProps) => {
  const highScore = getHighScore();
  const hasActiveSave = hasSavedGame();

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
        🎮 Emoji Fusion
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
        Merge tiles with the same emoji to create new ones! Use arrow keys to move tiles and reach the highest score possible.
      </div>

      {/* High Score Display */}
      {highScore > 0 && (
        <div style={{
          fontSize: DESIGN_TOKENS.fontSize.lg,
          color: '#4CAF50',
          fontWeight: 'bold',
          padding: `${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl}`,
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderRadius: DESIGN_TOKENS.borderRadius.lg,
          border: '2px solid rgba(76, 175, 80, 0.2)',
          margin: '0',
          textAlign: 'center',
          boxShadow: DESIGN_TOKENS.boxShadow.sm,
        }}>
          🏆 High Score: {highScore.toLocaleString()}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: DESIGN_TOKENS.spacing.lg,
        alignItems: 'center',
        width: '100%',
        maxWidth: DESIGN_TOKENS.layout.buttonMaxWidth,
      }}>
        <GameButton 
          onClick={onStartGame}
          variant="primary"
        >
          ✅ Start New Game
        </GameButton>

        <GameButton
          onClick={onContinueGame}
          disabled={!hasActiveSave}
          variant="secondary"
        >
          ▶️ Continue Game
        </GameButton>

        <GameButton 
          onClick={onShowLeaderboard}
          variant="secondary"
        >
          🏆 Leaderboard
        </GameButton>
      </div>
    </ResponsiveContainer>
  );
};