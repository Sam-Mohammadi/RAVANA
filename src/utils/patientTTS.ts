import type { ClinicalCase, ClientState } from '../types';

export type PatientVoiceTone = 'clinical_adaptive' | 'anxious' | 'hesitant' | 'calm' | 'inquisitive' | 'empathic';

export interface VoiceToneConfig {
  id: PatientVoiceTone;
  name: string;
  nameEn: string;
  description: string;
  acousticSummary: string;
  basePitchModifier: number;
  baseRateModifier: number;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accentColor: string;
  samplePhrase: string;
}

export const VOICE_TONE_CONFIGS: Record<PatientVoiceTone, VoiceToneConfig> = {
  clinical_adaptive: {
    id: 'clinical_adaptive',
    name: 'انطباقی با هیجانات بالینی',
    nameEn: 'Clinical Emotional Adaptive',
    description: 'محاسبه خودکار و بلادرنگ صدا، ضرب‌آهنگ (Pace) و بسامد (Pitch) متناسب با اضطراب، تردید و حالات روانی مراجع.',
    acousticSummary: 'پویا بر اساس اضطراب و تردید لحظه‌ای • بازتاب شبیه‌سازی‌شده هیجان',
    basePitchModifier: 1.0,
    baseRateModifier: 1.0,
    badgeBg: 'bg-teal-50',
    badgeBorder: 'border-teal-200',
    badgeText: 'text-teal-800',
    accentColor: 'text-teal-600',
    samplePhrase: 'حالت صدا، سرعت کلام و مکث‌ها به‌صورت زنده از اضطراب، تردید یا گشودگی بیمار الگوبرداری می‌شود.',
  },
  anxious: {
    id: 'anxious',
    name: 'مضطرب و سراسیمه',
    nameEn: 'Anxious & Hurried',
    description: 'انقباض تارهای صوتی ناشی از برانگیختگی سمپاتیک؛ آهنگ پرشتاب و نفس‌گیر، بسامد زیرتر و جملات مقطع.',
    acousticSummary: 'سرعت پرشتاب (۱.۱۸x-۱.۲۸x) • بسامد زیر و منقبض (۱.۲۵x) • تنفس‌های مقطع',
    basePitchModifier: 1.25,
    baseRateModifier: 1.18,
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-800',
    accentColor: 'text-rose-600',
    samplePhrase: 'دستام داره می‌لرزه... حس می‌کنم قلبم توی دهنمه و هر لحظه ممکنه کنترلم رو کامل از دست بدم!',
  },
  hesitant: {
    id: 'hesitant',
    name: 'مردد و همراه با مکث',
    nameEn: 'Hesitant & Wavering',
    description: 'آهنگ کلامی شمرده، کند و همراه با درنگ‌های مکرر؛ بازتاب تردید، سردرگمی، مقاومت دفاعی یا دشواری در افشای خود.',
    acousticSummary: 'سرعت کند و محتاط (۰.۷۶x-۰.۸۲x) • بسامد مردد (۱.۰۵x) • مکث‌های درنگ مکرر',
    basePitchModifier: 1.05,
    baseRateModifier: 0.78,
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-800',
    accentColor: 'text-amber-600',
    samplePhrase: 'راستش... نمی‌دونم... شاید نباید این رو به زبون بیارم... ولی احساس می‌کنم هیچ‌کس درکم نمی‌کنه.',
  },
  calm: {
    id: 'calm',
    name: 'آرام و متین',
    nameEn: 'Calm & Grounded',
    description: 'آهنگ کلامی شمرده، تسکین‌بخش و با طمانینه؛ کاهش تنش صوتی و ایجاد فضای امن و زمین‌گیرنده در جلسه.',
    acousticSummary: 'سرعت ملایم (۰.۸۵x) • بسامد عمیق‌تر و آرام (۰.۸۸x) • مکث‌های تنفسی ملایم',
    basePitchModifier: 0.88,
    baseRateModifier: 0.85,
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-800',
    accentColor: 'text-emerald-600',
    samplePhrase: 'الان که فکر می‌کنم، حس می‌کنم کمی درونم آروم‌تر شده... شاید بتونم این بار به قضیه یه جور دیگه نگاه کنم.',
  },
  inquisitive: {
    id: 'inquisitive',
    name: 'پرسشگرانه و کاوشگر',
    nameEn: 'Inquisitive & Curious',
    description: 'لحن استفهامی، متفکر و جویای معنا؛ فراز لحنی در انتهای جملات و تأکید روی نقاط ابهام و خودآگاهی.',
    acousticSummary: 'سرعت طبیعی (۱.۰۲x) • فراز بسامد استفهامی (۱.۱۲x) • تکیه‌های کلامی جستجوگر',
    basePitchModifier: 1.12,
    baseRateModifier: 1.02,
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-200',
    badgeText: 'text-sky-800',
    accentColor: 'text-sky-600',
    samplePhrase: 'آیا واقعاً فکر می‌کنید این ترسی که دارم منطقیه؟ چطور می‌تونم بفهمم این افکار واقعیت دارن؟',
  },
  empathic: {
    id: 'empathic',
    name: 'همدلانه و گرم',
    nameEn: 'Empathetic & Warm',
    description: 'طنین عاطفی صمیمی، بازتابنده و اتصال‌بخش؛ انتقال حس درک متقابل، تفاهم عمیق و پیوند درمانی استوار.',
    acousticSummary: 'سرعت متوازن و نرم (۰.۹۲x) • بسامد گرم و ملودیک (۱.۰۲x) • آهنگ کلام پذیرا',
    basePitchModifier: 1.02,
    baseRateModifier: 0.92,
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-200',
    badgeText: 'text-indigo-800',
    accentColor: 'text-indigo-600',
    samplePhrase: 'درک می‌کنم که چقدر تلاش کردید تا کمکم کنید... حس می‌کنم بالاخره یک نفر بدون قضاوت داره دردم رو می‌شنوه.',
  },
};

