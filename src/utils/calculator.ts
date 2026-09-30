import { Direction, TransferQuote } from '../types';

/**
 * Rapidex Mathematical Conversion Engine
 *
 * Rules:
 * 1. Fixed peg CFA Zone: 1 EUR = 655.957 XAF/XOF
 * 2. Live rate: 1 EUR = R RUB
 * 3. Direction Africa -> Russia:
 *    Raw rate = R / 655.957 (RUB received per 1 XAF/XOF sent)
 * 4. Direction Russia -> Africa:
 *    Raw rate = 655.957 / R (XAF/XOF received per 1 RUB sent)
 * 5. Effective client rate = Raw rate * (1 - COMMISSION_PERCENT / 100)
 */

export const CFA_EUR_PEG = 655.957;
export const DEFAULT_COMMISSION_PERCENT = 2.0;

// No minimum restriction for exchange rate checking
export const MIN_AFRICA_AMOUNT_CFA = 0;
export const MIN_RUSSIA_AMOUNT_RUB = 0;

export interface RawRates {
  AFRICA_TO_RUSSIA: number;
  RUSSIA_TO_AFRICA: number;
}

export interface ClientRates {
  AFRICA_TO_RUSSIA: number;
  RUSSIA_TO_AFRICA: number;
}

/**
 * Computes raw pivot rates from EUR/RUB rate
 */
export function computeRawRates(eurRub: number): RawRates {
  if (!eurRub || eurRub <= 0) {
    throw new Error('Invalid EUR/RUB rate provided');
  }

  const africaToRussia = eurRub / CFA_EUR_PEG;
  const russiaToAfrica = CFA_EUR_PEG / eurRub;

  return {
    AFRICA_TO_RUSSIA: africaToRussia,
    RUSSIA_TO_AFRICA: russiaToAfrica,
  };
}

/**
 * Applies commission margin to raw rate
 */
export function computeClientRate(rawRate: number, commissionPercent: number = DEFAULT_COMMISSION_PERCENT): number {
  if (commissionPercent < 0 || commissionPercent >= 100) {
    throw new Error('Commission must be between 0 and 100');
  }
  return rawRate * (1 - commissionPercent / 100);
}

/**
 * Calculates both raw and client rates
 */
export function computeAllRates(eurRub: number, commissionPercent: number = DEFAULT_COMMISSION_PERCENT) {
  const raw = computeRawRates(eurRub);
  return {
    rawRates: raw,
    clientRates: {
      AFRICA_TO_RUSSIA: computeClientRate(raw.AFRICA_TO_RUSSIA, commissionPercent),
      RUSSIA_TO_AFRICA: computeClientRate(raw.RUSSIA_TO_AFRICA, commissionPercent),
    },
  };
}

/**
 * Calculates a complete transfer quote given source amount and direction
 */
export function calculateQuote(
  direction: Direction,
  sourceAmount: number,
  eurRub: number,
  currencyCode: 'XAF' | 'XOF' = 'XAF',
  commissionPercent: number = DEFAULT_COMMISSION_PERCENT
): TransferQuote {
  const { rawRates, clientRates } = computeAllRates(eurRub, commissionPercent);

  const isAfricaSender = direction === 'AFRICA_TO_RUSSIA';
  const sourceCurrency = isAfricaSender ? currencyCode : 'RUB';
  const targetCurrency = isAfricaSender ? 'RUB' : currencyCode;
  const minSourceAmount = isAfricaSender ? MIN_AFRICA_AMOUNT_CFA : MIN_RUSSIA_AMOUNT_RUB;

  const rawRate = isAfricaSender ? rawRates.AFRICA_TO_RUSSIA : rawRates.RUSSIA_TO_AFRICA;
  const effectiveRate = isAfricaSender ? clientRates.AFRICA_TO_RUSSIA : clientRates.RUSSIA_TO_AFRICA;

  const isValidAmount = Number.isFinite(sourceAmount) && sourceAmount > 0;
  let validationError: string | undefined = undefined;

  if (sourceAmount <= 0) {
    validationError = 'Veuillez saisir un montant';
  }

  // Calculate target amount: maximum 2 decimals only when fractional
  const rawTarget = sourceAmount * effectiveRate;
  const targetAmount = Math.round(rawTarget * 100) / 100;

  return {
    direction,
    sourceAmount,
    sourceCurrency,
    targetAmount: Math.max(0, targetAmount),
    targetCurrency,
    effectiveRate,
    rawRate,
    commissionPercent,
    estimatedFee: 0, // Transparent fee (0 FCFA frais de dossier)
    minSourceAmount,
    isValid: isValidAmount,
    validationError,
  };
}

/**
 * Format numbers with French locale spacing
 * Shows maximumFractionDigits (default 2) only when the number has decimals, 0 decimals for whole numbers
 */
export function formatNumber(num: number, maximumFractionDigits: number = 2): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  const maxDigits = Math.max(0, Math.min(maximumFractionDigits, 20));

  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Format currency with appropriate symbol and spacing (max 2 decimals only when needed)
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatted = formatNumber(amount, 2);
  if (currency === 'RUB') {
    return `${formatted} ₽`;
  }
  return `${formatted} ${currency}`;
}

/**
 * Generates random transaction session ID, e.g. "RP-N7-7Z"
 */
export function generateTransactionId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const p1 = 'RP';
  const p2 = chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
  const p3 = chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
  return `${p1}-${p2}-${p3}`;
}
