import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Wind,
  Clock,
  CloudRain,
  Waves,
  Play,
  Pause,
  X,
  Sparkles,
  Radio,
  Check,
  Headphones
} from 'lucide-react';
import {
  ambientAudioEngine,
  AMBIENT_PRESETS,
  AmbientPresetId,
  AmbientSoundState
} from '../utils/ambientAudio';

interface AmbientSoundControllerProps {
  buttonVariant?: 'header' | 'toolbar' | 'compact';
  className?: string;
}

export const AmbientSoundController: React.FC<AmbientSoundControllerProps> = ({
  buttonVariant = 'toolbar',
  className = ''
}) => {
  const [ambientState, setAmbientState] = useState<AmbientSoundState>(ambientAudioEngine.getState());
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = ambientAudioEngine.subscribe(newState => {
      setAmbientState(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activePreset = AMBIENT_PRESETS.find(p => p.id === ambientState.currentPreset) || AMBIENT_PRESETS[0];

  const getPresetIcon = (id: AmbientPresetId, className = 'w-4 h-4') => {
    switch (id) {
      case 'office_hvac':
        return <Wind className={className} />;
      case 'wall_clock':
        return <Clock className={className} />;
      case 'gentle_rain':
        return <CloudRain className={className} />;
      case 'brown_noise':
        return <Waves className={className} />;
      case 'evening_calm':
        return <Sparkles className={className} />;
      default:
        return <Radio className={className} />;
    }
  };

  const isActuallyPlaying = ambientState.isPlaying && !ambientState.isMuted;

  return (
    <div className={`relative inline-block ${className}`} ref={panelRef}>
      
      {/* Trigger Button Variants */}
      {buttonVariant === 'header' ? (
        <button
          id="btn-ambient-sound-header"
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer select-none ${
            isActuallyPlaying
              ? 'bg-amber-50/90 hover:bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
              : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-800'
          }`}
          title="تنظیم صداهای محیطی و اتمسفر صوتی مطب (نویز اتاق درمان)"
        >
          {isActuallyPlaying ? (
            <div className="flex items-center gap-0.5">
              <span className="w-0.5 h-3 bg-amber-600 rounded-full animate-pulse" />
              <span className="w-0.5 h-4 bg-amber-600 rounded-full animate-pulse delay-75" />
              <span className="w-0.5 h-2 bg-amber-600 rounded-full animate-pulse delay-150" />
            </div>
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-stone-400" />
          )}
          
          <span className="hidden md:inline font-semibold">
            {isActuallyPlaying ? activePreset.name.split('(')[0] : 'صدای محیط مطب'}
          </span>
          <span className="md:hidden">محیط</span>

          {isActuallyPlaying && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
          )}
        </button>
      ) : (
        /* Toolbar Variant */
        <button
          id="btn-ambient-sound-toolbar"
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`p-1.5 sm:p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            isActuallyPlaying
              ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-2xs'
              : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
          }`}
          title="افکت‌های صوتی محیطی مطب (نویز ملایم تهویه، ساعت، باران)"
        >
          {isActuallyPlaying ? (
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="w-0.5 h-2.5 bg-amber-600 rounded-full animate-pulse" />
              <span className="w-0.5 h-3.5 bg-amber-600 rounded-full animate-pulse delay-75" />
              <span className="w-0.5 h-2 bg-amber-600 rounded-full animate-pulse delay-150" />
            </div>
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          )}
          <span className="hidden sm:inline">اتمسفر مطب</span>
          {isActuallyPlaying && (
            <span className="text-[10px] px-1 py-0.2 bg-amber-200/70 text-amber-900 rounded font-mono">
              {Math.round(ambientState.volume * 100)}%
            </span>
          )}
        </button>
      )}

      {/* Popover Settings & Soundscape Selector Modal Panel */}
      {isOpen && (
        <div
          id="panel-ambient-soundscapes"
          className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-stone-200/90 shadow-xl z-50 p-4 font-sans text-stone-800 text-right animate-in fade-in zoom-in-95 duration-150"
          style={{ direction: 'rtl' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-800">
                  صداهای محیطی مطب (Ambient)
                </h3>
                <p className="text-[11px] text-stone-500">
                  حس حضور در اتاق واقعی درمان و رفع سکوت دیجیتال
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              title="بستن پنجره"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Master Play / Pause & Volume Control */}
          <div className="mt-3.5 p-3 rounded-xl bg-stone-50 border border-stone-200/70 space-y-3">
            
            {/* Top Toggle Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  id="btn-ambient-toggle-play"
                  type="button"
                  onClick={() => ambientAudioEngine.togglePlay()}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    ambientState.isPlaying
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-teal-700 hover:bg-teal-800 text-white'
                  }`}
                >
                  {ambientState.isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>توقف صدا</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>پخش صدای محیط</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => ambientAudioEngine.toggleMute()}
                  disabled={!ambientState.isPlaying}
                  className={`p-1.5 rounded-lg border text-xs transition-colors ${
                    ambientState.isMuted
                      ? 'bg-rose-100 border-rose-300 text-rose-700'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                  } ${!ambientState.isPlaying ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={ambientState.isMuted ? 'فعال‌سازی صدا' : 'بی‌صدا کردن'}
                >
                  {ambientState.isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <Volume1 className="w-3.5 h-3.5 text-stone-600" />
                  )}
                </button>
              </div>

              {/* Status Badge */}
              <div className="text-[11px] font-medium text-stone-500">
                {ambientState.isPlaying ? (
                  ambientState.isMuted ? (
                    <span className="text-rose-600">بی‌صدا شده</span>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      در حال پخش
                    </span>
                  )
                ) : (
                  <span>غیرفعال</span>
                )}
              </div>
            </div>

            {/* Volume Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-stone-600">
                <span className="flex items-center gap-1 font-medium">
                  <Volume2 className="w-3 h-3 text-stone-400" />
                  بلندی صدای زمینه:
                </span>
                <span className="font-mono font-bold text-stone-700">
                  {Math.round(ambientState.volume * 100)}%
                </span>
              </div>
              <input
                id="input-ambient-volume"
                type="range"
                min="0.05"
                max="0.85"
                step="0.05"
                value={ambientState.volume}
                onChange={e => ambientAudioEngine.setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[10px] text-stone-400 px-0.5">
                <span>بسیار محو و نامحسوس</span>
                <span>متوسط</span>
                <span>واضح</span>
              </div>
            </div>
          </div>

          {/* Soundscapes Preset List */}
          <div className="mt-3.5 space-y-2">
            <div className="text-[11px] font-bold text-stone-700 px-0.5 flex items-center justify-between">
              <span>انتخاب اتمسفر صوتی مطب:</span>
              <span className="text-[10px] text-stone-400 font-normal">سنتز بدون تأخیر Web Audio</span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
              {AMBIENT_PRESETS.map(preset => {
                const isSelected = ambientState.currentPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      if (!ambientState.isPlaying) {
                        ambientAudioEngine.play(preset.id);
                      } else {
                        ambientAudioEngine.setPreset(preset.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/60 shadow-2xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? 'bg-amber-200 text-amber-900' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {getPresetIcon(preset.id, 'w-4 h-4')}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-bold text-xs text-stone-800 truncate">
                          {preset.name}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md shrink-0">
                            <Check className="w-3 h-3 text-amber-700" />
                            <span>انتخاب‌شده</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Tip */}
          <div className="mt-3 p-2 rounded-xl bg-teal-50/70 border border-teal-100 text-[11px] text-teal-800 leading-relaxed flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">نکته بالینی:</span>{' '}
              سکوت مطلق دیجیتال در شبیه‌سازها مانع از احساس واقعی جلسه می‌شود. صدای ملایم تهویه یا تیک‌تاک ساعت کلاسیک، اتمسفر واقعی اتاق درمان را برای مراجع و درمانگر بازآفرینی می‌کند.
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