export function getVoiceToneConfig(tone?: PatientVoiceTone | string): VoiceToneConfig {
  if (tone && tone in VOICE_TONE_CONFIGS) {
    return VOICE_TONE_CONFIGS[tone as PatientVoiceTone];
  }
  return VOICE_TONE_CONFIGS.clinical_adaptive;
}

export interface TTSPreferences {
  autoSpeak: boolean;
  rateMultiplier: number;
  pitchMultiplier: number;
  selectedVoiceURI: string | null;
  readNonVerbalPrefix: boolean;
  tone: PatientVoiceTone;
}

export const DEFAULT_TTS_PREFERENCES: TTSPreferences = {
  autoSpeak: true,
  rateMultiplier: 1.0,
  pitchMultiplier: 1.0,
  selectedVoiceURI: null,
  readNonVerbalPrefix: false,
  tone: 'clinical_adaptive',
};

const STORAGE_KEY = 'clinical_sim_tts_prefs';

export function loadTTSPreferences(): TTSPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_TTS_PREFERENCES, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Failed to load TTS preferences from localStorage:', err);
  }
  return DEFAULT_TTS_PREFERENCES;
}

export function saveTTSPreferences(prefs: TTSPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('Failed to save TTS preferences:', err);
  }
}

/**
 * Check if browser supports Web Speech Synthesis API
 */
export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Clean spoken text: separate non-verbal stage directions inside brackets from patient verbal speech
 */
export function parsePatientUtteranceText(rawContent: string): {
  spokenText: string;
  nonVerbalCue?: string;
} {
  if (!rawContent) return { spokenText: '' };

  let cue = '';
  // Match content in brackets e.g. [با لکنت و نگاه به زمین: ...] or [آهی می‌کشد]
  const bracketMatch = rawContent.match(/\[([^\]]+)\]/);
  if (bracketMatch && bracketMatch[1]) {
    cue = bracketMatch[1].replace(/^[:\s]+|[:\s]+$/g, '').trim();
  }

  // Remove brackets and their content for the spoken voice
  let cleaned = rawContent.replace(/\[[^\]]+\]/g, ' ');

  // Remove markdown bold/italic asterisks
  cleaned = cleaned.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');

  // Convert multiple dots / ellipses to a clean pause
  cleaned = cleaned.replace(/\.{2,}/g, '، ');

  // Normalize spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return {
    spokenText: cleaned,
    nonVerbalCue: cue || undefined,
  };
}

/**
 * Describe patient's verbal tone and emotional delivery based on clinical state and text cues
 */
