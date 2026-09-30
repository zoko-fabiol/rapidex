import React from 'react';
import { Language } from '../types';
import { RapidexLogo } from './RapidexLogo';
import { FlagIcon } from './FlagIcon';
import { CheckCircle2, Globe2 } from 'lucide-react';

interface InitialLanguageModalProps {
  isOpen: boolean;
  onSelectLanguage: (lang: Language) => void;
}

export const InitialLanguageModal: React.FC<InitialLanguageModalProps> = ({
  isOpen,
  onSelectLanguage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#182238] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-center text-slate-100 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-center mb-4">
          <RapidexLogo size="lg" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700 text-xs text-amber-400 font-medium mb-4">
          <Globe2 className="w-3.5 h-3.5" />
          <span>Sélectionnez votre langue / Select Language</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Bienvenue sur Rapidex
        </h2>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Transferts d&apos;argent directs et instantanés entre la Russie et l&apos;Afrique.
          <br />
          <span className="text-xs text-slate-400">Direct instant money transfers between Russia and Africa.</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* French Option */}
          <button
            onClick={() => onSelectLanguage('fr')}
            className="group flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700 hover:border-amber-400/80 transition-all text-left active:scale-[0.98]"
          >
            <FlagIcon countryCode="FR" size={36} className="mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
              Français
            </span>
            <span className="text-xs text-slate-400 mt-1">Langue principale</span>
          </button>

          {/* English Option */}
          <button
            onClick={() => onSelectLanguage('en')}
            className="group flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700 hover:border-amber-400/80 transition-all text-left active:scale-[0.98]"
          >
            <FlagIcon countryCode="GB" size={36} className="mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
              English
            </span>
            <span className="text-xs text-slate-400 mt-1">International</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Taux de change en temps réel sans frais cachés</span>
        </div>
      </div>
    </div>
  );
};
