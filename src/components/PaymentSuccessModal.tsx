import React, { useState } from 'react';
import { TransactionData, Language } from '../types';
import { translations } from '../data/translations';
import { formatCurrency, formatNumber } from '../utils/calculator';
import { CheckCircle2, MessageCircle, Copy, Check, Clock, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { RapidexLogo } from './RapidexLogo';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  transaction: TransactionData | null;
  currentLanguage: Language;
  onClose: () => void;
  onNewTransfer: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  transaction,
  currentLanguage,
  onClose,
  onNewTransfer,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const t = translations[currentLanguage];

  if (!isOpen || !transaction) return null;

  const isRussiaToAfrica = transaction.direction === 'RUSSIA_TO_AFRICA';

  // Construct structured WhatsApp message
  const recipientSummary = isRussiaToAfrica
    ? `Afrique (${transaction.country.name}): ${transaction.recipientAfrica?.fullName} - ${transaction.recipientAfrica?.operator} (${transaction.recipientAfrica?.phoneNumber})`
    : `Russie: ${transaction.recipientRussia?.fullName} - ${transaction.recipientRussia?.bankId.toUpperCase()} (${transaction.recipientRussia?.transferType === 'card' ? transaction.recipientRussia?.cardNumber : transaction.recipientRussia?.sbpPhoneNumber})`;

  const whatsappMessage = `*RAPIDEX TRANSFERT - SESSION #${transaction.id}*
---------------------------------------
💰 *Montant envoyé :* ${formatCurrency(transaction.sourceAmount, transaction.sourceCurrency)}
🎯 *Montant à recevoir :* ${formatCurrency(transaction.targetAmount, transaction.targetCurrency)}
📊 *Taux appliqué :* ${transaction.appliedRate.toFixed(4)}
👤 *Expéditeur :* ${transaction.senderName} (${transaction.senderPhone})
📍 *Bénéficiaire :* ${recipientSummary}
---------------------------------------
Bonjour le support Rapidex, je viens d'initier cette commande et souhaite procéder au règlement pour finaliser l'envoi immédiat. Merci !`;

  const encodedWhatsAppUrl = `https://wa.me/79000000000?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#182238] border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-7 text-slate-100 relative my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mb-3 border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Commande initiée avec succès !
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 font-mono text-xs text-amber-400 font-bold mt-2 tracking-wider">
            ID : {transaction.id}
          </div>
        </div>

        {/* Key Transaction Overview */}
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 mb-5 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">À envoyer :</span>
            <span className="font-extrabold text-white font-mono text-base">
              {formatCurrency(transaction.sourceAmount, transaction.sourceCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">À recevoir :</span>
            <span className="font-extrabold text-emerald-400 font-mono text-base">
              {formatCurrency(transaction.targetAmount, transaction.targetCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">Bénéficiaire :</span>
            <span className="text-slate-200 font-semibold truncate max-w-[220px]">
              {isRussiaToAfrica ? transaction.recipientAfrica?.fullName : transaction.recipientRussia?.fullName}
            </span>
          </div>
        </div>

        {/* Step-by-Step Progress Timeline */}
        <div className="mb-6 px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Statut du transfert
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">1. Commande créée</p>
                <p className="text-slate-400 text-[11px]">Taux bloqué pour 15 minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold animate-pulse">
                2
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-300">2. En attente de règlement</p>
                <p className="text-slate-300 text-[11px]">Contactez le support pour payer localement</p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="text-xs">
                <p className="font-medium text-slate-300">3. Libération des fonds (5-15 min)</p>
                <p className="text-slate-500 text-[11px]">Envoi instantané sur Mobile Money / SBP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary WhatsApp Action */}
        <div className="space-y-2 mb-4">
          <a
            href={encodedWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 fill-slate-950 text-emerald-500" />
            <span>{t.openWhatsApp}</span>
          </a>

          <button
            onClick={handleCopyDetails}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>{t.copyOrderDetails}</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={onNewTransfer}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
          >
            ← Effectuer un nouveau transfert
          </button>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
