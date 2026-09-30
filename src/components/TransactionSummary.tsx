import React, { useState } from 'react';
import {
  Language,
  CountryInfo,
  TransferQuote,
} from '../types';
import { formatCurrency, formatNumber } from '../utils/calculator';
import { translations } from '../data/translations';
import { ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { RapidexLogo } from './RapidexLogo';
import { FlagIcon } from './FlagIcon';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { SwipeBackIndicator } from './SwipeBackIndicator';
import { triggerHaptic } from '../utils/haptics';

interface TransactionSummaryProps {
  currentLanguage: Language;
  quote: TransferQuote;
  country: CountryInfo;
  transactionId: string;
  onBackToCalculator: () => void;
  onSubmitTransaction?: () => void;
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  currentLanguage,
  quote,
  country,
  transactionId,
  onBackToCalculator,
}) => {
  const t = translations[currentLanguage];
  const [copied, setCopied] = useState<boolean>(false);
  const isAfricaToRussia = quote.direction === 'AFRICA_TO_RUSSIA';

  // Mobile edge-swipe-back gesture
  const { isSwiping, swipeProgress } = useSwipeBack({
    onBack: onBackToCalculator,
  });

  // Inverse rate
  const inverseRate = quote.effectiveRate > 0 ? 1 / quote.effectiveRate : 0;

  const countryDisplayName = currentLanguage === 'en' ? country.nameEn : country.name;
  const russiaName = currentLanguage === 'ru' ? 'Россия' : currentLanguage === 'en' ? 'Russia' : 'Russie';

  const handleCopySummary = () => {
    triggerHaptic('success');
    const text = `📊 Rapidex (${countryDisplayName} ⇄ ${russiaName}) :
ID : ${transactionId}
${formatCurrency(quote.sourceAmount, quote.sourceCurrency)} = ${formatCurrency(quote.targetAmount, quote.targetCurrency)}
1 ${isAfricaToRussia ? quote.sourceCurrency : 'RUB'} = ${formatNumber(quote.effectiveRate, 4)} ${quote.targetCurrency}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch {
      // ignore clipboard error in restricted iframe
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-16 select-none relative">
      {/* Visual edge cue during left-to-right swipe */}
      <SwipeBackIndicator isSwiping={isSwiping} swipeProgress={swipeProgress} />

      {/* Header */}
      <div className="relative flex items-center justify-center pt-2 pb-4 mb-4">
        {/* Back button with text label, high-contrast, touch target >= 44px, and tactile haptic feedback */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onBackToCalculator();
          }}
          aria-label={t.back}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-[#151E33] active:bg-[#1C2742] active:scale-95 text-slate-200 hover:text-white transition-all cursor-pointer border border-transparent hover:border-[#23314F] min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          <span className="text-xs font-semibold">{t.back}</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <RapidexLogo size="sm" />
          <h2 className="font-['Playfair_Display',serif] text-base sm:text-lg font-bold text-white mt-1">
            {t.summaryTitle}
          </h2>
        </div>
      </div>

      {/* Step Indicator & Session ID bar */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#EAB308] tracking-wider mb-4 px-1 font-sans">
        <span className="uppercase">{t.step2}</span>
        <span className="font-mono tracking-widest">{transactionId}</span>
      </div>

      {/* Main Conversion Result Card */}
      <div className="space-y-4">
        <div className="p-5 sm:p-6 rounded-3xl bg-[#151E33] border border-[#23314F] shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#23314F] mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <FlagIcon countryCode={isAfricaToRussia ? country.id : 'RU'} size={20} />
              <span className="text-slate-500 text-xs">→</span>
              <FlagIcon countryCode={isAfricaToRussia ? 'RU' : country.id} size={20} />
              <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider ml-1">
                {isAfricaToRussia ? `${countryDisplayName} → ${russiaName}` : `${russiaName} → ${countryDisplayName}`}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentLanguage === 'ru' ? 'Курс онлайн' : currentLanguage === 'en' ? 'Live rate' : 'Taux direct'}</span>
            </span>
          </div>

          {/* Big visual comparison */}
          <div className="space-y-3">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0E1626] border border-[#1F2C46]">
              <span className="text-xs text-slate-400 block mb-1">{t.baseAmount}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-white break-all">
                  {formatNumber(quote.sourceAmount)}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <FlagIcon countryCode={isAfricaToRussia ? country.id : 'RU'} size={18} />
                  <span className="text-sm sm:text-base font-bold text-[#EAB308] font-sans">
                    {quote.sourceCurrency}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0E1626] border border-emerald-500/30">
              <span className="text-xs text-emerald-400 block mb-1">{t.directEquivalence}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-emerald-400 break-all">
                  {formatNumber(quote.targetAmount, 2)}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <FlagIcon countryCode={isAfricaToRussia ? 'RU' : country.id} size={18} />
                  <span className="text-sm sm:text-base font-bold text-emerald-300 font-sans">
                    {quote.targetCurrency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Mathematical Breakdown */}
          <div className="mt-4 pt-4 border-t border-[#23314F] space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">{t.appliedRate}</span>
              <span className="font-bold font-mono text-[#EAB308] tabular-nums">
                {isAfricaToRussia
                  ? `1 ${quote.sourceCurrency} = ${formatNumber(quote.effectiveRate, 4)} ₽`
                  : `1 ₽ = ${formatNumber(quote.effectiveRate, 4)} ${quote.targetCurrency}`}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">{t.inverseRate}</span>
              <span className="font-mono text-slate-300 tabular-nums">
                {isAfricaToRussia
                  ? `1 ₽ = ${formatNumber(inverseRate, 4)} ${quote.sourceCurrency}`
                  : `1 ${quote.targetCurrency} = ${formatNumber(inverseRate, 4)} ₽`}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">{t.officialPeg}</span>
              <span className="text-slate-400 font-mono">1 EUR = 655,957 FCFA</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">{t.hiddenFees}</span>
              <span className="font-bold text-emerald-400">{t.freeIncluded}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleCopySummary}
            className="w-full py-4 px-4 rounded-2xl bg-[#EAB308] hover:bg-[#FACC15] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{t.copiedSuccess}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 stroke-[2.5]" />
                <span>{t.copyRateDetails}</span>
              </>
            )}
          </button>

          <button
            onClick={onBackToCalculator}
            className="w-full py-4 px-4 rounded-2xl bg-[#19243C] hover:bg-[#202E4E] border border-[#32456B] text-slate-200 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#EAB308]" />
            <span>{t.checkAnotherAmount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
