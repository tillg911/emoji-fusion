import { useEffect, useState } from 'react';
import { Tile } from '../types';
import { EMOJI_MAP, JOKER_EMOJI } from '../constants/emojis';
import { getTileColor, getTileTextColor } from '../constants/colors';
import { TILE_RADIUS, CELL_GAP, TILE_PADDING } from '../constants/styles';

interface AnimatedTileProps {
  tile: Tile;
  cellSize: number;
  onTileClick?: (tile: Tile, row: number, col: number) => void;
  isFrozen?: boolean;
  freezeTurns?: number;
  isSelected?: boolean;
  canInteract?: boolean;
  isSelectable?: boolean;
  isPicked?: boolean;
}

export const AnimatedTile = ({ 
  tile, 
  cellSize, 
  onTileClick, 
  isFrozen = false, 
  freezeTurns = 0,
  isSelected = false, 
  canInteract = false,
  isSelectable = false,
  isPicked = false
}: AnimatedTileProps) => {
  const [scale, setScale] = useState(tile.justSpawned ? 0.7 : 1);
  const [opacity, setOpacity] = useState(tile.justSpawned ? 0.5 : 1);

  useEffect(() => {
    if (tile.justSpawned) {
      setTimeout(() => {
        setScale(1);
        setOpacity(1);
      }, 10);
    }
  }, [tile.justSpawned]);

  useEffect(() => {
    if (tile.justMerged) {
      setScale(1.3);
      setTimeout(() => setScale(1), 150);
    }
  }, [tile.justMerged]);

  const emoji = tile.isJoker ? JOKER_EMOJI : (EMOJI_MAP.get(tile.level) || '❓');
  // Use consistent spacing with grid cells
  const x = tile.col * (cellSize + CELL_GAP);
  const y = tile.row * (cellSize + CELL_GAP);
  
  let tileColor = tile.isJoker ? 'linear-gradient(45deg, #FFD700, #FFA500, #FF69B4, #9370DB)' : getTileColor(tile.level); // Gradient for joker
  let textColor = tile.isJoker ? '#FFFFFF' : getTileTextColor(tile.level);
  
  // Apply frozen overlay
  if (isFrozen) {
    tileColor = '#60A5FA'; // Ice blue
    textColor = '#FFFFFF';
  }
  
  // Apply selection highlight - prioritize isPicked over isSelected
  if (isPicked) {
    tileColor = '#10B981'; // Emerald green for picked tiles
  } else if (isSelected) {
    tileColor = '#34D399'; // Green for selected (legacy swap)
  }

  const handleClick = () => {
    if ((canInteract || isSelectable) && onTileClick) {
      onTileClick(tile, tile.row, tile.col);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling and other touch behaviors
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleClick();
  };

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: cellSize,
        height: cellSize,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: tile.justMerged 
          ? 'rgba(255, 215, 0, 0.8)'
          : tile.isJoker 
            ? tileColor
            : tileColor,
        borderRadius: TILE_RADIUS,
        border: isPicked
          ? '3px solid #059669' // Darker emerald for picked
          : isSelected 
            ? '3px solid #10B981' 
            : isFrozen 
              ? '2px solid #3B82F6'
              : isSelectable
                ? '2px solid #F59E0B' // Amber border for selectable tiles
                : '1px solid rgba(255, 255, 255, 0.3)',
        transform: `scale(${scale})`,
        opacity: opacity,
        transition: 'left 0.2s ease, top 0.2s ease, transform 0.15s ease, opacity 0.2s ease, background-color 0.3s ease, box-shadow 0.3s ease',
        boxSizing: 'border-box',
        boxShadow: tile.justMerged 
          ? '0 4px 16px rgba(255, 215, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.15)'
          : tile.isJoker && !isPicked && !isSelected && !isFrozen && !isSelectable
            ? '0 4px 20px rgba(255, 215, 0, 0.6), 0 6px 16px rgba(255, 105, 180, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15)'
            : isPicked
              ? '0 4px 16px rgba(5, 150, 105, 0.5), 0 2px 8px rgba(0, 0, 0, 0.15)'
              : isSelected 
                ? '0 4px 16px rgba(16, 185, 129, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15)'
                : isFrozen
                  ? '0 4px 16px rgba(59, 130, 246, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15)'
                  : isSelectable
                    ? '0 4px 12px rgba(245, 158, 11, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: tile.justMerged ? 100 : isSelected ? 50 : 10,
        padding: TILE_PADDING,
        cursor: (canInteract || isSelectable) ? 'pointer' : 'default',
        // Mobile touch improvements
        WebkitTapHighlightColor: 'rgba(0,0,0,0)', // Remove iOS tap highlight
        WebkitTouchCallout: 'none', // Disable iOS callout
        WebkitUserSelect: 'none', // Disable text selection
        userSelect: 'none',
        touchAction: 'manipulation', // Better touch handling
      }}
    >
      {/* Joker sparkling overlay */}
      {tile.isJoker && !isFrozen && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: TILE_RADIUS,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 1
        }}>
          {/* Sparkling animation */}
          <div style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.8) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.6) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(255, 215, 0, 0.4) 0%, transparent 50%)',
            animation: 'sparkle 2s ease-in-out infinite',
            transform: 'translate(-50%, -50%)',
            top: '50%',
            left: '50%'
          }} />
        </div>
      )}
      
      {/* Frozen overlay */}
      {isFrozen && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(96, 165, 250, 0.3)',
          borderRadius: TILE_RADIUS,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2
        }}>
          <div style={{
            fontSize: Math.max(8, cellSize * 0.15),
            color: 'white',
            fontWeight: 'bold',
            marginBottom: '1px'
          }}>
            ❄️
          </div>
          <div style={{
            fontSize: Math.max(6, cellSize * 0.12),
            color: 'white',
            fontWeight: 'bold',
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderRadius: '8px',
            padding: '1px 4px',
            minWidth: '12px',
            textAlign: 'center'
          }}>
            {freezeTurns}
          </div>
        </div>
      )}
      <div
        style={{
          fontSize: Math.max(16, cellSize * 0.35), // Responsive emoji size
          lineHeight: '1',
          marginBottom: Math.max(1, cellSize * 0.025), // Responsive spacing
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {emoji}
      </div>
      <div
        style={{
          fontSize: Math.max(8, cellSize * 0.15), // Responsive text size
          fontWeight: '600',
          color: textColor,
          lineHeight: '1',
          fontFamily: 'Arial, sans-serif',
          textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {tile.isJoker ? 'JOKER' : tile.level}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes sparkle {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};