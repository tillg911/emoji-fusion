import { getHighScore, hasSavedGame } from '../utils/storage';
import { GameButton } from './GameButton';
import { ResponsiveContainer } from './ResponsiveContainer';

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
        fontSize: 'clamp(32px, 6vh, 48px)',
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        margin: '0',
      }}>
        🎮 Emoji Fusion
      </div>

      {/* Game Description */}
      <div style={{
        fontSize: 'clamp(14px, 2.5vh, 18px)',
        color: '#666',
        textAlign: 'center',
        maxWidth: '90%',
        lineHeight: '1.4',
        margin: '0',
      }}>
        Merge tiles with the same emoji to create new ones! Use arrow keys to move tiles and reach the highest score possible.
      </div>

      {/* High Score Display */}
      {highScore > 0 && (
        <div style={{
          fontSize: 'clamp(16px, 3vh, 20px)',
          color: '#4CAF50',
          fontWeight: 'bold',
          padding: 'clamp(8px, 1.5vh, 12px) clamp(16px, 3vh, 24px)',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderRadius: '8px',
          border: '2px solid rgba(76, 175, 80, 0.2)',
          margin: '0',
          textAlign: 'center',
        }}>
          🏆 High Score: {highScore.toLocaleString()}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(12px, 2vh, 20px)',
        alignItems: 'center',
        width: '100%',
        maxWidth: '400px',
      }}>
        <GameButton onClick={onStartGame}>
          ✅ Start New Game
        </GameButton>

        <GameButton
          onClick={onContinueGame}
          disabled={!hasActiveSave}
        >
          ▶️ Continue Game
        </GameButton>

        <GameButton onClick={onShowLeaderboard}>
          🏆 Leaderboard
        </GameButton>
      </div>
    </ResponsiveContainer>
  );
};