import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Settings2, 
  Sparkles, 
  Play, 
  Square, 
  X, 
  Activity, 
  Gauge, 
  Sliders, 
  Mic, 
  Check, 
  Info,
  Ear,
  Feather,
  HelpCircle,
  HeartHandshake,
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import type { ClinicalCase, ClientState } from '../types';
import { 
  TTSPreferences, 
  PatientVoiceTone,
  VOICE_TONE_CONFIGS,
  getVoiceToneConfig,
  getSortedVoices, 
  getVoiceEmotionalDescriptor, 
  calculateAcousticParameters, 
  speakPatientUtterance, 
  stopPatientSpeech,
  isTTSSupported
} from '../utils/patientTTS';

interface PatientVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: TTSPreferences;
  onUpdatePreferences: (newPrefs: TTSPreferences) => void;
  currentCase: ClinicalCase;
  clientState: ClientState;
}

export const PatientVoiceSettingsModal: React.FC<PatientVoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  currentCase,
  clientState,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [auditioningTone, setAuditioningTone] = useState<PatientVoiceTone | null>(null);

  useEffect(() => {
    if (!isTTSSupported()) return;

    const updateVoices = () => {
      const v = getSortedVoices();
      setVoices(v);
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const currentToneKey = preferences.tone || 'clinical_adaptive';
  const activeToneConfig = getVoiceToneConfig(currentToneKey);
  const emotionalTone = getVoiceEmotionalDescriptor(clientState, currentCase);
  const acoustic = calculateAcousticParameters(clientState, currentCase, preferences);

  const handleAuditionTone = (toneKey: PatientVoiceTone) => {
    if (isTesting && auditioningTone === toneKey) {
      stopPatientSpeech();
      setIsTesting(false);
      setAuditioningTone(null);
      return;
    }

    stopPatientSpeech();
    setIsTesting(true);
    setAuditioningTone(toneKey);

    const config = VOICE_TONE_CONFIGS[toneKey];
    const phrase = config.samplePhrase;

    speakPatientUtterance({
      text: phrase,
      clientState,
      caseProfile: currentCase,
      userPrefs: { ...preferences, tone: toneKey },
      toneOverride: toneKey,
      onStart: () => {
        setIsTesting(true);
        setAuditioningTone(toneKey);
      },
      onEnd: () => {
        setIsTesting(false);
        setAuditioningTone(null);
      },
      onError: () => {
        setIsTesting(false);
        setAuditioningTone(null);
      },
    });
  };

  const handleSelectTone = (toneKey: PatientVoiceTone) => {
    onUpdatePreferences({ ...preferences, tone: toneKey });
  };

  const handleTestCurrentSpeech = () => {
    if (isTesting) {
      stopPatientSpeech();
      setIsTesting(false);
      setAuditioningTone(null);
      return;
    }

    const testPhrase = activeToneConfig.samplePhrase;

    setIsTesting(true);
    setAuditioningTone(currentToneKey);
    speakPatientUtterance({
      text: testPhrase,
      clientState,
      caseProfile: currentCase,
      userPrefs: preferences,
      onStart: () => setIsTesting(true),
      onEnd: () => {
        setIsTesting(false);
        setAuditioningTone(null);
      },
      onError: () => {
        setIsTesting(false);
        setAuditioningTone(null);
      },
    });
  };

  const hasPersianVoice = voices.some(v => 
    v.lang.toLowerCase().startsWith('fa') || 
    v.name.toLowerCase().includes('persian') || 
    v.name.toLowerCase().includes('farsi')
  );

  const toneCards: {
    id: PatientVoiceTone;
    icon: React.ComponentType<{ className?: string }>;
    tag: string;
    borderActive: string;
    bgActive: string;
    iconColor: string;
  }[] = [
    {
      id: 'clinical_adaptive',
      icon: Activity,
      tag: 'هوشمند انطباقی',
      borderActive: 'border-teal-500 ring-2 ring-teal-200 bg-teal-50/40',
      bgActive: 'bg-teal-500 text-white',
      iconColor: 'text-teal-600',
    },
    {
      id: 'anxious',
      icon: AlertTriangle,
      tag: 'مضطرب و پرشتاب',
      borderActive: 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/40',
      bgActive: 'bg-rose-500 text-white',
      iconColor: 'text-rose-600',
    },
    {
      id: 'hesitant',
      icon: Clock,
      tag: 'مردد و همراه با مکث',
      borderActive: 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/40',
      bgActive: 'bg-amber-500 text-white',
      iconColor: 'text-amber-600',
    },
    {
      id: 'calm',
      icon: Feather,
      tag: 'آرام و تسکین‌بخش',
      borderActive: 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/40',
      bgActive: 'bg-emerald-500 text-white',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'inquisitive',
      icon: HelpCircle,
      tag: 'پرسشگرانه و کاوشگر',
      borderActive: 'border-sky-500 ring-2 ring-sky-200 bg-sky-50/40',
      bgActive: 'bg-sky-500 text-white',
      iconColor: 'text-sky-600',
    },
    {
      id: 'empathic',
      icon: HeartHandshake,
      tag: 'همدلانه و گرم',
      borderActive: 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/40',
      bgActive: 'bg-indigo-500 text-white',
      iconColor: 'text-indigo-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-stone-900 via-indigo-950 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Ear className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                تنظیمات خوانش صوتی و انتخاب لحن گفتار مراجع (TTS)
              </h3>
              <p className="text-[11px] text-stone-300">
                شبیه‌سازی تُن، ضرب‌آهنگ، لحن و عواطف کلامی مراجع ({currentCase.patientName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Section: Select Voice Tone (آرام، پرسشگرانه، همدلانه) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>انتخاب لحن کلامی جملات مراجع مجازی (Voice Tone):</span>
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${activeToneConfig.badgeBg} ${activeToneConfig.badgeBorder} ${activeToneConfig.badgeText}`}>
                لحن فعال: {activeToneConfig.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {toneCards.map((tc) => {
                const cfg = VOICE_TONE_CONFIGS[tc.id];
                const isSelected = currentToneKey === tc.id;
                const isAuditioning = auditioningTone === tc.id && isTesting;
                const IconComp = tc.icon;

                return (
                  <div
                    key={tc.id}
                    onClick={() => handleSelectTone(tc.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? tc.borderActive
                        : 'border-stone-200 bg-stone-50/70 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg ${isSelected ? tc.bgActive : 'bg-stone-200/80 text-stone-700'}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-bold text-stone-900">
                            {cfg.name}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 mt-1.5 leading-relaxed">
                        {cfg.description}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono mt-1">
                        {cfg.acousticSummary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAuditionTone(tc.id);
                        }}
                        title={`شنیدن نمونه لحن ${cfg.name}`}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isAuditioning
                            ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                            : isSelected
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                            : 'bg-stone-200/90 hover:bg-stone-300 text-stone-700'
                        }`}
                      >
                        {isAuditioning ? (
                          <>
                            <Square className="w-3 h-3 fill-white" />
                            <span>توقف صوت</span>
                            <span className="flex items-center gap-0.5 mr-0.5">
                              <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>تست این لحن</span>
                          </>
                        )}
                      </button>

                      <span className="text-[10px] text-stone-400 font-medium truncate max-w-[120px]">
                        {tc.tag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Current Acoustic Telemetry Card */}
          <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>شاخص‌های آکوستیک محاسبه‌شده برای جلسه:</span>
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${emotionalTone.badgeColor}`}>
                {emotionalTone.title}
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              {currentToneKey === 'clinical_adaptive'
                ? emotionalTone.description
                : `لحن انتخابی «${activeToneConfig.name}» با اعمال ضرایب آکوستیک زیر روی تارهای صوتی مراجع اعمال می‌شود.`}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-stone-200/70 text-[11px] text-stone-500">
              <div>
                <span>بسامد صوتی (Pitch خروجی): </span>
                <strong className="text-stone-800 font-mono font-bold">{acoustic.pitch}x</strong>
              </div>
              <div>
                <span>سرعت کلام (Rate خروجی): </span>
                <strong className="text-stone-800 font-mono font-bold">{acoustic.rate}x</strong>
              </div>
            </div>
          </div>

          {/* Auto-Speak Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${preferences.autoSpeak ? 'bg-indigo-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
                {preferences.autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <label className="text-xs font-bold text-stone-900 block cursor-pointer" htmlFor="toggle-auto-speak">
                  پخش خودکار صدای مراجع
                </label>
                <span className="text-[11px] text-stone-500">
                  به محض دریافت هر پاسخ جدید از مراجع، پیام به صورت صوتی با لحن انتخاب‌شده خوانده شود
                </span>
              </div>
            </div>
            <input
              id="toggle-auto-speak"
              type="checkbox"
              checked={preferences.autoSpeak}
              onChange={(e) => onUpdatePreferences({ ...preferences, autoSpeak: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Include Non-Verbal Cue Prefix */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
            <div className="text-stone-700">
              <span className="font-semibold block">خوانش حالات غیرکلامی مراجع</span>
              <span className="text-[11px] text-stone-500">مثال: خواندن عبارات داخل کروشه مثل «با لکنت و نگاه به پایین» پیش از جمله اصلی</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.readNonVerbalPrefix}
              onChange={(e) => onUpdatePreferences({ ...preferences, readNonVerbalPrefix: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Rate Multiplier Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                <span>ضریب سرعت بیان (Rate Multiplier):</span>
              </span>
              <span className="font-mono text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                {preferences.rateMultiplier}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              value={preferences.rateMultiplier}
              onChange={(e) => onUpdatePreferences({ ...preferences, rateMultiplier: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-medium">
              <span>کندتر (شمرده)</span>
              <span>طبیعی (۱.۰x)</span>
              <span>سریع‌تر (شتابان)</span>
            </div>
          </div>

          {/* Pitch Multiplier Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-600" />
                <span>ضریب زیر و بمی صدا (Pitch Multiplier):</span>
              </span>
              <span className="font-mono text-xs text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded">
                {preferences.pitchMultiplier}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              value={preferences.pitchMultiplier}
              onChange={(e) => onUpdatePreferences({ ...preferences, pitchMultiplier: parseFloat(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-medium">
              <span>بم‌تر (عمیق)</span>
              <span>طبیعی (۱.۰x)</span>
              <span>زیرتر (فشرده)</span>
            </div>
          </div>

          {/* Voice Engine Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">
              موتور صوتی مراجع (صدای سیستم):
            </label>
            <select
              value={preferences.selectedVoiceURI || ''}
              onChange={(e) => onUpdatePreferences({ ...preferences, selectedVoiceURI: e.target.value || null })}
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-stone-800"
            >
              <option value="">انتخاب خودکار بر اساس جنسیت و زبان فارسی (پیش‌فرض)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}) {v.default ? '★ پیش‌فرض سیستم' : ''}
                </option>
              ))}
            </select>

            {!hasPersianVoice && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-800 mt-1">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  نکته آموزشی: مرورگر از صداهای نصب‌شده روی ویندوز، مک یا اندروید شما استفاده می‌کند. اگر بسته صوتی فارسی روی سیستم شما نصب باشد، تلفظ کاملاً بومی خواهد بود؛ در غیر این صورت از صدای چندزبانه پیش‌فرض استفاده می‌شود.
                </span>
              </div>
            )}
          </div>

          {/* Test Live Voice Button */}
          <div className="pt-2">
            <button
              onClick={handleTestCurrentSpeech}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isTesting && !auditioningTone
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs animate-pulse'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
              }`}
            >
              {isTesting && !auditioningTone ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>توقف پخش آزمایشی صدای مراجع</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>تست آزمایشی صدا با لحن انتخابی ({activeToneConfig.name})</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            تأیید و بازگشت به جلسه
          </button>
        </div>

      </div>
    </div>
  );
};
