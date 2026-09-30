import React from 'react';

export type SupportedCountryCode =
  | 'RU' | 'RUS'
  | 'CM' | 'CMR'
  | 'CI' | 'CIV'
  | 'SN' | 'SEN'
  | 'GA' | 'GAB'
  | 'CG' | 'COG'
  | 'ML' | 'MLI'
  | 'BJ' | 'BEN'
  | 'TG' | 'TGO'
  | 'BF' | 'BFA'
  | 'FR' | 'FRA'
  | 'GB' | 'GBR' | 'UK' | 'EN';

export interface FlagProps {
  countryCode: string;
  size?: number;
  className?: string;
  shape?: 'circle' | 'rounded';
}

export function normalizeCountryCode(code: string): string {
  if (!code) return 'RU';
  const clean = code.trim().toUpperCase();

  // Handle emojis
  if (code.includes('🇷🇺')) return 'RU';
  if (code.includes('🇨🇲')) return 'CM';
  if (code.includes('🇨🇮')) return 'CI';
  if (code.includes('🇸🇳')) return 'SN';
  if (code.includes('🇬🇦')) return 'GA';
  if (code.includes('🇨🇬')) return 'CG';
  if (code.includes('🇲🇱')) return 'ML';
  if (code.includes('🇧🇯')) return 'BJ';
  if (code.includes('🇹🇬')) return 'TG';
  if (code.includes('🇧🇫')) return 'BF';
  if (code.includes('🇫🇷')) return 'FR';
  // Handle country names in French, English, Russian
  if (clean.includes('RUSSIE') || clean.includes('RUSSIA') || clean.includes('РОССИ') || clean.includes('MOSCOU') || clean.includes('MOSCOW')) return 'RU';
  if (clean.includes('CAMEROUN') || clean.includes('CAMEROON')) return 'CM';
  if (clean.includes('IVOIRE') || clean.includes('IVORY')) return 'CI';
  if (clean.includes('SENEGAL') || clean.includes('SÉNÉGAL')) return 'SN';
  if (clean.includes('GABON')) return 'GA';
  if (clean.includes('CONGO')) return 'CG';
  if (clean.includes('MALI')) return 'ML';
  if (clean.includes('BENIN') || clean.includes('BÉNIN')) return 'BJ';
  if (clean.includes('TOGO')) return 'TG';
  if (clean.includes('BURKINA')) return 'BF';
  if (clean.includes('FRANCE') || clean.includes('FRANÇ')) return 'FR';

  // 3-letter or 2-letter mapping
  switch (clean) {
    case 'RU':
    case 'RUS':
      return 'RU';
    case 'CM':
    case 'CMR':
      return 'CM';
    case 'CI':
    case 'CIV':
      return 'CI';
    case 'SN':
    case 'SEN':
      return 'SN';
    case 'GA':
    case 'GAB':
      return 'GA';
    case 'CG':
    case 'COG':
      return 'CG';
    case 'ML':
    case 'MLI':
      return 'ML';
    case 'BJ':
    case 'BEN':
      return 'BJ';
    case 'TG':
    case 'TGO':
      return 'TG';
    case 'BF':
    case 'BFA':
      return 'BF';
    case 'FR':
    case 'FRA':
      return 'FR';
    case 'GB':
    case 'GBR':
    case 'UK':
    case 'EN':
      return 'GB';
    default:
      return clean.slice(0, 2);
  }
}

