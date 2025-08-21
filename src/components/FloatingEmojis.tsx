import { useEffect, useState, useMemo } from 'react';
import { EMOJI_MAP } from '../constants/emojis';
import { loadMaxDiscoveredRank } from '../utils/storage';

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  layer: number; // 0 = background, 1 = mid, 2 = foreground
}

interface FloatingEmojisProps {
  containerWidth: number;
  containerHeight: number;
  maxEmojis?: number;
}

export const FloatingEmojis = ({ 
  containerWidth, 
  containerHeight, 
  maxEmojis = 10 
}: FloatingEmojisProps) => {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  
  // Get discovered emojis based on persistent max discovered rank
  const { discoveredEmojis, weightedEmojiSelection } = useMemo(() => {
    // Load the highest ever discovered rank (persistent across sessions)
    const maxDiscoveredRank = loadMaxDiscoveredRank();
    
    // Create array from level 1 to highest ever discovered level
    const availableLevels = [];
    for (let level = 1; level <= maxDiscoveredRank; level++) {
      availableLevels.push(level);
    }
    
    // Convert to emoji array
    const emojis = availableLevels
      .map(level => EMOJI_MAP.get(level))
      .filter((emoji): emoji is string => emoji !== undefined);
    
    // Create weighted selection for higher ranks to appear more frequently
    // Higher levels get more weight (appear more often)
    const weightedSelection: string[] = [];
    availableLevels.forEach(level => {
      const emoji = EMOJI_MAP.get(level);
      if (emoji) {
        // Weight: level 1 gets 1 copy, level 2 gets 2 copies, etc.
        // But cap the weight to avoid too much bias (max 3 copies)
        const weight = Math.min(level, 3);
        for (let i = 0; i < weight; i++) {
          weightedSelection.push(emoji);
        }
      }
    });
    
    return {
      discoveredEmojis: emojis,
      weightedEmojiSelection: weightedSelection
    };
  }, []); // No dependencies - loadMaxDiscoveredRank() handles localStorage internally

  // Create initial emojis
  useEffect(() => {
    if (discoveredEmojis.length === 0 || containerWidth === 0 || containerHeight === 0) {
      return;
    }

    const createEmoji = (id: number): FloatingEmoji => {
      const layer = Math.floor(Math.random() * 3); // 0, 1, or 2
      const layerMultiplier = layer === 0 ? 0.3 : layer === 1 ? 0.6 : 1.0; // Parallax effect
      
      // Random starting position from all sides with diagonal movements
      const side = Math.floor(Math.random() * 4); // 0=left, 1=right, 2=top, 3=bottom
      let x, y, vx, vy;
      
      // Generate random angle for diagonal movement (in radians)
      const angle = Math.random() * Math.PI * 2; // 0 to 2π
      const speed = 2 + Math.random() * 2 * layerMultiplier;
      
      switch (side) {
        case 0: // From left
          x = -100;
          y = Math.random() * containerHeight;
          // Ensure movement is generally towards the right (angle between -π/2 and π/2)
          const rightAngle = (Math.random() - 0.5) * Math.PI; // -π/2 to π/2
          vx = Math.cos(rightAngle) * speed;
          vy = Math.sin(rightAngle) * speed;
          break;
        case 1: // From right
          x = containerWidth + 100;
          y = Math.random() * containerHeight;
          // Ensure movement is generally towards the left (angle between π/2 and 3π/2)
          const leftAngle = Math.PI + (Math.random() - 0.5) * Math.PI; // π/2 to 3π/2
          vx = Math.cos(leftAngle) * speed;
          vy = Math.sin(leftAngle) * speed;
          break;
        case 2: // From top
          x = Math.random() * containerWidth;
          y = -100;
          // Ensure movement is generally downward (angle between 0 and π)
          const downAngle = Math.random() * Math.PI; // 0 to π
          vx = Math.cos(downAngle) * speed;
          vy = Math.sin(downAngle) * speed;
          break;
        case 3: // From bottom
          x = Math.random() * containerWidth;
          y = containerHeight + 100;
          // Ensure movement is generally upward (angle between π and 2π)
          const upAngle = Math.PI + Math.random() * Math.PI; // π to 2π
          vx = Math.cos(upAngle) * speed;
          vy = Math.sin(upAngle) * speed;
          break;
        default:
          x = -100;
          y = Math.random() * containerHeight;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed;
      }
      
      return {
        id,
        emoji: weightedEmojiSelection[Math.floor(Math.random() * weightedEmojiSelection.length)],
        x,
        y,
        vx,
        vy,
        scale: 0.6 + Math.random() * 0.8 * layerMultiplier, // More variation: 0.6 to 1.4, scaled by layer
        opacity: 1.0, // No transparency
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.8 * layerMultiplier, // More rotation variation
        layer
      };
    };

    const initialEmojis = Array.from({ length: maxEmojis }, (_, i) => createEmoji(i));
    setEmojis(initialEmojis);
  }, [discoveredEmojis, containerWidth, containerHeight, maxEmojis]);

  // Animation loop with performance optimization
  useEffect(() => {
    if (emojis.length === 0) return;

    let animationId: number;
    const targetFPS = 60; // Smoother animation
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    const animate = (currentTime: number) => {

      // Throttle animation to target FPS
      if (currentTime - lastFrameTime >= frameInterval) {
        lastFrameTime = currentTime;

        setEmojis(prevEmojis => 
          prevEmojis.map(emoji => {
            let newX = emoji.x + emoji.vx;
            let newY = emoji.y + emoji.vy;
            let newRotation = emoji.rotation + emoji.rotationSpeed;

            // Reset emoji when it goes off any edge
            const buffer = 100;
            if (newX > containerWidth + buffer || newX < -buffer || 
                newY > containerHeight + buffer || newY < -buffer) {
              
              // Create new emoji from random side with diagonal movement
              const side = Math.floor(Math.random() * 4);
              const layerMultiplier = emoji.layer === 0 ? 0.3 : emoji.layer === 1 ? 0.6 : 1.0;
              let resetX, resetY, resetVx, resetVy;
              const speed = 2 + Math.random() * 2 * layerMultiplier;
              
              switch (side) {
                case 0: // From left
                  resetX = -100;
                  resetY = Math.random() * containerHeight;
                  const rightAngle = (Math.random() - 0.5) * Math.PI; // -π/2 to π/2
                  resetVx = Math.cos(rightAngle) * speed;
                  resetVy = Math.sin(rightAngle) * speed;
                  break;
                case 1: // From right
                  resetX = containerWidth + 100;
                  resetY = Math.random() * containerHeight;
                  const leftAngle = Math.PI + (Math.random() - 0.5) * Math.PI; // π/2 to 3π/2
                  resetVx = Math.cos(leftAngle) * speed;
                  resetVy = Math.sin(leftAngle) * speed;
                  break;
                case 2: // From top
                  resetX = Math.random() * containerWidth;
                  resetY = -100;
                  const downAngle = Math.random() * Math.PI; // 0 to π
                  resetVx = Math.cos(downAngle) * speed;
                  resetVy = Math.sin(downAngle) * speed;
                  break;
                case 3: // From bottom
                  resetX = Math.random() * containerWidth;
                  resetY = containerHeight + 100;
                  const upAngle = Math.PI + Math.random() * Math.PI; // π to 2π
                  resetVx = Math.cos(upAngle) * speed;
                  resetVy = Math.sin(upAngle) * speed;
                  break;
                default:
                  resetX = -100;
                  resetY = Math.random() * containerHeight;
                  const defaultAngle = Math.random() * Math.PI * 2;
                  resetVx = Math.cos(defaultAngle) * speed;
                  resetVy = Math.sin(defaultAngle) * speed;
              }
              
              const newEmoji = weightedEmojiSelection[Math.floor(Math.random() * weightedEmojiSelection.length)];
              return {
                ...emoji,
                emoji: newEmoji,
                x: resetX,
                y: resetY,
                vx: resetVx,
                vy: resetVy,
                scale: 0.6 + Math.random() * 0.8 * layerMultiplier,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 0.8 * layerMultiplier
              };
            }

            return {
              ...emoji,
              x: newX,
              y: newY,
              rotation: newRotation
            };
          })
        );
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [emojis.length, containerWidth, containerHeight]);

  if (discoveredEmojis.length === 0) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0, // Behind main content but above other background elements
      }}
    >
      {emojis.map(emoji => (
        <div
          key={emoji.id}
          style={{
            position: 'absolute',
            left: emoji.x,
            top: emoji.y,
            fontSize: `${40 + emoji.scale * 20}px`, // 2x smaller: 40px to 60px based on scale
            opacity: emoji.opacity,
            transform: `scale(${emoji.scale}) rotate(${emoji.rotation}deg)`,
            filter: 'blur(0.3px)', // Subtle blur for dreamy effect
            userSelect: 'none',
            zIndex: emoji.layer + 1, // 1, 2, 3 for proper layering (no negative z-index)
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
};