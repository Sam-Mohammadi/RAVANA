import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  Smile, 
  Frown, 
  Meh, 
  HeartPulse, 
  Wind, 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  Activity, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ScanEye,
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react';
import type { ClientState, ClinicalCase } from '../types';

export interface NonVerbalAnalysis {
  faceText: string;
  faceType: 'tense' | 'sad' | 'guilt' | 'guarded' | 'angry' | 'relieved' | 'neutral';
  postureText: string;
  postureType: 'closed' | 'slumped' | 'forward' | 'restless' | 'rigid' | 'relaxed';
  eyeGazeText: string;
  eyeGazeType: 'down' | 'avoidant' | 'intense' | 'tearful' | 'steady';
  physioText: string;
  physioType: 'sigh' | 'tremor' | 'rapid_breath' | 'swallow' | 'shallow' | 'calm';
  intensity: 'خفیف' | 'متوسط' | 'شدید';
  clinicalMeaning: string;
}

/**
 * Derives comprehensive non-verbal behavioral cues from message cue text,
 * psychological state snapshot (anxiety, resistance, openness), and case context.
 */
export function analyzeNonVerbalCues(
  rawCue?: string,
  state?: ClientState,
  caseInfo?: Pick<ClinicalCase, 'dsmDiagnosis' | 'title' | 'patientName'>
): NonVerbalAnalysis {
  const cue = (rawCue || '').toLowerCase().trim();
  const anxiety = state?.anxiety ?? 50;
  const resistance = state?.resistance ?? 40;
  const openness = state?.openness ?? 50;
  const rapport = state?.rapport ?? 50;

  // 1. Analyze Facial Expression
  let faceText = 'حالت چهره کنترل‌شده با انقباض خفیف عضلات اطراف چشم و پیشانی';
  let faceType: NonVerbalAnalysis['faceType'] = 'tense';

  if (cue.includes('گریه') || cue.includes('اشک') || cue.includes('بغض') || cue.includes('غم') || anxiety > 75 && openness > 60) {
    faceText = 'گرفتگی شدید چهره، چانه‌ای که می‌لرزد و حلقه‌زدن اشک در چشمان مراجع';
    faceType = 'sad';
  } else if (cue.includes('خشم') || cue.includes('اخم') || cue.includes('فک') || resistance > 70) {
    faceText = 'ابروهای درهم‌کشیده، انقباض عضلات فک و خطوط عمیق پیشانی (نشانه خشم نهفته یا مقاومت)';
    faceType = 'angry';
  } else if (cue.includes('شرم') || cue.includes('سر به زیر') || cue.includes('خجالت')) {
    faceText = 'سر به زیر افکنده، جمع شدن اجزای چهره و سرخ‌شدگی گونه‌ها ناشی از احساس شرم';
    faceType = 'guilt';
  } else if (cue.includes('سرد') || cue.includes('بی‌تفاوت') || cue.includes('ماسک') || resistance > 60 && openness < 35) {
    faceText = 'میمیک چهره بی‌روح و شبیه ماسک، پنهان‌سازی خودآگاهانه هیجانات زیر نقاب منطق';
    faceType = 'guarded';
  } else if (openness > 70 && rapport > 70 && anxiety < 40) {
    faceText = 'تسکین عضلات صورت، چهره‌ای باز و آماده برای تبادل عاطفی عمیق‌تر';
    faceType = 'relieved';
  } else if (anxiety > 60) {
    faceText = 'انقباض ملموس در خطوط فک و پلک‌زدن‌های متوالی و پرشتاب';
    faceType = 'tense';
  }

  // 2. Analyze Body Posture
  let postureText = 'نشسته با فاصله محتاطانه، تکیه داده به صندلی با حرکات بدنی کنترل‌شده';
  let postureType: NonVerbalAnalysis['postureType'] = 'rigid';

  if (cue.includes('دست‌به‌سینه') || cue.includes('عقب') || cue.includes('بسته') || resistance > 65) {
    postureText = 'دست‌به‌سینه، جمع کردن شانه و عقب‌کشیدن تنه از میز درمانگر (پاسچر دفاعی)';
    postureType = 'closed';
  } else if (cue.includes('افتاده') || cue.includes('خمیده') || cue.includes('بی‌رمق') || (state?.currentDefense?.includes('افسردگی') || anxiety > 60 && openness < 40)) {
    postureText = 'شانه‌های افتاده، ستون فقرات خمیده و سنگینی کل جثه بر روی صندلی (بی‌رمقی بالینی)';
    postureType = 'slumped';
  } else if (cue.includes('جلو') || cue.includes('مشتاق') || (openness > 65 && rapport > 60)) {
    postureText = 'متمایل شدن بالاتنه به سمت درمانگر با دست‌های باز (نشانگر پذیرش و اتصال درمانی)';
    postureType = 'forward';
  } else if (cue.includes('بی‌قرار') || cue.includes('تکان') || cue.includes('پا') || anxiety > 70) {
    postureText = 'تکان‌دادن متناوب پا، فشردن انگشتان دست در یکدیگر و تغییر مکرر وضعیت نشستن';
    postureType = 'restless';
  } else if (rapport > 75 && anxiety < 45) {
    postureText = 'عضلات بدن رها و متقارن، تنش عضلانی پایین و پذیرای فضای اتاق درمان';
    postureType = 'relaxed';
  }

  // 3. Analyze Eye Gaze & Contact
  let eyeGazeText = 'تماس چشمی ناپیوسته، چرخش متناوب نگاه بین درمانگر و اشیاء اتاق';
  let eyeGazeType: NonVerbalAnalysis['eyeGazeType'] = 'avoidant';

  if (cue.includes('زمین') || cue.includes('پایین') || (cue.includes('شرم'))) {
    eyeGazeText = 'نگاه ثابت به کف اتاق با پلک‌های افتاده (اجتناب از نگاه مستقیم درمانگر)';
    eyeGazeType = 'down';
  } else if (cue.includes('خیره') || cue.includes('موشکاف') || resistance > 70) {
    eyeGazeText = 'نگاه تیز و ارزیابانه، جستجوی نشانه‌های قضاوت در چشمان درمانگر';
    eyeGazeType = 'intense';
  } else if (cue.includes('اشک') || cue.includes('خیس') || anxiety > 70) {
    eyeGazeText = 'چشمان مرطوب و براق، خیرگی مبهم به نقطه‌ای نامعلوم در فضا';
    eyeGazeType = 'tearful';
  } else if (rapport > 70 && openness > 65) {
    eyeGazeText = 'تماس چشمی طبیعی، پایدار و سرشار از اطمینان خاطر نسبت به درمانگر';
    eyeGazeType = 'steady';
  }

  // 4. Analyze Physiological / Vocal Reactions
  let physioText = 'تنفس قفسه‌ای با مکث‌های گاه‌به‌گاه پیش از ادای کلمات';
  let physioType: NonVerbalAnalysis['physioType'] = 'shallow';

  if (cue.includes('آه') || cue.includes('تخلیه') || (cue.includes('نفس عمیق'))) {
    physioText = 'آه عمیق و لرزان به همراه بازدم طولانی (تلاش ناخودآگاه سیستم عصبی برای خودآرام‌سازی)';
    physioType = 'sigh';
  } else if (cue.includes('لرزش') || cue.includes('دست') || anxiety > 75) {
    physioText = 'لرزش خفیف در ریتم صدا، گرفتگی گلو و حرکات ریز عضلانی در نوک انگشتان';
    physioType = 'tremor';
  } else if (cue.includes('نفس') || cue.includes('شتاب') || anxiety > 65) {
    physioText = 'تنفس سطحی و پرشتاب سینه، بلعیدن مکرر آب دهان ناشی از خشکی گلو';
    physioType = 'rapid_breath';
  } else if (cue.includes('آب دهان') || cue.includes('بغض')) {
    physioText = 'قورت دادن سخت آب دهان همراه با مکث حرکتی در حنجره (احساس توده در گلو - Globus)';
    physioType = 'swallow';
  } else if (anxiety < 40 && rapport > 65) {
    physioText = 'ریتم تنفسی شکمی و یکنواخت، بدون نشانه‌های تحریکی سمپاتیک';
    physioType = 'calm';
  }

  // 5. Overall Non-Verbal Intensity
  let intensity: NonVerbalAnalysis['intensity'] = 'متوسط';
  if (anxiety > 75 || resistance > 75) {
    intensity = 'شدید';
  } else if (anxiety < 40 && resistance < 40) {
    intensity = 'خفیف';
  }

  // 6. Clinical Meaning / Supervision Insight
  let clinicalMeaning = 'ناهماهنگی احتمالی بین کلام ظاهری و زبان بدن مراجع نیازمند مشاهده همدلانه است.';
  if (postureType === 'closed' || faceType === 'angry') {
    clinicalMeaning = 'وضعیت تدافعی بدن نشان‌دهنده احساس تهدید یا ارزیابی شدن است؛ از پرسشگری مستقیم خودداری کرده و همدلی با مقاومت را پیش بگیرید.';
  } else if (faceType === 'sad' || physioType === 'sigh') {
    clinicalMeaning = 'نشانه‌های بارز برون‌ریزی عاطفی و فعال‌شدن هیجان اولیه؛ با سکوت پذیرا و بازتاب ملایم، فضا را برای تجربه ایمن سوگ مهیا کنید.';
  } else if (eyeGazeType === 'down' || faceType === 'guilt') {
    clinicalMeaning = 'نگاه رو به زمین و افتادگی شانه گویای شرم و احساس بی‌ارزشی است؛ نیاز به اعتبارسنجی غیرقضاوتی و حمایت بی‌قیدوشرط دارد.';
  } else if (physioType === 'tremor' || physioType === 'rapid_breath') {
    clinicalMeaning = 'فعال‌شدن سیستم سمپاتیک و برانگیختگی بدنی فراتر از پنجره تحمل (Window of Tolerance)؛ سرعت جلسه را کند کرده و روی احساس امنیت تمرکز کنید.';
  } else if (postureType === 'forward' && rapport > 65) {
    clinicalMeaning = 'نشانه‌های زبان بدن حکایت از تعمیق اتحاد درمانی و عبور از پوسته اولیه مقاومت دارد؛ بستر برای ورود به لایه‌های شناختی-هیجانی فراهم است.';
  }

  return {
    faceText,
    faceType,
    postureText,
    postureType,
    eyeGazeText,
    eyeGazeType,
    physioText,
    physioType,
    intensity,
    clinicalMeaning,
  };
}

