import { useState, useEffect } from 'react';
import { getLeaderboard, LeaderboardEntry } from '../utils/storage';
import { GameButton } from './GameButton';
import { ResponsiveContainer } from './ResponsiveContainer';
import { EMOJI_MAP } from '../constants/emojis';
import { DESIGN_TOKENS } from '../constants/design-system';

interface LeaderboardScreenProps {
  onBackToHome: () => void;
}

export const LeaderboardScreen = ({ onBackToHome }: LeaderboardScreenProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const topScores = leaderboard.slice(0, 10); // Show only top 10 scores

  return (
    <ResponsiveContainer>
      {/* Screen Title */}
      <div style={{
        fontSize: DESIGN_TOKENS.fontSize['3xl'],
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        margin: '0',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}>
        🏆 Leaderboard
      </div>

      {/* Leaderboard Container */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'white',
        borderRadius: DESIGN_TOKENS.borderRadius.xl,
        boxShadow: DESIGN_TOKENS.boxShadow.overlay,
        padding: `clamp(${DESIGN_TOKENS.spacing.xl}, 4vh, ${DESIGN_TOKENS.spacing['3xl']})`,
        minHeight: 'clamp(300px, 50vh, 400px)',
        maxHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        margin: '0',
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
              Loading leaderboard...
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
              Top Scores
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
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: `${DESIGN_TOKENS.spacing.lg} ${DESIGN_TOKENS.spacing.xl}`,
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
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      gap: 'clamp(12px, 2vh, 16px)',
                    }}>
                      {/* Left: Rank + Player Name */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: DESIGN_TOKENS.spacing.lg,
                        flex: '1',
                        minWidth: '0', // Allow text truncation if needed
                      }}>
                        {/* Rank with special styling */}
                        <div style={{
                          fontSize: DESIGN_TOKENS.fontSize.lg,
                          fontWeight: 'bold',
                          minWidth: 'clamp(30px, 4vh, 35px)',
                          textAlign: 'center',
                          color: isFirst 
                            ? '#FFD700' 
                            : index === 1 
                              ? '#C0C0C0' 
                              : index === 2 
                                ? '#CD7F32' 
                                : '#666',
                        }}>
                          {isFirst ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                        </div>
                        
                        {/* Player Name */}
                        <div style={{
                          fontSize: DESIGN_TOKENS.fontSize.base,
                          fontWeight: '500',
                          color: '#333',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {entry.name}
                        </div>
                      </div>
                      
                      {/* Center: Highest Tile Emoji + Level */}
                      <div style={{
                        fontSize: DESIGN_TOKENS.fontSize.sm,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: DESIGN_TOKENS.spacing.xs,
                        color: '#666',
                        fontWeight: '500',
                        minWidth: 'clamp(50px, 8vh, 60px)',
                      }}>
                        <span style={{ fontSize: DESIGN_TOKENS.fontSize.base }}>
                          {EMOJI_MAP.get(entry.highestTile || 1) || '❓'}
                        </span>
                        <span>
                          {entry.highestTile || 1}
                        </span>
                      </div>
                      
                      {/* Right: Score */}
                      <div style={{
                        fontSize: DESIGN_TOKENS.fontSize.base,
                        fontWeight: '600',
                        color: '#333',
                        textAlign: 'right',
                        minWidth: 'clamp(60px, 10vh, 80px)',
                      }}>
                        {entry.score.toLocaleString()}
                      </div>
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
              No Scores Yet
            </div>
            <div style={{
              fontSize: DESIGN_TOKENS.fontSize.base,
              lineHeight: '1.5',
            }}>
              Play your first game to start building your leaderboard!
            </div>
          </div>
        )}
      </div>

      {/* Home Button */}
      <div style={{
        width: '100%',
        maxWidth: DESIGN_TOKENS.layout.buttonMaxWidth,
      }}>
        <GameButton 
          onClick={onBackToHome}
          variant="secondary"
        >
          🏠 Home
        </GameButton>
      </div>
    </ResponsiveContainer>
  );
};