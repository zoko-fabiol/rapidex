/**
 * Rapidex - Cross-Border Money Transfer Russia ⇄ Africa
 */

import React, { useState, useEffect } from 'react';
import { Direction, Language, CountryInfo, Review, TransferQuote, TransactionData } from './types';
import { triggerHaptic } from './utils/haptics';
import { COUNTRIES } from './data/countries';
import { useRates } from './hooks/useRates';
import { generateTransactionId } from './utils/calculator';
import { Header } from './components/Header';
import { HeroSelector } from './components/HeroSelector';
import { ExchangeCalculator } from './components/ExchangeCalculator';
import { TransactionSummary } from './components/TransactionSummary';
import { ReviewSection } from './components/ReviewSection';
import { LanguageSelectionScreen } from './components/LanguageSelectionScreen';
import { PaymentSuccessModal } from './components/PaymentSuccessModal';
import { GuideModal } from './components/GuideModal';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

type AppScreen = 'LANGUAGE' | 'HOME' | 'SIMULATOR' | 'SUMMARY';

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('fr');
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('LANGUAGE');

  // Corridor and Transfer State
  const [direction, setDirection] = useState<Direction>('AFRICA_TO_RUSSIA');
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]); // Cameroun
  const [transactionId, setTransactionId] = useState<string>('WE-N7-7Z');
  const [currentQuote, setCurrentQuote] = useState<TransferQuote | null>(null);
  const [completedTransaction, setCompletedTransaction] = useState<TransactionData | null>(null);

  // Modals
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Rates Hook
  const { rates, isRefreshing, secondsSinceUpdate, manualRefresh } = useRates(2.0);

  // Real reviews state from SQLite backend (starts empty)
  const [reviews, setReviews] = useState<Review[]>([]);

  // Fetch verified reviews from SQLite on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchDatabaseReviews() {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.reviews)) {
            setReviews(data.reviews);
          }
        }
      } catch (err) {
        console.warn('[Rapidex] Could not connect to SQLite reviews API:', err);
      }
    }
    fetchDatabaseReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate dynamic rating average directly from SQLite reviews
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // On mount check if saved language exists for initial preference, but keep currentScreen on LANGUAGE by default
  useEffect(() => {
    const savedLang = localStorage.getItem('rapidex_lang');
    if (savedLang === 'fr' || savedLang === 'en' || savedLang === 'ru') {
      setCurrentLanguage(savedLang);
    }
  }, []);

  // Synchronize browser and native mobile OS back navigation (Android back button)
  useEffect(() => {
    // Initial state
    window.history.replaceState({ screen: currentScreen }, '');

    const handlePopState = (e: PopStateEvent) => {
      // If modal is open, close modal first
      if (isGuideModalOpen) {
        setIsGuideModalOpen(false);
        return;
      }
      if (isPaymentModalOpen) {
        setIsPaymentModalOpen(false);
        return;
      }

      if (e.state && e.state.screen) {
        setCurrentScreen(e.state.screen);
      } else {
        // Fallback backward steps
        setCurrentScreen((prev) => {
          if (prev === 'SUMMARY') return 'SIMULATOR';
          if (prev === 'SIMULATOR') return 'HOME';
          if (prev === 'HOME') return 'LANGUAGE';
          return prev;
        });
      }
      triggerHaptic('light');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isGuideModalOpen, isPaymentModalOpen, currentScreen]);

  const handleLanguageSelect = (lang: Language) => {
    triggerHaptic('light');
    setCurrentLanguage(lang);
    localStorage.setItem('rapidex_lang', lang);
    window.history.pushState({ screen: 'HOME' }, '');
    setCurrentScreen('HOME');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCorridor = (newDir: Direction) => {
    triggerHaptic('light');
    setDirection(newDir);
    setTransactionId(generateTransactionId());
    window.history.pushState({ screen: 'SIMULATOR' }, '');
    setCurrentScreen('SIMULATOR');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToSummary = (quote: TransferQuote) => {
    triggerHaptic('light');
    setCurrentQuote(quote);
    window.history.pushState({ screen: 'SUMMARY' }, '');
    setCurrentScreen('SUMMARY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    triggerHaptic('light');
    if (window.history.state?.screen === 'SIMULATOR') {
      window.history.back();
    } else {
      setCurrentScreen('HOME');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToCalculator = () => {
    triggerHaptic('light');
    if (window.history.state?.screen === 'SUMMARY') {
      window.history.back();
    } else {
      setCurrentScreen('SIMULATOR');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitTransaction = (data: TransactionData) => {
    triggerHaptic('success');
    setCompletedTransaction(data);
    setIsPaymentModalOpen(true);
  };

  const handleNewTransfer = () => {
    triggerHaptic('light');
    setTransactionId(generateTransactionId());
    setCurrentQuote(null);
    setCompletedTransaction(null);
    setIsPaymentModalOpen(false);
    window.history.pushState({ screen: 'SIMULATOR' }, '');
    setCurrentScreen('SIMULATOR');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddReview = async (reviewInput: Omit<Review, 'id' | 'date' | 'verified'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewInput,
          transactionId: transactionId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Erreur lors de l’envoi' };
      }
    } catch (err: unknown) {
      console.warn('Backend SQLite unreachable, saving locally:', err);
      const newRev: Review = {
        ...reviewInput,
        id: `rev-${Date.now()}`,
        date: 'À l’instant',
        verified: true,
      };
      setReviews((prev) => [newRev, ...prev]);
      return { success: true };
    }
  };

  // If user hasn't selected language yet, show full screen LanguageSelectionScreen (Screenshot 1)
  if (currentScreen === 'LANGUAGE') {
    return <LanguageSelectionScreen onSelectLanguage={handleLanguageSelect} />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0A101D] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Persistent Header on Home (Screenshot 2) */}
      {currentScreen === 'HOME' && (
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={(lang) => {
            setCurrentLanguage(lang);
            localStorage.setItem('rapidex_lang', lang);
          }}
          onOpenGuide={() => setIsGuideModalOpen(true)}
          onGoToLanguageSelect={() => setCurrentScreen('LANGUAGE')}
          eurRub={rates.eurRub}
          isRefreshing={isRefreshing}
          onManualRefresh={manualRefresh}
          secondsSinceUpdate={secondsSinceUpdate}
        />
      )}

      {/* Main Views */}
      <main className="flex-1">
        {currentScreen === 'HOME' && (
          <>
            <HeroSelector
              currentLanguage={currentLanguage}
              onSelectCorridor={handleSelectCorridor}
              averageRating={averageRating}
              totalReviews={reviews.length}
            />

            <ReviewSection
              currentLanguage={currentLanguage}
              reviews={reviews}
              onAddReview={handleAddReview}
            />
          </>
        )}

        {currentScreen === 'SIMULATOR' && (
          <ExchangeCalculator
            currentLanguage={currentLanguage}
            direction={direction}
            onDirectionChange={setDirection}
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            transactionId={transactionId}
            rates={rates}
            onBackToHome={handleBackToHome}
            onProceedToSummary={handleProceedToSummary}
          />
        )}

        {currentScreen === 'SUMMARY' && currentQuote && (
          <TransactionSummary
            currentLanguage={currentLanguage}
            quote={currentQuote}
            country={selectedCountry}
            transactionId={transactionId}
            onBackToCalculator={handleBackToCalculator}
          />
        )}
      </main>

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideModalOpen}
        currentLanguage={currentLanguage}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Payment Success & WhatsApp Modal */}
      <PaymentSuccessModal
        isOpen={isPaymentModalOpen}
        transaction={completedTransaction}
        currentLanguage={currentLanguage}
        onClose={() => setIsPaymentModalOpen(false)}
        onNewTransfer={handleNewTransfer}
      />

      {/* Vercel Web Analytics & Speed Insights */}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
