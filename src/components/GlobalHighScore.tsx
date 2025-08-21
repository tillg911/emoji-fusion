import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLeaderboard, LeaderboardEntry } from '../utils/storage';
import { DESIGN_TOKENS, BUTTON_SIZES } from '../constants/design-system';

interface GlobalHighScoreProps {
  style?: React.CSSProperties;
}

export const GlobalHighScore = ({ style }: GlobalHighScoreProps) => {
  const { t } = useTranslation();
  const [highScore, setHighScore] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHighScore = async () => {
      setIsLoading(true);
      try {
        const leaderboard = await getLeaderboard();
        // Get the highest score (first entry since it's ordered by score descending)
        setHighScore(leaderboard.length > 0 ? leaderboard[0] : null);
      } catch (error) {
        console.error('Failed to load high score:', error);
        setHighScore(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadHighScore();
  }, []);

  // Use the same styling as buttons to match the design
  const sizeStyles = BUTTON_SIZES.md;

  const baseStyle: React.CSSProperties = {
    // Match button dimensions and layout
    width: '100%',
    minHeight: sizeStyles.minHeight,
    
    // Match button visual styling
    padding: sizeStyles.padding,
    fontSize: sizeStyles.fontSize,
    fontWeight: 'bold',
    borderRadius: sizeStyles.borderRadius,
    
    // Use secondary button colors but with a different accent for high score
    background: 'rgba(255, 215, 0, 0.7)', // Balanced transparency gold background
    color: '#B8860B', // Dark gold text
    border: '2px solid rgba(255, 215, 0, 0.6)', // Balanced transparency gold border
    backdropFilter: 'blur(5px)', // Add backdrop blur to reduce emoji visibility
    boxShadow: DESIGN_TOKENS.boxShadow.base,
    
    // Text and layout
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    
    // Transitions
    transition: `all ${DESIGN_TOKENS.transition.base}`,
    
    // Prevent interaction
    cursor: 'default',
    userSelect: 'none',
    
    ...style,
  };

  if (isLoading) {
    return (
      <div style={baseStyle}>
        ⏳ Loading...
      </div>
    );
  }

  if (!highScore) {
    return (
      <div style={baseStyle}>
        {t('startScreen.noScoresYet')}
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}>
        <div style={{
          fontSize: 'clamp(12px, 2.5vw, 14px)',
          fontWeight: '600',
          opacity: 0.9,
        }}>
          {t('startScreen.globalHighScoreTitle')}
        </div>
        <div style={{
          fontSize: 'clamp(14px, 3vw, 16px)',
          fontWeight: 'bold',
        }}>
          {highScore.score.toLocaleString()}
        </div>
        <div style={{
          fontSize: 'clamp(10px, 2vw, 12px)',
          fontWeight: '500',
          opacity: 0.8,
        }}>
          {t('startScreen.globalHighScoreBy', { name: highScore.name })}
        </div>
      </div>
    </div>
  );
};