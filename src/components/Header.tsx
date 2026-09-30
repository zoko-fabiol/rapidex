import React from 'react';
import { RapidexLogo } from './RapidexLogo';
import { Language } from '../types';
import { translations } from '../data/translations';

interface HeaderProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenGuide: () => void;
  onGoToLanguageSelect?: () => void;
  eurRub: number;
  isRefreshing: boolean;
  onManualRefresh: () => void;
  secondsSinceUpdate: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  onOpenGuide,
  onGoToLanguageSelect,
  eurRub,
  isRefreshing,
  onManualRefresh,
}) => {
  const t = translations[currentLanguage];

  return (
    <header className="w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-2">
      {/* Mobile view (< md): exact centered layout from screenshot */}
      <div className="md:hidden">
        <div className="flex justify-center mb-3">
          <button
            onClick={onGoToLanguageSelect}
            title="Changer de langue / Change language"
            className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
          >
            <RapidexLogo size="md" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Language Pill Switcher */}
          <div className="inline-flex p-0.5 rounded-full bg-[#151E33] border border-[#23314F]">
            {(['fr', 'en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  currentLanguage === lang
                    ? 'bg-[#EAB308] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Guide Button */}
          <button
            onClick={onOpenGuide}
            className="px-4 py-1.5 min-h-[36px] rounded-full bg-transparent hover:bg-[#151E33] border border-[#2B3B5C] text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center justify-center"
          >
            {t.guide}
          </button>
        </div>
      </div>

      {/* Tablet & Desktop view (>= md): spacious bar */}
      <div className="hidden md:flex items-center justify-between py-2">
        <button
          onClick={onGoToLanguageSelect}
          title="Rapidex Home"
          className="focus:outline-none transition-transform hover:opacity-90 active:scale-95 cursor-pointer"
        >
          <RapidexLogo size="md" />
        </button>

        <div className="flex items-center gap-3 lg:gap-4">
          {/* Live EUR/RUB Rate Indicator */}
          {eurRub > 0 && (
            <button
              onClick={onManualRefresh}
              title="Actualiser le cours direct"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151E33] border border-[#23314F] hover:border-[#EAB308]/50 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="font-mono text-white font-semibold">1 EUR = {eurRub.toFixed(2)} ₽</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="inline-flex p-0.5 rounded-full bg-[#151E33] border border-[#23314F]">
            {(['fr', 'en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  currentLanguage === lang
                    ? 'bg-[#EAB308] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Guide Button */}
          <button
            onClick={onOpenGuide}
            className="px-4 py-1.5 rounded-full bg-[#151E33] hover:bg-[#1A253E] border border-[#2B3B5C] text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            {t.guide}
          </button>
        </div>
      </div>
    </header>
  );
};
