import React, { useEffect, useRef } from 'react';

export type VisualizerMode = 
  | 'idle'
  | 'listening-therapist'
  | 'therapist-speaking'
  | 'patient-thinking'
  | 'patient-speaking'
  | 'muted';

interface AudioWaveVisualizerProps {
  mode: VisualizerMode;
  audioLevel?: number; // 0 to 100
  accentColor?: string; // Tailwind color class or hex
  barsCount?: number;
  height?: number;
}

export const AudioWaveVisualizer: React.FC<AudioWaveVisualizerProps> = ({
  mode,
  audioLevel = 0,
  barsCount = 28,
  height = 56,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      phaseRef.current += 0.05;
      const phase = phaseRef.current;

      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      const centerY = h / 2;
      const barWidth = Math.max(3, (width - (barsCount - 1) * 3) / barsCount);

      // Determine styling and amplitudes based on mode
      for (let i = 0; i < barsCount; i++) {
        const normalizedIndex = (i - barsCount / 2) / (barsCount / 2);
        const centerBell = Math.cos(normalizedIndex * (Math.PI / 2.2)); // Higher in center
        let barHeight = 4; // minimum height

        if (mode === 'therapist-speaking') {
          // Dynamic bars driven by audioLevel + varied harmonic frequencies
          const rawAmp = (audioLevel / 100) * (h * 0.85);
          const wave = Math.sin(phase * 2 + i * 0.4) * 0.3 + 0.7;
          barHeight = Math.max(4, Math.min(h * 0.9, rawAmp * centerBell * wave + 6));
        } else if (mode === 'listening-therapist') {
          // Subtle gentle ambient ripple indicating active listening
          const wave = Math.sin(phase * 1.5 + i * 0.3) * 0.5 + 0.5;
          barHeight = 4 + wave * 8 * centerBell;
        } else if (mode === 'patient-speaking') {
          // Vocal prosody waveform
          const wave1 = Math.sin(phase * 3 + i * 0.35);
          const wave2 = Math.cos(phase * 1.8 + i * 0.2);
          const combined = Math.abs(wave1 * 0.6 + wave2 * 0.4);
          barHeight = Math.max(6, combined * (h * 0.75) * centerBell + 6);
        } else if (mode === 'patient-thinking') {
          // Meditative calm breathing wave
          const breathe = (Math.sin(phase * 0.8) + 1) / 2;
          const ripple = Math.sin(phase * 1.2 + i * 0.2) * 0.4 + 0.6;
          barHeight = Math.max(4, (breathe * 16 + 6) * centerBell * ripple);
        } else if (mode === 'muted') {
          barHeight = 3;
        } else {
          barHeight = 4;
        }

        const x = i * (barWidth + 3);
        const y = centerY - barHeight / 2;
        const radius = Math.min(barWidth / 2, 4);

        // Color gradient per bar
        let fillStyle = '#0d9488'; // teal default
        if (mode === 'therapist-speaking') {
          fillStyle = '#059669'; // emerald
        } else if (mode === 'listening-therapist') {
          fillStyle = '#14b8a6'; // teal-500
        } else if (mode === 'patient-speaking') {
          fillStyle = '#4f46e5'; // indigo
        } else if (mode === 'patient-thinking') {
          fillStyle = '#d97706'; // amber
        } else if (mode === 'muted') {
          fillStyle = '#cbd5e1'; // slate-300
        }

        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mode, audioLevel, barsCount]);

  return (
    <div className="w-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={barsCount * 7}
        height={height}
        className="max-w-full h-auto"
      />
    </div>
  );
};
