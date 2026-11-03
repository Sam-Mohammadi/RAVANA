import React, { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Heart, 
  Activity, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  StopCircle, 
  Award,
  Lightbulb,
  Mic,
  MicOff,
  UserCheck,
  FileText,
  Clock,
  Trash2,
  BookmarkPlus,
  CheckCheck,
  BarChart3,
  FlaskConical,
  SlidersHorizontal,
  Compass,
  Layers,
  Download,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Square,
  Play,
  ArrowLeft,
  Star,
  BookOpen,
  Save,
  X,
  Headphones,
  Unlock
} from 'lucide-react';
import { downloadTextFile, copyToClipboard } from '../utils/reportExport';
import { 
  TTSPreferences, 
  loadTTSPreferences, 
  saveTTSPreferences, 
  speakPatientUtterance, 
  stopPatientSpeech,
  getVoiceEmotionalDescriptor,
  getVoiceToneConfig,
  PatientVoiceTone,
  warmUpTTS
} from '../utils/patientTTS';
import { PatientVoiceBar } from './PatientVoiceBar';
import { PatientResponse } from './PatientResponse';
import { 
  SpeechToTextSession, 
  isSpeechRecognitionSupported,
  queryMicrophonePermission,
  requestMicrophoneAccess,
  playMicChime,
  formatPersianSpokenPunctuation
} from '../utils/speechToText';
import { TherapistVoiceDictationBar } from './TherapistVoiceDictationBar';
import { detectSilenceOrHelplessness } from '../utils/interventionSuggesterUtils';
import type { 
  ClinicalCase, 
  SimulationMessage, 
  ClientState, 
  SupervisorFeedback,
  PatientPersonaConfig
} from '../types';
import { SessionCountdownTimer } from './SessionCountdownTimer';
import { InterventionSuggester } from './InterventionSuggester';
import { SupervisorEmpathyValidationWidget, StarRatingVisual } from './SupervisorEmpathyValidationWidget';
import { LiveSupervisorCopilotWidget } from './LiveSupervisorCopilotWidget';
import { PsychologyGlossaryWidget } from './PsychologyGlossaryWidget';
import { ClinicalNotesWidget } from './ClinicalNotesWidget';
import { AmbientSoundController } from './AmbientSoundController';
import { ambientAudioEngine } from '../utils/ambientAudio';
import { TypewriterText } from './TypewriterText';
import { PatientStateProgressCard } from './PatientStateProgressCard';

// Lazy-loaded auxiliary modals & real-time voice room for lightning-fast first paint
const TechniqueAnalyticsModal = lazy(() => import('./TechniqueAnalyticsModal').then(m => ({ default: m.TechniqueAnalyticsModal })));
const PreflightSandbox = lazy(() => import('./PreflightSandbox').then(m => ({ default: m.PreflightSandbox })));
const PatientVoiceSettingsModal = lazy(() => import('./PatientVoiceSettingsModal').then(m => ({ default: m.PatientVoiceSettingsModal })));
const PersonaConfigModal = lazy(() => import('./PersonaConfigModal').then(m => ({ default: m.PersonaConfigModal })));
const LiveVoiceDialogueRoom = lazy(() => import('./LiveVoiceDialogueRoom').then(m => ({ default: m.LiveVoiceDialogueRoom })));

interface LiveSessionSimulatorProps {
  currentCase: ClinicalCase;
  messages: SimulationMessage[];
  clientState: ClientState;
  currentPersona?: PatientPersonaConfig;
  onUpdatePersona?: (newPersona: PatientPersonaConfig) => void;
  onSendMessage: (text: string) => Promise<void>;
  onEndSession: () => void;
  isLoadingPatient: boolean;
  isLoadingSupervisor: boolean;
  latestSupervisorFeedback: SupervisorFeedback | null;
  onResetSession: () => void;
  onChangeCase: () => void;
  clinicalNotes: string;
  setClinicalNotes: React.Dispatch<React.SetStateAction<string>>;
  sessionDurationSecs?: number;
}

