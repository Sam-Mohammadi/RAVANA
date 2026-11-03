import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Square, 
  Play, 
  RotateCcw,
  Lightbulb, 
  Copy, 
  Check, 
  Sparkles,
  SlidersHorizontal,
  Activity,
  Languages
} from 'lucide-react';
import type { ClinicalCase, SimulationMessage, ClientState } from '../types';
import { 
  TTSPreferences, 
  PatientVoiceTone, 
  getVoiceToneConfig, 
  getVoiceEmotionalDescriptor,
  speakPatientUtterance,
  stopPatientSpeech,
  warmUpTTS,
  isTTSSupported,
  getPersianVoiceInfo
} from '../utils/patientTTS';
import { PatientAudioPlayer } from './PatientAudioPlayer';
import { PatientNonVerbalCues } from './PatientNonVerbalCues';

export interface PatientResponseProps {
  message: SimulationMessage;
  currentCase: ClinicalCase;
  clientState: ClientState;
  isSpeaking: boolean;
  speakingCharIndex?: number | null;
  onToggleSpeak: (msg: SimulationMessage, toneOverride?: PatientVoiceTone) => void;
  onStopSpeech: () => void;
  ttsPreferences: TTSPreferences;
  onUpdateTtsPreferences?: (prefs: TTSPreferences) => void;
  showInternalThoughts?: boolean;
  isLatest?: boolean;
}