export function getVoiceEmotionalDescriptor(
  clientState?: ClientState,
  caseProfile?: Pick<ClinicalCase, 'gender' | 'age'>,
  rawText?: string
): {
  title: string;
  description: string;
  badgeColor: string;
} {
  const anxiety = clientState?.anxiety ?? 50;
  const rapport = clientState?.rapport ?? 50;
  const openness = clientState?.openness ?? 50;
  const resistance = clientState?.resistance ?? 50;

  // Check for hesitation cues in text or non-verbal directions
  const isHesitant = rawText && (
    /\.{2,}|تردید|مکث|لکنت|شک دارم|شاید|نمی‌دونم|آخه|راستش/i.test(rawText) ||
    (resistance >= 60 && openness <= 45)
  );

  if (anxiety >= 75) {
    return {
      title: 'لحن سراسیمه، لرزان و پرشتاب (اضطراب حاد)',
      description: 'انقباض شدید تارهای صوتی ناشی از برانگیختگی سمپاتیک؛ تنفس سطحی، مکث‌های مقطع و زیرتر شدن بسامد صدا',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
    };
  }

  if (anxiety >= 60) {
    return {
      title: 'لحن نگران و مضطرب (اضطراب بالا)',
      description: 'ضرب‌آهنگ سریع‌تر کلام (Pacing) همراه با تنش عضلانی حنجره و تأکیدهای هیجانی نگران‌کننده',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    };
  }

  if (isHesitant && anxiety < 60) {
    return {
      title: 'لحن مردد، با مکث‌های تأملی و درنگ (Hesitation)',
      description: 'ضرب‌آهنگ کند و مکث‌های مکرر؛ بازتابنده تعارض درونی، تردید در افشای خود، یا دشواری در بیان هیجانات',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    };
  }

  if (openness <= 30 && rapport <= 35) {
    return {
      title: 'لحن بی‌رمق، کند و خموده (افسرده/کندی روانی-حرکتی)',
      description: 'کندی روانی-حرکتی (Psychomotor slowing)؛ ریتم سنگین و کش‌دار، بسامد بم‌تر و افت انرژی کلامی',
      badgeColor: 'text-stone-700 bg-stone-100 border-stone-300',
    };
  }

  if (resistance >= 65) {
    return {
      title: 'لحن محتاط، گزینشی و تدافعی (مقاومت روانی)',
      description: 'مکث‌های ارادی برای پایش بازخورد درمانگر؛ آهنگ کلام کنترل‌شده و طفره‌آمیز',
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    };
  }

  if (rapport >= 65) {
    return {
      title: 'لحن پذیرا و متصل (اتحاد درمانی بالا)',
      description: 'آهنگ کلام طبیعی، روان و همراه با طنین صمیمیت و گشودگی عاطفی در اتاق درمان',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    };
  }

  return {
    title: 'لحن متعادل و پایش‌گرانه',
    description: 'آهنگ معمول محاوره‌ای مراجع در جریان ارزیابی اولیه',
    badgeColor: 'text-teal-700 bg-teal-50 border-teal-200',
  };
}

/**
 * Pre-process text prosody based on selected psychological tone and emotional state (e.g. anxiety, hesitation)
 */
