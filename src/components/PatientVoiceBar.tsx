import React, { useState, useMemo } from 'react';
import { Volume2, VolumeX, Square, Play, Sparkles, Settings2, Sliders, Check, Gauge, Activity } from 'lucide-react';
import type { ClinicalCase, SimulationMessage, ClientState } from '../types';
import { 
  TTSPreferences, 
  PatientVoiceTone, 
  VOICE_TONE_CONFIGS, 
  getVoiceToneConfig, 
  getAcousticSummaryInfo,
  isTTSSupported,
  warmUpTTS
} from '../utils/patientTTS';

interface PatientVoiceBarProps {
  currentCase: ClinicalCase;
  clientState: ClientState;
  lastPatientMessage?: SimulationMessage;
  activeSpeakingMessageId: string | null;
  ttsPreferences: TTSPreferences;
  onUpdatePreferences: (prefs: TTSPreferences) => void;
  onToggleSpeak: (msg: SimulationMessage, toneOverride?: PatientVoiceTone) => void;
  onStopSpeech: () => void;
  onOpenSettings: () => void;
}

export const PatientVoiceBar: React.FC<PatientVoiceBarProps> = ({
  currentCase,
  clientState,
  lastPatientMessage,
  activeSpeakingMessageId,
  ttsPreferences,
  onUpdatePreferences,
  onToggleSpeak,
  onStopSpeech,
  onOpenSettings,
}) => {
  const isSpeaking = !!activeSpeakingMessageId;
  const activeTone = ttsPreferences.tone || 'clinical_adaptive';
  const currentToneConfig = getVoiceToneConfig(activeTone);
  const [isExpanded, setIsExpanded] = useState(true);

  const acousticInfo = useMemo(() => {
    return getAcousticSummaryInfo(
      clientState,
      currentCase,
      ttsPreferences,
      activeTone,
      lastPatientMessage?.content
    );
  }, [clientState, currentCase, ttsPreferences, activeTone, lastPatientMessage?.content]);

  const handleToneChange = (tone: PatientVoiceTone) => {
    warmUpTTS();
    const updated = { ...ttsPreferences, tone };
    onUpdatePreferences(updated);
    // If speaking, immediately replay with new tone
    if (lastPatientMessage) {
      onToggleSpeak(lastPatientMessage, tone);
    }
  };

  const handleRateChange = (rateMultiplier: number) => {
    warmUpTTS();
    const updated = { ...ttsPreferences, rateMultiplier };
    onUpdatePreferences(updated);
  };

  const handleAutoSpeakToggle = () => {
    warmUpTTS();
    const updated = { ...ttsPreferences, autoSpeak: !ttsPreferences.autoSpeak };
    onUpdatePreferences(updated);
  };

  const handlePlayLatest = () => {
    warmUpTTS();
    if (isSpeaking) {
      onStopSpeech();
    } else if (lastPatientMessage) {
      onToggleSpeak(lastPatientMessage);
    }
  };

  return (
    <aside 
      aria-label="پنل خوانش صوتی مراجع مجازی"
      className="bg-white/95 backdrop-blur-md border border-indigo-200/90 rounded-xl shadow-xs px-3 py-2 transition-all"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Left Side: Avatar & Voice Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${currentCase.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
              {currentCase.patientName.slice(0, 1)}
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-stone-900">
                صوت مراجع: {currentCase.patientName}
              </span>
              <span 
                title={acousticInfo.toneDescription}
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${currentToneConfig.badgeBg} ${currentToneConfig.badgeBorder} ${currentToneConfig.badgeText}`}
              >
                لحن: {acousticInfo.toneName}
              </span>
              <span 
                title="سرعت و ضرب‌آهنگ کلام بیمار متناسب با اضطراب و مقاومت"
                className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-stone-100 text-stone-600 border border-stone-200 hidden xs:inline-flex items-center gap-1"
              >
                <Gauge className="w-2.5 h-2.5 text-stone-400" />
                <span>{acousticInfo.paceLabel}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
              {isSpeaking ? (
                <div className="flex items-center gap-1.5 text-rose-600 font-semibold animate-pulse">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>در حال بازگویی صوتی با ضرب‌آهنگ {acousticInfo.paceLabel}...</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <span className="w-1 h-2.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-3.5 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                    <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-stone-500">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">تبدیل هوشمند متن به گفتار (Web Speech API) • میانبر: Alt+P</span>
                  <span className="sm:hidden">آماده پخش (Alt+P)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right: Action Buttons & Tone Quick Switchers */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
          {/* Main Play/Stop Button for Last Utterance */}
          {lastPatientMessage && (
            <button
              id="btn-voice-bar-play-pause"
              type="button"
              onClick={handlePlayLatest}
              title={isSpeaking ? 'توقف پخش صوتی مراجع (Alt+P)' : 'پخش صوتی آخرین جمله مراجع مجازی با Web Speech API (Alt+P)'}
              className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 ring-2 ring-rose-200 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-98'
              }`}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>توقف پخش</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>پخش صدای بیمار</span>
                  <kbd className="hidden md:inline text-[9px] bg-indigo-700/80 px-1 py-0.5 rounded text-indigo-100 font-mono">Alt+P</kbd>
                </>
              )}
            </button>
          )}

          {/* Quick Tone Selector Tabs */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => handleToneChange('clinical_adaptive')}
              title="لحن هوشمند و انطباقی متناسب با اضطراب و مقاومت لحظه‌ای بیمار"
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                activeTone === 'clinical_adaptive'
                  ? 'bg-white text-teal-700 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ⚡ انطباقی (هوشمند)
            </button>

            <button
              type="button"
              onClick={() => handleToneChange('anxious')}
              title="لحن مضطرب و سراسیمه (شتاب در کلام و تنش حنجره)"
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                activeTone === 'anxious'
                  ? 'bg-white text-rose-700 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              😰 مضطرب
            </button>

            <button
              type="button"
              onClick={() => handleToneChange('hesitant')}
              title="لحن مردد و همراه با مکث (تردید و درنگ)"
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                activeTone === 'hesitant'
                  ? 'bg-white text-amber-700 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ⏱️ مردد
            </button>

            <button
              type="button"
              onClick={() => handleToneChange('calm')}
              title="لحن آرام و شمرده (کاهش تنش و تسکین)"
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap hidden sm:inline-block ${
                activeTone === 'calm'
                  ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🍃 آرام
            </button>
          </div>

          {/* Speed Presets */}
          <div className="hidden lg:flex items-center gap-1 bg-stone-100 px-1 py-0.5 rounded-lg border border-stone-200 text-[11px]">
            <span className="text-stone-500 text-[10px] px-1 font-medium">سرعت:</span>
            {[
              { val: 0.85, label: '۰.۸x' },
              { val: 1.0, label: '۱.۰x' },
              { val: 1.2, label: '۱.۲x' },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => handleRateChange(preset.val)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                  Math.abs(ttsPreferences.rateMultiplier - preset.val) < 0.05
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Auto-Speak Toggle */}
          <button
            id="toggle-auto-tts-playback"
            type="button"
            onClick={handleAutoSpeakToggle}
            title={ttsPreferences.autoSpeak ? 'پخش خودکار فعال است؛ برای خاموش کردن کلیک کنید' : 'فعال‌سازی پخش خودکار صدای بیمار پس از دریافت هر پاسخ'}
            className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
              ttsPreferences.autoSpeak
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
            }`}
          >
            {ttsPreferences.autoSpeak ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">پخش خودکار: روشن</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">پخش خودکار: خاموش</span>
              </>
            )}
          </button>

          {/* Advanced Settings Modal Trigger */}
          <button
            id="btn-voice-bar-open-advanced-modal"
            type="button"
            onClick={onOpenSettings}
            title="تنظیمات پیشرفته صدا، بسامد، صدای گوینده و تست زنده لحن‌ها"
            className="h-8 w-8 rounded-lg border border-stone-200 bg-stone-50 hover:bg-indigo-50 hover:border-indigo-200 text-stone-600 hover:text-indigo-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
