import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  RotateCcw,
  Sparkles,
  Brain,
  Headphones,
  Eye,
  EyeOff,
  ArrowRight,
  Send,
  Heart,
  Activity,
  ShieldAlert,
  Clock,
  Sliders,
  AlertCircle,
  HelpCircle,
  Award,
  Maximize2,
  Minimize2,
  MessageSquare
} from 'lucide-react';
import type { ClinicalCase, SimulationMessage, ClientState, SupervisorFeedback, PatientPersonaConfig } from '../types';
import { SpeechToTextSession, isSpeechRecognitionSupported } from '../utils/speechToText';
import { 
  speakPatientUtterance, 
  stopPatientSpeech, 
  parsePatientUtteranceText, 
  getVoiceEmotionalDescriptor,
  loadTTSPreferences,
  type TTSPreferences
} from '../utils/patientTTS';
import { AudioWaveVisualizer, type VisualizerMode } from './AudioWaveVisualizer';
import { MicVolumeTracker } from '../utils/micVolumeTracker';
import { playTherapistTurnCue, playSpeechSentCue, playInterruptCue } from '../utils/audioChimes';
import { StarRatingVisual } from './SupervisorEmpathyValidationWidget';
import { AmbientSoundController } from './AmbientSoundController';
import { TypewriterText } from './TypewriterText';

interface LiveVoiceDialogueRoomProps {
  currentCase: ClinicalCase;
  messages: SimulationMessage[];
  clientState: ClientState;
  currentPersona?: PatientPersonaConfig;
  isLoadingPatient: boolean;
  latestSupervisorFeedback: SupervisorFeedback | null;
  embedded?: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onClose: () => void;
  onEndSession: () => void;
}

