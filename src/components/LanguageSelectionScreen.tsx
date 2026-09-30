import React from 'react';
import { RapidexLogo } from './RapidexLogo';
import { FlagIcon } from './FlagIcon';
import { Language } from '../types';

interface LanguageSelectionScreenProps {
  onSelectLanguage: (lang: Language) => void;
}

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  onSelectLanguage,
}) => {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center px-4 py-8 sm:py-12 bg-gradient-to-b from-[#0F182A] via-[#0A101D] to-[#060A13] text-slate-100 select-none overflow-y-auto">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center my-auto">
        {/* Rapidex Logo (Centered with exact arches and serif typography) */}
        <div className="mb-10 sm:mb-12">
          <RapidexLogo size="xl" />
        </div>

        {/* Multilingual Titles (Uppercase, bold, matching Screenshot) */}
        <div className="space-y-1.5 mb-8">
          <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-slate-100 uppercase font-sans">
            CHOISISSEZ VOTRE LANGUE
          </h1>
          <h2 className="text-sm sm:text-base font-extrabold tracking-wider text-slate-200 uppercase font-sans">
            CHOOSE YOUR LANGUAGE
          </h2>
          <h3 className="text-xs sm:text-sm font-bold tracking-wider text-slate-400 uppercase font-sans">
            ВЫБЕРИТЕ ВАШ ЯЗЫК
          </h3>
        </div>

        {/* Language Selection Buttons */}
        <div className="w-full space-y-3.5">
          {/* Row 1: Français & English side-by-side (Identical to Screenshot) */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => onSelectLanguage('fr')}
              className="flex items-center justify-center gap-2.5 py-4 px-3 sm:px-4 rounded-2xl bg-[#141E34] hover:bg-[#1A2744] active:bg-[#121B30] border border-[#243556] hover:border-[#384F7E] text-white font-medium text-sm sm:text-base shadow-xl transition-all duration-150 active:scale-[0.97] cursor-pointer"
            >
              <FlagIcon countryCode="FR" size={24} />
              <span className="tracking-tight">Français</span>
            </button>

            <button
              onClick={() => onSelectLanguage('en')}
              className="flex items-center justify-center gap-2.5 py-4 px-3 sm:px-4 rounded-2xl bg-[#141E34] hover:bg-[#1A2744] active:bg-[#121B30] border border-[#243556] hover:border-[#384F7E] text-white font-medium text-sm sm:text-base shadow-xl transition-all duration-150 active:scale-[0.97] cursor-pointer"
            >
              <FlagIcon countryCode="GB" size={24} />
              <span className="tracking-tight">English</span>
            </button>
          </div>

          {/* Row 2: Русский button */}
          <button
            onClick={() => onSelectLanguage('ru')}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-[#141E34] hover:bg-[#1A2744] active:bg-[#121B30] border border-[#243556] hover:border-[#384F7E] text-white font-medium text-sm sm:text-base shadow-xl transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            <FlagIcon countryCode="RU" size={24} />
            <span className="tracking-tight">Русский</span>
          </button>
        </div>
      </div>
    </div>
  );
};
