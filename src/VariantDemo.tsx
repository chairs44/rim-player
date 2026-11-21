import { StrictMode, useEffect, useState, type SyntheticEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { RimPlayerVariant, type RimTrack, type RimVariant } from './RimPlayerVariant';
import './variant-demo.css';

interface RecordingSet { id: string; name: string; tracks: RimTrack[] }

const samples: RecordingSet = {
  id: 'demo', name: 'Demo recordings',
  tracks: [
    { title: 'Quiet sequence', src: '/demo.wav', duration: 24 },
    { title: 'Low register', src: '/samples/low-register.mp3', duration: 12 },
    { title: 'Quick steps', src: '/samples/quick-steps.mp3', duration: 8 },
  ],
};

const designs: { type: RimVariant; title: string }[] = [
  { type: 'inline', title: 'Inline transport' },
  { type: 'inline-no-time', title: 'Inline transport · No time' },
  { type: 'waveform', title: 'Full-width waveform' },
  { type: 'fine-rail', title: 'Fine rail · No time' },
  { type: 'shared', title: 'Shared transport' },
];

function soloPreview(event: SyntheticEvent<HTMLElement>) {
  const active = event.target;
  if (!(active instanceof HTMLAudioElement)) return;
  event.currentTarget.querySelectorAll('audio').forEach(audio => { if (audio !== active && !audio.paused) audio.pause(); });
}

export default function VariantDemo() {
  const [collections, setCollections] = useState<RecordingSet[]>([samples]);
  const [requested, setRequested] = useState(() => new URLSearchParams(location.search).get('set') ?? '');
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const ac = new AbortController();
    // Private listening copies live in the ignored review directory, outside Vite's production assets.
    fetch('/review/variant-audio/sets.json', { signal: ac.signal }).then(async response => {
      if (!response.ok || !response.headers.get('content-type')?.includes('json')) return;
      const local: RecordingSet[] = await response.json();
      if (!ac.signal.aborted) setCollections([...local.filter(set => set.tracks?.length), samples]);
    }).catch(() => { /* The portable sample playlist works on every checkout. */ });
    return () => ac.abort();
  }, []);
  const set = collections.find(item => item.id === requested) ?? collections[0];
  function choose(id: string) {
    setRequested(id);
    const url = new URL(location.href);
    url.searchParams.set('set', id);
    history.replaceState(null, '', url);
  }
  return <main className="rim-variants" onPlayCapture={soloPreview}>
    <div className="variant-page">
      <header className="variant-header"><h1>Rim Player variants</h1><a href="/">Original player</a></header>
      <div className="variant-recordings"><label htmlFor="recording-set">Recordings</label>
        <select id="recording-set" value={set.id} onChange={e => choose(e.target.value)}>
          {collections.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
      <div className="variant-specimens" key={set.id}>{designs.map(({type,title}) =>
        <section className="variant-specimen" key={type} aria-labelledby={'title-'+type}>
          <h2 id={'title-'+type}>{title}</h2>
          {type === 'fine-rail' || type === 'waveform'
            ? <RimPlayerVariant variant={type} track={set.tracks[0]}/>
            : <RimPlayerVariant variant={type} tracks={set.tracks} initialTrack={set.id === 'best-practice' ? 0 : 1} label={title}/>}
        </section>
      )}</div>
    </div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><VariantDemo/></StrictMode>);
