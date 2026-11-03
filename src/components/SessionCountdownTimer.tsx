import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  PlusCircle, 
  CheckCircle2, 
  Sparkles,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';

interface SessionCountdownTimerProps {
  totalMinutes?: number; // default 50
  onTimeExpired?: () => void;
  onWrapUpWarning?: () => void;
}

export const SessionCountdownTimer: React.FC<SessionCountdownTimerProps> = ({
  totalMinutes = 50,
  onTimeExpired,
  onWrapUpWarning,
}) => {
  const initialSeconds = totalMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [hasWarnedWrapUp, setHasWarnedWrapUp] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [warningDismissed, setWarningDismissed] = useState<boolean>(false);

  // Play subtle audio beep using Web Audio API (no external asset required)
  const playChime = (frequency = 587.33, duration = 0.4) => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not permitted or supported in sandbox
    }
  };

  // Interval timer tick
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          playChime(440, 0.8);
          onTimeExpired?.();
          return 0;
        }

        // Trigger 5-minute wrap-up alert at exactly 300 seconds (5 mins remaining)
        if (prev === 300 && !hasWarnedWrapUp) {
          setHasWarnedWrapUp(true);
          setShowWarningModal(true);
          setWarningDismissed(false);
          playChime(659.25, 0.5);
          onWrapUpWarning?.();
        }

        // Trigger 2-minute secondary reminder
        if (prev === 120) {
          playChime(783.99, 0.4);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, hasWarnedWrapUp, onTimeExpired, onWrapUpWarning, isMuted]);

  // Format MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const percentLeft = Math.max(0, Math.min(100, (secondsRemaining / initialSeconds) * 100));

  // Determine clinical status phase
  const isExpired = secondsRemaining === 0;
  const isFinalFive = secondsRemaining > 0 && secondsRemaining <= 300; // <= 5 minutes
  const isWarningTen = secondsRemaining > 300 && secondsRemaining <= 600; // 5-10 minutes

  // Manual fast-forward to 5 min for quick simulation testing
  const handleTestFiveMinutes = () => {
    setSecondsRemaining(300);
    setIsRunning(true);
    setHasWarnedWrapUp(true);
    setShowWarningModal(true);
    setWarningDismissed(false);
    playChime(659.25, 0.5);
  };

  const handleAddFiveMinutes = () => {
    setSecondsRemaining((prev) => prev + 300);
    setWarningDismissed(true);
    setShowWarningModal(false);
  };

  const handleReset = () => {
    setSecondsRemaining(initialSeconds);
    setIsRunning(true);
    setHasWarnedWrapUp(false);
    setShowWarningModal(false);
    setWarningDismissed(false);
  };

  return (
    <div id="session-countdown-timer-container" className="relative flex items-center">
      
      {/* Main Timer Pill */}
      <div 
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-300 shadow-2xs select-none ${
          isExpired
            ? 'bg-rose-100/90 border-rose-300 text-rose-900 animate-pulse'
            : isFinalFive
            ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/40 animate-pulse'
            : isWarningTen
            ? 'bg-amber-50/60 border-amber-200 text-amber-800'
            : 'bg-stone-50 border-stone-200/90 text-stone-800'
        }`}
        title="زمان‌سنج معکوس ۵۰ دقیقه‌ای استاندارد جلسه روانشناسی"
      >
        {/* Clock Icon / Pulse indicator */}
        <div className="flex items-center gap-1.5">
          <Clock className={`w-4 h-4 shrink-0 ${
            isExpired 
              ? 'text-rose-600 animate-bounce' 
              : isFinalFive 
              ? 'text-amber-600 animate-spin' 
              : isWarningTen 
              ? 'text-amber-500' 
              : 'text-indigo-600'
          }`} />

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-stone-500">
                {isExpired 
                  ? 'اتمام جلسه' 
                  : isFinalFive 
                  ? 'جمع‌بندی' 
                  : isWarningTen 
                  ? 'فاز پایانی' 
                  : 'زمان جلسه:'}
              </span>
              
              {/* Digital Timer Display */}
              <span className={`font-mono font-extrabold text-sm tracking-tight ${
                isExpired 
                  ? 'text-rose-700' 
                  : isFinalFive 
                  ? 'text-amber-700' 
                  : 'text-stone-900'
              }`}>
                {formatTime(secondsRemaining)}
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-24 h-1 bg-stone-200 rounded-full overflow-hidden mt-0.5">
              <div 
                className={`h-full transition-all duration-1000 ${
                  isExpired 
                    ? 'bg-rose-600' 
                    : isFinalFive 
                    ? 'bg-amber-500' 
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${percentLeft}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-stone-200/80 mr-1">
          {/* Play / Pause */}
          <button
            id="btn-timer-toggle-play"
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 hover:bg-stone-200/70 text-stone-600 rounded-md transition-colors"
            title={isRunning ? 'توقف موقت زمان‌سنج' : 'ادامه زمان‌سنج'}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-600" />}
          </button>

          {/* Reset */}
          <button
            id="btn-timer-reset"
            onClick={handleReset}
            className="p-1 hover:bg-stone-200/70 text-stone-500 hover:text-stone-800 rounded-md transition-colors"
            title="شروع مجدد ۵۰ دقیقه"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Add 5 Minutes */}
          <button
            id="btn-timer-add-five"
            onClick={handleAddFiveMinutes}
            className="p-1 hover:bg-stone-200/70 text-indigo-600 hover:text-indigo-800 rounded-md transition-colors font-mono text-[10px] font-bold"
            title="افزایش ۵ دقیقه به زمان جلسه"
          >
            +5m
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-timer-toggle-sound"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 hover:bg-stone-200/70 text-stone-400 hover:text-stone-700 rounded-md transition-colors"
            title={isMuted ? 'فعال‌سازی صدای ملایم زنگ' : 'بی‌صدا کردن'}
          >
            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-stone-500" />}
          </button>

          {/* Testing shortcut: jump to 5m wrapup */}
          {secondsRemaining > 300 && (
            <button
              id="btn-timer-simulate-five-min"
              onClick={handleTestFiveMinutes}
              className="px-1 py-0.5 text-[9px] bg-stone-200/60 hover:bg-amber-100 text-stone-600 hover:text-amber-800 rounded font-sans transition-colors hidden xl:inline-block"
              title="شبیه‌سازی ۵ دقیقه پایانی برای تست هشدار جمع‌بندی"
            >
              تست هشدار
            </button>
          )}
        </div>

      </div>

      {/* Floating Alert Banner when in Final 5 Minutes (Can be dismissed) */}
      {isFinalFive && !warningDismissed && (
        <div 
          id="wrap-up-warning-banner"
          className="absolute top-12 left-0 z-30 w-72 sm:w-80 bg-amber-50 border border-amber-300 text-amber-950 rounded-xl p-3 shadow-lg flex flex-col gap-2 dir-rtl animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>هشدار ۵ دقیقه پایانی جلسه درمانی:</span>
            </div>
            <button
              onClick={() => setWarningDismissed(true)}
              className="text-amber-600 hover:text-amber-800 p-0.5 rounded-md hover:bg-amber-100"
              title="بستن پیام"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-amber-800 text-justify">
            زمان استاندارد ۵۰ دقیقه‌ای رو به اتمام است ({formatTime(secondsRemaining)} باقی‌مانده). از باز کردن مباحث چالش‌برانگیز جدید خودداری نموده و وارد فاز <strong>جمع‌بندی، ارزیابی تکالیف خانگی و بررسی حال پایانی مراجع</strong> شوید.
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-amber-200/80 text-[10px]">
            <button
              onClick={handleAddFiveMinutes}
              className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 hover:underline"
            >
              <PlusCircle className="w-3 h-3" />
              <span>تمدید ۵ دقیقه اضافه</span>
            </button>

            <button
              onClick={() => setWarningDismissed(true)}
              className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-md transition-colors"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* When Time is Expired Notification */}
      {isExpired && !warningDismissed && (
        <div 
          id="session-expired-banner"
          className="absolute top-12 left-0 z-30 w-72 sm:w-80 bg-rose-50 border border-rose-300 text-rose-950 rounded-xl p-3 shadow-lg flex flex-col gap-2 dir-rtl animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>پایان ۵۰ دقیقه ساعت بالینی استاندارد:</span>
            </div>
            <button
              onClick={() => setWarningDismissed(true)}
              className="text-rose-600 hover:text-rose-800 p-0.5 rounded-md hover:bg-rose-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-rose-800 text-justify">
            ساعت بالینی این جلسه تکمیل شد. اکنون می‌توانید بر روی دکمه <strong>«پایان جلسه و ارزیابی»</strong> کلیک کنید تا کارنامه تفصیلی و تحلیل مهارت‌های بالینی توسط سوپروایزر صادر شود.
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-rose-200 text-[10px]">
            <button
              onClick={handleAddFiveMinutes}
              className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 hover:underline"
            >
              <PlusCircle className="w-3 h-3" />
              <span>تمدید ۵ دقیقه</span>
            </button>

            <button
              onClick={() => setWarningDismissed(true)}
              className="px-2 py-0.5 bg-rose-200 hover:bg-rose-300 text-rose-900 font-bold rounded-md transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
