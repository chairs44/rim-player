'use client';

import { useId, useMemo, type CSSProperties } from 'react';
import { formatTime } from './audioTime';
import { trackKey, useRimPlaylist, type RimTrack } from './useRimPlaylist';
import { useWaveform } from './useWaveform';
import './variants.css';

export type { RimTrack } from './useRimPlaylist';
export type SingleVariant = 'fine-rail' | 'waveform';
export type PlaylistVariant = 'inline' | 'inline-no-time' | 'shared';
export type RimVariant = SingleVariant | PlaylistVariant;
type Props = { label?: string; className?: string } & (
  { variant: SingleVariant; track: RimTrack } |
  { variant: PlaylistVariant; tracks: readonly RimTrack[]; initialTrack?: number }
);

type Transport = ReturnType<typeof useRimPlaylist>;

function Glyph({ kind }: { kind: 'play' | 'pause' | 'previous' | 'next' }) {
  if (kind === 'pause') return <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="3.5" width="3.4" height="13" rx="1"/><rect x="11.6" y="3.5" width="3.4" height="13" rx="1"/></svg>;
  if (kind === 'play') return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3.7c0-.7.8-1.1 1.4-.7l9 5.9c.6.4.6 1.1 0 1.5l-9 5.9c-.6.4-1.4 0-1.4-.7z"/></svg>;
  return <svg viewBox="0 0 20 20" aria-hidden="true"><g transform={kind === 'previous' ? 'translate(20 0) scale(-1 1)' : undefined}><path d="M3 4.9c0-.6.6-1 1.1-.6l7.1 5.1c.4.3.4.9 0 1.2l-7.1 5.1c-.5.4-1.1 0-1.1-.6z"/><rect x="14" y="4" width="2" height="12" rx=".6"/></g></svg>;
}

function PlayButton({ player, index = player.index, withTitle = false, title }: {
  player: Transport; index?: number; withTitle?: boolean; title: string;
}) {
  const playing = player.index === index && player.playing;
  return <button type="button" className={withTitle ? 'rim-row-play' : 'rim-play'} onClick={() => player.toggle(index)}
    aria-label={`${playing ? 'Pause' : 'Play'} ${title}`} aria-busy={player.index === index && player.waiting}>
    <span className="rim-disc" data-playing={playing}><Glyph kind={playing ? 'pause' : 'play'}/></span>
    {withTitle && <span className="rim-title" title={title}>{title}</span>}
  </button>;
}

function WaveInk({ peaks, progress }: { peaks: readonly number[]; progress: number }) {
  const clip = useId();
  const path = useMemo(() => {
    const count = Math.min(92, peaks.length);
    return Array.from({ length: count }, (_, i) => {
      const level = peaks[Math.floor(i * peaks.length / count)];
      const height = 2 + Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0)) * 17;
      return `M${((i + 0.5) * 274 / count).toFixed(2)} ${((22 - height) / 2).toFixed(2)}v${height.toFixed(2)}`;
    }).join(' ');
  }, [peaks]);
  return <svg data-waveform="" viewBox="0 0 274 22" preserveAspectRatio="none" aria-hidden="true">
    <defs><clipPath id={clip}><rect width={274 * progress} height="22"/></clipPath></defs>
    <g fill="none" strokeWidth="1.75" strokeLinecap="round">
      <path d={path} stroke="var(--rim-wave)"/><path d={path} stroke="var(--rim-wave-played)" clipPath={`url(#${clip})`}/>
    </g>
    <path d={`M${Math.min(273.4,Math.max(0.6,274 * progress))} 0.75v20.5`} stroke="var(--rim-head)" strokeWidth="1.25"/>
  </svg>;
}

