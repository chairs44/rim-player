'use client';

import { useEffect, useLayoutEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import './player.css';
import { playerMotion, transportPath, liquidEnvelope } from './motion';

export type AudioPlayerProps = {
  src: string; label?: string; initialExpanded?: boolean;
  mode?: 'toggle' | 'compact' | 'expanded'; theme?: 'light' | 'dark';
  className?: string; style?: CSSProperties;
};

const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const timeLabel = (s: number) => `${Math.floor(s / 60)} minutes ${Math.floor(s % 60)} seconds`;

// Remount only when the media source changes, never when the display collapses.
export function AudioPlayer(props: AudioPlayerProps) {
  return <Player key={props.src} {...props}/>;
}
function Player({ src, label = 'Audio', initialExpanded, mode = 'toggle', theme = 'light', className = '', style }: AudioPlayerProps) {
  const host = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const userChoice = useRef(false);
  const initialized = useRef(false);
  const [expanded, setExpanded] = useState(initialExpanded ?? false);
  const open = mode === 'expanded' || (mode !== 'compact' && expanded);
  const [available, setAvailable] = useState(506);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState('');
  const [peaks, setPeaks] = useState<number[]>([]);
  const [waveError, setWaveError] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const screenId = useId();
  const fusionId = `fusion-${screenId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const reduce = useReducedMotion();
  const phase = useSpring(open ? 1 : 0, playerMotion.bubble);
  const glyph = useSpring(playing ? 1 : 0, playerMotion.glyph);
  const glyphPath = useTransform(glyph, transportPath);
  const toggleMode = useMotionValue(mode === 'toggle' ? 1 : 0);
  const hasToggle = mode === 'toggle';
  const playback = useMotionValue(0);
  const progressWidth = useTransform(playback, p => `${clamp(p) * 100}%`);
  const playX = useTransform(() => 34 * clamp(phase.get()) * toggleMode.get());
  const playWidth = useTransform(phase, p => 53 + 7 * clamp(p));
  const shellWidth = useTransform(playWidth, w => w - 1);
  // Stretch at contact, swell during absorption, then release the same way.
  // All deformations share the horizontal centreline and reverse continuously.
  const contact = useTransform(phase, p => Math.sin(Math.PI * clamp(p)) ** .7);
  const absorbed = useTransform(phase, p => Math.sin(Math.PI * clamp(p)) ** 2);
  const playScaleX = useTransform(() => 1 + .13 * contact.get() - .17 * absorbed.get());
  const playScaleY = useTransform(() => 1 - .08 * contact.get() + .25 * absorbed.get());
  const toggleScaleX = useTransform(contact, p => 1 + .38 * p);
  const toggleScaleY = useTransform(contact, p => 1 - .24 * p);
  // Full fusion during contact: don't crossfade overlapping vector outlines.
  // Ease back into SourceGraphic before rest, with no final-frame filter swap.
  const fusionMix = useTransform(phase, liquidEnvelope);
  const vectorMix = useTransform(fusionMix, p => 1 - p);
  const fusionBlur = useTransform(contact, p => 5.5 * p);
  const toggleIconScale = useTransform(phase, [0,.28,.72,1], [1,0,0,1]);
  const toggleX = useTransform(phase, p => 55 * (1 - clamp(p)));
  const screenX = useTransform(() => 62 + toggleMode.get() * (-7 + 41 * clamp(phase.get())));
  const screenWidth = Math.max(48, Math.min(410, available - (hasToggle ? 96 : 62)));
  const widthValue = useMotionValue(screenWidth);
  const revealWidth = useTransform(() => widthValue.get() * clamp(phase.get()));
  const revealHeight = useTransform(phase, p => 48 * Math.pow(clamp(p), .45) + 5 * Math.sin(Math.PI * clamp(p)));
  const revealY = useTransform(revealHeight, h => (53-h)/2);
  const bridgePath = useTransform(() => {
    const p = clamp(phase.get()); const stretch = Math.sin(Math.PI*p);
    const x = 52 + 34*p*toggleMode.get(); const end = screenX.get()+15;
    const cy = 26.5; const r = 15*stretch;
    return `M${x} ${cy-r} C${x+10} ${cy-r*.25} ${end-12} ${cy-r*.25} ${end} ${cy-r} L${end} ${cy+r} C${end-12} ${cy+r*.25} ${x+10} ${cy+r*.25} ${x} ${cy+r}Z`;
  });
  const bridgeOpacity = useTransform(phase, [0,.15,.7,1], [0,1,.8,0]);
  const revealOpacity = useTransform(phase, p => p <= .001 ? 0 : 1);
  useLayoutEffect(() => {
    // Responsive collapse or a locked-mode change must not strand keyboard
    // focus in the now-hidden seek control.
    const node = host.current;
    if (!open && node?.querySelector('.apc-rim')?.contains(document.activeElement)) {
      node.querySelector<HTMLButtonElement>(hasToggle ? '.apc-toggle' : '.apc-play')?.focus();
    }
  }, [open, hasToggle]);
  useEffect(() => { toggleMode.set(hasToggle ? 1 : 0); }, [hasToggle, toggleMode]);
  useEffect(() => { if (reduce) glyph.jump(playing ? 1 : 0); else glyph.set(playing ? 1 : 0); }, [playing, reduce, glyph]);
  useEffect(() => { widthValue.set(screenWidth); }, [screenWidth, widthValue]);
  useEffect(() => { if (reduce) phase.jump(open ? 1 : 0); else phase.set(open ? 1 : 0); }, [open, reduce, phase]);
  useEffect(() => {
    const node = host.current!;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(node);
    const query = matchMedia('(min-width: 640px)');
    const resize = () => { if (!userChoice.current && initialExpanded === undefined) setExpanded(query.matches); };
    // Server and hydration render the same state. Adopt the viewport only
    // after mount, jumping the initial shell rather than animating an entrance.
    if (!initialized.current) {
      initialized.current = true;
      if (initialExpanded === undefined) {
        resize();
        phase.jump(mode === 'expanded' || (mode === 'toggle' && query.matches) ? 1 : 0);
      }
    }
    query.addEventListener('change', resize);
    return () => { observer.disconnect(); query.removeEventListener('change', resize); };
  }, [initialExpanded, mode, phase]);
  useEffect(() => {
    const abort = new AbortController();
    let context: AudioContext | undefined;
    (async () => {
      try {
        const response = await fetch(src, { signal: abort.signal });
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
        const max = Math.max(...values, .00001);
        setPeaks(values.map(p => p / max));
      } catch { if (!abort.signal.aborted) setWaveError(true); }
      finally { if (context && context.state !== 'closed') void context.close(); }
    })();
    return () => { abort.abort(); };
  }, [src]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const el = audio.current;
      if (el && Number.isFinite(el.duration) && el.duration > 0) playback.set(el.currentTime / el.duration);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, playback]);
  const bars = useMemo(() => {
    const count = Math.max(12, Math.floor((screenWidth - 4) / 4));
    return Array.from({ length: count }, (_, i) => {
      const p = peaks[Math.min(peaks.length - 1, Math.floor(i / count * peaks.length))] ?? 0;
      const h = Math.max(2, p * 48);
      return <rect key={i} x={i * 4} y={(44 - h) / 2} width="2.5" height={h} rx="1.25"/>;
    });
  }, [peaks, screenWidth]);
  function seek(value: number) {
    if (!audio.current || !duration) return;
    const next = clamp(value, 0, duration);
    audio.current.currentTime = next; setPosition(next); playback.set(next / duration);
  }
  async function togglePlayback() {
    const el = audio.current!;
    if (!el.paused) { el.pause(); return; }
    try {
      setError('');
      if (el.error) el.load();
      if (el.ended) seek(0);
      await el.play();
    } catch { setError('Audio could not play. Press Play to retry or choose another file.'); }
  }
  const wave = <svg width={screenWidth - 4} height="44" viewBox={`0 0 ${screenWidth - 4} 44`} aria-hidden="true">{bars}</svg>;
  return <div ref={host} className={`apc ${className}`} data-theme={theme} data-expanded={open} data-mode={mode} style={style} role="group" aria-label={label}>
    <audio ref={audio} src={src} preload="metadata"
      onLoadedMetadata={e => { const d = e.currentTarget.duration; setDuration(Number.isFinite(d) ? d : 0); }}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      onWaiting={() => setWaiting(true)} onPlaying={() => setWaiting(false)} onCanPlay={() => setWaiting(false)}
      onTimeUpdate={e => { setPosition(e.currentTarget.currentTime); if (duration) playback.set(e.currentTarget.currentTime / duration); }}
      onEnded={() => { setPlaying(false); setWaiting(false); }}
      onError={() => { setPlaying(false); setWaiting(false); setError('Audio unavailable. Press Play to retry or choose another file.'); }}/>
    <div className="apc-stage">
      {hasToggle ? <svg className="apc-shells" width="100" height="53" aria-hidden="true">
        <defs><filter id={fusionId} x="-25%" y="-60%" width="150%" height="220%" colorInterpolationFilters="sRGB">
          <motion.feGaussianBlur in="SourceAlpha" stdDeviation={reduce ? 0 : fusionBlur}/>
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="body"/>
          <feMorphology in="body" operator="dilate" radius=".5" result="edge"/>
          <feFlood floodColor="var(--apc-border)" result="border"/><feComposite in="border" in2="edge" operator="in" result="outline"/>
          <feFlood floodColor="var(--apc-bg)" result="surface"/><feComposite in="surface" in2="body" operator="in" result="inside"/>
          <feMerge result="fused"><feMergeNode in="outline"/><feMergeNode in="inside"/></feMerge>
          <motion.feComposite in="fused" in2="SourceGraphic" operator="arithmetic" k1="0" k2={reduce ? 0 : fusionMix} k3={reduce ? 1 : vectorMix} k4="0"/>
        </filter></defs>
        <motion.g filter={`url(#${fusionId})`} fill="var(--apc-bg)" stroke="var(--apc-border)" strokeWidth="1">
          <motion.rect x=".5" y=".5" width={shellWidth} height="52" rx="26" style={{x:playX,scaleX:reduce?1:playScaleX,scaleY:reduce?1:playScaleY}}/>
          <motion.circle cx="16" cy="26.5" r="15.5" style={{x:toggleX,scaleX:reduce?1:toggleScaleX,scaleY:reduce?1:toggleScaleY}}/>
        </motion.g>
      </svg> : null}
      {hasToggle && !reduce ? <svg className="apc-bridge" width="100" height="60" aria-hidden="true"><motion.path d={bridgePath} style={{opacity:bridgeOpacity}}/></svg> : null}
      <motion.button type="button" className="apc-play" style={{ x: playX, width: playWidth, scaleX: reduce ? 1 : playScaleX, scaleY: reduce ? 1 : playScaleY }} onClick={togglePlayback} aria-label={playing ? 'Pause' : 'Play'} aria-busy={waiting}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <motion.path className="apc-transport" d={glyphPath} fillRule="evenodd"/>
        </svg>
      </motion.button>
      {hasToggle ? <motion.button type="button" className="apc-toggle" style={{ x: toggleX, scaleX: reduce ? 1 : toggleScaleX, scaleY: reduce ? 1 : toggleScaleY }} aria-label={open ? 'Collapse waveform' : 'Expand waveform'} aria-expanded={open} aria-controls={screenId} onClick={() => { userChoice.current = true; setExpanded(v => !v); }}>
        <motion.svg style={{scale:reduce ? 1 : toggleIconScale}} width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><motion.path initial={false} animate={{ d: open ? 'M8 3V8H3M16 3V8H21M21 16H16V21M3 16H8V21' : 'M8 3H3V8M16 3H21V8M21 16V21H16M8 21H3V16' }} transition={reduce ? {duration:0} : {type:'spring', ...playerMotion.glyph}}/></motion.svg>
      </motion.button> : null}
      <motion.div id={screenId} className="apc-rim" aria-hidden={!open} style={{ x: screenX, y: revealY, width: revealWidth, height: revealHeight, opacity: revealOpacity, pointerEvents: open ? 'auto' : 'none' }}>
        <div className="apc-screen">
          <div className="apc-wave-reveal">
          <div className="apc-wave" style={{width:screenWidth - 4}}>{wave}</div>
          <motion.div className="apc-played" style={{width:progressWidth}}><div className="apc-wave" style={{width:screenWidth - 4}}>{wave}</div></motion.div>
          <motion.div className="apc-head" style={{left:progressWidth}}/>
          </div>
          <input type="range" aria-label={`Seek ${label}`} aria-valuetext={`${timeLabel(position)} of ${timeLabel(duration)}`} min="0" max={duration || 1} step="0.1" value={position} disabled={!duration || !!error} tabIndex={open ? 0 : -1} onChange={e => seek(Number(e.target.value))}
            onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); seek(position + (e.key === 'ArrowRight' ? 5 : -5)); } }}/>
        </div>
      </motion.div>
    </div>
    <span className="apc-sr" role="status">{waiting ? 'Buffering audio' : ''}</span>
    {error ? <p className="apc-message" role="alert">{error}</p> : waveError ? <p className="apc-message" role="status">Waveform unavailable. Audio and seeking remain available.</p> : null}
  </div>;
}
