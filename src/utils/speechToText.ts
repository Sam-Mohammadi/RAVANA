/**
 * Web Speech API Voice-to-Text (Speech Recognition) Utility for Ravāna (روانا)
 * Allows psychology students to speak their therapeutic responses in real-time.
 */

// Interface declarations for Web Speech API to satisfy TypeScript
export interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindowWithSpeech;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

/**
 * Check browser microphone permission state ('granted' | 'prompt' | 'denied' | 'unsupported')
 */
export async function queryMicrophonePermission(): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unsupported';
  }
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return status.state as 'granted' | 'prompt' | 'denied';
  } catch {
    return 'unsupported';
  }
}

/**
 * Pre-emptively request microphone permission via getUserMedia to trigger the browser prompt cleanly.
 */
export async function requestMicrophoneAccess(): Promise<{ granted: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { granted: false, error: 'مرورگر شما از دسترسی به میکروفون پشتیبانی نمی‌کند.' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately so mic isn't held open until recognition starts
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return { 
        granted: false, 
        error: 'دسترسی به میکروفون توسط کاربر یا تنظیمات مرورگر مسدود شده است. لطفاً در نوار آدرس روی آیکون قفل/میکروفون کلیک کرده و دسترسی را مجاز (Allow) کنید.' 
      };
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return { 
        granted: false, 
        error: 'هیچ میکروفونی متصل به دستگاه شما یافت نشد. لطفاً اتصال هدست یا میکروفون خود را بررسی کنید.' 
      };
    }
    return { 
      granted: false, 
      error: `امکان دسترسی به میکروفون فراهم نشد: ${err.message || err.name || 'خطای نامشخص'}` 
    };
  }
}

/**
 * Automatically converts spoken clinical punctuation commands into proper Persian punctuation marks.
 * Example: "احساس تنهایی می‌کنید علامت سوال" -> "احساس تنهایی می‌کنید؟"
 */
export function formatPersianSpokenPunctuation(text: string): string {
  if (!text) return text;
  return text
    .replace(/\s+(نقطه|دات)\b/gi, '.')
    .replace(/\s+(ویرگول|کاما)\b/gi, '،')
    .replace(/\s+(علامت\s+سوال|علامت\s+پرسش|علامت\s+پرسشی)\b/gi, '؟')
    .replace(/\s+(علامت\s+تعجب)\b/gi, '!')
    .replace(/\s+(دو\s*نقطه)\b/gi, ':')
    .replace(/\s+(خط\s*بعد|سطر\s*بعد|پاراگراف\s*بعدی|پاراگراف\s*جدید)\b/gi, '\n')
    .replace(/\s+(گیومه\s*باز)\b/gi, ' «')
    .replace(/\s+(گیومه\s*بسته)\b/gi, '» ')
    .replace(/\s+(پرانتز\s*باز)\b/gi, ' (')
    .replace(/\s+(پرانتز\s*بسته)\b/gi, ') ');
}

/**
 * Play a gentle Web Audio chime for microphone activation / deactivation feedback.
 */
export function playMicChime(type: 'start' | 'stop' | 'send'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      // Pleasant rising chord (440Hz -> 659Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.23);
    } else if (type === 'send') {
      // Crisp completion chime (523Hz -> 784Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.14);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.26);
    } else {
      // Gentle descending tone (554Hz -> 370Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(554.37, now);
      osc.frequency.exponentialRampToValueAtTime(369.99, now + 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.21);
    }

    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 400);
  } catch {
    // AudioContext blocked or not allowed, ignore silently
  }
}

export interface SpeechToTextConfig {
  lang?: string; // Default: 'fa-IR'
  continuous?: boolean; // Default: true
  interimResults?: boolean; // Default: true
  enableAudioMeter?: boolean; // Default: true
  onStart?: () => void;
  onInterim?: (interimText: string) => void;
  onResult?: (finalText: string) => void;
  onError?: (errorMessage: string, errorCode?: string) => void;
  onEnd?: () => void;
  onVolumeChange?: (volumePercentage: number) => void;
}

export class SpeechToTextSession {
  private recognition: any = null;
  private isExplicitlyStopped = false;
  private config: SpeechToTextConfig;
  private active = false;
  private consecutiveErrors = 0;
  private restartTimer: number | null = null;
  
  // AudioContext meter variables
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private meterAnimationId: number | null = null;

  constructor(config: SpeechToTextConfig) {
    this.config = config;
  }

  public get isActive(): boolean {
    return this.active;
  }

  private startAudioMeter(): void {
    if (this.config.enableAudioMeter === false || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (this.isExplicitlyStopped || !this.active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        this.audioStream = stream;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        this.audioContext = new AudioContextClass();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 64;
        this.analyserNode.smoothingTimeConstant = 0.6;
        source.connect(this.analyserNode);

        const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

        const updateMeter = () => {
          if (!this.active || this.isExplicitlyStopped || !this.analyserNode) {
            return;
          }
          this.analyserNode.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          // Scale from 0-128 range to 0-100 percentage
          const volume = Math.min(100, Math.round((average / 110) * 100));
          this.config.onVolumeChange?.(volume);
          this.meterAnimationId = requestAnimationFrame(updateMeter);
        };

        this.meterAnimationId = requestAnimationFrame(updateMeter);
      })
      .catch(() => {
        // Microphone stream could not be separately opened for metering; ignore gracefully
      });
  }