function Seek({ player, peaks }: { player: Transport; peaks?: readonly number[] }) {
  const { position, duration, seek, track } = player;
  const fraction = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  return <div className="rim-seek" style={{ '--rim-progress': `${fraction * 100}%` } as CSSProperties}>
    {peaks?.length ? <WaveInk peaks={peaks} progress={fraction}/> :
      <span className="rim-line" aria-hidden="true"><span className="rim-filled"/><span className="rim-thumb"/></span>}
    <input type="range" aria-label={`Seek ${track.title}`} aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`}
      min="0" max={duration || 1} step="any" value={Math.min(position, duration)} disabled={!duration || !!player.error}
      onChange={event => seek(Number(event.target.value))}
      onKeyDown={event => {
        const step = event.shiftKey ? 15 : 5;
        const to: Record<string, number> = { ArrowLeft: position-step, ArrowDown: position-step, ArrowRight: position+step, ArrowUp: position+step, Home: 0, End: duration };
        if (Object.hasOwn(to, event.key)) { event.preventDefault(); seek(to[event.key]); }
      }}/>
  </div>;
}

function Clock({ value, remaining = false }: { value?: number; remaining?: boolean }) {
  return <time className="rim-time">{value === undefined ? '–:––' : formatTime(Math.round(value), { remaining })}</time>;
}

function Player({ tracks, variant, initialTrack, label, className }: {
  tracks: readonly RimTrack[]; variant: RimVariant; initialTrack: number; label?: string; className?: string;
}) {
  const player = useRimPlaylist(tracks, initialTrack);
  const { track, index, duration, position } = player;
  const compact = variant === 'waveform' || variant === 'fine-rail';
  const { peaks, waveError } = useWaveform(variant === 'waveform' ? track.src : undefined, track.waveform);
  const measured = (t: RimTrack) => player.durations[t.src] ?? t.duration;
  const total = duration || measured(track);
  const remaining = total === undefined ? undefined : Math.max(0, total - position);
  return <div className={`rim-variant ${className ?? ''}`} data-rim-variant={variant} role="group" aria-label={label ?? track.title}>
    <audio ref={player.audio} {...player.events}/>
    {compact ? <div className="rim-shell rim-single">
      <PlayButton player={player} title={track.title}/>
      <div className="rim-display"><Seek player={player} peaks={variant === 'waveform' ? peaks : undefined}/></div>
    </div> : <div className="rim-shell rim-list">
      {variant === 'shared' && <div className="rim-transport">
        <div className="rim-navigation">
          <button type="button" aria-label="Previous track" disabled={index === 0} onClick={() => player.select(index-1, !player.audio.current?.paused)}><Glyph kind="previous"/></button>
          <PlayButton player={player} title={track.title}/>
          <button type="button" aria-label="Next track" disabled={index === tracks.length - 1} onClick={() => player.select(index+1, !player.audio.current?.paused)}><Glyph kind="next"/></button>
        </div>
        <Seek player={player}/><Clock value={remaining} remaining/>
      </div>}
      <ol className="rim-rows">
        {tracks.map((entry, i) => {
          const current = i === index;
          return <li key={trackKey(entry)} className="rim-row" data-current={current} aria-current={current ? 'true' : undefined}>
            {variant === 'shared' ? <button type="button" className="rim-pick" aria-label={`${current && player.playing ? 'Pause' : 'Play'} ${entry.title}`} onClick={() => player.toggle(i)}>
              <span className="rim-index" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
              <span className="rim-title" title={entry.title}>{entry.title}</span><Clock value={measured(entry)}/>
            </button> : <>
              <PlayButton player={player} title={entry.title} index={i} withTitle/>
              {current && <Seek player={player}/>}
              {variant === 'inline' && <Clock remaining={current} value={current ? remaining : measured(entry)}/>}
            </>}
          </li>;
        })}
      </ol>
    </div>}
    {player.error ? <p className="rim-status" role="alert">{player.error}</p> :
      waveError ? <p className="rim-status" role="status">Waveform unavailable. Use the seek rail.</p> : null}
  </div>;
}

export function RimPlayerVariant(props: Props) {
  const tracks = 'track' in props ? [props.track] : props.tracks;
  if (!tracks.length) return <p className="rim-status" role="status">No tracks available.</p>;
  return <Player variant={props.variant} tracks={tracks} initialTrack={'initialTrack' in props ? props.initialTrack ?? 0 : 0}
    label={props.label} className={props.className}/>;
}
