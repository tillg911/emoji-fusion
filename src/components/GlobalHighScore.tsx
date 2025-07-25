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
    background: 'rgba(255, 215, 0, 0.1)', // Gold background
    color: '#B8860B', // Dark gold text
    border: '2px solid rgba(255, 215, 0, 0.3)', // Gold border
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
      {t('startScreen.globalHighScore', { score: highScore.score.toLocaleString() })}
    </div>
  );
};