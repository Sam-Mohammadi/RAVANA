/**
 * Real-time microphone audio level analyzer using Web Audio API
 */

export class MicVolumeTracker {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private onLevelChange: (level: number) => void;
  private isListening = false;

  constructor(onLevelChange: (level: number) => void) {
    this.onLevelChange = onLevelChange;
  }

  public async start(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;

      this.sourceNode.connect(this.analyser);
      this.isListening = true;

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const update = () => {
        if (!this.isListening || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);

        // Compute average level across frequency bins
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Normalize 0-255 to 0-100 with a slight boost for soft speech
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        this.onLevelChange(normalized);
        this.animationFrameId = requestAnimationFrame(update);
      };

      update();
      return true;
    } catch (err) {
      console.warn('Microphone volume tracker initialization error:', err);
      this.stop();
      return false;
    }
  }

  public stop(): void {
    this.isListening = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
    this.onLevelChange(0);
  }
}
