import { useEffect, useState } from 'react';
import { Tile } from '../types';
import { EMOJI_MAP } from '../constants/emojis';
import { getTileColor, getTileTextColor } from '../constants/colors';
import { TILE_RADIUS, CELL_GAP, TILE_PADDING } from '../constants/styles';

interface AnimatedTileProps {
  tile: Tile;
  cellSize: number;
}

export const AnimatedTile = ({ tile, cellSize }: AnimatedTileProps) => {
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

  const emoji = EMOJI_MAP.get(tile.level) || '❓';
  // Use consistent spacing with grid cells
  const x = tile.col * (cellSize + CELL_GAP);
  const y = tile.row * (cellSize + CELL_GAP);
  const tileColor = getTileColor(tile.level);
  const textColor = getTileTextColor(tile.level);

  return (
    <div
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
        border: '1px solid rgba(255, 255, 255, 0.3)',
        transform: `scale(${scale})`,
        opacity: opacity,
        transition: 'left 0.2s ease, top 0.2s ease, transform 0.15s ease, opacity 0.2s ease, background-color 0.3s ease, box-shadow 0.3s ease',
        boxSizing: 'border-box',
        boxShadow: tile.justMerged 
          ? '0 4px 16px rgba(255, 215, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.15)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: tile.justMerged ? 100 : 10,
        padding: TILE_PADDING,
      }}
    >
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
        {tile.level}
      </div>
    </div>
  );
};