export const LiveSessionSimulator: React.FC<LiveSessionSimulatorProps> = ({
  currentCase,
  messages,
  clientState,
  currentPersona,
  onUpdatePersona,
  onSendMessage,
  onEndSession,
  isLoadingPatient,
  isLoadingSupervisor,
  latestSupervisorFeedback,
  onResetSession,
  onChangeCase,
  clinicalNotes,
  setClinicalNotes,
  sessionDurationSecs = 0,
}) => {
  const [inputText, setInputText] = useState('');
  const [showInternalThoughts, setShowInternalThoughts] = useState(true);
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'supervisor' | 'notes' | 'glossary'>('supervisor');
  const [isRecording, setIsRecording] = useState(false);
  const [speechInterimText, setSpeechInterimText] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState<'fa-IR' | 'en-US'>('fa-IR');
  const [speechErrorMessage, setSpeechErrorMessage] = useState<string | null>(null);
  const [speechVolume, setSpeechVolume] = useState<number>(0);
  const [autoSendOnSilence, setAutoSendOnSilence] = useState<boolean>(() => {
    try {
      return localStorage.getItem('psychosim_dictate_autosend') === 'true';
    } catch {
      return false;
    }
  });
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const speechSessionRef = useRef<SpeechToTextSession | null>(null);
  const autoSendTimerRef = useRef<number | null>(null);
  const silenceIntervalRef = useRef<number | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showPreflightSandbox, setShowPreflightSandbox] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [activeAlternativeSchool, setActiveAlternativeSchool] = useState<'cbt' | 'act' | 'relational'>('cbt');
  
  // Clinical Intervention Suggester State
  const [showInterventionSuggester, setShowInterventionSuggester] = useState(false);
  const [isSuggesterCollapsed, setIsSuggesterCollapsed] = useState(false);

  // Text-To-Speech (TTS) State
  const [ttsPreferences, setTtsPreferences] = useState<TTSPreferences>(loadTTSPreferences);
  const [showVoiceSettingsModal, setShowVoiceSettingsModal] = useState(false);
  const [activeSpeakingMessageId, setActiveSpeakingMessageId] = useState<string | null>(null);
  const [speakingCharIndex, setSpeakingCharIndex] = useState<number | null>(null);
  const lastAutoSpokenIdRef = useRef<string | null>(null);
  
  // Real-Time Natural Voice Dialogue Room State
  const [isRealtimeVoiceMode, setIsRealtimeVoiceMode] = useState(false);

  // Patient State Progress Card (Collapsed / Expanded / Mobile Modal)
  const [isStateCardCollapsed, setIsStateCardCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('psychosim_state_card_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [showMobileStateCard, setShowMobileStateCard] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Derive last patient message and silence/helplessness detection
  const lastPatientMessage = useMemo(() => {
    return [...messages].reverse().find(m => m.role === 'patient');
  }, [messages]);

  const lastTherapistMessage = useMemo(() => {
    return [...messages].reverse().find(m => m.role === 'therapist');
  }, [messages]);

  const [showEmpathyWidget, setShowEmpathyWidget] = useState(true);

  const silenceDetection = useMemo(() => {
    return detectSilenceOrHelplessness(lastPatientMessage, clientState);
  }, [lastPatientMessage, clientState]);

  const handleUpdateTtsPreferences = (newPrefs: TTSPreferences) => {
    setTtsPreferences(newPrefs);
    saveTTSPreferences(newPrefs);
  };

  const handleStopSpeech = () => {
    stopPatientSpeech();
    setActiveSpeakingMessageId(null);
    setSpeakingCharIndex(null);
  };

  const handleToggleSpeakMessage = (msg: SimulationMessage, toneOverride?: PatientVoiceTone) => {
    warmUpTTS();
    if (activeSpeakingMessageId === msg.id && !toneOverride) {
      handleStopSpeech();
      return;
    }

    handleStopSpeech();
    setActiveSpeakingMessageId(msg.id);
    setSpeakingCharIndex(0);

    const toneToUse = toneOverride || ttsPreferences.tone || 'clinical_adaptive';

    speakPatientUtterance({
      text: msg.content,
      clientState: msg.stateSnapshot || clientState,
      caseProfile: currentCase,
      userPrefs: ttsPreferences,
      toneOverride: toneToUse,
      onStart: () => {
        setActiveSpeakingMessageId(msg.id);
        setSpeakingCharIndex(0);
      },
      onBoundary: (charIndex) => {
        setSpeakingCharIndex(charIndex);
      },
      onEnd: () => {
        setActiveSpeakingMessageId(null);
        setSpeakingCharIndex(null);
      },
      onError: () => {
        setActiveSpeakingMessageId(null);
        setSpeakingCharIndex(null);
      },
    });
  };

  // Clean up speech on component unmount
  useEffect(() => {
    return () => {
      stopPatientSpeech();
    };
  }, []);

  // Ensure side drawer is closed on component mount / app refresh
  useEffect(() => {
    setShowRightDrawer(false);
  }, []);

  // Auto-speak new patient messages if autoSpeak preference is enabled
  useEffect(() => {
    if (!ttsPreferences.autoSpeak || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'patient' && lastMsg.id !== lastAutoSpokenIdRef.current) {
      lastAutoSpokenIdRef.current = lastMsg.id;
      // Slight delay for smooth DOM render and natural breathing pause
      const timer = setTimeout(() => {
        handleToggleSpeakMessage(lastMsg);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [messages, ttsPreferences.autoSpeak]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingPatient]);

  // Cancel silence auto-send timers
  const cancelAutoSendTimer = () => {
    if (autoSendTimerRef.current) {
      window.clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    if (silenceIntervalRef.current) {
      window.clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
    setSilenceCountdown(null);
  };

  // Schedule auto-send after 2 seconds of therapist silence (Hands-free voice dialogue)
  const scheduleAutoSend = (accumulatedText: string) => {
    if (!autoSendOnSilence || !accumulatedText.trim()) return;

    cancelAutoSendTimer();

    setSilenceCountdown(2);
    let remaining = 2;

    silenceIntervalRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setSilenceCountdown(remaining);
      } else {
        if (silenceIntervalRef.current) {
          window.clearInterval(silenceIntervalRef.current);
          silenceIntervalRef.current = null;
        }
        setSilenceCountdown(null);
      }
    }, 1000);

    autoSendTimerRef.current = window.setTimeout(() => {
      if (silenceIntervalRef.current) {
        window.clearInterval(silenceIntervalRef.current);
        silenceIntervalRef.current = null;
      }
      setSilenceCountdown(null);
      handleSend();
    }, 2200);
  };

  // Clean up Web Speech API session, audio engine, and timers on unmount
  useEffect(() => {
    return () => {
      speechSessionRef.current?.abort();
      ambientAudioEngine.stop();
      cancelAutoSendTimer();
    };
  }, []);

  const handleSend = async () => {
    cancelAutoSendTimer();

    // Check if there is in-flight interim speech that hasn't finalized yet
    let textToSend = inputText.trim();
    if (speechInterimText.trim()) {
      const formattedInterim = formatPersianSpokenPunctuation(speechInterimText.trim());
      textToSend = textToSend ? `${textToSend} ${formattedInterim}` : formattedInterim;
    }

    if (!textToSend || isLoadingPatient) return;
    
    handleStopSpeech();

    if (isRecording) {
      playMicChime('send');
      speechSessionRef.current?.stop();
      setIsRecording(false);
      setSpeechInterimText('');
      setSpeechVolume(0);
    }

    setInputText('');
    await onSendMessage(textToSend);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Global Keyboard shortcut for Web Speech API Dictation (Alt + V / Ctrl + M)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        (e.altKey && (e.key.toLowerCase() === 'v' || e.key === 'ر')) || 
        (e.ctrlKey && (e.key.toLowerCase() === 'm' || e.key === 'پ'))
      ) {
        e.preventDefault();
        toggleSpeechRecognition();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isRecording, speechLanguage, autoSendOnSilence, inputText, speechInterimText]);

  // Quick clinical prompt helpers for students
  const clinicalPrompts = [
    { label: 'انعکاس احساس', text: 'به نظر میاد در اون لحظه احساس درماندگی و تنهایی عمیقی داشتید...' },
    { label: 'سوال سقراطی', text: 'چه شواهدی وجود داره که نشون بده این سناریوی ترسناک حتماً اتفاق می‌افته؟' },
    { label: 'اعتبارسنجی (Validation)', text: 'کاملاً طبیعیه که با وجود این همه فشار، این حس سنگین رو تجربه کنید.' },
    { label: 'بررسی در بدن', text: 'الان که دارید درباره‌اش صحبت می‌کنید، این حس رو بیشتر کجای بدنتون حس می‌کنید؟' },
    { label: 'بررسی هزینه-فایده', text: 'این الگو و چک کردن مداوم، در بلندمدت چه تاثیری روی آرامشتون داشته؟' },
  ];

  const [lastAutoSavedTimestamp, setLastAutoSavedTimestamp] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem('psychosim_notes_last_saved_time');
      if (raw) {
        const d = new Date(raw);
        return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    } catch (e) {}
    return null;
  });

  // Auto-Save clinical notes immediately to localStorage on every change
  const handleNotesChange = (newText: string) => {
    setClinicalNotes(newText);
    try {
      localStorage.setItem(`psychosim_notes_${currentCase.id}`, newText);
      localStorage.setItem('psychosim_active_clinical_notes', newText);
      const now = new Date();
      localStorage.setItem('psychosim_notes_last_saved_time', now.toISOString());
      setLastAutoSavedTimestamp(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Auto-save notes error:', err);
    }
  };

  // Rehydrate notes on case change if not loaded
  useEffect(() => {
    if (!clinicalNotes) {
      try {
        const saved = localStorage.getItem(`psychosim_notes_${currentCase.id}`) || localStorage.getItem('psychosim_active_clinical_notes');
        if (saved) {
          setClinicalNotes(saved);
        }
      } catch (e) {}
    }
  }, [currentCase.id]);

  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');

  // Check microphone permissions on mount
  useEffect(() => {
    queryMicrophonePermission().then((status) => {
      setMicPermissionState(status);
    });
  }, []);

  // Web Speech API Voice-to-Text integration for therapist clinical responses
  const toggleSpeechRecognition = async () => {
    setSpeechErrorMessage(null);

    if (!isSpeechRecognitionSupported()) {
      setSpeechErrorMessage(
        'مرورگر شما از ورودی صوتی (Web Speech API) پشتیبانی نمی‌کند. لطفاً از مرورگرهای مدرن مانند Google Chrome یا Microsoft Edge استفاده فرمایید.'
      );
      return;
    }

    if (isRecording) {
      cancelAutoSendTimer();
      playMicChime('stop');
      speechSessionRef.current?.stop();
      setIsRecording(false);
      setSpeechInterimText('');
      setSpeechVolume(0);
      return;
    }

    // Stop any ongoing patient speech output to prevent audio feedback loop
    handleStopSpeech();

    // Verify microphone access pre-flight if permission isn't already granted
    if (micPermissionState !== 'granted') {
      const micAccess = await requestMicrophoneAccess();
      if (!micAccess.granted) {
        setSpeechErrorMessage(micAccess.error || 'دسترسی به میکروفون رد شد.');
        setMicPermissionState('denied');
        return;
      }
      setMicPermissionState('granted');
    }

    playMicChime('start');

    const session = new SpeechToTextSession({
      lang: speechLanguage,
      continuous: true,
      interimResults: true,
      enableAudioMeter: true,
      onStart: () => {
        setIsRecording(true);
        setSpeechErrorMessage(null);
        setMicPermissionState('granted');
      },
      onVolumeChange: (vol) => {
        setSpeechVolume(vol);
      },
      onInterim: (interim) => {
        setSpeechInterimText(interim);
        // If therapist is actively speaking, postpone auto-send timer
        cancelAutoSendTimer();
      },
      onResult: (finalText) => {
        let accumulated = '';
        setInputText((prev) => {
          const trimmed = prev.trim();
          accumulated = trimmed ? `${trimmed} ${finalText}` : finalText;
          return accumulated;
        });
        setSpeechInterimText('');

        // If auto-send on silence is active, schedule auto send
        if (autoSendOnSilence) {
          scheduleAutoSend(accumulated);
        }
      },
      onError: (errMsg, errCode) => {
        // 'no-speech' is triggered on natural pause, we ignore it to keep continuous listening
        if (errCode === 'no-speech' || errCode === 'aborted') return;
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          setMicPermissionState('denied');
        }
        setSpeechErrorMessage(errMsg);
        setIsRecording(false);
        setSpeechInterimText('');
        setSpeechVolume(0);
        cancelAutoSendTimer();
      },
      onEnd: () => {
        setIsRecording(false);
        setSpeechInterimText('');
        setSpeechVolume(0);
      },
    });

    speechSessionRef.current = session;
    const started = session.start();
    if (!started) {
      setIsRecording(false);
      setSpeechVolume(0);
    }
  };

  // Keyboard shortcuts: Alt+P (Read last patient message aloud) & Alt+V (Toggle speech dictation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing with Alt key combination inside standard input (unless it's the specific shortcut)
      if (e.altKey && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
        e.preventDefault();
        if (activeSpeakingMessageId) {
          handleStopSpeech();
        } else if (lastPatientMessage) {
          handleToggleSpeakMessage(lastPatientMessage);
        }
      } else if (e.altKey && (e.key === 'v' || e.key === 'V' || e.code === 'KeyV')) {
        e.preventDefault();
        toggleSpeechRecognition();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSpeakingMessageId, lastPatientMessage, isRecording]);

  const notesWordCount = clinicalNotes.trim() ? clinicalNotes.trim().split(/\s+/).length : 0;
  const lastPatientUtterance = [...messages].reverse().find((m) => m.role === 'patient')?.content || currentCase.chiefComplaint;

  return (
    <div className="w-full max-w-full max-w-7xl 2xl:max-w-[1700px] mx-auto px-1.5 sm:px-3 lg:px-6 2xl:px-8 py-1 sm:py-2 flex flex-col h-[calc(100dvh-7.25rem)] md:h-[calc(100dvh-4.75rem)] min-h-0 overflow-x-hidden">
      
      {/* Top Patient Status Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-stone-200 shadow-2xs mb-2 sm:mb-2.5 flex flex-col gap-2">
        
        {/* Row 1: Patient Profile & Core Session Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap lg:flex-nowrap">
          {/* Patient Profile summary */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr ${currentCase.avatarColor} text-white flex items-center justify-center font-bold text-sm sm:text-lg shadow-xs shrink-0`}>
              {currentCase.patientName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate">{currentCase.patientName}</h2>
                <span className="text-[11px] sm:text-xs text-stone-500 font-mono">({currentCase.age} ساله)</span>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200 truncate max-w-[130px] sm:max-w-none">
                  {currentCase.dsmDiagnosis.split('(')[0]}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 truncate max-w-[200px] sm:max-w-md mt-0.5 hidden xs:block">
                شکایت: {currentCase.chiefComplaint}
              </p>
            </div>
          </div>

          {/* Primary Session Actions (Real-time Voice Toggle + Ambient Sound + Timer + End Session + Switch) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Dedicated Real-time Voice Conversation Toggle Switch */}
            <button
              id="toggle-realtime-voice-conversation"
              data-testid="btn-open-live-voice-room"
              type="button"
              role="switch"
              aria-checked={isRealtimeVoiceMode}
              onClick={() => {
                handleStopSpeech();
                if (isRecording) {
                  speechSessionRef.current?.stop();
                  setIsRecording(false);
                  setSpeechInterimText('');
                }
                setIsRealtimeVoiceMode(prev => !prev);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer select-none ${
                isRealtimeVoiceMode
                  ? 'bg-teal-700 border-teal-600 text-white shadow-teal-800/25 ring-2 ring-teal-500/30'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700 hover:text-stone-900'
              }`}
              title={
                isRealtimeVoiceMode
                  ? 'گفتگوی صوتی زنده فعال است؛ برای بازگشت به نمای متنی کلیک کنید'
                  : 'فعال‌سازی گفتگوی صوتی زنده و پیوسته (Hands-free Voice Mode) با مراجع بدون نیاز به تایپ'
              }
            >
              {/* Toggle Switch Track & Knob */}
              <div className={`w-7 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
                isRealtimeVoiceMode ? 'bg-teal-950/60' : 'bg-stone-300'
              }`}>
                <div className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform duration-200 flex items-center justify-center ${
                  isRealtimeVoiceMode ? 'translate-x-3' : 'translate-x-0'
                }`}>
                  {isRealtimeVoiceMode ? (
                    <span className="w-1 h-1 rounded-full bg-teal-600" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-stone-400" />
                  )}
                </div>
              </div>

              <Headphones className={`w-3.5 h-3.5 ${isRealtimeVoiceMode ? 'text-teal-200 animate-pulse' : 'text-stone-500'}`} />
              <span className="hidden sm:inline">گفتگوی صوتی زنده</span>
              <span className="sm:hidden">صوت زنده</span>

              {isRealtimeVoiceMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping inline-block" />
              )}
            </button>

            {/* Ambient Soundscapes Controller (Therapy Office Atmosphere) */}
            <AmbientSoundController buttonVariant="header" />

            {/* Clinical 50-Minute Therapy Session Countdown Timer */}
            <SessionCountdownTimer totalMinutes={50} />

            {/* End Session Button */}
            <button
              id="btn-end-session-evaluate"
              type="button"
              onClick={() => {
                handleStopSpeech();
                ambientAudioEngine.stop();
                onEndSession();
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
              title="پایان جلسه و تولید کارنامه تفصیلی سوپروایزر"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">پایان جلسه</span>
              <span className="sm:hidden">پایان</span>
            </button>

            {/* Switch Case Button */}
            <button
              id="btn-switch-case"
              type="button"
              onClick={() => {
                handleStopSpeech();
                ambientAudioEngine.stop();
                onChangeCase();
              }}
              className="p-1.5 sm:p-2 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors"
              title="تغییر کیس"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Psychological Meters + Clinical Options Strip */}
        <div className="flex items-center justify-between gap-2 pt-1.5 sm:pt-2 border-t border-stone-100 flex-wrap lg:flex-nowrap">
          
          {/* Patient Internal Psychological Meters */}
          <div className="flex items-center gap-2 sm:gap-3.5 bg-stone-50/90 px-2 sm:px-3 py-1 rounded-xl border border-stone-200/80 shrink-0">
            {/* Anxiety Level */}
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
              <div>
                <div className="text-[9px] sm:text-[10px] text-stone-500 font-medium">اضطراب</div>
                <div className="flex items-center gap-1">
                  <div className="w-10 sm:w-14 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 transition-all duration-500" 
                      style={{ width: `${clientState.anxiety}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-rose-600">{clientState.anxiety}%</span>
                </div>
              </div>
            </div>

            {/* Therapeutic Alliance */}
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <div>
                <div className="text-[9px] sm:text-[10px] text-stone-500 font-medium">اتحاد درمانی</div>
                <div className="flex items-center gap-1">
                  <div className="w-10 sm:w-14 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-600 transition-all duration-500" 
                      style={{ width: `${clientState.rapport}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-teal-700">{clientState.rapport}%</span>
                </div>
              </div>
            </div>

            {/* Active Defense Mechanism */}
            <div className="hidden sm:flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div>
                <div className="text-[9px] sm:text-[10px] text-stone-500 font-medium">دفاع فعال</div>
                <span className="text-[10px] sm:text-xs font-medium text-stone-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block truncate max-w-[90px] md:max-w-[120px]">
                  {clientState.currentDefense || currentCase.defenseMechanisms[0]}
                </span>
              </div>
            </div>

            {/* Persona Tag */}
            {currentPersona && (
              <button
                id="btn-edit-persona-in-header"
                type="button"
                onClick={() => setShowPersonaModal(true)}
                title="مشاهده یا تنظیم لحن و میزان صراحت و مقاومت مراجع"
                className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer transition-colors shrink-0"
              >
                <SlidersHorizontal className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>{currentPersona.shortLabel}</span>
              </button>
            )}

            {/* Real-time State Card Trigger Pill (Anxiety, Rapport, Openness & Resistance) */}
            <button
              id="btn-toggle-patient-state-card"
              type="button"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setShowMobileStateCard(true);
                } else {
                  setIsStateCardCollapsed(prev => {
                    const next = !prev;
                    try {
                      localStorage.setItem('psychosim_state_card_collapsed', String(next));
                    } catch {
                      // ignore
                    }
                    return next;
                  });
                }
              }}
              title="نمودار روند لحظه‌ای و وضعیت بیمار (اضطراب، رابطه درمانی، گشودگی و مقاومت)"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 cursor-pointer transition-colors shrink-0 shadow-2xs"
            >
              <div className="flex items-center gap-1" title={`اضطراب مراجع: ${clientState.anxiety}%`}>
                <Activity className="w-3 h-3 text-rose-500 shrink-0 animate-pulse" />
                <span className="text-rose-700 font-bold">{clientState.anxiety}%</span>
              </div>
              <span className="text-stone-300">/</span>
              <div className="flex items-center gap-1" title={`رابطه درمانی (Rapport): ${clientState.rapport}%`}>
                <Heart className="w-3 h-3 text-teal-600 shrink-0" />
                <span className="text-teal-700 font-bold">{clientState.rapport}%</span>
              </div>
              <span className="hidden sm:inline-block text-stone-300">|</span>
              <div className="hidden sm:flex items-center gap-1" title={`گشودگی: ${clientState.openness}% / مقاومت: ${clientState.resistance}%`}>
                <Unlock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                <span className="text-emerald-700 font-bold">{clientState.openness}%</span>
                <span className="text-stone-300">/</span>
                <ShieldAlert className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                <span className="text-rose-600 font-bold">{clientState.resistance}%</span>
              </div>
            </button>
          </div>

          {/* Clinical Tools & Options Strip (Cleanly grouped with subtle dividers and uniform heights) */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 no-scrollbar max-w-full min-w-0 touch-pan-x">
            
            {/* Group 1: Clinical Drawers (Supervisor, Notes, Glossary) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Supervisor Panel Toggle Button */}
              <button
                id="btn-toggle-supervisor-panel"
                type="button"
                onClick={() => {
                  if (!showRightDrawer) {
                    setShowRightDrawer(true);
                    setActiveSideTab('supervisor');
                  } else if (activeSideTab === 'supervisor') {
                    setShowRightDrawer(false);
                  } else {
                    setActiveSideTab('supervisor');
                  }
                }}
                className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 ${
                  showRightDrawer && activeSideTab === 'supervisor'
                    ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold shadow-xs' 
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
                title="مشاهده راهنمایی‌ها و تحلیل زنده سوپروایزر"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="hidden sm:inline">سوپروایزر</span>
              </button>

              {/* Clinical Notes Toggle Button */}
              <button
                id="btn-toggle-notes-panel"
                type="button"
                onClick={() => {
                  if (!showRightDrawer) {
                    setShowRightDrawer(true);
                    setActiveSideTab('notes');
                  } else if (activeSideTab === 'notes') {
                    setShowRightDrawer(false);
                  } else {
                    setActiveSideTab('notes');
                  }
                }}
                className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 ${
                  showRightDrawer && activeSideTab === 'notes'
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
                title="دفترچه یادداشت‌های بالینی درمانگر"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">یادداشت‌ها</span>
                {clinicalNotes.trim().length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                )}
              </button>

              {/* Psychology Glossary Toggle Button */}
              <button
                id="btn-toggle-glossary-panel"
                type="button"
                onClick={() => {
                  if (!showRightDrawer) {
                    setShowRightDrawer(true);
                    setActiveSideTab('glossary');
                  } else if (activeSideTab === 'glossary') {
                    setShowRightDrawer(false);
                  } else {
                    setActiveSideTab('glossary');
                  }
                }}
                title="واژه‌نامه تخصصی روانشناسی بالینی و مفاهیم DSM-5"
                className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 ${
                  showRightDrawer && activeSideTab === 'glossary'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold shadow-xs' 
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline">واژه‌نامه</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-stone-200 shrink-0 mx-0.5" />

            {/* Group 2: Clinical Interventions & Live Analytics */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Clinical Intervention Suggester Button */}
              <button
                id="btn-open-intervention-suggester-header"
                type="button"
                onClick={() => {
                  setShowInterventionSuggester(prev => !prev);
                  setIsSuggesterCollapsed(false);
                }}
                title="ویجت پیشنهادی ۳ مداخله بالینی تأیید شده (بازتاب احساس، شفاف‌سازی، مواجهه)"
                className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0 ${
                  showInterventionSuggester
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200'
                    : silenceDetection.isDetected
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 font-bold ring-2 ring-amber-300/80 animate-pulse'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <Lightbulb className={`w-3.5 h-3.5 shrink-0 ${showInterventionSuggester ? 'text-amber-300' : silenceDetection.isDetected ? 'text-amber-600' : 'text-indigo-600'}`} />
                <span className="hidden xs:inline">پیشنهاد مداخله</span>
                {silenceDetection.isDetected && !showInterventionSuggester && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                )}
              </button>

              {/* Live Interaction & Technique Matrix Button */}
              <button
                id="btn-open-technique-analytics"
                type="button"
                onClick={() => setShowAnalyticsModal(true)}
                title="ماتریس تحلیل تکنیک‌ها و تعاملات زنده"
                className="h-8 px-2 sm:px-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-800 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
              >
                <BarChart3 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="hidden sm:inline">ماتریس</span>
              </button>

              {/* Real-time 5-Star Empathy & Validation Indicator */}
              {latestSupervisorFeedback && (
                <button
                  id="btn-header-empathy-stars-indicator"
                  type="button"
                  onClick={() => {
                    setShowEmpathyWidget(true);
                    if (!showRightDrawer) {
                      setShowRightDrawer(true);
                      setActiveSideTab('supervisor');
                    }
                  }}
                  title="مشاهده تحلیل ۵ ستاره‌ای همدلی و تأیید کلام شما"
                  className="h-8 hidden md:flex items-center gap-1.5 px-2 sm:px-2.5 rounded-lg border border-amber-300/80 bg-amber-50 hover:bg-amber-100/90 text-amber-900 transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  <StarRatingVisual 
                    rating={latestSupervisorFeedback.empathyStars || (latestSupervisorFeedback.empathyScore / 2)} 
                    starSize="w-3 h-3" 
                    activeColor="text-amber-500 fill-amber-400"
                  />
                  <span className="font-mono text-xs font-bold">
                    {((latestSupervisorFeedback.empathyStars || (latestSupervisorFeedback.empathyScore / 2))).toFixed(1)}
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">همدلی</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-stone-200 shrink-0 mx-0.5" />

            {/* Group 3: View & Client Audio Controls */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Internal Thoughts Toggle */}
              <button
                id="btn-toggle-internal-thoughts"
                type="button"
                onClick={() => setShowInternalThoughts(!showInternalThoughts)}
                title={showInternalThoughts ? 'مخفی‌سازی افکار ناخودآگاه مراجع' : 'نمایش افکار ناخودآگاه مراجع'}
                className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0 ${
                  showInternalThoughts 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-900'
                }`}
              >
                {showInternalThoughts ? <Eye className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400 shrink-0" />}
                <span className="hidden md:inline">افکار درونی</span>
              </button>

              {/* Patient Voice / TTS Controls with Tone Indicator */}
              <button
                id="btn-open-voice-settings"
                type="button"
                onClick={() => setShowVoiceSettingsModal(true)}
                title={`تنظیمات خوانش صوتی و انتخاب لحن گفتار مراجع (لحن فعلی: ${getVoiceToneConfig(ttsPreferences.tone || 'calm').name})`}
                className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0 ${
                  activeSpeakingMessageId
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse font-bold'
                    : ttsPreferences.autoSpeak
                      ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-900'
                }`}
              >
                {activeSpeakingMessageId ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-rose-600 animate-bounce shrink-0" />
                    <span className="hidden sm:inline">گفتار ({getVoiceToneConfig(ttsPreferences.tone || 'calm').name})</span>
                  </>
                ) : ttsPreferences.autoSpeak ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="hidden sm:inline">لحن: {getVoiceToneConfig(ttsPreferences.tone || 'calm').name}</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="hidden sm:inline">لحن: {getVoiceToneConfig(ttsPreferences.tone || 'calm').name}</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Main Simulation Body (Dialogue Stream + Side Panel) */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        
        {/* If Real-time Voice Conversation Mode is active, switch chat interface to hands-free audio-only mode */}
        {isRealtimeVoiceMode ? (
          <div className="flex-1 bg-stone-900 rounded-2xl border border-stone-800 flex flex-col overflow-hidden shadow-xs animate-in fade-in duration-200">
            <Suspense fallback={
              <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs">در حال راه‌اندازی اتاق صوتی زنده...</span>
              </div>
            }>
              <LiveVoiceDialogueRoom
                embedded={true}
                currentCase={currentCase}
                messages={messages}
                clientState={clientState}
                currentPersona={currentPersona}
                isLoadingPatient={isLoadingPatient}
                latestSupervisorFeedback={latestSupervisorFeedback}
                onSendMessage={onSendMessage}
                onClose={() => setIsRealtimeVoiceMode(false)}
                onEndSession={onEndSession}
              />
            </Suspense>
          </div>
        ) : (
          <>
            {/* Real-time Patient State Progress Card (Docked next to dialogue space) */}
            <PatientStateProgressCard
              clientState={clientState}
              currentCase={currentCase}
              messages={messages}
              lastPatientMessageTime={lastPatientMessage?.timestamp}
              isCollapsed={isStateCardCollapsed}
              onToggleCollapse={() => {
                setIsStateCardCollapsed(prev => {
                  const next = !prev;
                  try {
                    localStorage.setItem('psychosim_state_card_collapsed', String(next));
                  } catch {
                    // ignore
                  }
                  return next;
                });
              }}
              className="hidden md:flex"
            />

            {/* Dialogue Stream (Left / Main - Text Chat Mode) */}
            <div className="flex-1 bg-stone-100/70 rounded-2xl border border-stone-200 flex flex-col overflow-hidden shadow-xs">
            
            {/* Top Patient Voice & Text-to-Speech Control Bar */}
            <div className="p-2 sm:p-2.5 pb-1 shrink-0">
              <PatientVoiceBar
                currentCase={currentCase}
                clientState={clientState}
                lastPatientMessage={lastPatientMessage}
                activeSpeakingMessageId={activeSpeakingMessageId}
                ttsPreferences={ttsPreferences}
                onUpdatePreferences={handleUpdateTtsPreferences}
                onToggleSpeak={handleToggleSpeakMessage}
                onStopSpeech={handleStopSpeech}
                onOpenSettings={() => setShowVoiceSettingsModal(true)}
              />
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Initial Session Prompt */}
            <div className="text-center my-2">
              <span className="px-3 py-1 bg-stone-200/80 text-stone-600 text-xs font-medium rounded-full inline-flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                شروع جلسه ارزیابی بالینی • مراجع: {currentCase.patientName}
              </span>
            </div>

            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.role === 'therapist' ? 'items-start' : 'items-end'}`}
              >
                {msg.role === 'patient' ? (
                  /* Dedicated Patient Dialogue Component with Web Speech API */
                  <PatientResponse
                    message={msg}
                    currentCase={currentCase}
                    clientState={clientState}
                    isSpeaking={activeSpeakingMessageId === msg.id}
                    speakingCharIndex={activeSpeakingMessageId === msg.id ? speakingCharIndex : null}
                    onToggleSpeak={handleToggleSpeakMessage}
                    onStopSpeech={handleStopSpeech}
                    ttsPreferences={ttsPreferences}
                    onUpdateTtsPreferences={handleUpdateTtsPreferences}
                    showInternalThoughts={showInternalThoughts}
                    isLatest={msg.id === lastPatientMessage?.id}
                  />
                ) : (
                  /* Therapist Dialogue Box with Immediate Micro-Supervision */
                  <>
                    {/* Sender Label & Role */}
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-indigo-700">شما (دانشجوی درمانگر)</span>
                      <span className="text-[10px] text-stone-400 font-mono">{msg.timestamp}</span>
                    </div>

                    {/* Therapist Message Bubble */}
                    <div className="flex items-end gap-2 max-w-[92%] sm:max-w-[85%] self-start">
                      <div className="flex-1 rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all bg-indigo-600 text-white rounded-br-xs shadow-xs">
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {/* Immediate Micro-Tag for Therapist Utterance with 5-Star Empathy & Validation & Typewriter Nudge */}
                        {msg.supervisorFeedback && (
                          <motion.div 
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-2.5 pt-2 border-t border-indigo-500/40 text-[11px] text-indigo-100 space-y-1.5"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-medium text-[11px]">تکنیک: {msg.supervisorFeedback.techniqueUsed}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold bg-indigo-700/80 px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-400/40 text-[10px]">
                                  <StarRatingVisual 
                                    rating={msg.supervisorFeedback.empathyStars || (msg.supervisorFeedback.empathyScore / 2)} 
                                    starSize="w-2.5 h-2.5" 
                                    activeColor="text-amber-300 fill-amber-300"
                                  />
                                  <span>همدلی: {(msg.supervisorFeedback.empathyStars || (msg.supervisorFeedback.empathyScore / 2)).toFixed(1)}</span>
                                </span>

                                {(msg.supervisorFeedback.validationStars || msg.supervisorFeedback.validationScore) && (
                                  <span className="font-bold bg-teal-800/80 px-2 py-0.5 rounded-md flex items-center gap-1 border border-teal-400/40 text-[10px]">
                                    <CheckCheck className="w-2.5 h-2.5 text-teal-300" />
                                    <span>تأیید: {(msg.supervisorFeedback.validationStars || ((msg.supervisorFeedback.validationScore || 7) / 2)).toFixed(1)}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* In-bubble Instant Clinical Nudge / Comment */}
                            {(msg.supervisorFeedback.instantClinicalNudge || msg.supervisorFeedback.clinicalComment) && (
                              <div className="bg-indigo-950/70 p-2 rounded-lg border border-indigo-400/30 text-[11px] text-indigo-100 flex items-start gap-1.5 shadow-2xs">
                                <Sparkles className="w-3 h-3 text-amber-300 shrink-0 mt-0.5" />
                                <div className="leading-relaxed flex-1">
                                  <TypewriterText
                                    text={msg.supervisorFeedback.instantClinicalNudge || msg.supervisorFeedback.clinicalComment}
                                    speed={14}
                                    triggerKey={msg.id}
                                    cursorClassName="inline-block w-1.5 h-3 bg-amber-300 rounded-xs mx-0.5 align-middle"
                                  />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Loading Indicator for Patient speech */}
            {isLoadingPatient && (
              <div className="flex items-center gap-2 text-xs text-stone-500 p-2 bg-white/70 rounded-xl max-w-[200px] shadow-2xs border border-stone-200">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>مراجع در حال پاسخ و واکنش...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Smart Alert for Silence or Helplessness */}
          {silenceDetection.isDetected && !showInterventionSuggester && (
            <div 
              id="banner-silence-helplessness-nudge"
              className="mx-3 sm:mx-4 my-1.5 sm:my-2 px-3 sm:px-3.5 py-2 bg-gradient-to-r from-amber-50 via-indigo-50/60 to-amber-50 border border-amber-300/80 rounded-xl shadow-2xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 text-xs min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 shadow-2xs">
                  <Lightbulb className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-stone-900 text-xs">
                      {silenceDetection.title}
                    </span>
                    <span className="hidden md:inline text-stone-300">|</span>
                    <span className="text-stone-600 text-[11px] hidden sm:inline truncate max-w-[400px]">
                      {silenceDetection.description}
                    </span>
                  </div>
                </div>
              </div>
              <button
                id="btn-open-interventions-from-banner"
                type="button"
                onClick={() => {
                  setShowInterventionSuggester(true);
                  setIsSuggesterCollapsed(false);
                }}
                className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>مشاهده ۳ گزینه مداخله</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Docked Clinical Intervention Suggester Widget */}
          <InterventionSuggester
            currentCase={currentCase}
            clientState={clientState}
            lastPatientMessage={lastPatientMessage}
            onApplyIntervention={(text) => {
              setInputText(text);
              inputRef.current?.focus();
            }}
            isOpen={showInterventionSuggester}
            onClose={() => setShowInterventionSuggester(false)}
            isCollapsed={isSuggesterCollapsed}
            onToggleCollapse={() => setIsSuggesterCollapsed(prev => !prev)}
          />

          {/* Real-time Supervisor Empathy & Validation 5-Star Rating Widget */}
          {(latestSupervisorFeedback || isLoadingSupervisor) && showEmpathyWidget && (
            <div className="px-3 pt-2 pb-1 bg-stone-50/70 border-t border-stone-200">
              <SupervisorEmpathyValidationWidget
                latestFeedback={latestSupervisorFeedback}
                isLoading={isLoadingSupervisor}
                lastTherapistMessageText={lastTherapistMessage?.content}
                defaultExpanded={false}
              />
            </div>
          )}

          {/* Live Supervisor Coaching Ribbon with Typewriter & Soft Entrance */}
          <AnimatePresence>
            {latestSupervisorFeedback && !showRightDrawer && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.99 }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
                className="mx-3 sm:mx-4 my-1.5 px-3 py-2 bg-gradient-to-r from-teal-900 via-indigo-950 to-stone-900 border border-teal-500/40 rounded-xl shadow-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs text-white"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="p-1 rounded-md bg-teal-500/20 text-amber-300 border border-teal-400/30 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-teal-300 text-xs shrink-0">
                        بازخورد آنی سوپروایزر:
                      </span>
                      <span className="text-stone-200 text-[11px] leading-relaxed">
                        <TypewriterText
                          text={latestSupervisorFeedback.instantClinicalNudge || latestSupervisorFeedback.clinicalComment}
                          speed={14}
                          triggerKey={latestSupervisorFeedback.instantClinicalNudge || latestSupervisorFeedback.clinicalComment}
                          cursorClassName="inline-block w-1.5 h-3 bg-amber-400 rounded-xs mx-0.5 align-middle"
                        />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-teal-300/90 font-mono hidden md:inline">
                    همدلی: {(latestSupervisorFeedback.empathyStars || (latestSupervisorFeedback.empathyScore / 2)).toFixed(1)}⭐
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSideTab('supervisor');
                      setShowRightDrawer(true);
                    }}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>تحلیل کامل</span>
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Clinical Prompts Bar */}
          <div className="px-3 sm:px-4 py-1.5 bg-stone-50 border-t border-stone-200 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar min-w-0 w-full">
            {/* Options Label */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-stone-600 shrink-0 ml-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>گزینه‌های مداخله:</span>
            </div>

            {/* Quick Suggester Widget button */}
            <button
              id="btn-trigger-suggester-from-prompts"
              type="button"
              onClick={() => {
                setShowInterventionSuggester(prev => !prev);
                setIsSuggesterCollapsed(false);
              }}
              className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                showInterventionSuggester
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : silenceDetection.isDetected
                    ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 animate-pulse'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
              title="پیشنهاد ۳ مداخله بالینی بر اساس وضعیت لحظه‌ای مراجع"
            >
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>۳ گزینه مداخله بالینی</span>
            </button>

            {/* Quick Glossary Drawer Trigger */}
            <button
              type="button"
              id="btn-quick-glossary-bar"
              onClick={() => {
                setShowRightDrawer(true);
                setActiveSideTab('glossary');
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="جستجو در واژه‌نامه تخصصی و مفاهیم بالینی روانشناسی"
            >
              <BookOpen className="w-3 h-3 text-indigo-600" />
              <span>واژه‌نامه بالینی</span>
            </button>

            <div className="h-4 w-px bg-stone-300 shrink-0 mx-0.5" />

            {/* Clinical Prompt Options Chips */}
            {clinicalPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(p.text)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 text-stone-700 transition-all text-[11px] whitespace-nowrap shadow-2xs cursor-pointer"
                title={`درج تکنیک «${p.label}» در متن پیام`}
              >
                {p.label}
              </button>
            ))}

            {/* Real-time Empathy/Validation Widget Quick Toggle Button */}
            {latestSupervisorFeedback && (
              <button
                type="button"
                id="btn-toggle-empathy-widget-bar"
                onClick={() => setShowEmpathyWidget(prev => !prev)}
                className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer mr-auto ${
                  showEmpathyWidget
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                    : 'bg-white hover:bg-amber-50 border-stone-200 text-stone-600'
                }`}
                title="نمایش/عدم نمایش ویجت ۵ ستاره‌ای همدلی و تأیید"
              >
                <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                <span>ویجت همدلی ({((latestSupervisorFeedback.empathyStars || (latestSupervisorFeedback.empathyScore / 2))).toFixed(1)}⭐)</span>
              </button>
            )}
          </div>

          {/* Speech Error Banner if any */}
          {speechErrorMessage && (
            <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 flex flex-wrap items-center justify-between text-xs text-amber-900 gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="leading-snug">{speechErrorMessage}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {micPermissionState === 'denied' && (
                  <button
                    type="button"
                    onClick={async () => {
                      setSpeechErrorMessage(null);
                      const access = await requestMicrophoneAccess();
                      if (access.granted) {
                        setMicPermissionState('granted');
                        toggleSpeechRecognition();
                      } else {
                        setSpeechErrorMessage(access.error || 'دسترسی مجدد به میکروفون امکان‌پذیر نشد.');
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    تلاش مجدد دسترسی میکروفون
                  </button>
                )}
                <button
                  type="button"
                  id="btn-dismiss-speech-error"
                  onClick={() => setSpeechErrorMessage(null)}
                  className="text-amber-700 hover:text-amber-950 font-bold px-1.5 py-0.5 rounded-md hover:bg-amber-100 text-xs shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Web Speech API Live Voice-to-Text Recording Status Bar with Waveform, Interim Text, and Punctuation Helper */}
          <TherapistVoiceDictationBar
            isRecording={isRecording}
            speechInterimText={speechInterimText}
            speechVolume={speechVolume}
            speechLanguage={speechLanguage}
            autoSendOnSilence={autoSendOnSilence}
            silenceCountdown={silenceCountdown}
            onToggleLanguage={() => {
              const next = speechLanguage === 'fa-IR' ? 'en-US' : 'fa-IR';
              setSpeechLanguage(next);
              speechSessionRef.current?.stop();
              setIsRecording(false);
              setSpeechInterimText('');
              setTimeout(() => {
                toggleSpeechRecognition();
              }, 150);
            }}
            onToggleAutoSend={() => {
              setAutoSendOnSilence((prev) => {
                const next = !prev;
                try {
                  localStorage.setItem('psychosim_dictate_autosend', String(next));
                } catch {}
                if (!next) cancelAutoSendTimer();
                return next;
              });
            }}
            onStopRecording={() => {
              cancelAutoSendTimer();
              playMicChime('stop');
              speechSessionRef.current?.stop();
              setIsRecording(false);
              setSpeechInterimText('');
              setSpeechVolume(0);
            }}
            onSendNow={handleSend}
            onClearText={() => {
              setInputText('');
              setSpeechInterimText('');
              cancelAutoSendTimer();
            }}
            hasText={Boolean(inputText.trim())}
          />

          {/* Therapist Input Console */}
          <div className="p-2 sm:p-3 bg-white border-t border-stone-200 flex flex-col gap-1.5 sm:gap-2">
            
            {/* Quick Assist & Auxiliary Actions Strip (Sleek horizontal ribbon) */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Clinical Intervention Suggester Trigger Button */}
                <button
                  type="button"
                  id="btn-open-suggester-input-console"
                  onClick={() => {
                    setShowInterventionSuggester(prev => !prev);
                    setIsSuggesterCollapsed(false);
                  }}
                  title="پیشنهاد ۳ مداخله بالینی تأیید شده (بازتاب احساس، شفاف‌سازی، مواجهه)"
                  className={`px-2 sm:px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 shrink-0 text-xs font-bold cursor-pointer shadow-2xs ${
                    showInterventionSuggester
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : silenceDetection.isDetected
                        ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 font-bold animate-pulse'
                        : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>پیشنهاد مداخله</span>
                  {silenceDetection.isDetected && !showInterventionSuggester && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                  )}
                </button>

                {/* Pre-Flight Sandbox Button */}
                <button
                  type="button"
                  id="btn-open-preflight-sandbox"
                  onClick={() => setShowPreflightSandbox(true)}
                  title="آزمایشگاه سنجش پیش‌ارسال تکنیک (تست پیام قبل از ارسال)"
                  disabled={!inputText.trim()}
                  className="px-2 sm:px-2.5 py-1 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 disabled:opacity-40 disabled:hover:bg-teal-50 text-teal-800 transition-colors flex items-center gap-1.5 shrink-0 text-xs font-bold shadow-2xs cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                  <span>سنجش پیش‌ارسال</span>
                </button>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Quick Switch to Full Live Voice Session */}
                <button
                  type="button"
                  id="btn-quick-enter-voice-session"
                  onClick={() => {
                    handleStopSpeech();
                    if (isRecording) {
                      speechSessionRef.current?.stop();
                      setIsRecording(false);
                      setSpeechInterimText('');
                    }
                    setIsRealtimeVoiceMode(true);
                  }}
                  title="ورود به گفتگوی صوتی پیوسته و طبیعی با مراجع (بدون نیاز به کیبورد و موس)"
                  className="px-2 sm:px-2.5 py-1 rounded-lg border border-teal-300/80 bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors flex items-center gap-1.5 shrink-0 text-xs font-bold shadow-2xs cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                  <span className="hidden xs:inline">جلسه صوتی زنده</span>
                </button>
              </div>
            </div>

            {/* Primary Input Line: Voice Mic + Textarea + Send */}
            <div className="flex items-end gap-1.5 sm:gap-2">
              <button
                type="button"
                id="btn-voice-input-therapist"
                onClick={toggleSpeechRecognition}
                title={
                  isRecording 
                    ? 'توقف دیکته صوتی (Web Speech API) - کلید میانبر: Alt+V' 
                    : 'دیکته صوتی بالینی (Web Speech API): پاسخ بالینی خود را آزادانه بگویید - کلید میانبر: Alt+V'
                }
                className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs group ${
                  isRecording 
                    ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-200 shadow-xs' 
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                }`}
              >
                {isRecording ? (
                  <>
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-rose-300 opacity-80" />
                      <MicOff className="w-4 h-4 relative text-white" />
                    </div>
                    <span className="text-xs font-bold hidden md:inline">در حال دیکته</span>
                    <span className="text-[9px] bg-rose-800/90 text-white px-1 py-0.5 rounded font-mono hidden lg:inline">
                      Alt+V
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-stone-600 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-xs font-medium hidden md:inline">دیکته صوتی</span>
                    <span className="text-[9px] text-stone-400 bg-stone-100 px-1 py-0.5 rounded font-mono hidden lg:inline">
                      Alt+V
                    </span>
                  </>
                )}
              </button>

              <div className="flex-1 min-w-0 flex flex-col">
                <textarea
                  ref={inputRef}
                  id="input-therapist-message"
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isRecording
                      ? "در حال شنیدن صدای شما... پاسخ بالینی خود را بیان کنید (Enter برای ارسال)..."
                      : "پاسخ، بازتاب، یا پرسش بالینی خود را بنویسید یا با دکمه میکروفون دیکته کنید (Enter برای ارسال)..."
                  }
                  disabled={isLoadingPatient}
                  className={`w-full min-w-0 resize-none bg-stone-50 border rounded-xl p-2 sm:p-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-stone-400 ${
                    isRecording ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-200' : 'border-stone-200'
                  }`}
                />

                {/* In-situ streaming text while speech is being dictated */}
                {isRecording && speechInterimText && (
                  <div className="mt-1 px-2.5 py-1 bg-rose-50/90 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-center justify-between gap-1.5 animate-in fade-in duration-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                      <span className="font-bold text-rose-800 shrink-0 text-[11px]">در حال بیان:</span>
                      <span className="italic truncate text-[11px] text-stone-800" dir="auto">
                        «{speechInterimText}»
                      </span>
                    </div>
                    <span className="text-[10px] text-rose-600 font-medium shrink-0 hidden sm:inline">
                      (با مکث، متن تثبیت می‌شود)
                    </span>
                  </div>
                )}
              </div>

              <button
                id="btn-send-therapist-message"
                onClick={handleSend}
                disabled={(!inputText.trim() && !speechInterimText.trim()) || isLoadingPatient}
                title="ارسال پاسخ به مراجع (Enter)"
                className="p-2.5 sm:p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px]"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </div>

          </div>

        </div>
      </>
      )}

        {/* Floating Quick Opener Tab when Right Drawer is Closed */}
        {!showRightDrawer && (
          <div className="hidden lg:flex flex-col gap-1.5 shrink-0 self-start pt-1 animate-in fade-in duration-200">
            <button
              id="btn-quick-open-supervisor"
              type="button"
              onClick={() => {
                setShowRightDrawer(true);
                setActiveSideTab('supervisor');
              }}
              title="باز کردن ویجت سوپروایزر هوشمند"
              className="p-2 bg-white hover:bg-teal-50 border border-stone-200 hover:border-teal-300 text-teal-800 rounded-xl shadow-xs transition-all cursor-pointer flex flex-col items-center gap-1 group"
            >
              <Sparkles className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold writing-mode-vertical [writing-mode:vertical-rl] tracking-wider py-1">سوپروایزر</span>
            </button>
            <button
              id="btn-quick-open-notes"
              type="button"
              onClick={() => {
                setShowRightDrawer(true);
                setActiveSideTab('notes');
              }}
              title="باز کردن یادداشت‌های بالینی"
              className="p-2 bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-300 text-amber-800 rounded-xl shadow-xs transition-all cursor-pointer flex flex-col items-center gap-1 group"
            >
              <FileText className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold writing-mode-vertical [writing-mode:vertical-rl] tracking-wider py-1">یادداشت</span>
            </button>
          </div>
        )}

        {/* Multi-Tab Right Sidebar (Live Supervisor OR Clinical Notes OR Glossary) */}
        {showRightDrawer && (
          <>
            {/* Backdrop on mobile/tablet screens */}
            <div
              id="backdrop-drawer-mobile"
              onClick={() => setShowRightDrawer(false)}
              className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            />

            <div className="fixed lg:relative inset-y-0 right-0 z-50 w-full sm:w-[420px] lg:w-80 xl:w-96 2xl:w-[450px] pb-safe lg:pb-0 bg-white lg:rounded-2xl border-l lg:border border-stone-200 shadow-2xl lg:shadow-xs flex flex-col overflow-hidden shrink-0 h-full lg:h-auto animate-in slide-in-from-right-4 duration-200">
              
              {/* Tab Selector Header */}
              <div className="p-2 bg-stone-100 border-b border-stone-200 flex items-center gap-1">
                
                <button
                  id="tab-btn-supervisor"
                  onClick={() => setActiveSideTab('supervisor')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSideTab === 'supervisor'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>سوپروایزر</span>
                </button>

                <button
                  id="tab-btn-glossary"
                  onClick={() => setActiveSideTab('glossary')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSideTab === 'glossary'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>واژه‌نامه</span>
                </button>

                <button
                  id="tab-btn-clinical-notes"
                  onClick={() => setActiveSideTab('notes')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSideTab === 'notes'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>یادداشت‌ها</span>
                  {notesWordCount > 0 && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">
                      {notesWordCount}
                    </span>
                  )}
                </button>

                {/* Close Button on all screen sizes */}
                <button
                  id="btn-close-drawer"
                  onClick={() => setShowRightDrawer(false)}
                  className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-200/70 transition-colors shrink-0 cursor-pointer"
                  title="بستن پنل و بازگشت به گفت‌وگو"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>

            {/* TAB 1: CLINICAL NOTES WIDGET */}
            {activeSideTab === 'notes' ? (
              <ClinicalNotesWidget
                clinicalNotes={clinicalNotes}
                onNotesChange={handleNotesChange}
                currentCase={currentCase}
                messages={messages}
                lastAutoSavedTimestamp={lastAutoSavedTimestamp}
                onClose={() => setShowRightDrawer(false)}
              />
            ) : activeSideTab === 'glossary' ? (
              /* TAB 2: LIVE PSYCHOLOGY GLOSSARY & CLINICAL DICTIONARY */
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <PsychologyGlossaryWidget
                  currentCase={currentCase}
                  onInsertIntoNotes={(text) => {
                    const updated = clinicalNotes ? clinicalNotes + '\n\n' + text : text;
                    handleNotesChange(updated);
                  }}
                />
              </div>
            ) : (
              /* TAB 3: LIVE SUPERVISOR COPILOT WIDGET */
              <LiveSupervisorCopilotWidget
                latestSupervisorFeedback={latestSupervisorFeedback}
                isLoadingSupervisor={isLoadingSupervisor}
                lastTherapistMessage={lastTherapistMessage}
                onApplyText={(text) => setInputText(text)}
                onClose={() => setShowRightDrawer(false)}
              />
            )}

            {/* Panel Footer */}
            <div className="p-2.5 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500 flex items-center justify-between">
              {activeSideTab === 'notes' ? (
                <>
                  <span className="text-amber-800 font-medium">یادداشت‌های بالینی درمانگر</span>
                  <span className="text-[10px] text-stone-400">ذخیره با کارنامه در Firestore</span>
                </>
              ) : activeSideTab === 'glossary' ? (
                <>
                  <span className="text-indigo-800 font-medium">دانشنامه بالینی و مفاهیم DSM-5</span>
                  <span className="text-[10px] text-stone-500">پوشش اصطلاحات + هوش مصنوعی</span>
                </>
              ) : (
                <>
                  <span>مدل ارزیاب: Gemini 3.1 Flash-Lite</span>
                  <span className="font-mono text-[10px]">تأخیر: لحظه‌ای</span>
                </>
              )}
            </div>

          </div>
        </>
      )}

      </div>

      {/* On-Demand Aux Modals (Loaded only when requested) */}
      <Suspense fallback={null}>
        {/* Technique Analytics Modal */}
        {showAnalyticsModal && (
          <TechniqueAnalyticsModal
            isOpen={showAnalyticsModal}
            onClose={() => setShowAnalyticsModal(false)}
            messages={messages}
            currentCase={currentCase}
          />
        )}

        {/* Pre-Flight Sandbox Modal */}
        {showPreflightSandbox && (
          <PreflightSandbox
            isOpen={showPreflightSandbox}
            onClose={() => setShowPreflightSandbox(false)}
            draftText={inputText}
            patientPreviousUtterance={lastPatientUtterance}
            currentCase={currentCase}
            onApplyRewrite={(rewrittenText) => setInputText(rewrittenText)}
          />
        )}

        {/* Patient Voice & TTS Settings Modal */}
        {showVoiceSettingsModal && (
          <PatientVoiceSettingsModal
            isOpen={showVoiceSettingsModal}
            onClose={() => setShowVoiceSettingsModal(false)}
            preferences={ttsPreferences}
            onUpdatePreferences={handleUpdateTtsPreferences}
            currentCase={currentCase}
            clientState={clientState}
          />
        )}

        {/* Persona & Tone Settings Modal */}
        {showPersonaModal && (
          <PersonaConfigModal
            isOpen={showPersonaModal}
            onClose={() => setShowPersonaModal(false)}
            targetCase={currentCase}
            initialPersona={currentPersona}
            onConfirmStartSession={(_selectedCase, newPersona) => {
              setShowPersonaModal(false);
              if (onUpdatePersona) {
                onUpdatePersona(newPersona);
              }
            }}
          />
        )}

        {/* Mobile Floating Modal for Patient State Progress Card */}
        <AnimatePresence>
          {showMobileStateCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200">
              <div 
                className="fixed inset-0" 
                onClick={() => setShowMobileStateCard(false)} 
              />
              <div className="relative z-10 w-full max-w-sm">
                <PatientStateProgressCard
                  clientState={clientState}
                  currentCase={currentCase}
                  messages={messages}
                  lastPatientMessageTime={lastPatientMessage?.timestamp}
                  isCollapsed={false}
                  onToggleCollapse={() => setShowMobileStateCard(false)}
                  className="w-full shadow-2xl"
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </Suspense>

        </div>
      );
    };
