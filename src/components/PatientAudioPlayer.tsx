import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  SlidersHorizontal,
  Check,
  Languages,
  Mic,
  Activity,
  Gauge
} from 'lucide-react';
import type { ClinicalCase, ClientState } from '../types';
import { 
  PatientVoiceTone, 
  getVoiceToneConfig, 
  getPersianVoiceInfo, 
  PersianVoiceInfo,
  getAcousticSummaryInfo,
  warmUpTTS 
} from '../utils/patientTTS';

export interface PatientAudioPlayerProps {
  messageId: string;
  text: string;
  isSpeaking: boolean;
  onPlay: () => void;
  onStop: () => void;
  onReplay: () => void;
  tone?: PatientVoiceTone;
  onCycleTone?: () => void;
  rateMultiplier?: number;
  onRateChange?: (rate: number) => void;
  emotionalDescriptorTitle?: string;
  clientState?: ClientState;
  caseInfo?: Pick<ClinicalCase, 'patientName' | 'gender' | 'age'>;
  className?: string;
}

export const PatientAudioPlayer: React.FC<PatientAudioPlayerProps> = ({
  messageId,
  text,
  isSpeaking,
  onPlay,
  onStop,
  onReplay,
  tone = 'calm',
  onCycleTone,
  rateMultiplier = 1.0,
  onRateChange,
  emotionalDescriptorTitle,
  clientState,
  caseInfo,
  className = '',
}) => {
  const [voiceInfo, setVoiceInfo] = useState<PersianVoiceInfo>(() => getPersianVoiceInfo());
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const safeTone: PatientVoiceTone = (tone as PatientVoiceTone) || 'calm';

  // Calculate detailed acoustic profile for tone, rate, and pitch
  const acousticInfo = useMemo(() => {
    return getAcousticSummaryInfo(
      clientState,
      caseInfo,
      { rateMultiplier, tone: safeTone },
      safeTone,
      text
    );
  }, [clientState, caseInfo, rateMultiplier, safeTone, text]);

  // Re-check available Persian voices when browser loads voices
  useEffect(() => {
    const updateVoice = () => {
      setVoiceInfo(getPersianVoiceInfo());
    };
    updateVoice();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoice;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Compute estimated speech duration in seconds for Persian
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const wordCount = words.length;
  const effectiveRate = acousticInfo.rate || rateMultiplier;
  const estimatedSecs = Math.max(2, Math.round(wordCount / (2.2 * effectiveRate)));

  // Track playback time
  useEffect(() => {
    if (!isSpeaking) {
      setElapsedSecs(0);
      return;
    }
    setHasPlayedOnce(true);
    setElapsedSecs(0);
    const timer = setInterval(() => {
      setElapsedSecs((prev) => (prev < estimatedSecs ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(timer);
  }, [isSpeaking, estimatedSecs]);

  const progressPercent = isSpeaking
    ? Math.min(100, Math.max(6, Math.round((elapsedSecs / estimatedSecs) * 100)))
    : hasPlayedOnce
    ? 100
    : 0;

  const toneConfig = getVoiceToneConfig(tone);

  // Deterministic heights for 18 waveform bars
  const waveBars = useMemo(() => {
    return [35, 60, 85, 45, 95, 70, 50, 80, 100, 65, 40, 90, 75, 55, 80, 60, 45, 30];
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id={`audio-player-${messageId}`}
      role="region"
      aria-label="کنترلر پلیر صوتی پیام مراجع با لهجه فارسی"
      className={`mt-2.5 p-2.5 rounded-xl border transition-all duration-200 select-none ${
        isSpeaking
          ? 'bg-gradient-to-br from-indigo-50/90 via-white to-rose-50/70 border-indigo-300 shadow-sm ring-2 ring-indigo-200/70'
          : 'bg-stone-50/90 hover:bg-white border-stone-200/90 hover:border-indigo-200 shadow-2xs'
      } ${className}`}
    >
      {/* Top Header Row: fa-IR Badge & Engine Info */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-stone-200/60 text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Automatic fa-IR Persian Accent Badge */}
          <span 
            title="انتخاب خودکار لهجه فارسی استاندارد (fa-IR) در Web Speech API"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-[10px] font-bold shadow-2xs"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-emerald-500 animate-ping' : 'bg-emerald-600'}`} />
            <Languages className="w-3 h-3 text-emerald-600" />
            <span>لهجه فارسی (fa-IR)</span>
          </span>

          {/* Voice status label */}
          <span 
            title={voiceInfo.statusText}
            className="text-[10px] text-stone-500 truncate max-w-[140px] sm:max-w-[180px]"
          >
            {voiceInfo.displayName}
          </span>
        </div>

        {/* Engine Identifier */}
        <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-mono font-medium">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Web Speech API</span>
        </div>
      </div>

      {/* Main Player Row: Play/Pause/Replay Button + Waveform + Timer */}
      <div className="flex items-center gap-3">
        {/* Play / Stop Master Button */}
        <button
          type="button"
          onClick={() => {
            warmUpTTS();
            if (isSpeaking) {
              onStop();
            } else {
              onPlay();
            }
          }}
          aria-label={isSpeaking ? 'توقف پخش صوتی متن پیام' : 'پخش صوتی متن پیام با Web Speech API'}
          title={
            isSpeaking
              ? 'توقف پخش صوتی (Web Speech API)'
              : `پخش صوتی متن پیام با لهجه فارسی (fa-IR)، لحن ${toneConfig.name} و سرعت ${acousticInfo.paceLabel}`
          }
          className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
            isSpeaking
              ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-200/80 animate-pulse'
              : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white hover:shadow-md hover:shadow-indigo-500/20'
          }`}
        >
          {isSpeaking ? (
            <Square className="w-4 h-4 fill-white text-white" />
          ) : (
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          )}
        </button>

        {/* Replay Quick Button */}
        {hasPlayedOnce && (
          <button
            type="button"
            onClick={() => {
              warmUpTTS();
              onReplay();
            }}
            title="بازپخش صوتی پیام از ابتدا با لهجه فارسی"
            className="shrink-0 p-1.5 rounded-lg text-stone-500 hover:text-indigo-700 hover:bg-indigo-50 border border-stone-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Waveform Equalizer Display & Progress Scrub Track */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {/* Waveform Equalizer Graphic */}
          <div className="flex items-end justify-between gap-0.5 h-6 px-1 py-0.5 bg-stone-100/70 rounded-md border border-stone-200/50">
            {waveBars.map((heightPercent, idx) => {
              const barProgress = (idx / waveBars.length) * 100;
              const isPast = progressPercent >= barProgress;
              
              return (
                <span
                  key={idx}
                  style={{ 
                    height: isSpeaking ? undefined : `${heightPercent}%`,
                    animationDelay: `${(idx % 6) * 100}ms`,
                    animationDuration: '650ms'
                  }}
                  className={`flex-1 rounded-full transition-all ${
                    isSpeaking
                      ? 'bg-indigo-600 animate-bounce'
                      : isPast
                      ? 'bg-indigo-500'
                      : 'bg-stone-300'
                  }`}
                />
              );
            })}
          </div>

          {/* Time Counter & Progress Bar */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 px-0.5">
            <span className={isSpeaking ? 'text-indigo-700 font-bold' : ''}>
              {formatTime(elapsedSecs)}
            </span>
            <div className="flex-1 mx-2 bg-stone-200/80 h-1 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>~{formatTime(estimatedSecs)}</span>
          </div>
        </div>
      </div>

      {/* Tone & Pace Educational Acoustic Monitor */}
      <div className="mt-2 pt-2 border-t border-stone-200/60 flex flex-col gap-1.5 text-[11px]">
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          {/* Tone Selector Pill */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                warmUpTTS();
                onCycleTone?.();
              }}
              title={`لحن فعلی: ${acousticInfo.toneName} - کلیک برای تغییر لحن`}
              className={`px-2 py-0.5 rounded-md border font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1 ${toneConfig.badgeBg} ${toneConfig.badgeBorder} ${toneConfig.badgeText}`}
            >
              <span>🎭 لحن: {acousticInfo.toneName}</span>
              <span className="text-[9px] opacity-70">↻</span>
            </button>

            {/* Pace Metric Badge */}
            <span 
              title="ضرب‌آهنگ کلام بیمار متناسب با میزان اضطراب و مقاومت"
              className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-medium flex items-center gap-1"
            >
              <Gauge className="w-2.5 h-2.5 text-stone-500" />
              <span>سرعت: {acousticInfo.paceLabel}</span>
            </span>

            {/* Pitch Metric Badge */}
            <span 
              title="بسامد صوتی و انقباض تارهای صوتی مراجع"
              className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-medium hidden xs:inline-flex items-center gap-1"
            >
              <Activity className="w-2.5 h-2.5 text-stone-500" />
              <span>بسامد: {acousticInfo.pitchLabel}</span>
            </span>
          </div>

          {/* Speed Multiplier Quick Switcher */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-stone-400">تنظیم دستی:</span>
            {[0.85, 1.0, 1.25].map((rate) => {
              const isActive = Math.abs(rateMultiplier - rate) < 0.08;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    warmUpTTS();
                    onRateChange?.(rate);
                  }}
                  title={`سرعت گفتار: ${rate === 1.0 ? '۱x (عادی)' : rate < 1.0 ? '۰.۸۵x (شمرده)' : '۱.۲۵x (تند)'}`}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/70'
                  }`}
                >
                  {rate === 1.0 ? '1x' : rate < 1.0 ? '.85x' : '1.25x'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clinical Implication Insight for Students */}
        <p className="text-[10px] text-stone-500 italic bg-stone-100/60 px-2 py-1 rounded-md border border-stone-200/50 leading-relaxed">
          <span className="font-semibold not-italic text-stone-700">تحلیل آکوستیک برای دانشجو:</span> {acousticInfo.clinicalImplication}
        </p>
      </div>
    </div>
  );
};