export const FlagIcon: React.FC<FlagProps> = ({
  countryCode,
  size = 32,
  className = '',
  shape = 'circle',
}) => {
  const code = normalizeCountryCode(countryCode);
  const s = size;
  const borderRadius = shape === 'circle' ? '50%' : '6px';

  const baseSvgProps = {
    width: s,
    height: s,
    viewBox: '0 0 32 32',
    style: {
      width: `${s}px`,
      height: `${s}px`,
      borderRadius,
      overflow: 'hidden' as const,
      display: 'inline-block',
      flexShrink: 0,
    },
    className: `shrink-0 shadow-sm border border-white/10 ${className}`,
  };

  switch (code) {
    case 'RU':
      // Russian Federation (White, Blue, Red)
      return (
        <svg {...baseSvgProps}>
          <rect width="32" height="10.67" fill="#FFFFFF" />
          <rect y="10.67" width="32" height="10.67" fill="#0039A6" />
          <rect y="21.33" width="32" height="10.67" fill="#D52B1E" />
        </svg>
      );

    case 'FR':
      // France (Blue, White, Red)
      return (
        <svg {...baseSvgProps}>
          <rect width="10.67" height="32" fill="#002395" />
          <rect x="10.67" width="10.67" height="32" fill="#FFFFFF" />
          <rect x="21.34" width="10.67" height="32" fill="#ED2939" />
        </svg>
      );

    case 'GB':
      // United Kingdom (Union Jack)
      return (
        <svg {...baseSvgProps}>
          <rect width="32" height="32" fill="#012169" />
          {/* White diagonals */}
          <line x1="0" y1="0" x2="32" y2="32" stroke="#FFFFFF" strokeWidth="5.5" />
          <line x1="32" y1="0" x2="0" y2="32" stroke="#FFFFFF" strokeWidth="5.5" />
          {/* Red diagonals */}
          <line x1="0" y1="0" x2="32" y2="32" stroke="#C8102E" strokeWidth="2.2" />
          <line x1="32" y1="0" x2="0" y2="32" stroke="#C8102E" strokeWidth="2.2" />
          {/* White cross */}
          <rect x="12" y="0" width="8" height="32" fill="#FFFFFF" />
          <rect x="0" y="12" width="32" height="8" fill="#FFFFFF" />
          {/* Red cross */}
          <rect x="13.5" y="0" width="5" height="32" fill="#C8102E" />
          <rect x="0" y="13.5" width="32" height="5" fill="#C8102E" />
        </svg>
      );

    case 'CM':
      // Cameroon (Green, Red with yellow star, Yellow)
      return (
        <svg {...baseSvgProps}>
          <rect width="10.67" height="32" fill="#007A5E" />
          <rect x="10.67" width="10.67" height="32" fill="#CE1126" />
          <rect x="21.34" width="10.67" height="32" fill="#FCD116" />
          <polygon
            points="16,11 17.2,14.7 21.1,14.7 18,17 19.2,20.7 16,18.4 12.8,20.7 14,17 10.9,14.7 14.8,14.7"
            fill="#FCD116"
          />
        </svg>
      );

    case 'CI':
      // Ivory Coast / Côte d'Ivoire (Orange, White, Green)
      return (
        <svg {...baseSvgProps}>
          <rect width="10.67" height="32" fill="#F77F00" />
          <rect x="10.67" width="10.67" height="32" fill="#FFFFFF" />
          <rect x="21.34" width="10.67" height="32" fill="#009A44" />
        </svg>
      );

    case 'SN':
      // Senegal (Green, Yellow with green star, Red)
      return (
        <svg {...baseSvgProps}>
          <rect width="10.67" height="32" fill="#00853F" />
          <rect x="10.67" width="10.67" height="32" fill="#FDEF42" />
          <rect x="21.34" width="10.67" height="32" fill="#E31B23" />
          <polygon
            points="16,11 17.2,14.7 21.1,14.7 18,17 19.2,20.7 16,18.4 12.8,20.7 14,17 10.9,14.7 14.8,14.7"
            fill="#00853F"
          />
        </svg>
      );

    case 'GA':
      // Gabon (Green, Yellow, Blue)
      return (
        <svg {...baseSvgProps}>
          <rect width="32" height="10.67" fill="#009E60" />
          <rect y="10.67" width="32" height="10.67" fill="#FCD116" />
          <rect y="21.33" width="32" height="10.67" fill="#3A75C4" />
        </svg>
      );

    case 'CG':
      // Congo-Brazzaville (Green, Yellow diagonal, Red)
      return (
        <svg {...baseSvgProps}>
          <rect width="32" height="32" fill="#FBDE4A" />
          <polygon points="0,0 21,0 0,21" fill="#009543" />
          <polygon points="32,11 32,32 11,32" fill="#DC241F" />
        </svg>
      );

    case 'ML':
      // Mali (Green, Yellow, Red)
      return (
        <svg {...baseSvgProps}>
          <rect width="10.67" height="32" fill="#14B53A" />
          <rect x="10.67" width="10.67" height="32" fill="#FCD116" />
          <rect x="21.34" width="10.67" height="32" fill="#CE1126" />
        </svg>
      );

    case 'BJ':
      // Benin (Green left bar, Yellow top-right, Red bottom-right)
      return (
        <svg {...baseSvgProps}>
          <rect width="13" height="32" fill="#008751" />
          <rect x="13" width="19" height="16" fill="#FCD116" />
          <rect x="13" y="16" width="19" height="16" fill="#E8112D" />
        </svg>
      );

    case 'TG':
      // Togo (5 horizontal stripes: green & yellow, red canton with white star)
      return (
        <svg {...baseSvgProps}>
          <rect width="32" height="6.4" fill="#006A4E" />
          <rect y="6.4" width="32" height="6.4" fill="#FFCE00" />
          <rect y="12.8" width="32" height="6.4" fill="#006A4E" />
          <rect y="19.2" width="32" height="6.4" fill="#FFCE00" />
          <rect y="25.6" width="32" height="6.4" fill="#006A4E" />
          {/* Red canton */}
          <rect width="16" height="19.2" fill="#D21034" />
          {/* White star */}
          <polygon
            points="8,5.5 8.9,8.2 11.8,8.2 9.5,9.9 10.4,12.6 8,10.9 5.6,12.6 6.5,9.9 4.2,8.2 7.1,8.2"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'BF':
      // Burkina Faso (Red top, Green bottom, Yellow star in center)
      return (
        <svg {...baseSvgProps}>
          <rect width="32" height="16" fill="#EF3340" />
          <rect y="16" width="32" height="16" fill="#009739" />
          <polygon
            points="16,10.5 17.3,14.3 21.3,14.3 18.1,16.7 19.3,20.5 16,18.1 12.7,20.5 13.9,16.7 10.7,14.3 14.7,14.3"
            fill="#FFD100"
          />
        </svg>
      );

    default:
      return (
        <div
          style={{
            width: `${s}px`,
            height: `${s}px`,
            borderRadius,
          }}
          className={`shrink-0 flex items-center justify-center bg-slate-800 text-amber-400 font-bold text-[10px] border border-slate-700 ${className}`}
        >
          {code}
        </div>
      );
  }
};

export const OverlappingAfricanFlags: React.FC<{ size?: number }> = ({ size = 32 }) => {
  return (
    <div className="flex items-center -space-x-2.5 overflow-visible">
      <FlagIcon countryCode="CM" size={size} className="ring-2 ring-[#151E33] z-50 shadow-sm" />
      <FlagIcon countryCode="CI" size={size} className="ring-2 ring-[#151E33] z-40 shadow-sm" />
      <FlagIcon countryCode="SN" size={size} className="ring-2 ring-[#151E33] z-30 shadow-sm" />
      <FlagIcon countryCode="GA" size={size} className="ring-2 ring-[#151E33] z-20 shadow-sm" />
      <FlagIcon countryCode="CG" size={size} className="ring-2 ring-[#151E33] z-10 shadow-sm" />
      <FlagIcon countryCode="BJ" size={size} className="ring-2 ring-[#151E33] z-0 shadow-sm" />
    </div>
  );
};
