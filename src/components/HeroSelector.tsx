import React from 'react';
import { Direction, Language } from '../types';
import { translations } from '../data/translations';
import { FlagIcon, OverlappingAfricanFlags } from './FlagIcon';
import { Clock, ShieldCheck, TrendingUp } from 'lucide-react';

interface HeroSelectorProps {
  currentLanguage: Language;
  onSelectCorridor: (direction: Direction) => void;
  averageRating: string;
  totalReviews: number;
}

export const HeroSelector: React.FC<HeroSelectorProps> = ({
  currentLanguage,
  onSelectCorridor,
  averageRating,
  totalReviews,
}) => {
  const t = translations[currentLanguage];

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 pb-10">
      {/* Title & Subtitle */}
      <div className="mb-6 sm:mb-8 mt-2 text-center md:text-left">
        <h1 className="font-['Playfair_Display',serif] text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
          {t.chooseTransactionType}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm md:text-base mt-2 leading-relaxed max-w-2xl mx-auto md:mx-0">
          {t.chooseTransactionSubtitle}
        </p>
      </div>

      {/* Two Corridor Cards: 1 col on mobile, 2 cols on tablet & desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Russie vers l'Afrique */}
        <button
          onClick={() => onSelectCorridor('RUSSIA_TO_AFRICA')}
          className="w-full text-left p-6 sm:p-7 md:p-8 rounded-3xl bg-[#151E33] hover:bg-[#1A253E] border border-[#23314F] hover:border-[#3A4D78] shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between group"
        >
          <div>
            {/* Flags row */}
            <div className="flex items-center gap-3 mb-5">
              <FlagIcon countryCode="RU" size={38} className="shadow-md" />
              <span className="text-white text-lg font-bold group-hover:translate-x-0.5 transition-transform">→</span>
              <OverlappingAfricanFlags size={34} />
            </div>

            <h2 className="font-['Playfair_Display',serif] text-xl sm:text-2xl md:text-[26px] font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
              {t.russiaToAfrica}
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm mt-2.5 leading-relaxed">
              {t.russiaToAfricaDesc}
            </p>
          </div>
        </button>

        {/* Card 2: Afrique vers la Russie */}
        <button
          onClick={() => onSelectCorridor('AFRICA_TO_RUSSIA')}
          className="w-full text-left p-6 sm:p-7 md:p-8 rounded-3xl bg-[#151E33] hover:bg-[#1A253E] border border-[#23314F] hover:border-[#3A4D78] shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between group"
        >
          <div>
            {/* Flags row */}
            <div className="flex items-center gap-3 mb-5">
              <OverlappingAfricanFlags size={34} />
              <span className="text-white text-lg font-bold group-hover:translate-x-0.5 transition-transform">→</span>
              <FlagIcon countryCode="RU" size={38} className="shadow-md" />
            </div>

            <h2 className="font-['Playfair_Display',serif] text-xl sm:text-2xl md:text-[26px] font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
              {t.africaToRussia}
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm mt-2.5 leading-relaxed">
              {t.africaToRussiaDesc}
            </p>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-[#1C2742] my-8 sm:my-10" />

      {/* Reassurance text */}
      <p className="max-w-2xl mx-auto text-slate-300 text-xs sm:text-sm text-center px-2 leading-relaxed mb-8">
        {t.partnerTrust}
      </p>

      {/* 3 Badges: Rapide, Sécurisé, Meilleur taux */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-xl mx-auto mb-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#162138] border border-[#243354] flex items-center justify-center text-[#EAB308] mb-2 shadow-sm">
            <Clock className="w-6 h-6 stroke-[2]" />
          </div>
          <span className="text-xs sm:text-sm text-slate-300 font-medium">{t.fastBadge}</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#162138] border border-[#243354] flex items-center justify-center text-[#EAB308] mb-2 shadow-sm">
            <ShieldCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <span className="text-xs sm:text-sm text-slate-300 font-medium">{t.secureBadge}</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#162138] border border-[#243354] flex items-center justify-center text-[#EAB308] mb-2 shadow-sm">
            <TrendingUp className="w-6 h-6 stroke-[2]" />
          </div>
          <span className="text-xs sm:text-sm text-slate-300 font-medium">{t.bestRateBadge}</span>
        </div>
      </div>

      {/* Note Moyenne Card */}
      <div className="max-w-md sm:max-w-lg mx-auto p-6 sm:p-7 rounded-3xl bg-[#151E33] border border-[#23314F] text-center shadow-md">
        <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-2 font-sans">
          {t.averageRatingHeader}
        </h3>

        {totalReviews > 0 ? (
          <>
            <div className="flex items-baseline justify-center gap-1 my-1">
              <span className="font-['Playfair_Display',serif] text-4xl sm:text-5xl font-bold text-[#EAB308]">
                {averageRating}
              </span>
              <span className="text-xl text-slate-400 font-sans">/ 5</span>
            </div>

            <div className="flex items-center justify-center gap-1.5 my-2.5 text-[#FACC15]">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(Number(averageRating))
                      ? 'fill-[#FACC15] text-[#FACC15]'
                      : 'fill-slate-600 text-slate-600'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            <p className="text-xs text-slate-400">
              {t.basedOn} {totalReviews} {t.reviewsWord}
            </p>
          </>
        ) : (
          <div className="py-2">
            <div className="flex items-center justify-center gap-1.5 my-2 text-slate-600">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className="w-5 h-5 fill-slate-700 text-slate-700"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              {currentLanguage === 'ru'
                ? 'Оставьте первый проверенный отзыв о сервисе'
                : currentLanguage === 'en'
                ? 'Be the first to leave a verified review'
                : 'Soyez le premier client à laisser un avis vérifié'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
