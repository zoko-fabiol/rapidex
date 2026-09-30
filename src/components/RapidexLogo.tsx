import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const RapidexLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: { iconW: 32, iconH: 26, text: 'text-2xl', gap: 'gap-2.5' },
    md: { iconW: 42, iconH: 34, text: 'text-3xl', gap: 'gap-3' },
    lg: { iconW: 56, iconH: 45, text: 'text-4xl', gap: 'gap-3.5' },
    xl: { iconW: 76, iconH: 62, text: 'text-5xl sm:text-6xl', gap: 'gap-4' },
  };

  const { iconW, iconH, text, gap } = sizeMap[size];

  return (
    <div className={`inline-flex items-center justify-center ${gap} select-none ${className}`}>
      {/* Exact Rapidex Iconic Arch: Upper yellow, lower purple, curved over */}
      <svg
        width={iconW}
        height={iconH}
        viewBox="0 0 100 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
      >
        {/* Outer Yellow/Gold Arc */}
        <path
          d="M 12 70 C 12 30 35 12 76 12 C 86 12 92 14 94 16 C 92 24 82 24 74 24 C 44 24 28 38 26 70 Z"
          fill="#F59E0B"
        />
        {/* Inner Purple/Violet Arc */}
        <path
          d="M 26 70 C 28 42 44 24 74 24 C 82 24 92 24 94 16 C 94 22 88 32 76 34 C 52 38 40 50 38 70 Z"
          fill="#6D28D9"
        />
      </svg>

      {/* Brand Text in Serif font exactly matching rapidexpay.net */}
      {showText && (
        <span
          className={`font-['Playfair_Display',serif] font-bold text-white tracking-tight leading-none ${text}`}
        >
          Rapidex
        </span>
      )}
    </div>
  );
};