export interface PatientNonVerbalCuesProps {
  rawCue?: string;
  clientState?: ClientState;
  caseInfo?: Pick<ClinicalCase, 'dsmDiagnosis' | 'title' | 'patientName'>;
  className?: string;
  defaultExpanded?: boolean;
}

export const PatientNonVerbalCues: React.FC<PatientNonVerbalCuesProps> = ({
  rawCue,
  clientState,
  caseInfo,
  className = '',
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const analysis = analyzeNonVerbalCues(rawCue, clientState, caseInfo);

  // Render Face Icon with Animated Motion
  const renderFaceIcon = () => {
    switch (analysis.faceType) {
      case 'sad':
        return (
          <motion.div
            animate={{ y: [0, 2, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600"
          >
            <Frown className="w-4 h-4" />
          </motion.div>
        );
      case 'angry':
        return (
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-700"
          >
            <Flame className="w-4 h-4" />
          </motion.div>
        );
      case 'guilt':
        return (
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600"
          >
            <Meh className="w-4 h-4" />
          </motion.div>
        );
      case 'relieved':
        return (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600"
          >
            <Smile className="w-4 h-4" />
          </motion.div>
        );
      default:
        return (
          <motion.div
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="p-1.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-600"
          >
            <Meh className="w-4 h-4" />
          </motion.div>
        );
    }
  };

  // Render Posture Icon with Motion
  const renderPostureIcon = () => {
    switch (analysis.postureType) {
      case 'closed':
        return (
          <motion.div
            animate={{ scale: [1, 0.95, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600"
          >
            <ShieldAlert className="w-4 h-4" />
          </motion.div>
        );
      case 'slumped':
        return (
          <motion.div
            animate={{ y: [0, 2, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="p-1.5 rounded-lg bg-stone-100 border border-stone-300 text-stone-600"
          >
            <User className="w-4 h-4" />
          </motion.div>
        );
      case 'forward':
        return (
          <motion.div
            animate={{ x: [0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600"
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        );
      case 'restless':
        return (
          <motion.div
            animate={{ x: [-1.5, 1.5, -1.5], y: [-0.5, 0.5, -0.5] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600"
          >
            <Activity className="w-4 h-4" />
          </motion.div>
        );
      default:
        return (
          <motion.div
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600"
          >
            <ShieldCheck className="w-4 h-4" />
          </motion.div>
        );
    }
  };

  // Render Eye Gaze Icon with Motion
  const renderEyeGazeIcon = () => {
    switch (analysis.eyeGazeType) {
      case 'down':
      case 'avoidant':
        return (
          <motion.div
            animate={{ y: [0, 2.5, 0] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            className="p-1.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-600"
          >
            <EyeOff className="w-4 h-4" />
          </motion.div>
        );
      case 'tearful':
        return (
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600"
          >
            <ScanEye className="w-4 h-4" />
          </motion.div>
        );
      default:
        return (
          <motion.div
            animate={{ x: [-1, 1, -1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600"
          >
            <Eye className="w-4 h-4" />
          </motion.div>
        );
    }
  };

  // Render Physio Icon with Motion
  const renderPhysioIcon = () => {
    switch (analysis.physioType) {
      case 'sigh':
        return (
          <motion.div
            animate={{ scale: [1, 1.18, 0.95, 1] }}
            transition={{ repeat: Infinity, duration: 3.2 }}
            className="p-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600"
          >
            <Wind className="w-4 h-4" />
          </motion.div>
        );
      case 'rapid_breath':
      case 'tremor':
        return (
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600"
          >
            <HeartPulse className="w-4 h-4" />
          </motion.div>
        );
      default:
        return (
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600"
          >
            <Activity className="w-4 h-4" />
          </motion.div>
        );
    }
  };

  const intensityBadgeClass = 
    analysis.intensity === 'شدید'
      ? 'bg-rose-100 text-rose-800 border-rose-300'
      : analysis.intensity === 'متوسط'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : 'bg-emerald-100 text-emerald-800 border-emerald-300';

  return (
    <div
      id="patient-nonverbal-section"
      className={`rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 overflow-hidden shadow-2xs transition-all ${className}`}
    >
      {/* Clickable Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-2 flex items-center justify-between cursor-pointer select-none hover:bg-amber-100/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Animated Eye Scan Indicator */}
          <div className="relative flex items-center justify-center">
            <ScanEye className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
          </div>

          <span className="text-xs font-bold text-amber-900">
            نشانه‌های غیرکلامی مراجع (میمیک چهره و زبان بدن)
          </span>

          {/* Intensity Badge */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${intensityBadgeClass}`}>
            شدت تنش: {analysis.intensity}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-stone-500 text-xs">
          <span className="text-[11px] font-medium hidden sm:inline text-amber-800">
            {isExpanded ? 'بستن جزئیات' : 'مشاهده تحلیل حرکتی'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-amber-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-700" />
          )}
        </div>
      </div>

      {/* Summary Line when collapsed */}
      {!isExpanded && (
        <div 
          onClick={() => setIsExpanded(true)}
          className="px-3 pb-2 pt-0.5 text-xs text-stone-700 cursor-pointer flex items-center gap-2 flex-wrap"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="font-medium text-stone-800 line-clamp-1">
              {rawCue || analysis.faceText}
            </span>
          </div>
          <span className="text-[10px] text-amber-700 font-semibold underline underline-offset-2">
            مشاهده میمیک و وضعیت بدنی...
          </span>
        </div>
      )}

      {/* Expanded Interactive Behavioral Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="px-3 pb-3 pt-1 border-t border-amber-200/60 space-y-2.5"
          >
            {/* 4 Behavioral Modalities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* 1. Facial Expression (میمیک و حالت چهره) */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/90 border border-stone-200/80 shadow-2xs">
                {renderFaceIcon()}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-stone-800 flex items-center justify-between">
                    <span>میمیک و عضلات چهره</span>
                    <span className="text-[10px] font-normal text-amber-700 font-mono">Facial Cue</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5">
                    {analysis.faceText}
                  </p>
                </div>
              </div>

              {/* 2. Body Posture (وضعیت بدنی و پاسچر) */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/90 border border-stone-200/80 shadow-2xs">
                {renderPostureIcon()}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-stone-800 flex items-center justify-between">
                    <span>وضعیت بدنی و پاسچر</span>
                    <span className="text-[10px] font-normal text-amber-700 font-mono">Posture</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5">
                    {analysis.postureText}
                  </p>
                </div>
              </div>

              {/* 3. Eye Gaze (جهت و تماس چشمی) */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/90 border border-stone-200/80 shadow-2xs">
                {renderEyeGazeIcon()}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-stone-800 flex items-center justify-between">
                    <span>جهت و کیفیت تماس چشمی</span>
                    <span className="text-[10px] font-normal text-amber-700 font-mono">Eye Contact</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5">
                    {analysis.eyeGazeText}
                  </p>
                </div>
              </div>

              {/* 4. Physiological & Respiratory Reaction (واکنش بدنی و تنفسی) */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/90 border border-stone-200/80 shadow-2xs">
                {renderPhysioIcon()}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-stone-800 flex items-center justify-between">
                    <span>واکنش تنفسی و فیزیولوژیک</span>
                    <span className="text-[10px] font-normal text-amber-700 font-mono">Autonomic</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5">
                    {analysis.physioText}
                  </p>
                </div>
              </div>
            </div>

            {/* Clinical Educational Insight on Non-Verbal Modality */}
            <div className="p-2 rounded-lg bg-amber-100/70 border border-amber-300/80 flex items-start gap-2 text-xs text-amber-950">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-amber-900 ml-1">دلالت بالینی برای درمانگر:</span>
                <span>{analysis.clinicalMeaning}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
