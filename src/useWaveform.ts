'use client';

import { useEffect, useState } from 'react';

const empty: readonly number[] = [];
type Result = { src: string; peaks: readonly number[]; failed: boolean };

/** Rim's original 512-bin RMS envelope, shared by both waveform skins. */
export function useWaveform(src?: string, supplied?: readonly number[]) {
  const [result, setResult] = useState<Result>();
  useEffect(() => {
    if (!src || supplied?.length) return;
    const abort = new AbortController();
    let context: AudioContext | undefined;
    async function decode(url: string) {
      try {
        const response = await fetch(url, { signal: abort.signal });
        if (!response.ok) throw new Error('Media request failed');
        const bytes = await response.arrayBuffer();
        if (abort.signal.aborted) return;
        context = new AudioContext();
        const buffer = await context.decodeAudioData(bytes);
        if (abort.signal.aborted) return;
        const data = buffer.getChannelData(0);
        const count = 512;
        const values = Array.from({ length: count }, (_, i) => {
          const start = Math.floor(i * data.length / count);
          const end = Math.floor((i + 1) * data.length / count);
          let sum = 0;
          for (let j = start; j < end; j++) sum += data[j] * data[j];
          return Math.sqrt(sum / Math.max(1, end - start));
        });
        const max = Math.max(...values, 0.00001);
        setResult({ src: url, peaks: values.map(value => value / max), failed: false });
      } catch {
        if (!abort.signal.aborted) setResult({ src: url, peaks: empty, failed: true });
      } finally {
        if (context && context.state !== 'closed') void context.close();
      }
    }
    void decode(src);
    return () => abort.abort();
  }, [src, supplied]);
  if (supplied?.length) return { peaks: supplied, waveError: false };
  return { peaks: result?.src === src ? result?.peaks ?? empty : empty, waveError: !!result && result.src === src && result.failed };
}
