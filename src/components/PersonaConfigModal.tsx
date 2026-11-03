import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  MessageSquare, 
  Sliders, 
  Check, 
  RotateCcw, 
  Play, 
  Info, 
  ShieldCheck, 
  Brain, 
  Eye,
  SlidersHorizontal,
  Flame,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { ClinicalCase, PatientPersonaConfig, PersonaPresetId, PersonaToneStyle } from '../types';
import { 
  DEFAULT_PERSONA_PRESETS, 
  TONE_STYLES_LIST, 
  getCandorDescriptor, 
  getDefensivenessDescriptor, 
  createInitialGreeting,
  getDefaultPersonaForCase
} from '../utils/personaPresets';

interface PersonaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCase: ClinicalCase;
  initialPersona?: PatientPersonaConfig;
  onConfirmStartSession: (selectedCase: ClinicalCase, persona: PatientPersonaConfig) => void;
}

export const PersonaConfigModal: React.FC<PersonaConfigModalProps> = ({
  isOpen,
  onClose,
  targetCase,
  initialPersona,
  onConfirmStartSession
}) => {
  const [persona, setPersona] = useState<PatientPersonaConfig>(() => {
    return initialPersona || getDefaultPersonaForCase(targetCase);
  });

  // Keep synced if target case changes
  useEffect(() => {
    if (initialPersona) {
      setPersona(initialPersona);
    } else {
      setPersona(getDefaultPersonaForCase(targetCase));
    }
  }, [targetCase, initialPersona]);

  if (!isOpen) return null;

  const candorInfo = getCandorDescriptor(persona.candorLevel);
  const defensivenessInfo = getDefensivenessDescriptor(persona.defensivenessLevel);
  const previewGreeting = createInitialGreeting(targetCase, persona);

  const handleSelectPreset = (preset: PatientPersonaConfig) => {
    setPersona({
      ...preset,
      // If the case is female or male, we keep behavioral guidance aligned
    });
  };

  const handleCandorChange = (val: number) => {
    setPersona(prev => ({
      ...prev,
      candorLevel: val,
      presetId: 'custom',
      name: 'شخصیت سفارشی‌سازی‌شده (Custom Persona)',
      shortLabel: 'سفارشی'
    }));
  };

  const handleDefensivenessChange = (val: number) => {
    setPersona(prev => ({
      ...prev,
      defensivenessLevel: val,
      presetId: 'custom',
      name: 'شخصیت سفارشی‌سازی‌شده (Custom Persona)',
      shortLabel: 'سفارشی'
    }));
  };

  const handleToneChange = (toneId: PersonaToneStyle) => {
    const toneObj = TONE_STYLES_LIST.find(t => t.id === toneId);
    setPersona(prev => ({
      ...prev,
      toneStyle: toneId,
      toneStyleLabel: toneObj?.label || 'طبیعی',
      presetId: 'custom',
      name: 'شخصیت سفارشی‌سازی‌شده (Custom Persona)',
      shortLabel: 'سفارشی'
    }));
  };

  const handleResetToDefault = () => {
    setPersona(getDefaultPersonaForCase(targetCase));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        id="persona-config-modal-container"
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-stone-200 shadow-2xl flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 bg-gradient-to-r from-stone-900 via-indigo-950 to-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${targetCase.avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0 border border-white/20`}>
                {targetCase.patientName.slice(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-medium">
                    تنظیمات پیش از شروع جلسه
                  </span>
                  <span className="text-xs text-stone-300 font-mono">
                    {targetCase.patientName} • {targetCase.age} ساله
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mt-1 text-white flex items-center gap-2">
                  <span>تنظیم لحن و شخصیت بیمار (Patient Persona)</span>
                </h3>
              </div>
            </div>

            <button
              id="btn-close-persona-modal"
              onClick={onClose}
              className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors text-lg font-bold"
              aria-label="بستن"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-stone-300 mt-3 leading-relaxed">
            شما می‌توانید صراحت کلامی، میزان تدافعی بودن و لحن گفتار مراجع را متناسب با اهداف آموزشی خود تنظیم کنید. این متغیرها مستقیماً بر واکنش‌های روانی و زبان بدن مراجع در طول شبیه‌سازی اثر می‌گذارند.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* Presets Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>الگوهای پیش‌فرض بالینی (Persona Presets):</span>
              </label>
              <button
                id="btn-reset-persona"
                onClick={handleResetToDefault}
                className="text-[11px] text-stone-500 hover:text-indigo-600 flex items-center gap-1 hover:underline transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>بازنشانی به پیش‌فرض پرونده</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {DEFAULT_PERSONA_PRESETS.map((preset) => {
                const isSelected = persona.presetId === preset.presetId;
                return (
                  <button
                    key={preset.presetId}
                    id={`btn-select-preset-${preset.presetId}`}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-right p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-stone-200 hover:border-indigo-200 hover:bg-stone-50 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-stone-800'}`}>
                          {preset.shortLabel}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-600 font-medium">
                      <span>صراحت: {preset.candorLevel}٪</span>
                      <span>دفاعی: {preset.defensivenessLevel}٪</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders Area */}
          <div className="bg-stone-50/80 p-4 sm:p-5 rounded-2xl border border-stone-200/80 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-2">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>تنظیم دقیق مؤلفه‌های روان‌شناختی (Fine-Tuning)</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-600 font-medium">
                {persona.presetId === 'custom' ? 'حالت سفارشی' : `الگوی ${persona.shortLabel}`}
              </span>
            </div>

            {/* Slider 1: Candor & Openness */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-800">میزان صراحت و خودافشاگری (Candor & Disclosure):</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${candorInfo.badgeClass}`}>
                    {candorInfo.label} ({persona.candorLevel}٪)
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 mb-2 leading-relaxed">
                {candorInfo.explanation}
              </p>

              <div className="relative flex items-center">
                <input
                  id="slider-candor-level"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={persona.candorLevel}
                  onChange={(e) => handleCandorChange(Number(e.target.value))}
                  aria-label="تنظیم میزان صراحت بیمار"
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-medium">
                <span>۰٪ (پنهان‌کاری، طفره‌روی و پاسخ‌های مبهم)</span>
                <span>۵۰٪ (متوسط)</span>
                <span>۱۰۰٪ (بی‌پرده، شفاف و بدون فیلتر)</span>
              </div>
            </div>

            {/* Slider 2: Defensiveness & Resistance */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-800">میزان تدافعی بودن و مقاومت (Defensiveness & Resistance):</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${defensivenessInfo.badgeClass}`}>
                    {defensivenessInfo.label} ({persona.defensivenessLevel}٪)
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 mb-2 leading-relaxed">
                {defensivenessInfo.explanation}
              </p>

              <div className="relative flex items-center">
                <input
                  id="slider-defensiveness-level"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={persona.defensivenessLevel}
                  onChange={(e) => handleDefensivenessChange(Number(e.target.value))}
                  aria-label="تنظیم میزان دفاعی بودن بیمار"
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-medium">
                <span>۰٪ (پذیرنده و همکار)</span>
                <span>۵۰٪ (مقاومت معمول)</span>
                <span>۱۰۰٪ (تدافعی شدید، توجیه‌تراشی و گارد سفت)</span>
              </div>
            </div>

            {/* Tone of Voice Selector */}
            <div>
              <label className="text-xs font-bold text-stone-800 block mb-2">
                سبک لحن کلامی و بین‌فردی (Tone Style):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TONE_STYLES_LIST.map((tone) => {
                  const isSelected = persona.toneStyle === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => handleToneChange(tone.id)}
                      className={`text-right p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold shadow-2xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isSelected ? 'bg-indigo-600 ring-2 ring-indigo-200' : 'bg-stone-300'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs">{tone.label}</div>
                        <div className="text-[10px] text-stone-500 font-normal leading-tight mt-0.5 line-clamp-1">
                          {tone.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Clinical Simulation Preview Box */}
          <div className="bg-gradient-to-br from-indigo-50/40 via-stone-50 to-purple-50/30 p-4 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-950">پیش‌نمایش بالینی ورود مراجع با این شخصیت:</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
              <div>
                <div className="text-[10px] font-semibold text-stone-400 mb-0.5">گفتار آغازین در اتاق درمان:</div>
                <p className="text-xs text-stone-800 italic leading-relaxed font-medium">
                  {previewGreeting.speech}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
                <div className="text-stone-500">
                  <span className="font-semibold text-stone-600">افکار پنهانی مراجع: </span>
                  <span className="italic">{previewGreeting.internalThought}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/90 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 rounded-b-2xl">
          <button
            id="btn-cancel-persona-config"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition-colors"
          >
            انصراف
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            <button
              id="btn-confirm-persona-and-start"
              type="button"
              onClick={() => onConfirmStartSession(targetCase, persona)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>تأیید و آغاز جلسه شبیه‌سازی</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
