'use client';

import { useCallback, useEffect, useRef, useState, type AudioHTMLAttributes } from 'react';

export interface RimTrack {
  title: string;
  src: string;
  /** Duration hint in seconds for the playlist before metadata arrives. */
  duration?: number;
  /** Normalized 0..1 envelope; otherwise the waveform is decoded from src. */
  waveform?: readonly number[];
  /** Supply distinct IDs if two list entries share a URL. */
  id?: string;
}

export const trackKey = (track: RimTrack) => track.id ?? track.src;
const initialState = { playing: false, waiting: false, position: 0, duration: 0, error: '' };

export function useRimPlaylist(tracks: readonly RimTrack[], initialTrack: number) {
  const audio = useRef<HTMLAudioElement>(null);
  const [selection, setSelection] = useState(() => tracks[initialTrack] && trackKey(tracks[initialTrack]));
  const found = tracks.findIndex(track => trackKey(track) === selection);
  const index = found < 0 ? 0 : found;
  const track = tracks[index];
  const [state, setState] = useState(initialState);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const loaded = useRef<{ key: string; src: string } | null>(null);
  const request = useRef(0);
  const playRequested = useRef(false);

  // Assign the source synchronously inside a track click so play() stays
  // inside the user gesture, including on iOS. React never rewrites this src.
  const load = useCallback((key: string, src: string) => {
    const el = audio.current;
    if (!el || (loaded.current?.key === key && loaded.current.src === src)) return;
    request.current++;
    playRequested.current = false;
    loaded.current = { key, src };
    el.pause();
    el.src = src;
    el.load();
    setState(initialState);
  }, []);
  const key = track && trackKey(track);
  const src = track?.src;
  useEffect(() => {
    if (key !== undefined && src) load(key, src);
  }, [key, src, load]);
  useEffect(() => {
    const el = audio.current;
    return () => { request.current++; el?.pause(); };
  }, []);

  async function play() {
    const el = audio.current;
    if (!el) return;
    playRequested.current = true;
    const ticket = ++request.current;
    setState(previous => ({ ...previous, error: '' }));
    if (el.error) el.load();
    if (el.ended) el.currentTime = 0;
    try {
      await el.play();
    } catch (error) {
      if (ticket !== request.current || (error instanceof DOMException && error.name === 'AbortError')) return;
      playRequested.current = false;
      setState(previous => ({ ...previous, playing: false, waiting: false, error: 'Audio unavailable. Press Play to retry.' }));
    }
  }

  function select(next: number, start: boolean) {
    const nextTrack = tracks[next];
    if (!nextTrack) return;
    setSelection(trackKey(nextTrack));
    load(trackKey(nextTrack), nextTrack.src);
    if (start) void play();
  }

  function toggle(next = index) {
    const el = audio.current;
    if (!el || !tracks[next]) return;
    if (next !== index || el.paused || el.error) select(next, true);
    else {
      request.current++;
      playRequested.current = false;
      el.pause();
    }
  }

  function seek(value: number) {
    const el = audio.current;
    if (!el || !Number.isFinite(el.duration) || !Number.isFinite(value)) return;
    el.currentTime = Math.min(el.duration, Math.max(0, value));
    setState(previous => ({ ...previous, position: el.currentTime }));
  }

  function syncDuration(el: HTMLAudioElement) {
    if (!Number.isFinite(el.duration) || !loaded.current) return;
    const measured = el.duration;
    const url = loaded.current.src;
    setDurations(previous => previous[url] === measured ? previous : { ...previous, [url]: measured });
    setState(previous => ({ ...previous, duration: measured, position: el.currentTime }));
  }

  const events: AudioHTMLAttributes<HTMLAudioElement> = {
    preload: 'metadata',
    onLoadedMetadata: event => syncDuration(event.currentTarget),
    onDurationChange: event => syncDuration(event.currentTarget),
    onTimeUpdate: event => {
      const position = event.currentTarget.currentTime;
      setState(previous => previous.position === position ? previous : { ...previous, position });
    },
    onPlaying: () => setState(previous => ({ ...previous, playing: true, waiting: false, error: '' })),
    onPause: event => {
      if (event.currentTarget.paused && !event.currentTarget.ended) playRequested.current = false;
      setState(previous => ({ ...previous, playing: false, waiting: false }));
    },
    onWaiting: () => setState(previous => ({ ...previous, waiting: true })),
    onCanPlay: () => setState(previous => ({ ...previous, waiting: false })),
    onEnded: event => {
      if (!event.currentTarget.ended) return;
      setState(previous => ({ ...previous, playing: false, waiting: false }));
      // WebKit also emits ended when a paused listener seeks to the end.
      const advance = playRequested.current && index + 1 < tracks.length;
      playRequested.current = false;
      if (advance) select(index + 1, true);
    },
    onError: event => {
      const el = event.currentTarget;
      if (!el.error) return;
      playRequested.current = false;
      // Firefox and WebKit can keep paused=false after a failed play().
      el.pause();
      setState(previous => ({ ...previous, playing: false, waiting: false, error: 'Audio unavailable. Press Play to retry.' }));
    },
  };
  return { audio, events, track, index, ...state, durations, seek, select, toggle };
}