export const LiveVoiceDialogueRoom: React.FC<LiveVoiceDialogueRoomProps> = ({
  currentCase,
  messages,
  clientState,
  currentPersona,
  isLoadingPatient,
  latestSupervisorFeedback,
  embedded = false,
  onSendMessage,
  onClose,
  onEndSession,
}) => {
  // Conversational state
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [silenceThresholdSec, setSilenceThresholdSec] = useState<number>(1.6); // Auto-send delay after pause
  const [showInternalThoughts, setShowInternalThoughts] = useState(true);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  
  // Real-time speech transcript state
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [interimSpeechText, setInterimSpeechText] = useState('');
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Turn tracking: 'listening' | 'sending' | 'patient-thinking' | 'patient-speaking'
  const [dialoguePhase, setDialoguePhase] = useState<'listening' | 'sending' | 'patient-thinking' | 'patient-speaking'>('listening');
  const [silenceRemainingMs, setSilenceRemainingMs] = useState<number | null>(null);

  // Refs
  const speechSessionRef = useRef<SpeechToTextSession | null>(null);
  const micTrackerRef = useRef<MicVolumeTracker | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const silenceCountdownIntervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const isComponentMountedRef = useRef<boolean>(true);
  const ttsCancelFnRef = useRef<(() => void) | null>(null);

  // Latest patient message
  const lastPatientMessage = useMemo(() => {
    return [...messages].reverse().find(m => m.role === 'patient');
  }, [messages]);

  const lastTherapistMessage = useMemo(() => {
    return [...messages].reverse().find(m => m.role === 'therapist');
  }, [messages]);

  // Cleaned patient utterance
  const parsedPatientUtterance = useMemo(() => {
    if (!lastPatientMessage?.content) return { spokenText: '', nonVerbalCue: undefined };
    return parsePatientUtteranceText(lastPatientMessage.content);
  }, [lastPatientMessage?.content]);

  // Emotional descriptor based on clinical state
  const emotionalDescriptor = useMemo(() => {
    return getVoiceEmotionalDescriptor(clientState, currentCase);
  }, [clientState, currentCase]);

  // Clear silence timers safely
  const clearSilenceTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (silenceCountdownIntervalRef.current) {
      clearInterval(silenceCountdownIntervalRef.current);
      silenceCountdownIntervalRef.current = null;
    }
    setSilenceRemainingMs(null);
  };

  // Start or restart speech recognition
  const startListening = () => {
    if (isMuted || !isComponentMountedRef.current) return;
    setSpeechError(null);

    if (!isSpeechRecognitionSupported()) {
      setSpeechError('مرورگر شما از Web Speech API پشتیبانی نمی‌کند. لطفاً از آخرین نسخه Chrome یا Edge استفاده کنید.');
      return;
    }

    try {
      // Stop old session if any
      speechSessionRef.current?.stop();

      const session = new SpeechToTextSession({
        lang: 'fa-IR',
        continuous: true,
        interimResults: true,
        onStart: () => {
          if (!isComponentMountedRef.current) return;
          setDialoguePhase('listening');
        },
        onInterim: (interim) => {
          if (!isComponentMountedRef.current) return;
          setInterimSpeechText(interim);
          // If therapist is actively speaking, reset silence countdown
          clearSilenceTimers();
        },
        onResult: (finalText) => {
          if (!isComponentMountedRef.current) return;
          setCurrentSpeechText((prev) => {
            const combined = prev.trim() ? `${prev.trim()} ${finalText}` : finalText;
            // Trigger silence timer with accumulated text
            scheduleSilenceAutoSend(combined);
            return combined;
          });
          setInterimSpeechText('');
        },
        onError: (errMsg, errCode) => {
          if (!isComponentMountedRef.current) return;
          if (errCode === 'no-speech' || errCode === 'aborted') return;
          setSpeechError(errMsg);
        },
        onEnd: () => {
          if (!isComponentMountedRef.current) return;
          // If still in listening mode and not muted, we will restart unless waiting for patient
        }
      });

      speechSessionRef.current = session;
      session.start();

      // Start mic volume visualizer tracker
      if (!micTrackerRef.current) {
        micTrackerRef.current = new MicVolumeTracker((lvl) => {
          if (isComponentMountedRef.current) setMicAudioLevel(lvl);
        });
        micTrackerRef.current.start();
      }
    } catch (err: any) {
      console.warn('Error initiating microphone listening session:', err);
    }
  };

  // Stop listening
  const stopListening = () => {
    clearSilenceTimers();
    try {
      speechSessionRef.current?.stop();
      speechSessionRef.current = null;
    } catch {}
    try {
      micTrackerRef.current?.stop();
      micTrackerRef.current = null;
    } catch {}
    setMicAudioLevel(0);
  };

  // Schedule auto-send when silence pause is detected
  const scheduleSilenceAutoSend = (textToSend: string) => {
    clearSilenceTimers();
    if (!textToSend.trim() || isMuted) return;

    const totalMs = Math.round(silenceThresholdSec * 1000);
    setSilenceRemainingMs(totalMs);
    const startMs = Date.now();

    silenceCountdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startMs;
      const left = Math.max(0, totalMs - elapsed);
      setSilenceRemainingMs(left);
      if (left <= 0) {
        clearInterval(silenceCountdownIntervalRef.current!);
        silenceCountdownIntervalRef.current = null;
      }
    }, 100);

    silenceTimerRef.current = setTimeout(() => {
      clearSilenceTimers();
      commitTherapistSpeech(textToSend);
    }, totalMs);
  };

  // Commit and dispatch therapist speech to the virtual patient
  const commitTherapistSpeech = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // 1. Play subtle chime
    playSpeechSentCue();

    // 2. Pause microphone listening immediately to prevent patient speech audio bleed
    stopListening();
    setDialoguePhase('patient-thinking');
    setCurrentSpeechText('');
    setInterimSpeechText('');

    // 3. Send message through standard pipeline
    await onSendMessage(trimmed);
  };

  // Immediate send button
  const handleImmediateSend = () => {
    const fullText = `${currentSpeechText} ${interimSpeechText}`.trim();
    if (fullText) {
      clearSilenceTimers();
      commitTherapistSpeech(fullText);
    }
  };

  // Intentional therapeutic silence intervention
  const handleTherapeuticSilence = () => {
    const silenceActionText = '[درمانگر سکوت همدلانه و حضور متصل برقرار می‌کند و با نگاهی پذیرا به مراجع فرصت تأمل می‌دهد]';
    clearSilenceTimers();
    commitTherapistSpeech(silenceActionText);
  };

  // Patient speech synthesis handler
  const playPatientVoice = (message: SimulationMessage) => {
    stopPatientSpeech();
    setDialoguePhase('patient-speaking');

    const prefs = loadTTSPreferences();

    const cancelFn = speakPatientUtterance({
      text: message.content,
      clientState: message.stateSnapshot || clientState,
      caseProfile: currentCase,
      userPrefs: prefs,
      onStart: () => {
        if (!isComponentMountedRef.current) return;
        setDialoguePhase('patient-speaking');
      },
      onEnd: () => {
        if (!isComponentMountedRef.current) return;
        // Turn returns automatically to therapist!
        handlePatientSpeechFinished();
      },
      onError: () => {
        if (!isComponentMountedRef.current) return;
        handlePatientSpeechFinished();
      },
    });

    ttsCancelFnRef.current = cancelFn;
  };

  // When patient finishes speaking
  const handlePatientSpeechFinished = () => {
    setDialoguePhase('listening');
    playTherapistTurnCue(); // Chime to notify therapist
    // Automatically re-arm microphone for hands-free clinical dialogue
    setTimeout(() => {
      if (isComponentMountedRef.current && !isMuted) {
        startListening();
      }
    }, 200);
  };

  // Interrupt patient speech (therapeutic intervention)
  const handleInterruptPatient = () => {
    playInterruptCue();
    stopPatientSpeech();
    ttsCancelFnRef.current = null;
    handlePatientSpeechFinished();
  };

  // Replay patient's last utterance
  const handleReplayPatientUtterance = () => {
    if (!lastPatientMessage) return;
    stopListening();
    playPatientVoice(lastPatientMessage);
  };

  // Watch for new incoming patient messages and trigger speech synthesis
  useEffect(() => {
    if (!lastPatientMessage) return;

    if (lastPatientMessage.id !== lastSpokenMessageIdRef.current) {
      lastSpokenMessageIdRef.current = lastPatientMessage.id;
      // Brief pause to allow natural breathing space before patient speaks
      const timer = setTimeout(() => {
        if (isComponentMountedRef.current) {
          playPatientVoice(lastPatientMessage);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lastPatientMessage?.id]);

  // Reflect isLoadingPatient state
  useEffect(() => {
    if (isLoadingPatient) {
      setDialoguePhase('patient-thinking');
      stopListening();
    }
  }, [isLoadingPatient]);

  // Initial startup of listening on mount
  useEffect(() => {
    isComponentMountedRef.current = true;
    startListening();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopPatientSpeech();
        stopListening();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isComponentMountedRef.current = false;
      window.removeEventListener('keydown', handleKeyDown);
      stopListening();
      stopPatientSpeech();
      clearSilenceTimers();
    };
  }, []);

  // Handle mute toggling
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      stopListening();
      clearSilenceTimers();
      setDialoguePhase('listening');
    }
  };

  // Determine Visualizer Mode
  const visualizerMode: VisualizerMode = useMemo(() => {
    if (isMuted) return 'muted';
    if (dialoguePhase === 'patient-speaking') return 'patient-speaking';
    if (dialoguePhase === 'patient-thinking') return 'patient-thinking';
    if (dialoguePhase === 'sending') return 'therapist-speaking';
    if (currentSpeechText || interimSpeechText || micAudioLevel > 15) {
      return 'therapist-speaking';
    }
    return 'listening-therapist';
  }, [isMuted, dialoguePhase, currentSpeechText, interimSpeechText, micAudioLevel]);

  return (
    <div className={`flex flex-col text-stone-100 overflow-hidden select-none font-sans transition-all duration-300 ${
      isFullscreen || !embedded
        ? 'fixed inset-0 z-50 bg-stone-900/95 backdrop-blur-md'
        : 'relative w-full h-full bg-stone-900 rounded-2xl border border-stone-800 shadow-md'
    }`}>
      
      {/* Top Clinical Bar */}
      <header className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-stone-800/80 bg-stone-900/90 flex items-center justify-between gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
        
        {/* Left: Patient Title & Clinical Mode */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-teal-950/80 border border-teal-700/60 px-2 sm:px-2.5 py-1 rounded-xl shadow-xs">
            <Headphones className="w-3.5 h-3.5 text-teal-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-teal-200">حالت صوتی زنده (هندزفری)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-stone-100 truncate">{currentCase.patientName}</h2>
            <span className="text-[11px] sm:text-xs text-stone-400 hidden sm:inline truncate max-w-[180px]">({currentCase.dsmDiagnosis.split('(')[0]})</span>
          </div>
        </div>

        {/* Center: Clinical Status Banner */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800/90 border border-stone-700/60 text-xs">
          {dialoguePhase === 'patient-speaking' && (
            <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
              <span>مراجع در حال صحبت کردن است...</span>
            </span>
          )}
          {dialoguePhase === 'patient-thinking' && (
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Brain className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>مراجع در حال تأمل و پردازش پاسخ بالینی...</span>
            </span>
          )}
          {dialoguePhase === 'listening' && (
            <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>نوبت شماست؛ درمانگر گرامی، بفرمایید...</span>
            </span>
          )}
          {dialoguePhase === 'sending' && (
            <span className="flex items-center gap-1.5 text-teal-300 font-medium">
              <Send className="w-3.5 h-3.5 text-teal-400" />
              <span>در حال ارسال گفتار به مراجع...</span>
            </span>
          )}
        </div>

        {/* Right: Actions (Mute, Settings, Fullscreen, Log, Return to Chat) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Mute Button */}
          <button
            id="btn-voice-room-toggle-mute"
            onClick={handleToggleMute}
            className={`p-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-900/80 border border-rose-700 text-rose-200'
                : 'bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200'
            }`}
            title={isMuted ? 'فعال‌سازی میکروفون' : 'بی‌صدا کردن میکروفون'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isMuted ? 'بی‌صدا' : 'میکروفون فعال'}</span>
          </button>

          {/* Ambient Soundscapes Controller (Therapy Office Acoustics) */}
          <AmbientSoundController buttonVariant="header" />

          {/* Settings Drawer Button */}
          <button
            id="btn-voice-room-settings"
            onClick={() => setShowSettingsDrawer(prev => !prev)}
            className="p-1.5 sm:p-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
            title="تنظیمات حساسیت سکوت و لحن صوتی"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Fullscreen Button */}
          <button
            id="btn-voice-room-toggle-fullscreen"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-1.5 sm:p-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer hidden xs:flex items-center"
            title={isFullscreen ? 'خروج از تمام‌صفحه' : 'حالت تمام‌صفحه اختصاصی'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Toggle Log Drawer */}
          <button
            id="btn-voice-room-dialogue-log"
            onClick={() => setShowLogDrawer(prev => !prev)}
            className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-all cursor-pointer hidden sm:flex items-center gap-1"
            title="مشاهده رونوشت متنی گفتگو"
          >
            <span>رونوشت</span>
            <span className="w-4 h-4 rounded-full bg-stone-700 text-[10px] flex items-center justify-center font-mono">
              {messages.length}
            </span>
          </button>

          {/* Dedicated Toggle Button to Switch back to Text Chat mode */}
          <button
            id="btn-voice-room-exit-to-chat"
            onClick={() => {
              stopPatientSpeech();
              stopListening();
              onClose();
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 border border-teal-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="سوئیچ به حالت پیام متنی"
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-200" />
            <span className="hidden sm:inline">سوئیچ به حالت متنی</span>
            <span className="sm:hidden">متنی</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-200" />
          </button>
        </div>
      </header>

      {/* Main Consultation Room Stage */}
      <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-6 max-w-4xl mx-auto w-full overflow-y-auto">
        
        {/* Patient Acoustic Presence & Emotional Avatar */}
        <div className="w-full flex flex-col items-center justify-center my-auto py-2">
          
          {/* Avatar with Dynamic Resonance Rings */}
          <div className="relative mb-5 flex items-center justify-center">
            {/* Outer resonance ring */}
            <div 
              className={`absolute -inset-4 rounded-full transition-all duration-700 ${
                dialoguePhase === 'patient-speaking'
                  ? 'bg-indigo-500/20 animate-ping'
                  : dialoguePhase === 'patient-thinking'
                    ? 'bg-amber-500/20 animate-pulse'
                    : dialoguePhase === 'listening' && (currentSpeechText || micAudioLevel > 20)
                      ? 'bg-emerald-500/20 animate-pulse'
                      : 'bg-teal-500/10'
              }`}
            />

            {/* Mid ring */}
            <div 
              className={`absolute -inset-2 rounded-full transition-all duration-500 ${
                dialoguePhase === 'patient-speaking'
                  ? 'ring-4 ring-indigo-500/50'
                  : dialoguePhase === 'patient-thinking'
                    ? 'ring-4 ring-amber-500/40'
                    : 'ring-2 ring-stone-700'
              }`}
            />

            {/* Main Avatar Circle */}
            <div className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr ${currentCase.avatarColor} text-white flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-xl border-4 border-stone-800`}>
              {currentCase.patientName.slice(0, 1)}

              {/* Animated Speaking Icon Badge */}
              {dialoguePhase === 'patient-speaking' && (
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-2 rounded-full shadow-lg border-2 border-stone-900 animate-bounce">
                  <Volume2 className="w-4 h-4" />
                </div>
              )}

              {dialoguePhase === 'patient-thinking' && (
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-900 p-2 rounded-full shadow-lg border-2 border-stone-900 animate-spin">
                  <Brain className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Patient Voice Tone & Defense Mechanism Badge */}
          <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${emotionalDescriptor.badgeColor} bg-opacity-90`}>
              {emotionalDescriptor.title}
            </span>

            <span className="text-xs px-2.5 py-1 rounded-full border border-stone-700 bg-stone-800/80 text-stone-300 font-medium">
              دفاع فعال: {clientState.currentDefense || currentCase.defenseMechanisms[0]}
            </span>

            <span className="text-xs px-2.5 py-1 rounded-full border border-stone-700 bg-stone-800/80 text-rose-300 font-mono flex items-center gap-1">
              <Activity className="w-3 h-3 text-rose-400" />
              <span>اضطراب {clientState.anxiety}%</span>
            </span>

            <span className="text-xs px-2.5 py-1 rounded-full border border-stone-700 bg-stone-800/80 text-teal-300 font-mono flex items-center gap-1">
              <Heart className="w-3 h-3 text-teal-400" />
              <span>اتحاد {clientState.rapport}%</span>
            </span>
          </div>

          {/* Subtitle / Spoken Patient Words Display */}
          <div className="w-full max-w-2xl bg-stone-800/90 border border-stone-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl relative mb-4">
            {/* Non-verbal gesture / body language */}
            {parsedPatientUtterance.nonVerbalCue && (
              <div className="mb-2 text-center">
                <span className="inline-block text-xs sm:text-sm font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full animate-pulse">
                  [{parsedPatientUtterance.nonVerbalCue}]
                </span>
              </div>
            )}

            {/* Patient verbal utterance */}
            <p className="text-base sm:text-lg text-stone-100 leading-relaxed text-center font-medium">
              {parsedPatientUtterance.spokenText || '...'}
            </p>

            {/* Sub-controls for patient utterance (Interrupt / Replay) */}
            <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-stone-700/50">
              {dialoguePhase === 'patient-speaking' ? (
                <button
                  id="btn-voice-room-interrupt"
                  onClick={handleInterruptPatient}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-rose-200 text-xs font-bold transition-all cursor-pointer shadow-md"
                  title="مداخله بالینی درمانگر و قطع کلام مراجع"
                >
                  <Square className="w-3.5 h-3.5 fill-rose-300" />
                  <span>قطع کلام مراجع (مداخله درمانگر)</span>
                </button>
              ) : (
                <button
                  id="btn-voice-room-replay"
                  onClick={handleReplayPatientUtterance}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-700/80 hover:bg-stone-600 text-stone-200 text-xs font-medium transition-all cursor-pointer"
                  title="تکرار پخش صوتی آخرین گفته مراجع"
                >
                  <Volume2 className="w-3.5 h-3.5 text-stone-300" />
                  <span>پخش مجدد صدای مراجع</span>
                </button>
              )}

              <button
                id="btn-voice-room-toggle-thoughts"
                onClick={() => setShowInternalThoughts(prev => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  showInternalThoughts 
                    ? 'text-indigo-300 bg-indigo-950/60 border border-indigo-800/60' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="مشاهده افکار ناخودآگاه و پنهان مراجع"
              >
                {showInternalThoughts ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">افکار پنهان مراجع</span>
              </button>
            </div>

            {/* Internal Thought Box (if revealed) */}
            {showInternalThoughts && lastPatientMessage?.internalThought && (
              <div className="mt-3 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-900/60 text-xs text-indigo-200 leading-relaxed">
                <span className="font-bold text-indigo-400 ml-1">نجوای درون مراجع:</span>
                «{lastPatientMessage.internalThought}»
              </div>
            )}
          </div>

          {/* Sound Wave Frequency Visualizer Canvas */}
          <div className="w-full max-w-md my-2">
            <AudioWaveVisualizer
              mode={visualizerMode}
              audioLevel={micAudioLevel}
              barsCount={32}
              height={48}
            />
          </div>

          {/* Therapist Real-time Speaking Feedback Box */}
          <div className="w-full max-w-2xl bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  isMuted 
                    ? 'bg-rose-500' 
                    : currentSpeechText || interimSpeechText 
                      ? 'bg-emerald-400 animate-ping' 
                      : 'bg-teal-400'
                }`} />
                <span className="text-xs font-bold text-stone-300">
                  {isMuted ? 'میکروفون غیرفعال است' : 'گفتار شما (درمانگر):'}
                </span>
              </div>

              {/* Silence auto-send indicator ring */}
              {silenceRemainingMs !== null && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>ارسال در {(silenceRemainingMs / 1000).toFixed(1)} ثانیه</span>
                </div>
              )}
            </div>

            {/* Live speech transcription */}
            <div className="min-h-[50px] flex items-center justify-center text-center p-2">
              {isMuted ? (
                <p className="text-stone-500 text-xs italic">
                  میکروفون بی‌صدا است. برای شروع صحبت، دکمه «فعال‌سازی میکروفون» را بزنید.
                </p>
              ) : currentSpeechText || interimSpeechText ? (
                <p className="text-stone-100 text-sm sm:text-base leading-relaxed">
                  <span>{currentSpeechText} </span>
                  <span className="text-teal-400 italic font-medium">{interimSpeechText}</span>
                </p>
              ) : (
                <p className="text-stone-400 text-xs sm:text-sm animate-pulse">
                  در حال گوش دادن به صدای شما... به راحتی با مراجع صحبت کنید (پاسخ شما پس از {silenceThresholdSec} ثانیه سکوت خودکار ارسال می‌شود).
                </p>
              )}
            </div>

            {/* Quick Actions (Instant Send, Silence Intervention, Clear) */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-stone-800 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Intentional Therapeutic Silence Button */}
                <button
                  id="btn-voice-room-intentional-silence"
                  onClick={handleTherapeuticSilence}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors cursor-pointer border border-stone-700"
                  title="برقراری سکوت معنادار درمانی بدون کلام"
                >
                  <span>سکوت درمانی (Holding Space)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {(currentSpeechText || interimSpeechText) && (
                  <>
                    <button
                      id="btn-voice-room-clear-speech"
                      onClick={() => {
                        clearSilenceTimers();
                        setCurrentSpeechText('');
                        setInterimSpeechText('');
                      }}
                      className="px-2.5 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                    >
                      پاک کردن
                    </button>

                    <button
                      id="btn-voice-room-immediate-send"
                      onClick={handleImmediateSend}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ارسال فوری</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Diagnostic Speech Error Notice */}
          {speechError && (
            <div className="mt-3 flex items-center gap-2 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs px-3.5 py-2 rounded-xl max-w-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}
        </div>

        {/* Live Supervisor Feedback Floating Pill */}
        <AnimatePresence>
          {latestSupervisorFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-2xl bg-stone-800/95 border border-teal-500/40 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between gap-3 shadow-xl shrink-0 mt-2 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="p-1 rounded-md bg-teal-950 text-teal-400 border border-teal-700/50 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </span>
                <span className="text-teal-300 font-bold shrink-0">سوپروایزر:</span>
                <div className="text-stone-200 text-xs min-w-0 flex-1 leading-relaxed">
                  <TypewriterText
                    text={latestSupervisorFeedback.instantClinicalNudge || latestSupervisorFeedback.clinicalComment}
                    speed={15}
                    triggerKey={latestSupervisorFeedback.instantClinicalNudge || latestSupervisorFeedback.clinicalComment}
                    cursorClassName="inline-block w-1.5 h-3 bg-teal-400 rounded-xs mx-0.5 align-middle"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 bg-stone-900/80 px-2 py-1 rounded-lg border border-stone-700/60">
                <span className="text-[11px] text-stone-400">همدلی:</span>
                <StarRatingVisual rating={latestSupervisorFeedback.empathyStars || (latestSupervisorFeedback.empathyScore / 2) || 4} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Side Drawer Modal */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-800 border border-stone-700 rounded-2xl p-5 max-w-md w-full shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-700 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-sm text-stone-100">تنظیمات گفتگوی صوتی طبیعی</h3>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Silence Threshold Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-medium text-stone-200">تأخیر سکوت برای ارسال خودکار (VAD):</label>
                  <span className="font-mono font-bold text-teal-400">{silenceThresholdSec} ثانیه</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.2"
                  value={silenceThresholdSec}
                  onChange={(e) => setSilenceThresholdSec(parseFloat(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  پس از توقف صحبت شما، سیستم پس از این مدت گفته‌های شما را به مراجع ارسال می‌کند.
                </p>
              </div>

              {/* Tips for realistic conversation */}
              <div className="bg-stone-900/70 p-3 rounded-xl border border-stone-700/60 space-y-1.5 text-stone-300">
                <div className="font-bold text-teal-300 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>راهنمای گفتگوی طبیعی:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-300 leading-relaxed">
                  <li>نیازی به کلیک کردن نیست؛ پس از اتمام سخن مراجع، میکروفون خودبه‌خود آماده شنیدن می‌شود.</li>
                  <li>برای گفتگوی بدون نویز، استفاده از هدفون یا هندزفری پیشنهاد می‌شود.</li>
                  <li>در هر لحظه با زدن دکمه «قطع کلام»، می‌توانید مانند اتاق درمان واقعی صحبت مراجع را قطع کنید.</li>
                </ul>
              </div>

              {/* End Session Button Inside Voice Settings */}
              <div className="pt-2 border-t border-stone-700">
                <button
                  id="btn-voice-room-end-session"
                  onClick={() => {
                    setShowSettingsDrawer(false);
                    stopPatientSpeech();
                    stopListening();
                    onEndSession();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  <Award className="w-4 h-4" />
                  <span>پایان جلسه درمانی و ارزیابی تفصیلی</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Log Modal / Drawer */}
      {showLogDrawer && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-800 border border-stone-700 rounded-2xl p-5 max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-700 mb-3 shrink-0">
              <h3 className="font-bold text-sm text-stone-100">رونوشت کلامی جلسه صوتی</h3>
              <button
                onClick={() => setShowLogDrawer(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-1 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border ${
                    m.role === 'therapist'
                      ? 'bg-teal-950/50 border-teal-800/60 ml-6 text-stone-200'
                      : 'bg-stone-900/60 border-stone-700 mr-6 text-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] text-stone-400 font-medium">
                    <span>{m.role === 'therapist' ? 'شما (درمانگر)' : currentCase.patientName}</span>
                    <span className="font-mono">{m.timestamp}</span>
                  </div>
                  {m.nonVerbalCue && (
                    <div className="text-[11px] text-amber-300 mb-1 italic">[{m.nonVerbalCue}]</div>
                  )}
                  <p className="leading-relaxed">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