export function formatProsodyForTone(
  text: string, 
  tone: PatientVoiceTone,
  clientState?: ClientState,
  nonVerbalCue?: string
): string {
  let formatted = text;
  const anxiety = clientState?.anxiety ?? 50;
  const resistance = clientState?.resistance ?? 50;
  const openness = clientState?.openness ?? 50;

  // Detect anxiety & hesitation conditions
  const isAnxiousTone = tone === 'anxious' || (
    tone === 'clinical_adaptive' && (
      anxiety >= 65 || 
      (nonVerbalCue && /اضطراب|وحشت|ترس|لرزش|نگران|تپش/i.test(nonVerbalCue)) ||
      /می‌ترسم|وحشتناکه|ضربان قلبم|نمی‌تونم|حالم بده/i.test(formatted)
    )
  );

  const isHesitantTone = tone === 'hesitant' || (
    tone === 'clinical_adaptive' && !isAnxiousTone && (
      (nonVerbalCue && /تردید|مکث|لکنت|شک|شاید|نمی‌دونم/i.test(nonVerbalCue)) ||
      /\.{2,}|راستش|نمی‌دونم|شاید|آخه|چیزه/.test(formatted) ||
      (resistance >= 60 && openness <= 45)
    )
  );

  if (isAnxiousTone) {
    // Anxious Prosody: Rapid, breathless, clipped cadence with tension
    // Turn exclamation marks into sharp hurried stops
    formatted = formatted.replace(/[!！]+/g, '!، ');
    // Insert breath micro-pauses after emotional alarm triggers
    formatted = formatted.replace(/(می‌ترسم|تپش قلبم|وحشتناکه|نگرانم|نمی‌تونم|دستام داره می‌لرزه|حالم بده)/g, '$1، ');
    // Shorten long breath groups
    formatted = formatted.replace(/(و بعد|ولی بعد|همش فکر می‌کنم)/g, '، $1');
    formatted = formatted.replace(/،\s*،/g, '، ');
  } else if (isHesitantTone) {
    // Hesitant Prosody: Prolonged pauses, wavering hesitations, and reflective stops
    // Transform ellipses into distinct auditory pause tokens that Web Speech engines honor
    formatted = formatted.replace(/\.{2,}/g, '، ... ، ');
    // Insert hesitation pauses around filler and ambivalence markers
    formatted = formatted.replace(/(راستش|نمی‌دونم|شاید|آخه|یعنی|چیزه|حقیقتش|فکر می‌کنم|اممم)/g, '، $1، ');
    // Handle stuttering / false starts e.g. "من... من" -> "من، ... من"
    formatted = formatted.replace(/(\b\w+)\s*[.،]+\s*\1\b/g, '$1، ... $1');
    formatted = formatted.replace(/،\s*،+/g, '، ');
  } else if (tone === 'calm') {
    // Calm Prosody: Gentle pauses, softening harsh exclamations, relaxed delivery
    formatted = formatted.replace(/[!！]+/g, '، ');
    formatted = formatted.replace(/(راستش|شاید|فکر می‌کنم|درونم|احساس می‌کنم)/g, '$1، ');
    formatted = formatted.replace(/،\s*،/g, '، ');
  } else if (tone === 'inquisitive') {
    // Inquisitive Prosody: Interrogative rising cadence, emphasis on uncertainty questions
    if (!formatted.includes('؟') && !formatted.includes('?')) {
      formatted = formatted.replace(/\.+$/, '؟');
    }
    formatted = formatted.replace(/(آیا|چطور|چرا|واقعاً|یعنی|مگه میشه)/g, '$1، ');
    formatted = formatted.replace(/،\s*،/g, '، ');
  } else if (tone === 'empathic') {
    // Empathetic Prosody: Warm, reflective pauses around connecting phrases
    formatted = formatted.replace(/(درک می‌کنم|می‌فهمم|حس می‌کنم|ممنون از شما|با شما|کمک)/g, '$1، ');
    formatted = formatted.replace(/،\s*،/g, '، ');
  }

  return formatted.replace(/\s+/g, ' ').trim();
}

/**
 * Calculate pitch and rate based on clinical case profile and internal psychological state or selected tone
 */
export function calculateAcousticParameters(
  clientState?: ClientState,
  caseProfile?: Pick<ClinicalCase, 'gender' | 'age'>,
  userPrefs?: Partial<TTSPreferences>,
  toneOverride?: PatientVoiceTone,
  rawText?: string
): { pitch: number; rate: number; activeTone: PatientVoiceTone } {
  const activeTone = toneOverride || userPrefs?.tone || 'clinical_adaptive';
  const isFemale = caseProfile?.gender === 'female';
  const age = caseProfile?.age ?? 30;

  // 1. Base Pitch by gender & age
  let basePitch = isFemale ? 1.15 : 0.85;
  if (age > 60) basePitch -= 0.08;
  else if (age < 22) basePitch += 0.08;

  let baseRate = 0.95; // Natural Persian cadence baseline

  // 2. Adjust acoustic profile according to chosen tone or dynamic clinical state
  if (activeTone === 'anxious') {
    // Anxious: High tension in vocal cords (elevated pitch), pressured hurried speech (tachylalia)
    basePitch *= 1.25;
    baseRate *= 1.18;
  } else if (activeTone === 'hesitant') {
    // Hesitant: Decelerated speech rate, thoughtful/reluctant micro-pauses, wavering pitch
    basePitch *= 1.05;
    baseRate *= 0.78;
  } else if (activeTone === 'calm') {
    // Calm: Relaxed vocal cords, deeper and grounded pitch, gentle unhurried pacing
    basePitch *= 0.88;
    baseRate *= 0.85;
  } else if (activeTone === 'inquisitive') {
    // Inquisitive: Raised curiosity inflection, alert cadence with questioning dynamic
    basePitch *= 1.14;
    baseRate *= 1.02;
  } else if (activeTone === 'empathic') {
    // Empathetic: Warm melodic mid-register, tender, considerate pacing
    basePitch *= 1.02;
    baseRate *= 0.92;
  } else {
    // Clinical Adaptive: Calculate dynamically from clinical state metrics (Anxiety, Hesitation, Depression, Rapport)
    const anxiety = clientState?.anxiety ?? 50;
    const openness = clientState?.openness ?? 50;
    const rapport = clientState?.rapport ?? 50;
    const resistance = clientState?.resistance ?? 50;

    // Check hesitation signs from dialogue or resistance
    const hasHesitation = rawText && (
      /\.{2,}|تردید|مکث|لکنت|نمی‌دونم|شاید|آخه/i.test(rawText) ||
      (resistance >= 60 && openness <= 45)
    );

    // Anxiety effect on Pitch (Sympathetic nervous activation tightens laryngeal muscles)
    if (anxiety >= 75) {
      basePitch += 0.22 + (anxiety - 75) * 0.005;
    } else if (anxiety >= 60) {
      basePitch += 0.14 + (anxiety - 60) * 0.003;
    } else if (anxiety >= 50) {
      basePitch += (anxiety - 50) * 0.002;
    }

    // Anxiety effect on Rate (Pressured, rapid pacing vs normal speech)
    if (anxiety >= 75) {
      baseRate += 0.18 + (anxiety - 75) * 0.004;
    } else if (anxiety >= 60) {
      baseRate += 0.10 + (anxiety - 60) * 0.003;
    }

    // Hesitation effect on Pacing (If hesitant and not in panic state, decelerate pacing significantly)
    if (hasHesitation && anxiety < 70) {
      baseRate -= 0.16; // Pacing slows down to reflect hesitation
      basePitch += 0.04; // Slight wavering inflection
    }

    // Psychomotor slowing / Depression effect
    if (openness < 35 && rapport < 40 && anxiety < 55) {
      basePitch -= 0.12;
      baseRate -= 0.14;
    }

    // Defensive guarded delivery
    if (resistance > 70 && anxiety < 60 && !hasHesitation) {
      baseRate -= 0.08;
    }

    // Strong therapeutic alliance & calm openness
    if (rapport >= 70 && anxiety < 50) {
      basePitch *= 0.94;
      baseRate *= 0.92;
    }
  }

  // Apply user multipliers
  const pitchMult = userPrefs?.pitchMultiplier ?? 1.0;
  const rateMult = userPrefs?.rateMultiplier ?? 1.0;

  const finalPitch = Math.max(0.55, Math.min(1.85, Number((basePitch * pitchMult).toFixed(2))));
  const finalRate = Math.max(0.6, Math.min(1.45, Number((baseRate * rateMult).toFixed(2))));

  return { pitch: finalPitch, rate: finalRate, activeTone };
}

