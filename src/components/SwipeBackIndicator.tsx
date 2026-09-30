import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SwipeBackIndicatorProps {
  isSwiping: boolean;
  swipeProgress: number; // 0 to 1
}

export const SwipeBackIndicator: React.FC<SwipeBackIndicatorProps> = ({
  isSwiping,
  swipeProgress,
}) => {
  if (!isSwiping || swipeProgress <= 0.05) return null;

  const isTriggered = swipeProgress >= 1;
  const translateX = Math.min(swipeProgress * 32, 32);

  return (
    <div
      className="fixed left-0 top-1/2 -translate-y-1/2 z-[999] pointer-events-none transition-transform duration-75 ease-out"
      style={{ transform: `translate3d(${translateX}px, -50%, 0)` }}
    >
      <div
        className={`w-11 h-11 rounded-r-2xl flex items-center justify-center shadow-2xl backdrop-blur-md transition-all ${
          isTriggered
            ? 'bg-[#EAB308] text-slate-950 scale-110 shadow-amber-500/30'
            : 'bg-[#151E33]/90 text-white border border-[#23314F]/80'
        }`}
      >
        <ArrowLeft className={`w-5 h-5 stroke-[2.5] ${isTriggered ? 'animate-pulse' : ''}`} />
      </div>
    </div>
  );
};
