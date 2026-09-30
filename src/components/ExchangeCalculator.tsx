import React, { useState, useMemo, useEffect } from 'react';
import { Direction, Language, CountryInfo, ExchangeRatesData, TransferQuote } from '../types';
import { translations } from '../data/translations';
import { COUNTRIES } from '../data/countries';
import { calculateQuote, formatNumber } from '../utils/calculator';
import { RapidexLogo } from './RapidexLogo';
import { FlagIcon } from './FlagIcon';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { SwipeBackIndicator } from './SwipeBackIndicator';
import { triggerHaptic } from '../utils/haptics';

interface ExchangeCalculatorProps {
  currentLanguage: Language;
  direction: Direction;
  onDirectionChange: (newDir: Direction) => void;
  selectedCountry: CountryInfo;
  onCountryChange: (country: CountryInfo) => void;
  transactionId: string;
  rates: ExchangeRatesData;
  onBackToHome: () => void;
  onProceedToSummary: (quote: TransferQuote) => void;
}

export const ExchangeCalculator: React.FC<ExchangeCalculatorProps> = ({
  currentLanguage,
  direction,
  selectedCountry,
  onCountryChange,
  transactionId,
  rates,
  onBackToHome,
  onProceedToSummary,
}) => {
  const t = translations[currentLanguage];
  const isAfricaToRussia = direction === 'AFRICA_TO_RUSSIA';

  // No pre-filled amount: user enters amount freely from scratch
  const [sendAmountInput, setSendAmountInput] = useState<string>('');
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState<boolean>(false);
  const [sheetDragY, setSheetDragY] = useState<number>(0);
  const [sheetTouchStartY, setSheetTouchStartY] = useState<number | null>(null);

  // Native mobile swipe-back gesture (swiping from left screen edge to right)
  const { isSwiping, swipeProgress } = useSwipeBack({
    onBack: onBackToHome,
    enabled: !isCountryPickerOpen,
  });

  const parsedAmount = useMemo(() => {
    const raw = sendAmountInput.replace(/\s+/g, '').replace(',', '.');
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }, [sendAmountInput]);

  const quote: TransferQuote = useMemo(() => {
    return calculateQuote(
      direction,
      parsedAmount,
      rates.eurRub,
      selectedCountry.currency as 'XAF' | 'XOF',
      rates.commissionPercent
    );
  }, [direction, parsedAmount, rates.eurRub, rates.commissionPercent, selectedCountry.currency]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Digits only like in phone keyboard
    setSendAmountInput(val);
  };

  const handleSelectCountry = (country: CountryInfo) => {
    triggerHaptic('light');
    onCountryChange(country);
    setIsCountryPickerOpen(false);
  };

  const countryDisplayName = currentLanguage === 'en' ? selectedCountry.nameEn : selectedCountry.name;

  // Direction title: "Cameroun → Russie" or "Russie → Cameroun"
  const russiaName = currentLanguage === 'ru' ? 'Россия' : currentLanguage === 'en' ? 'Russia' : 'Russie';
  const directionTitle = isAfricaToRussia
    ? `${countryDisplayName} → ${russiaName}`
    : `${russiaName} → ${countryDisplayName}`;

  const sendCurrency = isAfricaToRussia ? selectedCountry.currency : 'RUB';
  const receiveCurrency = isAfricaToRussia ? 'RUB' : selectedCountry.currency;
  const sendCountryCode = isAfricaToRussia ? selectedCountry.id : 'RU';
  const receiveCountryCode = isAfricaToRussia ? 'RU' : selectedCountry.id;

  // Bottom sheet drag-down-to-dismiss handlers
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    setSheetTouchStartY(e.touches[0].clientY);
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (sheetTouchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - sheetTouchStartY;
    if (delta > 0) {
      setSheetDragY(delta);
    }
  };

  const handleSheetTouchEnd = () => {
    if (sheetDragY > 70) {
      triggerHaptic('light');
      setIsCountryPickerOpen(false);
    }
    setSheetTouchStartY(null);
    setSheetDragY(0);
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-16 select-none relative">
      {/* Visual edge cue during left-to-right swipe */}
      <SwipeBackIndicator isSwiping={isSwiping} swipeProgress={swipeProgress} />

      {/* Top Header */}
      <div className="relative flex items-center justify-center pt-2 pb-4 mb-4">
        {/* Back button with text label, high-contrast, touch target >= 44px, and tactile haptic feedback */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onBackToHome();
          }}
          aria-label={t.back}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-[#151E33] active:bg-[#1C2742] active:scale-95 text-slate-200 hover:text-white transition-all cursor-pointer border border-transparent hover:border-[#23314F] min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          <span className="text-xs font-semibold">{t.back}</span>
        </button>

        {/* Center: Rapidex Logo & Direction Title */}
        <div className="flex flex-col items-center text-center">
          <RapidexLogo size="sm" />
          <h2 className="font-['Playfair_Display',serif] text-base sm:text-lg font-bold text-white mt-1">
            {directionTitle}
          </h2>
        </div>
      </div>

      {/* Step Indicator & Session ID bar */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#EAB308] tracking-wider mb-3 px-1 font-sans">
        <span className="uppercase">{t.step1}</span>
        <span className="font-mono tracking-widest">{transactionId}</span>
      </div>

      {/* CARD 1: Pays de provenance / destination */}
      <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#151E33] border border-[#23314F] flex items-center justify-between shadow-md mb-3 sm:mb-4">
        <div>
          <span className="text-xs sm:text-sm text-slate-400 block font-sans mb-1">
            {isAfricaToRussia ? t.provenanceCountry : t.destinationCountry}
          </span>
          <div className="flex items-center gap-2.5">
            <FlagIcon countryCode={selectedCountry.id} size={24} />
            <span className="font-bold text-sm sm:text-base text-white font-sans">
              {countryDisplayName}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsCountryPickerOpen(true)}
          className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#19243C] hover:bg-[#202E4E] border border-[#32456B] text-xs sm:text-sm font-semibold text-[#EAB308] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{t.chooseCountry}</span>
          <span className="text-[10px]">▼</span>
        </button>
      </div>

      {/* CARD 2: ILS ENVOIENT / VOUS ENVOYEZ */}
      <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#151E33] border border-[#23314F] shadow-md mb-3 sm:mb-4">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 font-sans">
            {isAfricaToRussia ? t.theySend : t.youSend}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0E1626] border border-[#1F2C46] text-xs sm:text-sm text-white font-medium">
            <FlagIcon countryCode={sendCountryCode} size={18} />
            <span>{sendCurrency}</span>
          </div>
        </div>

        {/* Input row */}
        <div className="flex items-baseline justify-between gap-3">
          <input
            type="text"
            inputMode="decimal"
            value={sendAmountInput}
            onChange={handleInputChange}
            className="w-full bg-transparent text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white outline-none font-sans tracking-tight"
            placeholder="0"
          />
          <span className="text-[#EAB308] font-bold text-base sm:text-xl md:text-2xl font-sans shrink-0">
            {sendCurrency}
          </span>
        </div>
      </div>

      {/* CARD 3: VOUS RECEVEZ / ILS REÇOIVENT */}
      <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#151E33] border border-[#23314F] shadow-md mb-6 sm:mb-8">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 font-sans">
            {isAfricaToRussia ? t.theyReceive : t.theyReceiveAfrica}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0E1626] border border-[#1F2C46] text-xs sm:text-sm text-white font-medium">
            <FlagIcon countryCode={receiveCountryCode} size={18} />
            <span>{receiveCurrency}</span>
          </div>
        </div>

        {/* Amount display */}
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white font-sans tracking-tight break-all">
            {parsedAmount > 0
              ? formatNumber(quote.targetAmount, 2).replace(/[\s\u00A0\u202F]/g, '')
              : '0'}
          </span>
          <span className="text-slate-200 font-bold text-base sm:text-xl md:text-2xl font-sans shrink-0">
            {receiveCurrency}
          </span>
        </div>
      </div>

      {/* Validation error if user typed an invalid amount */}
      {!quote.isValid && quote.validationError && sendAmountInput.trim().length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs sm:text-sm text-red-200 text-center">
          {quote.validationError}
        </div>
      )}

      {/* CONTINUER VERS LE RÉCAPITULATIF BUTTON */}
      <button
        onClick={() => onProceedToSummary(quote)}
        disabled={!quote.isValid || parsedAmount <= 0}
        className={`w-full py-4 sm:py-4.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
          quote.isValid && parsedAmount > 0
            ? 'bg-[#EAB308] hover:bg-[#FACC15] text-slate-950 cursor-pointer shadow-amber-500/10'
            : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed'
        }`}
      >
        <span>{t.continueToSummary}</span>
        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* COUNTRY PICKER MODAL (Bottom sheet on mobile with drag-to-dismiss gesture) */}
      {isCountryPickerOpen && (
        <div
          onClick={() => {
            triggerHaptic('light');
            setIsCountryPickerOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            style={{
              transform: sheetDragY > 0 ? `translate3d(0, ${sheetDragY}px, 0)` : undefined,
              transition: sheetDragY === 0 ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            }}
            className="w-full max-w-md sm:max-w-xl bg-[#151E33] border border-[#23314F] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Visual drag handle bar for mobile bottom-sheet gesture */}
            <div className="w-12 h-1.5 rounded-full bg-slate-500/60 mx-auto -mt-1 mb-3 sm:hidden cursor-grab" />

            <div className="flex items-center justify-between pb-3 border-b border-[#23314F] mb-3">
              <h3 className="font-['Playfair_Display',serif] text-lg sm:text-xl font-bold text-white">
                {t.selectCountryTitle}
              </h3>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsCountryPickerOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
              {COUNTRIES.map((c) => {
                const isSelected = c.id === selectedCountry.id;
                const cName = currentLanguage === 'en' ? c.nameEn : c.name;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAB308]/15 border-[#EAB308] text-white'
                        : 'bg-[#0E1626] border-[#1F2C46] text-slate-200 hover:bg-[#19243C]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FlagIcon countryCode={c.id} size={26} />
                      <div>
                        <span className="font-bold text-sm block">{cName}</span>
                        <span className="text-xs text-slate-400">{c.currency}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#EAB308]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