/**
 * Get sorted available voices with Persian preference
 */
export function getSortedVoices(): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return [];

  // Sort: Persian first, then other localized/neural voices, then others
  return [...voices].sort((a, b) => {
    const aLang = a.lang.toLowerCase();
    const bLang = b.lang.toLowerCase();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    const isFaA = aLang.startsWith('fa') || aLang.includes('pes') || aName.includes('persian') || aName.includes('farsi');
    const isFaB = bLang.startsWith('fa') || bLang.includes('pes') || bName.includes('persian') || bName.includes('farsi');

    if (isFaA && !isFaB) return -1;
    if (!isFaA && isFaB) return 1;

    // Default system voice prioritized
    if (a.default && !b.default) return -1;
    if (!a.default && b.default) return 1;

    return a.name.localeCompare(b.name);
  });
}

export interface PersianVoiceInfo {
  voice: SpeechSynthesisVoice | null;
  lang: string;
  isNativePersian: boolean;
  displayName: string;
  statusText: string;
}

/**
 * Automatically inspects and returns Persian (fa-IR) voice metadata from Web Speech API
 */
export function getPersianVoiceInfo(): PersianVoiceInfo {
  if (!isTTSSupported()) {
    return {
      voice: null,
      lang: 'fa-IR',
      isNativePersian: false,
      displayName: 'سنتز وب (Web Audio)',
      statusText: 'موتور صوتی رزونانسی وب فعال است',
    };
  }

  const voices = getSortedVoices();
  const faVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith('fa') ||
      v.lang.toLowerCase().includes('pes') ||
      v.name.toLowerCase().includes('persian') ||
      v.name.toLowerCase().includes('farsi')
  );

  if (faVoice) {
    return {
      voice: faVoice,
      lang: faVoice.lang || 'fa-IR',
      isNativePersian: true,
      displayName: faVoice.name,
      statusText: `لهجه فارسی شناسایی شد (${faVoice.lang})`,
    };
  }

  return {
    voice: null,
    lang: 'fa-IR',
    isNativePersian: false,
    displayName: 'لهجه فارسی (fa-IR)',
    statusText: 'تنظیم خودکار Web Speech API روی fa-IR',
  };
}

// Web Audio Fallback for expressive emotional patient vocalization if Web Speech API is blocked or missing voices
let vocalAudioCtx: AudioContext | null = null;
let activeVocalNodes: { stop: () => void }[] = [];

function getVocalAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!vocalAudioCtx || vocalAudioCtx.state === 'closed') {
    vocalAudioCtx = new AudioCtx();
  }
  if (vocalAudioCtx.state === 'suspended') {
    vocalAudioCtx.resume().catch(() => {});
  }
  return vocalAudioCtx;
}

export function stopVocalAudioFallback(): void {
  for (const node of activeVocalNodes) {
    try {
      node.stop();
    } catch (e) {}
  }
  activeVocalNodes = [];
}

/**
 * Synthesizes expressive vocal contour matching emotional tone and text syllables
 * using resonant bandpass formant filters (human speech simulation)
 */
export function playEmotionalVocalFallback(
  text: string,
  tone: PatientVoiceTone = 'calm',
  gender: 'male' | 'female' = 'female',
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  const ctx = getVocalAudioContext();
  if (!ctx) {
    onEnd?.();
    return () => {};
  }

  stopVocalAudioFallback();
  onStart?.();

  // Break text into words
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = Math.min(words.length, 30);
  const startTime = ctx.currentTime + 0.05;

  let currentTime = startTime;
  const isFemale = gender === 'female';
  const baseFreq = isFemale ? 210 : 130;

  // Tone multipliers
  let pitchScale = 1.0;
  let durationScale = 1.0;
  if (tone === 'anxious') {
    pitchScale = 1.25;
    durationScale = 0.82;
  } else if (tone === 'hesitant') {
    pitchScale = 1.05;
    durationScale = 1.28;
  } else if (tone === 'calm') {
    pitchScale = 0.88;
    durationScale = 1.12;
  } else if (tone === 'inquisitive') {
    pitchScale = 1.14;
    durationScale = 0.95;
  } else if (tone === 'empathic') {
    pitchScale = 1.02;
    durationScale = 1.05;
  }

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.28, startTime);
  masterGain.connect(ctx.destination);

  let stopped = false;
  const timerIds: number[] = [];

  for (let i = 0; i < wordCount; i++) {
    const word = words[i];
    const syllableCount = Math.max(1, Math.min(4, Math.round(word.length / 2.5)));
    
    for (let s = 0; s < syllableCount; s++) {
      const syllableDuration = (0.11 + (word.length % 3) * 0.025) * durationScale;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Formant simulation: Bandpass around 750-1000 Hz for vocal warmth
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isFemale ? 950 : 720, currentTime);
      filter.Q.setValueAtTime(2.2, currentTime);

      // Pitch contour
      let freq = baseFreq * pitchScale;
      // Inquisitive tone rises at end of phrase
      if (tone === 'inquisitive' && i >= wordCount - 2) {
        freq *= 1.15 + (i - (wordCount - 2)) * 0.08;
      } else if (tone === 'calm') {
        freq *= 1.0 - (s * 0.03);
      }

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, currentTime);
      osc.frequency.linearRampToValueAtTime(freq * (1 + (s % 2 === 0 ? 0.02 : -0.02)), currentTime + syllableDuration);

      // Smooth attack & decay
      gain.gain.setValueAtTime(0.001, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, currentTime + syllableDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(currentTime);
      osc.stop(currentTime + syllableDuration);

      activeVocalNodes.push({
        stop: () => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {}
        }
      });

      currentTime += syllableDuration + 0.02;
    }

    // Punctuation pauses
    if (word.includes('،') || word.includes('...')) {
      currentTime += 0.2;
    } else if (word.includes('.') || word.includes('!') || word.includes('؟')) {
      currentTime += 0.35;
    } else {
      currentTime += 0.05;
    }
  }

  const totalDuration = currentTime - startTime;
  const endTimeout = window.setTimeout(() => {
    if (!stopped) {
      onEnd?.();
    }
  }, totalDuration * 1000);
  timerIds.push(endTimeout);

  return () => {
    stopped = true;
    timerIds.forEach(id => clearTimeout(id));
    stopVocalAudioFallback();
    onEnd?.();
  };
}

/**
 * Warm up audio contexts and speech engine on user interaction
 */
export function warmUpTTS(): void {
  if (typeof window === 'undefined') return;
  try {
    getVocalAudioContext();
    if (isTTSSupported()) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.getVoices();
    }
  } catch (e) {}
}

/**
 * Check if voice is currently speaking
 */
export function isPatientSpeaking(): boolean {
  return (
    !!activeUtterance ||
    activeVocalNodes.length > 0 ||
    (typeof window !== 'undefined' && !!window.speechSynthesis?.speaking)
  );
}

