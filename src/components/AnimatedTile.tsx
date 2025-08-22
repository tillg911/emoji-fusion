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
  
  let tileColor = tile.isJoker ? '#8B5CF6' : getTileColor(tile.level); // Purple for joker
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

  return (
    <div
      onClick={handleClick}
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
        backgroundColor: tile.justMerged 
          ? 'rgba(255, 215, 0, 0.8)'
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
        cursor: (canInteract || isSelectable) ? (isSelectable ? 'crosshair' : 'pointer') : 'default',
      }}
    >
      {/* Frozen overlay */}
      {isFrozen && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(96, 165, 250, 0.3)',
          borderRadius: TILE_RADIUS,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: 'white',
          fontWeight: 'bold',
          zIndex: 1
        }}>
          ❄️
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
    </div>
  );
};