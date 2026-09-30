import { useState, useEffect, useCallback, useRef } from 'react';
import { ExchangeRatesData } from '../types';
import { CFA_EUR_PEG, DEFAULT_COMMISSION_PERCENT, computeAllRates } from '../utils/calculator';

const FALLBACK_EUR_RUB = 95.5;

export function useRates(commissionPercent: number = DEFAULT_COMMISSION_PERCENT) {
  const [rates, setRates] = useState<ExchangeRatesData>(() => {
    const initialCalc = computeAllRates(FALLBACK_EUR_RUB, commissionPercent);
    return {
      success: true,
      base: 'EUR',
      eurRub: FALLBACK_EUR_RUB,
      eurCfa: CFA_EUR_PEG,
      commissionPercent,
      rawRates: initialCalc.rawRates,
      clientRates: initialCalc.clientRates,
      lastUpdated: new Date().toISOString(),
      source: 'fallback',
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRates = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // First attempt: call our Express backend /api/rates
      const res = await fetch(`/api/rates?commission=${commissionPercent}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.eurRub) {
          setRates(data);
          setError(null);
          setSecondsSinceUpdate(0);
          return;
        }
      }
      throw new Error('Local API returned unsuccessful response');
    } catch {
      // Second attempt: Direct client fetch to open.er-api.com as fallback
      try {
        const directRes = await fetch('https://open.er-api.com/v6/latest/EUR');
        if (directRes.ok) {
          const directData = await directRes.json();
          const rubRate = directData?.rates?.RUB;
          if (rubRate && typeof rubRate === 'number' && rubRate > 0) {
            const { rawRates, clientRates } = computeAllRates(rubRate, commissionPercent);
            setRates({
              success: true,
              base: 'EUR',
              eurRub: rubRate,
              eurCfa: CFA_EUR_PEG,
              commissionPercent,
              rawRates,
              clientRates,
              lastUpdated: new Date().toISOString(),
              source: 'api',
            });
            setError(null);
            setSecondsSinceUpdate(0);
            return;
          }
        }
      } catch (clientErr) {
        console.warn('Direct exchange rate fetch also failed:', clientErr);
      }

      // If both fail, keep current rates and notify
      setError('Mode hors-ligne : utilisation du dernier cours de référence.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [commissionPercent]);

  // Initial load
  useEffect(() => {
    fetchRates(false);
  }, [fetchRates]);

  // 60-second auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRates(true);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [fetchRates]);

  // Seconds counter for UI feedback
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsSinceUpdate((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    rates,
    isLoading,
    isRefreshing,
    error,
    secondsSinceUpdate,
    manualRefresh: () => fetchRates(false),
  };
}
