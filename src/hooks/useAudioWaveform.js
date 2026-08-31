import { useEffect, useRef, useState } from 'react';

export const AUDIO_WAVEFORM_BAR_COUNT = 48;

const useAudioWaveform = (mediaStream, isActive) => {
  const [levels, setLevels] = useState(() => Array(AUDIO_WAVEFORM_BAR_COUNT).fill(0.12));
  const rafRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const prevRef = useRef(Array(AUDIO_WAVEFORM_BAR_COUNT).fill(0.12));

  useEffect(() => {
    if (!isActive || !mediaStream) {
      return undefined;
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const half = Math.ceil(AUDIO_WAVEFORM_BAR_COUNT / 2);
    const center = (AUDIO_WAVEFORM_BAR_COUNT - 1) / 2;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const usable = Math.max(half, Math.floor(data.length * 0.55));
      const chunkSize = Math.max(1, Math.floor(usable / half));
      const bins = Array.from({ length: half }, (_, index) => {
        const start = index * chunkSize;
        const slice = data.slice(start, start + chunkSize);
        const avg = slice.reduce((sum, value) => sum + value, 0) / (slice.length || 1);
        return Math.min(1, avg / 165);
      });

      const nextLevels = Array.from({ length: AUDIO_WAVEFORM_BAR_COUNT }, (_, index) => {
        const dist = Math.min(half - 1, Math.round(Math.abs(index - center)));
        const target = bins[dist] ?? 0.12;
        const prev = prevRef.current[index] ?? 0.12;
        return prev * 0.38 + target * 0.62;
      });

      prevRef.current = nextLevels;
      setLevels(nextLevels);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      source.disconnect();
      analyser.disconnect();
      audioContext.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    };
  }, [isActive, mediaStream]);

  return levels;
};

export default useAudioWaveform;