  private stopAudioMeter(): void {
    if (this.meterAnimationId !== null) {
      cancelAnimationFrame(this.meterAnimationId);
      this.meterAnimationId = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyserNode = null;
    this.config.onVolumeChange?.(0);
  }

  private initRecognition(): boolean {
    const win = window as unknown as IWindowWithSpeech;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      this.config.onError?.(
        'مرورگر شما از قابلیت تبدیل صوت به متن (Web Speech Recognition) پشتیبانی نمی‌کند. لطفاً از مرورگر Google Chrome یا Edge استفاده کنید.',
        'not-supported'
      );
      return false;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.lang = this.config.lang || 'fa-IR';
      this.recognition.continuous = this.config.continuous ?? true;
      this.recognition.interimResults = this.config.interimResults ?? true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.active = true;
        this.consecutiveErrors = 0;
        this.config.onStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0]?.transcript || '';
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript.trim()) {
          const formattedFinal = formatPersianSpokenPunctuation(finalTranscript.trim());
          this.config.onResult?.(formattedFinal);
        }

        if (this.config.onInterim) {
          this.config.onInterim(interimTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        const error = event.error;

        // 'no-speech' is triggered when the student takes a clinical breath or pauses to think; do not crash
        if (error === 'no-speech' || error === 'aborted') {
          return;
        }

        this.consecutiveErrors++;
        let persianMsg = 'خطا در تشخیص صدا.';

        switch (error) {
          case 'not-allowed':
          case 'service-not-allowed':
            persianMsg = 'مجوز استفاده از میکروفون توسط مرورگر رد شده است. لطفاً دسترسی به میکروفون را مجاز کنید.';
            this.isExplicitlyStopped = true;
            break;
          case 'network':
            persianMsg = 'خطای شبکه در اتصال به سرویس تبدیل گفتار به متن.';
            break;
          case 'audio-capture':
            persianMsg = 'میکروفونی پیدا نشد یا میکروفون در حال استفاده توسط برنامه دیگری است.';
            this.isExplicitlyStopped = true;
            break;
          default:
            persianMsg = `خطای صوتی: ${error}`;
        }

        this.config.onError?.(persianMsg, error);
      };

      this.recognition.onend = () => {
        // If Chrome timed out after a pause while still active and not explicitly stopped, restart seamlessly
        if (!this.isExplicitlyStopped && (this.config.continuous ?? true) && this.consecutiveErrors < 3) {
          if (this.restartTimer) {
            window.clearTimeout(this.restartTimer);
          }
          this.restartTimer = window.setTimeout(() => {
            if (!this.isExplicitlyStopped) {
              try {
                this.initRecognition();
                this.recognition?.start();
              } catch {
                this.active = false;
                this.stopAudioMeter();
                this.config.onEnd?.();
              }
            }
          }, 120);
          return;
        }

        this.active = false;
        this.stopAudioMeter();
        this.config.onEnd?.();
      };

      return true;
    } catch (err: any) {
      this.active = false;
      this.stopAudioMeter();
      this.config.onError?.(`امکان فعال‌سازی میکروفون وجود ندارد: ${err?.message || err}`, 'start-failed');
      return false;
    }
  }

  public start(): boolean {
    if (!isSpeechRecognitionSupported()) {
      this.config.onError?.(
        'مرورگر شما از قابلیت تبدیل صوت به متن (Web Speech Recognition) پشتیبانی نمی‌کند. لطفاً از مرورگر Google Chrome یا Edge استفاده کنید.',
        'not-supported'
      );
      return false;
    }

    if (this.recognition) {
      this.stop();
    }

    this.isExplicitlyStopped = false;
    this.consecutiveErrors = 0;

    const initialized = this.initRecognition();
    if (!initialized) return false;

    try {
      this.recognition.start();
      this.startAudioMeter();
      return true;
    } catch (err: any) {
      this.active = false;
      this.config.onError?.(`امکان شروع ضبط گفتار وجود ندارد: ${err?.message || err}`, 'start-failed');
      return false;
    }
  }

  public stop(): void {
    this.isExplicitlyStopped = true;
    this.active = false;
    if (this.restartTimer) {
      window.clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.stopAudioMeter();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        try {
          this.recognition.abort();
        } catch {}
      }
      this.recognition = null;
    }
    this.config.onEnd?.();
  }

  public abort(): void {
    this.isExplicitlyStopped = true;
    this.active = false;
    if (this.restartTimer) {
      window.clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.stopAudioMeter();
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    this.config.onEnd?.();
  }
}

