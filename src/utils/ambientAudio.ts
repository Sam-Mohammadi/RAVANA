/**
 * Web Audio API Ambient Sound Synthesizer for Ravāna (روانا)
 * Generates continuous, procedural, zero-dependency clinical room acoustics:
 * - Subtle office ventilation (pink noise room presence)
 * - Classic pendulum wall clock
 * - Gentle rain outside therapy window
 * - Deep brown noise for mindfulness grounding
 * - Evening clinic calming resonance
 */

export type AmbientPresetId = 'office_hvac' | 'wall_clock' | 'gentle_rain' | 'brown_noise' | 'evening_calm';

export interface AmbientPreset {
  id: AmbientPresetId;
  name: string;
  nameEn: string;
  description: string;
  category: 'office' | 'calming' | 'nature';
  defaultVolume: number;
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: 'office_hvac',
    name: 'تهویه ملایم مطب (نویز صورتی)',
    nameEn: 'Office Room Presence (Pink Noise)',
    description: 'صدای طبیعی و محو جریان هوای اتاق درمان برای رفع سکوت دیجیتال و ایجاد حس امنیت',
    category: 'office',
    defaultVolume: 0.28,
  },
  {
    id: 'wall_clock',
    name: 'تیک‌تاک ساعت کلاسیک مطب',
    nameEn: 'Therapy Room Pendulum Clock',
    description: 'صدای ریتمیک و بسیار ملایم ساعت دیواری به همراه هوم آکوستیک آرام مطب',
    category: 'office',
    defaultVolume: 0.32,
  },
  {
    id: 'gentle_rain',
    name: 'باران ملایم پشت پنجره اتاق',
    nameEn: 'Gentle Rain Outside Window',
    description: 'صدای ملایم باران پاییزی بیرون پنجره برای فضایی دنج، تأمل‌برانگیز و همدلانه',
    category: 'nature',
    defaultVolume: 0.30,
  },
  {
    id: 'brown_noise',
    name: 'نویز قهوه‌ای عمیق (گراندینگ)',
    nameEn: 'Deep Brown Noise (Grounding)',
    description: 'فرکانس‌های بم و گرم برای کاهش تنش بدنی، تعدیل اضطراب و افزایش تمرکز بالینی',
    category: 'calming',
    defaultVolume: 0.35,
  },
  {
    id: 'evening_calm',
    name: 'غروب آرام کلینیک روان‌درمانی',
    nameEn: 'Calm Evening Clinic Ambiance',
    description: 'رزونانس آکوستیک بسیار ملایم و گرم مناسب جلسات عمیق تحلیلی و اگزیستانسیال',
    category: 'calming',
    defaultVolume: 0.25,
  }
];

export interface AmbientSoundState {
  isPlaying: boolean;
  currentPreset: AmbientPresetId;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
}

class AmbientSoundEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  
  private state: AmbientSoundState = {
    isPlaying: false,
    currentPreset: 'office_hvac',
    volume: 0.30,
    isMuted: false,
  };

  private listeners = new Set<(state: AmbientSoundState) => void>();

  constructor() {
    // Attempt to restore saved state from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedVolume = localStorage.getItem('ravana_ambient_volume');
        const savedPreset = localStorage.getItem('ravana_ambient_preset') as AmbientPresetId;
        if (savedVolume !== null) {
          this.state.volume = Math.min(1.0, Math.max(0.05, parseFloat(savedVolume)));
        }
        if (savedPreset && AMBIENT_PRESETS.some(p => p.id === savedPreset)) {
          this.state.currentPreset = savedPreset;
        }
      } catch {
        // Ignore localStorage error
      }
    }
  }

  private initContext(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return false;
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      if (!this.masterGain) {
        this.masterGain = this.audioCtx.createGain();
        this.updateMasterGainValue();
        this.masterGain.connect(this.audioCtx.destination);
      }
      return true;
    } catch (err) {
      console.warn('Could not initialize ambient AudioContext:', err);
      return false;
    }
  }

  private updateMasterGainValue(): void {
    if (!this.masterGain || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const targetGain = this.state.isMuted || !this.state.isPlaying ? 0.0001 : this.state.volume;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(targetGain, now + 0.15);
  }

  private notify(): void {
    const cloned = { ...this.state };
    this.listeners.forEach(cb => cb(cloned));
  }

  public subscribe(callback: (state: AmbientSoundState) => void): () => void {
    this.listeners.add(callback);
    callback({ ...this.state });
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getState(): AmbientSoundState {
    return { ...this.state };
  }

  public setVolume(volume: number): void {
    const clamped = Math.min(1.0, Math.max(0.0, volume));
    this.state.volume = clamped;
    this.updateMasterGainValue();
    try {
      localStorage.setItem('ravana_ambient_volume', clamped.toString());
    } catch {}
    this.notify();
  }

  public toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
    this.updateMasterGainValue();
    this.notify();
  }

  public setPreset(presetId: AmbientPresetId): void {
    if (this.state.currentPreset === presetId && this.state.isPlaying) return;
    this.state.currentPreset = presetId;
    try {
      localStorage.setItem('ravana_ambient_preset', presetId);
    } catch {}

    if (this.state.isPlaying) {
      // Smoothly switch soundscapes
      this.rebuildSoundscape();
    }
    this.notify();
  }

  public togglePlay(): void {
    if (this.state.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  public play(presetId?: AmbientPresetId): void {
    if (!this.initContext() || !this.audioCtx || !this.masterGain) return;
    if (presetId) {
      this.state.currentPreset = presetId;
    }
    this.state.isPlaying = true;
    this.rebuildSoundscape();
    this.updateMasterGainValue();
    this.notify();
  }

  public stop(): void {
    if (!this.audioCtx || !this.masterGain) {
      this.state.isPlaying = false;
      this.notify();
      return;
    }

    const now = this.audioCtx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);

    setTimeout(() => {
      this.cleanActiveNodes();
      this.state.isPlaying = false;
      this.notify();
    }, 250);
  }

  private cleanActiveNodes(): void {
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
  }

  private rebuildSoundscape(): void {
    this.cleanActiveNodes();
    if (!this.audioCtx || !this.masterGain) return;

    switch (this.state.currentPreset) {
      case 'office_hvac':
        this.buildOfficeHvacSoundscape();
        break;
      case 'wall_clock':
        this.buildWallClockSoundscape();
        break;
      case 'gentle_rain':
        this.buildGentleRainSoundscape();
        break;
      case 'brown_noise':
        this.buildBrownNoiseSoundscape();
        break;
      case 'evening_calm':
        this.buildEveningCalmSoundscape();
        break;
      default:
        this.buildOfficeHvacSoundscape();
    }
  }

  /**
   * Soundscape 1: Office HVAC / Room Presence
   * Soft, warm pink noise room presence removing dead digital silence.
   */
  private buildOfficeHvacSoundscape(): void {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;

    // Generate 5s pink noise loop
    const sampleRate = ctx.sampleRate;
    const duration = 5;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filters to shape acoustic room ventilation
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 420; // warm room muffling
    lowPass.Q.value = 0.7;

    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 75; // cut muddy sub-bass
    highPass.Q.value = 0.5;

    const nodeGain = ctx.createGain();
    nodeGain.gain.value = 0.7;

    noiseSource.connect(lowPass);
    lowPass.connect(highPass);
    highPass.connect(nodeGain);
    nodeGain.connect(this.masterGain);

    noiseSource.start();
    this.activeNodes.push(noiseSource, nodeGain);
  }

  /**
   * Soundscape 2: Classic Therapy Room Clock & Soft Air
   * Rhythmic gentle pendulum tick-tock with subtle room acoustics.
   */
  private buildWallClockSoundscape(): void {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const sampleRate = ctx.sampleRate;

    // 1. Soft room air bed
    this.buildOfficeHvacSoundscape();

    // 2. Pendulum tick-tock audio buffer (2-second loop: tick at 0.0s, tock at 1.0s)
    const loopDuration = 2.0;
    const bufferSize = Math.floor(sampleRate * loopDuration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Helper to generate a soft wooden mechanical click
    const addClick = (startTime: number, freq: number, decaySec: number, amplitude: number) => {
      const startSample = Math.floor(startTime * sampleRate);
      const length = Math.floor(decaySec * sampleRate);
      for (let i = 0; i < length && startSample + i < bufferSize; i++) {
        const t = i / sampleRate;
        // Wood resonant transient + subtle noise burst
        const sine = Math.sin(2 * Math.PI * freq * t);
        const noise = (Math.random() * 2 - 1) * 0.35;
        const env = Math.exp(-t * 80); // fast decay
        data[startSample + i] += (sine + noise) * env * amplitude;
      }
    };

    // Tick (slightly higher pitch 1050 Hz)
    addClick(0.02, 1050, 0.04, 0.18);
    // Tock (slightly lower pitch 820 Hz)
    addClick(1.02, 820, 0.045, 0.15);

    const clockSource = ctx.createBufferSource();
    clockSource.buffer = buffer;
    clockSource.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 950;
    bandpass.Q.value = 1.2;

    const clockGain = ctx.createGain();
    clockGain.gain.value = 0.55;

    clockSource.connect(bandpass);
    bandpass.connect(clockGain);
    clockGain.connect(this.masterGain);

    clockSource.start();
    this.activeNodes.push(clockSource, clockGain);
  }

  /**
   * Soundscape 3: Gentle Rain Outside Window
   * Atmospheric gentle rain against the glass, soothing and reflective.
   */
  private buildGentleRainSoundscape(): void {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const sampleRate = ctx.sampleRate;
    const duration = 6;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Multi-pole noise algorithm for rainfall texture
    let lastLeft = 0;
    let lastRight = 0;
    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;
      lastLeft = (lastLeft + 0.04 * whiteL) / 1.04;
      lastRight = (lastRight + 0.04 * whiteR) / 1.04;
      left[i] = (lastLeft * 0.7 + whiteL * 0.08) * 0.4;
      right[i] = (lastRight * 0.7 + whiteR * 0.08) * 0.4;
    }

    const rainSource = ctx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;

    // Filters for window pane dampening
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 1200;
    lowPass.Q.value = 0.5;

    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 180;
    highPass.Q.value = 0.6;

    // Slow LFO for natural rainfall breeze dynamics
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.18; // every 5.5 seconds
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.6;

    lfo.connect(lfoGain);
    lfoGain.connect(rainGain.gain);

    rainSource.connect(lowPass);
    lowPass.connect(highPass);
    highPass.connect(rainGain);
    rainGain.connect(this.masterGain);

    rainSource.start();
    lfo.start();
    this.activeNodes.push(rainSource, lfo, rainGain);
  }

  /**
   * Soundscape 4: Deep Brown Noise (Grounding)
   * Deep Brownian warm rumble for nervous system regulation and grounding.
   */
  private buildBrownNoiseSoundscape(): void {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const sampleRate = ctx.sampleRate;
    const duration = 6;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      data[i] = lastOut * 0.8;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 260; // deep soothing warmth
    lowpass.Q.value = 0.7;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 45; // protect from sub-woofer clipping
    highpass.Q.value = 0.5;

    const nodeGain = ctx.createGain();
    nodeGain.gain.value = 0.8;

    source.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(nodeGain);
    nodeGain.connect(this.masterGain);

    source.start();
    this.activeNodes.push(source, nodeGain);
  }

  /**
   * Soundscape 5: Evening Calm Clinic Ambiance
   * Soft room resonance with subtle harmonic undertones.
   */
  private buildEveningCalmSoundscape(): void {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;

    // 1. Very gentle pink noise base
    this.buildOfficeHvacSoundscape();

    // 2. Subtle, meditative warm room acoustic drone (55Hz A1 root and 110Hz A2 harmonic)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55;

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 110;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.045; // ultra soft, almost subliminal

    osc1.connect(droneGain);
    osc2.connect(droneGain);
    droneGain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    this.activeNodes.push(osc1, osc2, droneGain);
  }
}

// Singleton engine instance
export const ambientAudioEngine = new AmbientSoundEngine();
