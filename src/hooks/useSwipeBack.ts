import { useEffect, useRef, useState } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface UseSwipeBackOptions {
  onBack?: () => void;
  enabled?: boolean;
  edgeThreshold?: number; // Distance from left edge to start gesture (default 70px)
  swipeDistanceThreshold?: number; // Minimum swipe distance (default 75px)
}

/**
 * Mobile edge-swipe-back hook (iOS/Android native gesture behavior)
 */
export function useSwipeBack({
  onBack,
  enabled = true,
  edgeThreshold = 75,
  swipeDistanceThreshold = 80,
}: UseSwipeBackOptions) {
  const [swipeProgress, setSwipeProgress] = useState(0); // 0 to 1
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasTriggeredHapticRef = useRef(false);

  useEffect(() => {
    if (!enabled || !onBack) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Only initiate if touching near the left edge of the screen
      if (touch.clientX <= edgeThreshold) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
        hasTriggeredHapticRef.current = false;
        setIsSwiping(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // If scrolling vertically more than horizontally, cancel
      if (deltaY > deltaX && deltaX < 30) {
        touchStartRef.current = null;
        setIsSwiping(false);
        setSwipeProgress(0);
        return;
      }

      if (deltaX > 0) {
        const progress = Math.min(1, deltaX / swipeDistanceThreshold);
        setSwipeProgress(progress);
        if (progress >= 1 && !hasTriggeredHapticRef.current) {
          triggerHaptic('medium');
          hasTriggeredHapticRef.current = true;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      const duration = Date.now() - touchStartRef.current.time;

      const isFlick = deltaX > 40 && deltaY < 40 && duration < 280;
      const isPastThreshold = deltaX >= swipeDistanceThreshold && deltaY < deltaX;

      if (isFlick || isPastThreshold) {
        triggerHaptic('success');
        onBack();
      }

      touchStartRef.current = null;
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, onBack, edgeThreshold, swipeDistanceThreshold]);

  return { isSwiping, swipeProgress };
}
