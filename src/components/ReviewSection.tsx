import React, { useState } from 'react';
import { Review, Language } from '../types';
import { translations } from '../data/translations';
import { RUSSIAN_CITIES, COUNTRIES } from '../data/countries';
import { FlagIcon } from './FlagIcon';
import {
  MessageSquare,
  User,
  Globe,
  MapPin,
  Star,
  Send,
  ChevronDown,
  CheckCircle,
  ChevronUp,
} from 'lucide-react';

interface ReviewSectionProps {
  currentLanguage: Language;
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id' | 'date' | 'verified'>) => Promise<{ success: boolean; error?: string }> | void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  currentLanguage,
  reviews,
  onAddReview,
}) => {
  const t = translations[currentLanguage];

  const [authorName, setAuthorName] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) {
      setErrorMsg(
        currentLanguage === 'ru'
          ? 'Пожалуйста, укажите ваше имя.'
          : currentLanguage === 'en'
          ? 'Please enter your name.'
          : 'Veuillez renseigner votre nom.'
      );
      return;
    }
    if (!countryCode) {
      setErrorMsg(
        currentLanguage === 'ru'
          ? 'Пожалуйста, выберите вашу страну.'
          : currentLanguage === 'en'
          ? 'Please select your country.'
          : 'Veuillez sélectionner votre pays.'
      );
      return;
    }
    if (countryCode === 'RUS' && !city) {
      setErrorMsg(
        currentLanguage === 'ru'
          ? 'Пожалуйста, выберите ваш город в России.'
          : currentLanguage === 'en'
          ? 'Please select your city in Russia.'
          : 'Veuillez sélectionner votre ville en Russie.'
      );
      return;
    }
    if (rating === 0) {
      setErrorMsg(
        currentLanguage === 'ru'
          ? 'Пожалуйста, поставьте оценку звездами.'
          : currentLanguage === 'en'
          ? 'Please select a star rating.'
          : 'Veuillez attribuer une note (étoiles).'
      );
      return;
    }
    if (!comment.trim()) {
      setErrorMsg(
        currentLanguage === 'ru'
          ? 'Пожалуйста, напишите отзыв.'
          : currentLanguage === 'en'
          ? 'Please enter your review.'
          : 'Veuillez écrire un commentaire.'
      );
      return;
    }

    setErrorMsg(null);

    const isRussia = countryCode === 'RUS';
    const selectedCountryObj = COUNTRIES.find((c) => c.id === countryCode);
    const countryName = isRussia
      ? (currentLanguage === 'ru' ? 'Россия' : currentLanguage === 'en' ? 'Russia' : 'Russie')
      : (selectedCountryObj ? (currentLanguage === 'en' ? selectedCountryObj.nameEn : selectedCountryObj.name) : 'Afrique');

    const cleanCityName = isRussia ? city.replace(/\s*\(.*\)/, '').trim() : countryName;
    const corridorValue = isRussia ? 'RUSSIA_TO_AFRICA' : 'AFRICA_TO_RUSSIA';

    const promise = onAddReview({
      authorName: authorName.trim(),
      country: countryName,
      city: cleanCityName,
      rating,
      comment: comment.trim(),
      corridor: corridorValue,
    });

    const resetForm = () => {
      setSubmittedSuccess(true);
      setAuthorName('');
      setCountryCode('');
      setCity('');
      setRating(0);
      setComment('');
      setTimeout(() => setSubmittedSuccess(false), 4000);
    };

    if (promise && typeof promise.then === 'function') {
      promise.then((res) => {
        if (res && !res.success) {
          setErrorMsg(res.error || 'Erreur lors de la publication.');
          return;
        }
        resetForm();
      });
    } else {
      resetForm();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 pb-20">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Form Card (Sticky on desktop) */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-[#151E33] border border-[#23314F] shadow-lg mb-6 lg:mb-0 lg:sticky lg:top-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-[#EAB308] fill-[#EAB308]" />
            <h2 className="font-['Playfair_Display',serif] text-xl font-bold text-white">
              {t.reviewsAndTestimonials}
            </h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mb-5">
            {t.shareExperience}
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          {submittedSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{t.reviewSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Votre nom */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.yourName}</span>
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={t.yourNamePlaceholder}
                className="w-full px-3.5 py-3 rounded-xl bg-[#0E1626] border border-[#1F2C46] focus:border-[#EAB308] text-white text-sm outline-none transition-all placeholder:text-slate-500"
              />
            </div>

            {/* Votre pays (Section Russie et Afrique) */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.yourCountry}</span>
              </label>
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCountryCode(val);
                    if (val !== 'RUS') {
                      setCity('');
                    }
                  }}
                  className="w-full appearance-none px-3.5 py-3 rounded-xl bg-[#0E1626] border border-[#1F2C46] focus:border-[#EAB308] text-white text-sm outline-none transition-all cursor-pointer pr-10"
                >
                  <option value="" disabled className="text-slate-500">
                    {t.selectCountryPlaceholder}
                  </option>
                  <optgroup label={t.sectionRussia} className="bg-[#151E33] text-[#EAB308] font-bold">
                    <option value="RUS" className="bg-[#0E1626] text-white font-normal">
                      {currentLanguage === 'ru' ? 'Россия' : currentLanguage === 'en' ? 'Russia' : 'Russie'}
                    </option>
                  </optgroup>
                  <optgroup label={t.sectionAfrica} className="bg-[#151E33] text-[#EAB308] font-bold">
                    {COUNTRIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0E1626] text-white font-normal">
                        {currentLanguage === 'en' ? c.nameEn : c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Votre ville en Russie (S'affiche uniquement si la Russie est sélectionnée) */}
            {countryCode === 'RUS' && (
              <div className="transition-all duration-200">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.yourCity}</span>
                </label>
                <div className="relative">
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full appearance-none px-3.5 py-3 rounded-xl bg-[#0E1626] border border-[#1F2C46] focus:border-[#EAB308] text-white text-sm outline-none transition-all cursor-pointer pr-10"
                  >
                    <option value="" disabled className="text-slate-500">
                      {t.selectCityPlaceholder}
                    </option>
                    {RUSSIAN_CITIES.map((c) => (
                      <option key={c} value={c} className="bg-[#0E1626] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Votre note */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1.5">
                <Star className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.yourRating}</span>
              </label>
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((s) => {
                  const isSelected = (hoverRating || rating) >= s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          isSelected
                            ? 'text-[#FACC15] fill-[#FACC15]'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Votre commentaire */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.yourComment}</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.yourCommentPlaceholder}
                rows={4}
                className="w-full px-3.5 py-3 rounded-xl bg-[#0E1626] border border-[#1F2C46] focus:border-[#EAB308] text-white text-sm outline-none transition-all placeholder:text-slate-500 resize-none"
              />
            </div>

            {/* Publier button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer mt-2"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>{t.publishReview}</span>
            </button>
          </form>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-7 space-y-3.5">
          {reviews.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#151E33] border border-[#23314F] text-center shadow-sm">
              <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
              <p className="text-sm font-semibold text-slate-200 font-sans">
                {currentLanguage === 'ru'
                  ? 'Отзывов пока нет. Будьте первым, кто оставит свой отзыв!'
                  : currentLanguage === 'en'
                  ? 'No reviews yet. Be the first to share your experience!'
                  : 'Aucun avis pour le moment. Soyez le premier client à partager votre expérience !'}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                {currentLanguage === 'ru'
                  ? 'Все отзывы публикуются исключительно реальными пользователями.'
                  : currentLanguage === 'en'
                  ? 'All reviews are published exclusively by real verified users.'
                  : 'Tous les avis sont publiés exclusivement par de vrais utilisateurs vérifiés.'}
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#151E33] border border-[#23314F] shadow-sm"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                      {rev.authorName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <FlagIcon countryCode={rev.country || rev.city} size={15} />
                      <span className="font-medium text-slate-300">
                        {rev.country && rev.city && rev.country !== rev.city
                          ? `${rev.city}, ${rev.country}`
                          : (rev.city || rev.country)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            s <= rev.rating
                              ? 'text-[#FACC15] fill-[#FACC15]'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1 font-sans">
                      {rev.date}
                    </span>
                  </div>
                </div>

                {/* Comment text */}
                <p className="text-xs sm:text-sm text-slate-200 mt-3 leading-relaxed">
                  {rev.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Scroll to Top button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={scrollToTop}
          aria-label="Retour en haut"
          className="w-11 h-11 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
