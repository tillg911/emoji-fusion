import { useRef, useCallback, useEffect } from 'react';

interface SwipeDetectionOptions {
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  disabled?: boolean;
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  element?: React.RefObject<HTMLElement>;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const useSwipeDetection = ({
  onSwipe,
  disabled = false,
  minSwipeDistance = 30,
  maxSwipeTime = 1000,
  element,
}: SwipeDetectionOptions) => {
  const touchStartRef = useRef<TouchPoint | null>(null);
  const isTouchDeviceRef = useRef<boolean>(false);

  // Detect if device supports touch
  useEffect(() => {
    isTouchDeviceRef.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const handleTouchStart = useCallback(
    (event: Event) => {
      const touchEvent = event as TouchEvent;
      if (disabled || !onSwipe) return;

      // Only handle single touch
      if (touchEvent.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = touchEvent.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      // Prevent default for game container to avoid scrolling
      event.preventDefault();
    },
    [disabled, onSwipe]
  );

  const handleTouchEnd = useCallback(
    (event: Event) => {
      const touchEvent = event as TouchEvent;
      if (disabled || !onSwipe || !touchStartRef.current) return;

      // Only handle single touch
      if (touchEvent.changedTouches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = touchEvent.changedTouches[0];
      const touchEnd = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      const touchStart = touchStartRef.current;
      touchStartRef.current = null;

      // Check if swipe was too slow
      const swipeTime = touchEnd.timestamp - touchStart.timestamp;
      if (swipeTime > maxSwipeTime) {
        return;
      }

      // Calculate distance and direction
      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Check if swipe distance is sufficient
      const maxDistance = Math.max(absDeltaX, absDeltaY);
      if (maxDistance < minSwipeDistance) {
        return;
      }

      // Determine swipe direction based on dominant axis
      let direction: 'up' | 'down' | 'left' | 'right';
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        direction = deltaY > 0 ? 'down' : 'up';
      }

      console.log(`📱 Touch swipe detected: ${direction} (${maxDistance}px in ${swipeTime}ms)`);
      onSwipe(direction);

      // Prevent default to avoid any browser gestures
      event.preventDefault();
    },
    [disabled, onSwipe, minSwipeDistance, maxSwipeTime]
  );

  const handleTouchMove = useCallback(
    (event: Event) => {
      if (disabled || !touchStartRef.current) return;

      // For game grid area, prevent default to avoid scrolling during swipe
      // Only if we have a valid touch start point
      if (touchStartRef.current) {
        event.preventDefault();
      }
    },
    [disabled]
  );

  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  // Set up touch event listeners
  useEffect(() => {
    if (disabled || !isTouchDeviceRef.current) return;

    const targetElement = element?.current || document;

    // Use passive: false for touchstart and touchmove to allow preventDefault
    const touchStartOptions = { passive: false };
    const touchMoveOptions = { passive: false };
    const touchEndOptions = { passive: false };

    targetElement.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    targetElement.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    targetElement.addEventListener('touchend', handleTouchEnd, touchEndOptions);
    targetElement.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      targetElement.removeEventListener('touchstart', handleTouchStart);
      targetElement.removeEventListener('touchmove', handleTouchMove);
      targetElement.removeEventListener('touchend', handleTouchEnd);
      targetElement.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [
    disabled,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    element,
  ]);

  return {
    isTouchDevice: isTouchDeviceRef.current,
    isSwipeInProgress: touchStartRef.current !== null,
  };
};