import { getLeaderboard } from '../utils/storage';
import { GameButton } from './GameButton';
import { ResponsiveContainer } from './ResponsiveContainer';
import { EMOJI_MAP } from '../constants/emojis';

interface LeaderboardScreenProps {
  onBackToHome: () => void;
}

export const LeaderboardScreen = ({ onBackToHome }: LeaderboardScreenProps) => {
  const leaderboard = getLeaderboard();
  const topScores = leaderboard.slice(0, 10); // Show only top 10 scores

  return (
    <ResponsiveContainer>
      {/* Screen Title */}
      <div style={{
        fontSize: 'clamp(28px, 5vh, 42px)',
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        margin: '0',
      }}>
        🏆 Leaderboard
      </div>

      {/* Leaderboard Container */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        padding: 'clamp(20px, 4vh, 32px)',
        minHeight: 'clamp(300px, 50vh, 400px)',
        maxHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        margin: '0',
      }}>
        {topScores.length > 0 ? (
          <>
            <div style={{
              fontSize: 'clamp(20px, 3vh, 24px)',
              fontWeight: 'bold',
              color: '#333',
              textAlign: 'center',
              marginBottom: 'clamp(16px, 3vh, 24px)',
            }}>
              Top Scores
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(8px, 1.5vh, 12px)',
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
                      padding: 'clamp(14px, 2.5vh, 18px) clamp(16px, 3vh, 20px)',
                      backgroundColor: isFirst 
                        ? 'rgba(255, 215, 0, 0.12)' 
                        : isTop3 
                          ? 'rgba(76, 175, 80, 0.06)' 
                          : 'rgba(248, 249, 250, 0.8)',
                      borderRadius: '10px',
                      border: isFirst 
                        ? '1px solid rgba(255, 215, 0, 0.3)' 
                        : isTop3 
                          ? '1px solid rgba(76, 175, 80, 0.15)' 
                          : '1px solid rgba(0, 0, 0, 0.06)',
                      transition: 'transform 0.2s ease',
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
                        gap: 'clamp(12px, 2vh, 16px)',
                        flex: '1',
                        minWidth: '0', // Allow text truncation if needed
                      }}>
                        {/* Rank with special styling */}
                        <div style={{
                          fontSize: 'clamp(18px, 2.8vh, 22px)',
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
                          fontSize: 'clamp(16px, 2.5vh, 18px)',
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
                        fontSize: 'clamp(14px, 2.2vh, 16px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'clamp(4px, 0.8vh, 6px)',
                        color: '#666',
                        fontWeight: '500',
                        minWidth: 'clamp(50px, 8vh, 60px)',
                      }}>
                        <span style={{ fontSize: 'clamp(16px, 2.5vh, 18px)' }}>
                          {EMOJI_MAP.get(entry.highestTile || 1) || '❓'}
                        </span>
                        <span>
                          {entry.highestTile || 1}
                        </span>
                      </div>
                      
                      {/* Right: Score */}
                      <div style={{
                        fontSize: 'clamp(16px, 2.5vh, 18px)',
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
              fontSize: 'clamp(40px, 8vh, 48px)',
              marginBottom: 'clamp(12px, 2vh, 16px)',
            }}>
              🎮
            </div>
            <div style={{
              fontSize: 'clamp(18px, 3vh, 20px)',
              fontWeight: 'bold',
              marginBottom: 'clamp(6px, 1vh, 8px)',
              color: '#333',
            }}>
              No Scores Yet
            </div>
            <div style={{
              fontSize: 'clamp(14px, 2vh, 16px)',
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
        maxWidth: '320px',
      }}>
        <GameButton onClick={onBackToHome}>
          🏠 Home
        </GameButton>
      </div>
    </ResponsiveContainer>
  );
};