// Keep active utterance reference to prevent Chrome garbage collection bug
let activeUtterance: SpeechSynthesisUtterance | null = null;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

function clearKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

export interface SpeakOptions {
  text: string;
  clientState?: ClientState;
  caseProfile?: Pick<ClinicalCase, 'patientName' | 'gender' | 'age'>;
  userPrefs?: TTSPreferences;
  toneOverride?: PatientVoiceTone;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onBoundary?: (charIndex: number, charLength?: number) => void;
}

export interface AcousticSummaryInfo {
  pitch: number;
  rate: number;
  activeTone: PatientVoiceTone;
  toneName: string;
  toneDescription: string;
  paceLabel: string;
  pitchLabel: string;
  clinicalImplication: string;
}

/**
 * Provides comprehensive acoustic metadata (tone, pace, pitch, and clinical implications)
 * for student educational observation in the simulator.
 */
export function getAcousticSummaryInfo(
  clientState?: ClientState,
  caseProfile?: Pick<ClinicalCase, 'gender' | 'age'>,
  userPrefs?: Partial<TTSPreferences>,
  toneOverride?: PatientVoiceTone,
  rawText?: string
): AcousticSummaryInfo {
  const { pitch, rate, activeTone } = calculateAcousticParameters(
    clientState,
    caseProfile,
    userPrefs,
    toneOverride,
    rawText
  );
  const toneCfg = getVoiceToneConfig(activeTone);
  const emotional = getVoiceEmotionalDescriptor(clientState, caseProfile, rawText);

  let paceLabel = 'متعادل (۱.۰x)';
  if (activeTone === 'anxious' || rate >= 1.15) {
    paceLabel = `پرشتاب و سراسیمه (${rate.toFixed(2)}x)`;
  } else if (activeTone === 'hesitant' || rate <= 0.82) {
    paceLabel = `کند، با درنگ و مکث‌های مکرر (${rate.toFixed(2)}x)`;
  } else if (rate <= 0.88) {
    paceLabel = `شمرده و با طمانینه (${rate.toFixed(2)}x)`;
  } else if (rate < 0.98) {
    paceLabel = `ملایم و بازتابنده (${rate.toFixed(2)}x)`;
  } else if (rate >= 1.05) {
    paceLabel = `هوشیار و پویا (${rate.toFixed(2)}x)`;
  }

  let pitchLabel = 'طبیعی';
  if (activeTone === 'anxious' || pitch >= 1.18) {
    pitchLabel = `زیرتر به علت تنش عضلانی حنجره (${pitch.toFixed(2)}x)`;
  } else if (activeTone === 'hesitant') {
    pitchLabel = `مردد و نامطمئن (${pitch.toFixed(2)}x)`;
  } else if (pitch <= 0.85) {
    pitchLabel = `بم و آرام‌بخش (${pitch.toFixed(2)}x)`;
  } else if (pitch < 0.98) {
    pitchLabel = `گرم و عمیق (${pitch.toFixed(2)}x)`;
  } else if (pitch >= 1.05) {
    pitchLabel = `کمی زیر و استفهامی (${pitch.toFixed(2)}x)`;
  }

  return {
    pitch,
    rate,
    activeTone,
    toneName: activeTone === 'clinical_adaptive' ? emotional.title : toneCfg.name,
    toneDescription: activeTone === 'clinical_adaptive' ? emotional.description : toneCfg.description,
    paceLabel,
    pitchLabel,
    clinicalImplication: activeTone === 'clinical_adaptive' ? emotional.description : toneCfg.acousticSummary,
  };
}

/**
 * Synthesize and speak patient utterance aloud with clinical emotional prosody
 */
