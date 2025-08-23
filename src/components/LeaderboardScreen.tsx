import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLeaderboard, LeaderboardEntry } from '../utils/storage';
import { GameButton } from './GameButton';
import { ResponsiveContainer } from './ResponsiveContainer';
import { FloatingEmojis } from './FloatingEmojis';
import { useResponsive } from '../hooks/useResponsive';
import { safePlayerName } from '../utils/playerNameUtils';
import { EMOJI_MAP } from '../constants/emojis';
import { DESIGN_TOKENS } from '../constants/design-system';
import { CELL_GAP } from '../constants/styles';
import { playButtonClick } from '../utils/sound';

interface LeaderboardScreenProps {
  onBackToHome: () => void;
}

export const LeaderboardScreen = ({ onBackToHome }: LeaderboardScreenProps) => {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isMobile } = useResponsive();

  // Sound-enhanced handler for back button
  const handleBackToHome = () => {
    playButtonClick();
    onBackToHome();
  };

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

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const topScores = leaderboard.slice(0, 100); // Show top 100 scores

  return (
    <ResponsiveContainer>
      {/* Floating Emojis Background */}
      <FloatingEmojis 
        containerWidth={typeof window !== 'undefined' ? window.innerWidth : 800}
        containerHeight={typeof window !== 'undefined' ? window.innerHeight : 600}
        maxEmojis={20}
      />
      
      {/* Screen Title */}
      <div style={{
        fontSize: DESIGN_TOKENS.fontSize['3xl'],
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        margin: '0',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 1,
      }}>
{t('leaderboard.title')}
      </div>

      {/* Leaderboard Container */}
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '500px',
        backgroundColor: 'white',
        borderRadius: DESIGN_TOKENS.borderRadius.xl,
        boxShadow: DESIGN_TOKENS.boxShadow.overlay,
        padding: isMobile 
          ? `${DESIGN_TOKENS.spacing.lg} ${DESIGN_TOKENS.spacing.md}` 
          : `clamp(${DESIGN_TOKENS.spacing.xl}, 4vh, ${DESIGN_TOKENS.spacing['3xl']})`,
        minHeight: 'clamp(300px, 50vh, 400px)',
        maxHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        margin: '0',
        position: 'relative',
        zIndex: 1,
      }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            textAlign: 'center',
            color: '#666',
          }}>
            <div style={{
              fontSize: DESIGN_TOKENS.fontSize['4xl'],
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
              ⏳
            </div>
            <div style={{
              fontSize: DESIGN_TOKENS.fontSize.lg,
              fontWeight: 'bold',
              color: '#333',
            }}>
{t('leaderboard.loading')}
            </div>
          </div>
        ) : topScores.length > 0 ? (
          <>
            <div style={{
              fontSize: DESIGN_TOKENS.fontSize.xl,
              fontWeight: 'bold',
              color: '#333',
              textAlign: 'center',
              marginBottom: DESIGN_TOKENS.spacing.xl,
            }}>
{t('leaderboard.topScores')}
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: DESIGN_TOKENS.spacing.md,
              flex: 1,
            }}>
              {topScores.map((entry, index) => {
                const isFirst = index === 0;
                const isTop3 = index < 3;
                
                return (
                  <div
                    key={`${entry.score}-${entry.name}-${index}`}
                    style={{
                      position: 'relative',
                      display: 'grid',
                      gridTemplateColumns: isMobile 
                        ? '32px 1fr 60px 80px' 
                        : '40px 1fr 80px 100px',
                      alignItems: 'center',
                      gap: isMobile 
                        ? DESIGN_TOKENS.spacing.sm
                        : DESIGN_TOKENS.spacing.md,
                      padding: isMobile 
                        ? `${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.sm}` 
                        : `${DESIGN_TOKENS.spacing.lg} ${DESIGN_TOKENS.spacing.xl}`,
                      backgroundColor: isFirst 
                        ? 'rgba(255, 215, 0, 0.12)' 
                        : isTop3 
                          ? 'rgba(76, 175, 80, 0.06)' 
                          : 'rgba(248, 249, 250, 0.8)',
                      borderRadius: DESIGN_TOKENS.borderRadius.lg,
                      border: isFirst 
                        ? '1px solid rgba(255, 215, 0, 0.3)' 
                        : isTop3 
                          ? '1px solid rgba(76, 175, 80, 0.15)' 
                          : '1px solid rgba(0, 0, 0, 0.06)',
                      transition: `transform ${DESIGN_TOKENS.transition.base}`,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Rank */}
                    <div style={{
                      fontSize: isMobile ? DESIGN_TOKENS.fontSize.base : DESIGN_TOKENS.fontSize.lg,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: isFirst 
                        ? '#FFD700' 
                        : index === 1 
                          ? '#C0C0C0' 
                          : index === 2 
                            ? '#CD7F32' 
                            : '#666',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isFirst ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                    </div>
                    
                    {/* Player Name - Protected from i18n translation */}
                    <div style={{
                      fontSize: isMobile ? DESIGN_TOKENS.fontSize.sm : DESIGN_TOKENS.fontSize.base,
                      fontWeight: '500',
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: '0',
                    }}>
                      <span lang="und" suppressHydrationWarning>
                        {safePlayerName(entry.name)}
                      </span>
                    </div>
                    
                    {/* Highest Tile - Fixed width for consistent alignment */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: DESIGN_TOKENS.spacing.xs,
                      color: '#666',
                      fontWeight: '500',
                      fontSize: isMobile ? DESIGN_TOKENS.fontSize.xs : DESIGN_TOKENS.fontSize.sm,
                      textAlign: 'center',
                      width: '100%',
                      position: 'relative',
                    }}>
                      <span style={{ 
                        fontSize: isMobile ? DESIGN_TOKENS.fontSize.sm : DESIGN_TOKENS.fontSize.base,
                        lineHeight: '1',
                      }}>
                        {EMOJI_MAP.get(entry.highestTile || 1) || '❓'}
                      </span>
                      <span style={{
                        fontSize: isMobile ? DESIGN_TOKENS.fontSize.xs : DESIGN_TOKENS.fontSize.sm,
                        lineHeight: '1',
                        minWidth: isMobile ? '16px' : '20px',
                        textAlign: 'left',
                      }}>
                        {entry.highestTile || 1}
                      </span>
                    </div>
                    
                    {/* Score - Fixed width for consistent layout */}
                    <div style={{
                      fontSize: isMobile ? DESIGN_TOKENS.fontSize.sm : DESIGN_TOKENS.fontSize.base,
                      fontWeight: '600',
                      color: '#333',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}>
                      {entry.score.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            textAlign: 'center',
            color: '#666',
          }}>
            <div style={{
              fontSize: DESIGN_TOKENS.fontSize['4xl'],
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
              🎮
            </div>
            <div style={{
              fontSize: DESIGN_TOKENS.fontSize.xl,
              fontWeight: 'bold',
              marginBottom: DESIGN_TOKENS.spacing.sm,
              color: '#333',
            }}>
{t('leaderboard.noScores')}
            </div>
            <div style={{
              fontSize: DESIGN_TOKENS.fontSize.base,
              lineHeight: '1.5',
            }}>
{t('leaderboard.noScoresDescription')}
            </div>
          </div>
        )}
      </div>

      {/* Home Button */}
      <div style={{
        width: '100%',
        maxWidth: `${gridButtonWidth}px`,
        position: 'relative',
        zIndex: 1,
      }}>
        <GameButton 
          onClick={handleBackToHome}
          variant="secondary"
          style={{
            width: `${gridButtonWidth}px`,
            minWidth: '280px',
            maxWidth: '500px',
          }}
        >
{t('leaderboard.home')}
        </GameButton>
      </div>
    </ResponsiveContainer>
  );
};