export const PatientResponse: React.FC<PatientResponseProps> = ({
  message,
  currentCase,
  clientState,
  isSpeaking,
  speakingCharIndex,
  onToggleSpeak,
  onStopSpeech,
  ttsPreferences,
  onUpdateTtsPreferences,
  showInternalThoughts = true,
  isLatest = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const activeTone = ttsPreferences.tone || 'clinical_adaptive';
  const toneConfig = getVoiceToneConfig(activeTone);
  const emotionalDescriptor = getVoiceEmotionalDescriptor(
    message.stateSnapshot || clientState,
    currentCase,
    message.content
  );

  // Compute estimated duration in seconds based on Persian speech rate
  const words = message.content.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const currentSpeedMultiplier = ttsPreferences.rateMultiplier || 1.0;
  const estimatedSecs = Math.max(2, Math.round(wordCount / (2.2 * currentSpeedMultiplier)));

  // Elapsed playback progress tracking
  useEffect(() => {
    if (!isSpeaking) {
      setElapsedSecs(0);
      return;
    }
    setHasPlayedOnce(true);
    setElapsedSecs(0);
    const interval = setInterval(() => {
      setElapsedSecs((prev) => (prev < estimatedSecs ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSpeaking, estimatedSecs]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  };

  const handleCycleTone = (e: React.MouseEvent) => {
    e.stopPropagation();
    warmUpTTS();
    const cycleMap: Record<PatientVoiceTone, PatientVoiceTone> = {
      clinical_adaptive: 'anxious',
      anxious: 'hesitant',
      hesitant: 'calm',
      calm: 'inquisitive',
      inquisitive: 'empathic',
      empathic: 'clinical_adaptive',
    };
    const nextTone = cycleMap[activeTone];
    if (onUpdateTtsPreferences) {
      onUpdateTtsPreferences({ ...ttsPreferences, tone: nextTone });
    }
    // Replay or initiate speech with new tone
    onToggleSpeak(message, nextTone);
  };

  const handlePlayOrStop = () => {
    warmUpTTS();
    if (isSpeaking) {
      onStopSpeech();
    } else {
      onToggleSpeak(message);
    }
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    warmUpTTS();
    if (isSpeaking) {
      onStopSpeech();
      setTimeout(() => onToggleSpeak(message), 80);
    } else {
      onToggleSpeak(message);
    }
  };

  const progressPercent = isSpeaking 
    ? Math.min(100, Math.max(8, Math.round((elapsedSecs / estimatedSecs) * 100)))
    : 0;

  return (
    <div 
      id={`patient-response-${message.id}`}
      className="flex flex-col gap-1.5 w-full select-text"
      data-testid="patient-response-component"
    >
      {/* Header bar: Patient identifier, timestamp & Web Speech API trigger */}
      <div className="flex items-center justify-between text-xs px-1 text-stone-500">
        <div className="flex items-center gap-2">
          {/* Header Play/Stop Button with Web Speech API status */}
          <button
            id={`btn-speech-header-${message.id}`}
            type="button"
            onClick={handlePlayOrStop}
            title={isSpeaking ? 'توقف خوانش صوتی مراجع (Web Speech API)' : 'پخش صوتی جملات مراجع با Web Speech API'}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer font-medium ${
              isSpeaking
                ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-2xs'
                : 'bg-stone-100 hover:bg-indigo-50 border-stone-200 hover:border-indigo-200 text-stone-600 hover:text-indigo-700'
            }`}
          >
            {isSpeaking ? (
              <>
                <Square className="w-2.5 h-2.5 fill-rose-600 text-rose-600" />
                <span className="text-[10px]">توقف پخش</span>
                <span className="flex items-center gap-0.5 ml-0.5">
                  <span className="w-1 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3 text-indigo-600" />
                <span className="text-[10px]">پخش صوتی</span>
              </>
            )}
          </button>

          {/* Copy utterance button */}
          <button
            type="button"
            onClick={handleCopyText}
            title={copied ? 'کپی شد' : 'کپی متن پاسخ بیمار'}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>

          {isLatest && ttsPreferences.autoSpeak && !isSpeaking && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>پخش خودکار فعال</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-stone-400 font-mono">{message.timestamp}</span>
          <span className="text-xs font-bold text-stone-800">{currentCase.patientName} (مراجع)</span>
        </div>
      </div>

      {/* Main Dialogue Bubble with Audio Controls */}
      <div className="flex items-end gap-2 max-w-[96%] sm:max-w-[88%] self-end">
        {/* Left Side: Dedicated Small Audio Player Controller (پلیر صوتی کوچک Web Speech API) */}
        <div 
          id={`player-controller-${message.id}`}
          role="region"
          aria-label="کنترلر پلیر صوتی پیام مراجع"
          className={`flex flex-col items-center gap-1.5 shrink-0 mb-1 p-2 rounded-2xl border transition-all duration-300 select-none min-w-[72px] sm:min-w-[82px] shadow-xs ${
            isSpeaking
              ? 'bg-gradient-to-b from-rose-50/95 to-white border-rose-300 ring-2 ring-rose-200/80 scale-102'
              : 'bg-white/95 hover:bg-indigo-50/40 border-stone-200/90 hover:border-indigo-300'
          }`}
        >
          {/* Header Tag / Micro-Badge */}
          <div className="flex items-center justify-between w-full px-0.5 text-[9px] font-mono text-stone-400">
            <span className="font-semibold text-indigo-700">TTS</span>
            {isSpeaking ? (
              <span className="text-rose-600 font-bold animate-pulse">{elapsedSecs}s</span>
            ) : (
              <span>~{estimatedSecs}s</span>
            )}
          </div>

          {/* Main Circular Play / Stop Action Button */}
          <div className="relative flex items-center justify-center">
            <button
              id={`btn-speech-beside-${message.id}`}
              type="button"
              onClick={handlePlayOrStop}
              aria-label={isSpeaking ? 'توقف خوانش صوتی پیام' : 'پخش صوتی پیام با Web Speech API'}
              title={
                isSpeaking
                  ? 'توقف خوانش صوتی با Web Speech API'
                  : `پخش صوتی پیام با Web Speech API (لحن: ${toneConfig.name} - تخمین: ${estimatedSecs} ثانیه)`
              }
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-92 ${
                isSpeaking
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-200/80 animate-pulse'
                  : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white hover:shadow-indigo-500/30'
              }`}
            >
              {isSpeaking ? (
                <Square className="w-4 h-4 fill-white text-white" />
              ) : (
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              )}
            </button>

            {/* Quick Replay Mini Button when idle and played before */}
            {!isSpeaking && hasPlayedOnce && (
              <button
                type="button"
                onClick={handleReplay}
                title="بازپخش مجدد از ابتدا"
                className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-stone-100 hover:bg-indigo-100 text-stone-600 hover:text-indigo-700 border border-stone-300 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Dynamic Waveform Equalizer / Progress Bar */}
          <div className="w-full flex flex-col items-center gap-1">
            {isSpeaking ? (
              <>
                <div className="flex items-center justify-center gap-0.5 h-3 w-full">
                  <span className="w-1 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-3.5 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="w-1 h-2.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                  <span className="w-1 h-4 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '360ms' }} />
                  <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '480ms' }} />
                </div>
                {/* Mini Progress Track */}
                <div className="w-full bg-rose-100 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center gap-0.5 h-2.5 opacity-60">
                <span className="w-0.5 h-1.5 bg-stone-300 rounded-full" />
                <span className="w-0.5 h-2.5 bg-indigo-400 rounded-full" />
                <span className="w-0.5 h-1.5 bg-stone-300 rounded-full" />
                <span className="w-0.5 h-2 bg-indigo-400 rounded-full" />
              </div>
            )}
          </div>

          {/* Quick Tone Toggle Pill */}
          <button
            id={`btn-tone-toggle-${message.id}`}
            type="button"
            onClick={handleCycleTone}
            title={`لحن فعلی: ${toneConfig.name} - کلیک برای تعویض لحن (آرام، پرسشگر، همدلانه، انطباقی) و بازپخش`}
            className={`w-full text-[9px] py-0.5 px-1 rounded-md border font-semibold cursor-pointer transition-all hover:scale-102 active:scale-95 flex items-center justify-center gap-0.5 ${toneConfig.badgeBg} ${toneConfig.badgeBorder} ${toneConfig.badgeText}`}
          >
            <span>{toneConfig.name}</span>
            <span className="text-[8px] opacity-70">↻</span>
          </button>

          {/* Speed Presets Switcher (0.8x / 1.0x / 1.2x) */}
          <div className="flex items-center justify-center gap-0.5 w-full pt-0.5 border-t border-stone-100">
            {[0.85, 1.0, 1.2].map((rate) => {
              const isActive = Math.abs((ttsPreferences.rateMultiplier || 1) - rate) < 0.08;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    warmUpTTS();
                    if (onUpdateTtsPreferences) {
                      onUpdateTtsPreferences({ ...ttsPreferences, rateMultiplier: rate });
                    }
                    if (isSpeaking) {
                      onToggleSpeak(message);
                    }
                  }}
                  title={`سرعت گفتار: ${rate === 1.0 ? '۱x (عادی)' : rate < 1.0 ? '۰.۸x (آرام)' : '۱.۲x (تند)'}`}
                  className={`px-1 py-0.5 rounded text-[8px] font-mono leading-none transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {rate === 1.0 ? '1x' : rate < 1.0 ? '.8x' : '1.2x'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Bubble */}
        <div 
          className={`flex-1 rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all bg-white text-stone-800 border rounded-bl-xs shadow-xs ${
            isSpeaking
              ? 'border-indigo-400 ring-2 ring-indigo-200/80 bg-indigo-50/15'
              : 'border-stone-200/80'
          }`}
        >
          {/* Dedicated Non-Verbal Behavioral Cues Section (Facial Mimicry, Body Posture, Gaze & Animated Icons) */}
          <PatientNonVerbalCues
            rawCue={message.nonVerbalCue}
            clientState={message.stateSnapshot || clientState}
            caseInfo={currentCase}
            defaultExpanded={Boolean(message.nonVerbalCue || isLatest)}
            className="mb-3"
          />

          {/* Core Spoken Text with Real-Time Speech Karaoke Highlighting */}
          {isSpeaking && typeof speakingCharIndex === 'number' && speakingCharIndex >= 0 ? (
            <p className="whitespace-pre-wrap leading-relaxed text-stone-900 font-normal transition-all">
              <span className="bg-indigo-100/90 text-indigo-950 font-semibold px-1 py-0.5 rounded transition-colors duration-150 shadow-2xs">
                {message.content.slice(0, Math.min(message.content.length, speakingCharIndex))}
              </span>
              <span className="inline-block w-1.5 h-3.5 bg-indigo-600 rounded-full mx-0.5 animate-ping align-middle" />
              <span className="text-stone-700 opacity-90">
                {message.content.slice(Math.min(message.content.length, speakingCharIndex))}
              </span>
            </p>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed text-stone-900 font-normal">
              {message.content}
            </p>
          )}

          {/* Custom & Beautiful Audio Player Controller with automatic fa-IR Persian selection */}
          <PatientAudioPlayer
            messageId={message.id}
            text={message.content}
            isSpeaking={isSpeaking}
            clientState={message.stateSnapshot || clientState}
            caseInfo={currentCase}
            onPlay={() => onToggleSpeak(message)}
            onStop={onStopSpeech}
            onReplay={() => {
              if (isSpeaking) {
                onStopSpeech();
                setTimeout(() => onToggleSpeak(message), 80);
              } else {
                onToggleSpeak(message);
              }
            }}
            tone={activeTone}
            onCycleTone={() => {
              const cycleMap: Record<PatientVoiceTone, PatientVoiceTone> = {
                clinical_adaptive: 'anxious',
                anxious: 'hesitant',
                hesitant: 'calm',
                calm: 'inquisitive',
                inquisitive: 'empathic',
                empathic: 'clinical_adaptive',
              };
              const nextTone = cycleMap[activeTone];
              if (onUpdateTtsPreferences) {
                onUpdateTtsPreferences({ ...ttsPreferences, tone: nextTone });
              }
              onToggleSpeak(message, nextTone);
            }}
            rateMultiplier={ttsPreferences.rateMultiplier || 1.0}
            onRateChange={(newRate) => {
              if (onUpdateTtsPreferences) {
                onUpdateTtsPreferences({ ...ttsPreferences, rateMultiplier: newRate });
              }
              if (isSpeaking) {
                onToggleSpeak(message);
              }
            }}
            emotionalDescriptorTitle={emotionalDescriptor.title}
          />

          {/* Hidden Internal Psychological Thought (Educational Insight) */}
          {message.internalThought && showInternalThoughts && (
            <div className="mt-3 pt-2.5 border-t border-stone-100 text-xs text-indigo-900 bg-indigo-50/80 p-2.5 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 mb-0.5">
                <Lightbulb className="w-3 h-3 text-indigo-600" />
                <span>افکار و هیجان پنهان مراجع (زاویه دید آموزشی):</span>
              </div>
              <p className="italic font-medium">{message.internalThought}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
