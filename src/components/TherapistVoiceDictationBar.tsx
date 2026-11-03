import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Send, 
  Trash2, 
  HelpCircle, 
  Zap, 
  Volume2, 
  ChevronDown, 
  ChevronUp, 
  Keyboard 
} from 'lucide-react';

interface TherapistVoiceDictationBarProps {
  isRecording: boolean;
  speechInterimText: string;
  speechVolume: number;
  speechLanguage: 'fa-IR' | 'en-US';
  autoSendOnSilence: boolean;
  silenceCountdown: number | null;
  onToggleLanguage: () => void;
  onToggleAutoSend: () => void;
  onStopRecording: () => void;
  onSendNow: () => void;
  onClearText: () => void;
  hasText: boolean;
  className?: string;
}

export const TherapistVoiceDictationBar: React.FC<TherapistVoiceDictationBarProps> = ({
  isRecording,
  speechInterimText,
  speechVolume,
  speechLanguage,
  autoSendOnSilence,
  silenceCountdown,
  onToggleLanguage,
  onToggleAutoSend,
  onStopRecording,
  onSendNow,
  onClearText,
  hasText,
  className = ''
}) => {
  const [showPunctuationGuide, setShowPunctuationGuide] = useState(false);

  if (!isRecording) return null;

  // Compute heights for 8 dynamic frequency visualizer bars based on speech volume (0-100)
  const barMultipliers = [0.45, 0.85, 1.3, 1.8, 1.7, 1.2, 0.9, 0.5];
  const isSpeaking = speechVolume > 8 || Boolean(speechInterimText);

  return (
    <div 
      id="therapist-voice-dictation-console"
      className={`bg-gradient-to-r from-rose-50/90 via-amber-50/60 to-rose-50/80 border-t border-rose-200 p-2 sm:p-2.5 transition-all text-xs select-none shadow-xs ${className}`}
    >
      <div className="flex flex-col gap-2">
        
        {/* Row 1: Status + Dynamic Audio Waveform + Interim Text + Quick Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          
          {/* Active Recording State & Real-time Equalizer Waveform */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Pulsing Mic Badge */}
            <div className="relative flex items-center justify-center shrink-0">
              <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-rose-400 opacity-60"></span>
              <span className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 text-white shadow-xs">
                <Mic className="w-3.5 h-3.5 animate-pulse" />
              </span>
            </div>

            {/* Dynamic Real-time Audio Waveform */}
            <div 
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-md bg-rose-100/60 border border-rose-200/80 shrink-0 h-7"
              title={`شدت صدای میکروفون: ${speechVolume}%`}
            >
              {barMultipliers.map((mult, idx) => {
                const heightPx = Math.max(
                  4, 
                  Math.min(22, Math.round((speechVolume / 100) * 18 * mult + (isSpeaking ? 5 : 2)))
                );
                return (
                  <span
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isSpeaking ? 'bg-rose-600' : 'bg-rose-300'
                    }`}
                    style={{ height: `${heightPx}px` }}
                  />
                );
              })}
            </div>

            {/* Live Dictation Status or Interim Transcript */}
            <div className="min-w-0 flex-1 flex items-center gap-1.5">
              {speechInterimText ? (
                <div className="flex items-center gap-1.5 min-w-0 bg-white/95 border border-rose-300/80 px-2.5 py-1 rounded-lg shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="text-stone-900 font-medium text-[11px] sm:text-xs truncate" dir="auto">
                    «{speechInterimText}»
                  </span>
                </div>
              ) : (
                <div className="text-rose-800 text-[11px] font-medium truncate flex items-center gap-1">
                  <span>در حال شنیدن پاسخ درمانی شما...</span>
                  <span className="text-rose-500/80 hidden md:inline text-[10px]">
                    (آزادانه صحبت کنید یا بگویید «نقطه»، «علامت سوال»)
                  </span>
                </div>
              )}

              {/* Auto-send Countdown Badge if active */}
              {autoSendOnSilence && silenceCountdown !== null && (
                <span className="px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-900 text-[10px] font-bold shrink-0 animate-pulse border border-amber-300 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-700" />
                  <span>ارسال در {silenceCountdown} ثانیه...</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Action Buttons: Auto-Send Toggle, Language, Send, Clear, Stop */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap">
            
            {/* Auto-Send on Silence Toggle */}
            <button
              id="btn-toggle-dictation-autosend"
              type="button"
              onClick={onToggleAutoSend}
              title={
                autoSendOnSilence
                  ? 'ارسال خودکار پس از مکث فعال است (با مکث ۲ ثانیه‌ای، پاسخ مستقیماً ارسال می‌شود)'
                  : 'فعال‌سازی ارسال خودکار بدون نیاز به کلیک (Hands-free Voice Mode)'
              }
              className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                autoSendOnSilence
                  ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'
              }`}
            >
              <Zap className={`w-3 h-3 ${autoSendOnSilence ? 'text-white' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">ارسال خودکار مکث</span>
              <span className="sm:hidden">خودکار</span>
            </button>

            {/* Language Switcher */}
            <button
              id="btn-toggle-dictation-lang"
              type="button"
              onClick={onToggleLanguage}
              title="تغییر زبان گفتار به متن (فارسی / انگلیسی)"
              className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white border border-stone-200 hover:border-rose-300 text-stone-700 shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>{speechLanguage === 'fa-IR' ? '🇮🇷 فارسی' : '🇬🇧 English'}</span>
            </button>

            {/* Voice Punctuation Guide Toggle */}
            <button
              id="btn-toggle-dictation-punctuation-guide"
              type="button"
              onClick={() => setShowPunctuationGuide((prev) => !prev)}
              title="مشاهده فرامین صوتی علائم نگارشی (نقطه، کاما، علامت سوال)"
              className={`p-1 sm:px-1.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
                showPunctuationGuide
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">علائم نگارشی</span>
              {showPunctuationGuide ? (
                <ChevronUp className="w-3 h-3 hidden md:inline" />
              ) : (
                <ChevronDown className="w-3 h-3 hidden md:inline" />
              )}
            </button>

            {/* Clear Dictated Text */}
            {hasText && (
              <button
                id="btn-clear-dictated-text"
                type="button"
                onClick={onClearText}
                title="پاک‌کردن متن برای بیان مجدد پاسخ"
                className="p-1 sm:px-1.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-rose-300 text-stone-600 hover:text-rose-600 shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">پاک‌سازی</span>
              </button>
            )}

            {/* Stop Dictation */}
            <button
              id="btn-stop-dictation-bar"
              type="button"
              onClick={onStopRecording}
              title="توقف ضبط و بازگشت به تایپ دستی (کلید Esc یا Alt+V)"
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-stone-700 hover:bg-stone-800 text-white shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <Square className="w-2.5 h-2.5 fill-white text-white" />
              <span>پایان دیکته</span>
            </button>

            {/* Direct Send Spoken Response */}
            <button
              id="btn-send-dictated-response-now"
              type="button"
              onClick={onSendNow}
              disabled={!hasText && !speechInterimText.trim()}
              title="ارسال فوری پاسخ درمانی به مراجع (Enter)"
              className="text-[11px] font-bold px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3 h-3 rotate-180" />
              <span>ارسال</span>
            </button>
          </div>
        </div>

        {/* Collapsible Voice Punctuation & Keyboard Shortcuts Cheat-Sheet */}
        {showPunctuationGuide && (
          <div className="bg-white/95 rounded-xl p-2.5 border border-stone-200 shadow-xs flex flex-col gap-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-stone-800 font-bold text-[11px]">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                فرمان‌های صوتی برای علائم نگارشی بالینی
              </span>
              <span className="text-[10px] text-stone-500 flex items-center gap-1">
                <Keyboard className="w-3 h-3" />
                میانبر صوتی: <kbd className="px-1 py-0.5 bg-stone-100 border rounded text-[9px] font-mono">Alt + V</kbd>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 text-[10px]">
              <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <span className="text-stone-600">بگویید «نقطه»</span>
                <span className="font-bold text-indigo-700 px-1.5 py-0.5 bg-white rounded border border-stone-200">.</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <span className="text-stone-600">بگویید «ویرگول» یا «کاما»</span>
                <span className="font-bold text-indigo-700 px-1.5 py-0.5 bg-white rounded border border-stone-200">،</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <span className="text-stone-600">بگویید «علامت سوال»</span>
                <span className="font-bold text-indigo-700 px-1.5 py-0.5 bg-white rounded border border-stone-200">؟</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <span className="text-stone-600">بگویید «علامت تعجب»</span>
                <span className="font-bold text-indigo-700 px-1.5 py-0.5 bg-white rounded border border-stone-200">!</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <span className="text-stone-600">بگویید «دو نقطه»</span>
                <span className="font-bold text-indigo-700 px-1.5 py-0.5 bg-white rounded border border-stone-200">:</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <span className="text-stone-600">بگویید «خط بعد»</span>
                <span className="font-bold text-indigo-700 px-1 py-0.5 bg-white rounded border border-stone-200 text-[9px]">سطر جدید</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
