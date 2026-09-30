import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { X, TrendingUp, RefreshCw, Globe, CheckCircle2 } from 'lucide-react';
import { RapidexLogo } from './RapidexLogo';
import { triggerHaptic } from '../utils/haptics';

interface GuideModalProps {
  isOpen: boolean;
  currentLanguage: Language;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, currentLanguage, onClose }) => {
  const t = translations[currentLanguage];
  const [dragY, setDragY] = useState(0);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const delta = e.touches[0].clientY - touchStartY;
    if (delta > 0) {
      setDragY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 80) {
      triggerHaptic('light');
      onClose();
    }
    setTouchStartY(null);
    setDragY(0);
  };

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragY > 0 ? `translate3d(0, ${dragY}px, 0)` : undefined,
          transition: dragY === 0 ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
        className="w-full max-w-lg bg-[#151E33] border border-[#23314F] rounded-3xl shadow-2xl p-5 sm:p-7 text-slate-100 relative my-6"
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-500/60 mx-auto -mt-1 mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label={t.close}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#0E1626] text-slate-400 hover:text-white border border-[#1F2C46] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand header */}
        <div className="flex items-center gap-2 mb-3">
          <RapidexLogo size="sm" />
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-[#EAB308] font-bold text-xs uppercase tracking-wider font-sans">
            {t.guide}
          </span>
        </div>

        <h3 className="font-['Playfair_Display',serif] text-xl font-bold text-white mb-2">
          {t.guideModalTitle}
        </h3>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          {currentLanguage === 'ru'
            ? 'Rapidex — это специализированная онлайн-платформа для мониторинга и точного расчета обменного курса между российским рублем (RUB) и франками КФА (XAF / XOF).'
            : currentLanguage === 'en'
            ? 'Rapidex is a dedicated real-time exchange rate monitoring and conversion platform between the Russian Ruble (RUB) and CFA Francs (XAF / XOF).'
            : 'Rapidex est une plateforme dédiée de consultation et de simulation en temps réel du cours de change entre le Rouble russe (RUB) et le Franc CFA (XAF / XOF).'}
        </p>

        {/* Step-by-Step Info Cards */}
        <div className="space-y-3.5 mb-5 text-xs sm:text-sm text-slate-300">
          {/* Point 1: Plateforme de taux de change */}
          <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-[#1F2C46]">
            <h4 className="font-bold text-[#EAB308] mb-1 flex items-center gap-1.5 font-sans">
              <TrendingUp className="w-4 h-4 text-[#EAB308]" />
              <span>{t.guideStep1Title}</span>
            </h4>
            <p className="leading-relaxed text-slate-300 text-xs">
              {t.guideStep1Desc}
            </p>
          </div>

          {/* Point 2: Calcul Pivot */}
          <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-[#1F2C46]">
            <h4 className="font-bold text-[#EAB308] mb-1 flex items-center gap-1.5 font-sans">
              <RefreshCw className="w-4 h-4 text-[#EAB308]" />
              <span>{t.guideStep2Title}</span>
            </h4>
            <p className="leading-relaxed text-slate-300 text-xs">
              {t.guideStep2Desc}
            </p>
          </div>

          {/* Point 3: Couverture */}
          <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-[#1F2C46]">
            <h4 className="font-bold text-[#EAB308] mb-1 flex items-center gap-1.5 font-sans">
              <Globe className="w-4 h-4 text-[#EAB308]" />
              <span>{t.guideStep3Title}</span>
            </h4>
            <p className="leading-relaxed text-slate-300 text-xs">
              {t.guideStep3Desc}
            </p>
          </div>
        </div>

        {/* Reassurance Info Box */}
        <div className="p-3.5 rounded-2xl bg-[#0E1626] border border-emerald-500/20 text-xs text-slate-300 space-y-1.5 mb-5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {currentLanguage === 'ru'
                ? 'Гарантия прозрачности курса'
                : currentLanguage === 'en'
                ? 'Rate Transparency Guarantee'
                : 'Garantie de transparence des cours'}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {currentLanguage === 'ru'
              ? '• Курсы обновляются онлайн каждые 60 секунд на основе официальных межбанковских котировок.\n• 100% информационная точность без скрытых надбавок.'
              : currentLanguage === 'en'
              ? '• Rates refresh automatically every 60 seconds based on live interbank benchmarks.\n• 100% informative accuracy with zero hidden markups.'
              : '• Les cours s’actualisent en direct toutes les 60 secondes d’après les cotations interbancaires.\n• Transparence totale et calculs nets sans frais cachés.'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#EAB308] hover:bg-[#FACC15] text-slate-950 font-bold text-sm transition-all cursor-pointer"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
