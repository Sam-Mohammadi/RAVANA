import React, { useState } from 'react';
import { 
  Star, 
  HeartHandshake, 
  CheckCheck, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Info,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import type { SupervisorFeedback } from '../types';

interface SupervisorEmpathyValidationWidgetProps {
  latestFeedback: SupervisorFeedback | null;
  isLoading: boolean;
  lastTherapistMessageText?: string;
  defaultExpanded?: boolean;
  className?: string;
}

// Helper to render 5 stars cleanly with fractional / half-star support
export const StarRatingVisual: React.FC<{ 
  rating: number; 
  maxStars?: number; 
  starSize?: string;
  activeColor?: string;
}> = ({
  rating,
  maxStars = 5,
  starSize = 'w-3.5 h-3.5',
  activeColor = 'text-amber-400 fill-amber-400'
}) => {
  const safeRating = Math.max(0, Math.min(maxStars, rating || 0));

  return (
    <div className="flex items-center gap-0.5" dir="ltr" title={`${safeRating} از ${maxStars} ستاره`}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFull = safeRating >= starValue;
        const isHalf = !isFull && safeRating >= starValue - 0.65;

        return (
          <div key={index} className="relative inline-flex items-center justify-center">
            {/* Background empty star */}
            <Star className={`${starSize} text-stone-200 fill-stone-100`} />
            
            {/* Overlay filled star */}
            {isFull ? (
              <Star className={`absolute inset-0 ${starSize} ${activeColor}`} />
            ) : isHalf ? (
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star className={`${starSize} ${activeColor}`} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export const SupervisorEmpathyValidationWidget: React.FC<SupervisorEmpathyValidationWidgetProps> = ({
  latestFeedback,
  isLoading,
  lastTherapistMessageText,
  defaultExpanded = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  // If no message has been sent yet and not loading, we can show an inviting standby state or hide gracefully
  if (!latestFeedback && !isLoading) {
    return null;
  }

  // Calculate scores and star values safely
  const empathyStars = latestFeedback?.empathyStars !== undefined
    ? latestFeedback.empathyStars
    : latestFeedback?.empathyScore 
      ? Math.min(5, Math.max(1, Math.round((latestFeedback.empathyScore / 2) * 10) / 10))
      : 3.5;

  const validationStars = latestFeedback?.validationStars !== undefined
    ? latestFeedback.validationStars
    : latestFeedback?.validationScore
      ? Math.min(5, Math.max(1, Math.round((latestFeedback.validationScore / 2) * 10) / 10))
      : empathyStars;

  const combinedAverage = Math.round(((empathyStars + validationStars) / 2) * 10) / 10;

  // Determine badge styling based on rating
  const getRatingTier = (score: number) => {
    if (score >= 4.2) return { label: 'عالی و عمیق', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', starColor: 'text-amber-500 fill-amber-400' };
    if (score >= 3.2) return { label: 'مناسب و مطلوب', bg: 'bg-teal-50 border-teal-200 text-teal-800', starColor: 'text-amber-500 fill-amber-400' };
    if (score >= 2.2) return { label: 'متوسط / نیازمند بسط', bg: 'bg-amber-50 border-amber-200 text-amber-800', starColor: 'text-amber-500 fill-amber-400' };
    return { label: 'کم یا ابطال‌کننده', bg: 'bg-rose-50 border-rose-200 text-rose-800', starColor: 'text-rose-400 fill-rose-300' };
  };

  const currentTier = getRatingTier(combinedAverage);

  return (
    <div 
      id="widget-supervisor-empathy-validation"
      className={`bg-white/95 backdrop-blur-xs border border-stone-200/90 rounded-xl shadow-xs transition-all text-xs overflow-hidden ${className}`}
    >
      {/* Top Banner / Compact Bar */}
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-stone-100 bg-gradient-to-r from-stone-50 via-teal-50/30 to-indigo-50/20">
        
        {/* Left Indicator & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-teal-600 text-white shrink-0 shadow-2xs">
            <HeartHandshake className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-stone-800 text-[11px] sm:text-xs">
              سنجش همدلی و تأیید:
            </span>

            {isLoading ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md animate-pulse border border-teal-200">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                در حال تحلیل سخن شما توسط سوپروایزر...
              </span>
            ) : (
              <div className="flex items-center gap-2">
                {/* 5-Star Summary Visual */}
                <div className="flex items-center gap-1 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/60">
                  <StarRatingVisual rating={combinedAverage} starSize="w-3 h-3" />
                  <span className="font-mono font-bold text-amber-900 text-[11px] ml-0.5">
                    {combinedAverage.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-amber-700/80">/ ۵</span>
                </div>

                <span className={`hidden md:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentTier.bg}`}>
                  {currentTier.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls (Criteria info + Expand/Collapse) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            id="btn-empathy-validation-criteria-info"
            type="button"
            onClick={() => setShowCriteriaModal(prev => !prev)}
            title="معیارهای ۵ ستاره همدلی و تأیید بالینی"
            className="p-1 text-stone-400 hover:text-indigo-600 hover:bg-stone-100 rounded-md transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-toggle-expand-empathy-widget"
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            title={isExpanded ? 'بستن جزئیات ستاره‌دهی' : 'مشاهده تحلیل تفکیکی همدلی و تأیید'}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">{isExpanded ? 'خلاصه' : 'جزئیات ستاره‌ها'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Breakdown View */}
      {isExpanded && latestFeedback && !isLoading && (
        <div className="p-3 space-y-3 bg-stone-50/40 animate-fadeIn">
          
          {/* Recent Therapist Message Snippet (Context) */}
          {lastTherapistMessageText && (
            <div className="text-[11px] bg-white p-2 rounded-lg border border-stone-200/80 text-stone-600 flex items-start gap-1.5">
              <span className="font-semibold text-indigo-700 shrink-0">پیام اخیر شما:</span>
              <span className="truncate italic">"{lastTherapistMessageText}"</span>
            </div>
          )}

          {/* Dual 5-Star Metric Cards: 1) Empathy, 2) Validation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* 1. Empathy Card (Carkhuff Scale) */}
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700 text-xs flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                  <span>همدلی بالینی (مقیاس کارخوف)</span>
                </span>
                <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  {empathyStars.toFixed(1)} / ۵.۰
                </span>
              </div>

              {/* Star visuals & bar */}
              <div className="flex items-center justify-between pt-0.5">
                <StarRatingVisual rating={empathyStars} starSize="w-4 h-4" />
                <span className="text-[10px] text-stone-500 font-medium">
                  {latestFeedback.carkhuffEvaluation?.levelLabel || (empathyStars >= 4.5 ? 'همدلی عمیق' : empathyStars >= 3.5 ? 'همدلی مناسب' : empathyStars >= 2.5 ? 'همدلی تفریقی' : 'ابطال هیجانی')}
                </span>
              </div>

              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-400 to-indigo-600 transition-all duration-300"
                  style={{ width: `${(empathyStars / 5) * 100}%` }}
                />
              </div>

              {latestFeedback.carkhuffEvaluation?.clinicalRationale && (
                <p className="text-[10px] text-stone-500 italic pt-0.5 border-t border-stone-100">
                  {latestFeedback.carkhuffEvaluation.clinicalRationale}
                </p>
              )}
            </div>

            {/* 2. Validation Card (Linehan DBT Scale) */}
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700 text-xs flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>اعتبارسنجی و تأیید (لینهان)</span>
                </span>
                <span className="font-mono font-bold text-teal-800 text-xs bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {validationStars.toFixed(1)} / ۵.۰
                </span>
              </div>

              {/* Star visuals & bar */}
              <div className="flex items-center justify-between pt-0.5">
                <StarRatingVisual rating={validationStars} starSize="w-4 h-4" />
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  validationStars >= 4 ? 'bg-emerald-50 text-emerald-800' :
                  validationStars >= 3 ? 'bg-teal-50 text-teal-800' :
                  'bg-rose-50 text-rose-800'
                }`}>
                  {latestFeedback.linehanValidation?.levelLabel || latestFeedback.validationLevel || (validationStars >= 4 ? 'عالی' : validationStars >= 3 ? 'مناسب' : 'ناکافی')}
                </span>
              </div>

              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-teal-600 transition-all duration-300"
                  style={{ width: `${(validationStars / 5) * 100}%` }}
                />
              </div>

              {latestFeedback.linehanValidation?.scientificDescription && (
                <p className="text-[10px] text-stone-500 italic pt-0.5 border-t border-stone-100">
                  {latestFeedback.linehanValidation.scientificDescription}
                </p>
              )}
            </div>

          </div>

          {/* Supervisor Empathy & Validation Insight Sentence */}
          <div className="bg-teal-50/70 border border-teal-200/70 rounded-lg p-2.5 flex items-start gap-2 text-teal-950">
            <Sparkles className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[11px] text-teal-900 block">
                تحلیل سوپروایزر درباره همدلی و تأیید سخن اخیر:
              </span>
              <p className="text-[11px] leading-relaxed text-teal-900 font-medium">
                {latestFeedback.empathyValidationInsight || latestFeedback.clinicalComment}
              </p>
            </div>
          </div>

          {/* Quick Tip for Improvement if stars < 4 */}
          {combinedAverage < 4.0 && (
            <div className="text-[11px] bg-amber-50/80 border border-amber-200 rounded-lg p-2 text-amber-900 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>راهکار ارتقای ستاره‌ها:</strong> قبل از طرح پرسش جدید یا تحلیل عقلی، ابتدا درد یا هیجان پنهان مراجع را با جملاتی مثل «کاملاً درک می‌کنم که چقدر این موقعیت سخته...» تصدیق و تأیید کنید.
              </span>
            </div>
          )}

        </div>
      )}

      {/* Criteria Info Modal */}
      {showCriteriaModal && (
        <div className="p-3 bg-stone-900 text-stone-100 border-t border-stone-800 text-[11px] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-teal-300 border-b border-stone-800 pb-1.5">
            <span>مبانی علمی و سنجه‌های استاندارد سوپرویژن بالینی</span>
            <button 
              onClick={() => setShowCriteriaModal(false)}
              className="text-stone-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Section 1: Carkhuff Scale */}
          <div className="space-y-1.5">
            <span className="text-amber-300 font-bold block text-xs">۱. مقیاس ۵ سطحی همدلی رابرت کارخوف (Carkhuff, 1969):</span>
            <div className="space-y-1 text-stone-300 pr-1">
              <p><strong className="text-amber-400 font-mono">سطح ۵ (دگرگون‌کننده):</strong> تنظیم عمیق، حضور رادیکال و معنابخشی به تاریک‌ترین نقاط رنج مراجع؛ بستر تجربه هیجانی اصلاحی.</p>
              <p><strong className="text-amber-400 font-mono">سطح ۴ (افزاینده):</strong> کشف و نام‌گذاری احساسات ناگفته و معانی ضمنی که مراجع هنوز تصریح نکرده است.</p>
              <p><strong className="text-amber-400 font-mono">سطح ۳ (تبادلی دقیق):</strong> انعکاس هم‌سطح و وفادارانه عواطف و محتوای تصریح‌شده بدون کم یا زیاد.</p>
              <p><strong className="text-amber-400 font-mono">سطح ۲ (تفریقی / ناقص):</strong> بازتاب سطحی فقط به لایه منطقی و کلمات ظاهری، با نادیده گرفتن شدت هیجان.</p>
              <p><strong className="text-amber-400 font-mono">سطح ۱ (ابطال‌کننده / مخرب):</strong> سرزنش، تمسخر، تغییر موضوع، یا نادیده‌گرفتن کامل رنج مراجع.</p>
            </div>
          </div>

          {/* Section 2: Linehan Validation Levels */}
          <div className="space-y-1.5 pt-2 border-t border-stone-800">
            <span className="text-teal-300 font-bold block text-xs">۲. سطوح شش‌گانه اعتبارسنجی مارشا لینهان (Linehan DBT, 1993):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-stone-300 text-[10px]">
              <div className="p-1.5 bg-stone-800/80 rounded border border-stone-700">
                <strong className="text-teal-400">V1 (گوش‌دادن فعال):</strong> توجه کامل بدون قضاوت
              </div>
              <div className="p-1.5 bg-stone-800/80 rounded border border-stone-700">
                <strong className="text-teal-400">V2 (بازتاب دقیق):</strong> انعکاس کلامی بدون تحریف
              </div>
              <div className="p-1.5 bg-stone-800/80 rounded border border-stone-700">
                <strong className="text-teal-400">V3 (ذهن‌خوانی بالینی):</strong> به کلام درآوردن ناگفته‌ها
              </div>
              <div className="p-1.5 bg-stone-800/80 rounded border border-stone-700">
                <strong className="text-teal-400">V4 (اعتبارسنجی با تاریخچه):</strong> توجیه با توجه به گذشته
              </div>
              <div className="p-1.5 bg-stone-800/80 rounded border border-stone-700">
                <strong className="text-teal-400">V5 (نرمال‌سازی در شرایط حال):</strong> واکنش طبیعی هر انسان
              </div>
              <div className="p-1.5 bg-stone-800/80 rounded border border-stone-700">
                <strong className="text-teal-400">V6 (اصالت رادیکال):</strong> ارتباط برابر انسان با انسان
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
