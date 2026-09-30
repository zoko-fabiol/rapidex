/**
 * Haptic feedback utility for mobile touch interactions
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      if (type === 'light') {
        navigator.vibrate(12);
      } else if (type === 'medium') {
        navigator.vibrate(25);
      } else if (type === 'success') {
        navigator.vibrate([15, 30, 20]);
      } else if (type === 'warning') {
        navigator.vibrate([30, 50, 30]);
      }
    } catch {
      // Ignore if vibration is restricted or unsupported
    }
  }
}