export function speakPatientUtterance(options: SpeakOptions): () => void {
  const prefs = options.userPrefs || loadTTSPreferences();
  const activeTone: PatientVoiceTone = options.toneOverride || prefs.tone || 'clinical_adaptive';
  const gender = options.caseProfile?.gender === 'male' ? 'male' : 'female';

  if (!isTTSSupported()) {
    // Fallback directly to expressive Web Audio vocal synthesizer
    return playEmotionalVocalFallback(
      options.text,
      activeTone,
      gender,
      options.onStart,
      options.onEnd
    );
  }

  // Stop any active utterance first
  stopPatientSpeech();

  const { spokenText, nonVerbalCue } = parsePatientUtteranceText(options.text);
  if (!spokenText.trim()) {
    options.onEnd?.();
    return () => {};
  }

  // Apply tone-specific phrasing & prosodic cadence (anxiety, hesitation, calm, etc.)
  let textToSpeak = formatProsodyForTone(spokenText, activeTone, options.clientState, nonVerbalCue);

  if (prefs.readNonVerbalPrefix && nonVerbalCue) {
    textToSpeak = `${nonVerbalCue}، ${textToSpeak}`;
  }

  // Resume paused synthesis engine in Blink/WebKit browsers
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  activeUtterance = utterance;

  // Calculate parameters with dynamic emotion handling
  const { pitch, rate } = calculateAcousticParameters(
    options.clientState,
    options.caseProfile,
    prefs,
    activeTone,
    options.text
  );

  utterance.pitch = pitch;
  utterance.rate = rate;
  utterance.volume = 1.0;

  // Pick best available voice with smart priority
  const voices = getSortedVoices();
  let chosenVoice: SpeechSynthesisVoice | null = null;

  if (prefs.selectedVoiceURI) {
    chosenVoice = voices.find((v) => v.voiceURI === prefs.selectedVoiceURI) || null;
  }

  if (!chosenVoice) {
    // Find Persian voice
    chosenVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('fa') ||
          v.lang.toLowerCase().includes('pes') ||
          v.name.toLowerCase().includes('persian') ||
          v.name.toLowerCase().includes('farsi')
      ) || null;
  }

  if (!chosenVoice) {
    // Fallback: Multilingual / Arabic voice capable of phonetics
    chosenVoice =
      voices.find((v) => {
        const l = v.lang.toLowerCase();
        return l.startsWith('ar') || l.startsWith('ur') || l.includes('multi');
      }) || null;
  }

  if (chosenVoice) {
    utterance.voice = chosenVoice;
    // Automatically select Persian (fa-IR) accent
    utterance.lang =
      chosenVoice.lang &&
      (chosenVoice.lang.toLowerCase().startsWith('fa') || chosenVoice.lang.toLowerCase().includes('pes'))
        ? chosenVoice.lang
        : 'fa-IR';
  } else {
    // Let browser use its native Persian/Arabic engine rather than forcing an English voice
    utterance.lang = 'fa-IR';
  }

  let hasStarted = false;

  utterance.onboundary = (event) => {
    if (event.name === 'word' || typeof event.charIndex === 'number') {
      options.onBoundary?.(event.charIndex, event.charLength || 0);
    }
  };

  utterance.onstart = () => {
    hasStarted = true;
    options.onStart?.();
    clearKeepAlive();
    // Keep alive pulse for Chrome's 15s synthesis timeout bug
    keepAliveTimer = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearKeepAlive();
      } else {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 9000);
  };

  utterance.onend = () => {
    clearKeepAlive();
    activeUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (event) => {
    clearKeepAlive();
    activeUtterance = null;
    // Don't treat user-initiated cancel as an error
    if (event.error !== 'canceled' && event.error !== 'interrupted') {
      console.warn('Speech synthesis error, activating expressive vocal fallback:', event);
      // Seamlessly fallback to expressive Web Audio vocal synthesizer
      playEmotionalVocalFallback(
        spokenText,
        activeTone,
        gender,
        options.onStart,
        options.onEnd
      );
    } else {
      options.onEnd?.();
    }
  };

  try {
    // Tiny delay to ensure previous utterance cancel has finished propagating in browser
    setTimeout(() => {
      if (activeUtterance === utterance) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);

        // Fallback watchdog: if speech didn't start within 800ms due to browser silent blocking, trigger fallback
        setTimeout(() => {
          if (!hasStarted && activeUtterance === utterance && !window.speechSynthesis.speaking) {
            console.log('SpeechSynthesis watchdog triggered: switching to vocal fallback.');
            stopPatientSpeech();
            playEmotionalVocalFallback(
              spokenText,
              activeTone,
              gender,
              options.onStart,
              options.onEnd
            );
          }
        }, 850);
      }
    }, 30);
  } catch (err) {
    clearKeepAlive();
    activeUtterance = null;
    return playEmotionalVocalFallback(
      spokenText,
      activeTone,
      gender,
      options.onStart,
      options.onEnd
    );
  }

  // Return cancel function
  return () => {
    stopPatientSpeech();
  };
}

/**
 * Stop active speech immediately across all engines
 */
export function stopPatientSpeech(): void {
  stopVocalAudioFallback();
  if (!isTTSSupported()) return;
  try {
    clearKeepAlive();
    window.speechSynthesis.cancel();
    activeUtterance = null;
  } catch (err) {
    console.warn('Error stopping speech:', err);
  }
}
