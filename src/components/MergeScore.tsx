import { useEffect, useState } from 'react';

interface MergeScoreProps {
  score: number;
  x: number;
  y: number;
  cellSize: number;
  onComplete: () => void;
}

export const MergeScore = ({ score, x, y, cellSize, onComplete }: MergeScoreProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-remove after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 50); // Small delay to let fade-out finish
    }, 700);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x + cellSize / 2, // Center horizontally on tile
        top: y + cellSize / 2,  // Center vertically on tile
        transform: 'translate(-50%, -50%)', // Perfect center alignment
        pointerEvents: 'none', // Don't interfere with gameplay
        zIndex: 1000, // Above all tiles
        fontSize: '20px', // Slightly larger than normal text
        fontWeight: 'bold',
        color: '#FFFFFF', // White text for visibility
        fontFamily: 'Arial, sans-serif',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.5)', // Strong shadow for contrast
        animation: 'mergeScoreFloat 0.7s ease-out forwards',
      }}
    >
      +{score}
      <style>{`
        @keyframes mergeScoreFloat {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          40% {
            opacity: 1;
            transform: translate(-50%, -60%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -80%) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
};