export type Direction = 'AFRICA_TO_RUSSIA' | 'RUSSIA_TO_AFRICA';

export type Language = 'fr' | 'en' | 'ru';

export interface CountryInfo {
  id: string;
  name: string;
  nameEn: string;
  flag: string;
  currency: 'XAF' | 'XOF' | 'RUB';
  phonePrefix: string;
  region: 'CEMAC' | 'UEMOA' | 'RUSSIA';
  operators?: MobileOperator[];
}

export interface MobileOperator {
  id: string;
  name: string;
  logoColor: string;
  badgeText?: string;
  popular?: boolean;
}

export interface RussianBank {
  id: string;
  name: string;
  shortName: string;
  color: string;
  hasSbp: boolean;
}

export interface ExchangeRatesData {
  success: boolean;
  base: string;
  eurRub: number;
  eurCfa: number;
  commissionPercent: number;
  rawRates: {
    AFRICA_TO_RUSSIA: number; // 1 XAF/XOF = x RUB
    RUSSIA_TO_AFRICA: number; // 1 RUB = x XAF/XOF
  };
  clientRates: {
    AFRICA_TO_RUSSIA: number; // Applied to user
    RUSSIA_TO_AFRICA: number; // Applied to user
  };
  lastUpdated: string;
  cachedUntil?: string;
  source: 'api' | 'cache' | 'fallback';
}

export interface Review {
  id: string;
  authorName: string;
  country?: string;
  city: string;
  cityEn?: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  corridor: Direction;
  verified: boolean;
}

export interface TransferQuote {
  direction: Direction;
  sourceAmount: number;
  sourceCurrency: 'XAF' | 'XOF' | 'RUB';
  targetAmount: number;
  targetCurrency: 'XAF' | 'XOF' | 'RUB';
  effectiveRate: number;
  rawRate: number;
  commissionPercent: number;
  estimatedFee: number;
  minSourceAmount: number;
  isValid: boolean;
  validationError?: string;
}

export interface RecipientAfricaData {
  fullName: string;
  operator: string;
  phoneNumber: string;
  countryId: string;
}

export interface RecipientRussiaData {
  fullName: string;
  bankId: string;
  transferType: 'card' | 'sbp';
  cardNumber?: string;
  sbpPhoneNumber?: string;
}

export interface TransactionData {
  id: string; // e.g., "RP-N7-7Z"
  createdAt: string;
  direction: Direction;
  country: CountryInfo;
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  appliedRate: number;
  fee: number;
  senderName: string;
  senderPhone: string;
  recipientAfrica?: RecipientAfricaData;
  recipientRussia?: RecipientRussiaData;
  status: 'PENDING_PAYMENT' | 'PROCESSING' | 'COMPLETED';
}
