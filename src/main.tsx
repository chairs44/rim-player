import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { AudioPlayer, type AudioPlayerProps } from './AudioPlayer';
import './demo.css';
function App(){
 const [theme,setTheme]=useState<'light'|'dark'>('light');
 const [mode,setMode]=useState<AudioPlayerProps['mode']>('toggle');
 const [src,setSrc]=useState('/demo.wav');
 const [name,setName]=useState('Quiet sequence');
 const [fileError,setFileError]=useState('');
 useEffect(()=>()=>{if(src.startsWith('blob:'))URL.revokeObjectURL(src)},[src]);
 return <main data-theme={theme}><header><h1>Rim Player</h1><span>Audio player prototype</span></header><section className="demo-stage" aria-label="Player preview"><div className="player-wrap"><AudioPlayer src={src} label={name} theme={theme} mode={mode}/></div></section><footer><div className="settings"><label>Appearance<select value={theme} onChange={e=>setTheme(e.target.value as 'light'|'dark')}><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Behaviour<select value={mode} onChange={e=>setMode(e.target.value as AudioPlayerProps['mode'])}><option value="toggle">Expandable</option><option value="compact">Always compact</option><option value="expanded">Always expanded</option></select></label><label className="file-label">Try an audio file<input type="file" accept="audio/*" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>40*1024*1024){setFileError('Choose a file smaller than 40 MB for this prototype.');return;}setFileError('');setSrc(URL.createObjectURL(file));setName(file.name);}}/></label></div><p>{fileError || (src.startsWith('blob:')?name:'Quiet sequence · generated test audio')}</p><p className="hint">Files stay in your browser. Expand, play, and drag the waveform.</p></footer></main>
}
createRoot(document.getElementById('root')!).render(<StrictMode><MotionConfig reducedMotion="user"><App/></MotionConfig></StrictMode>);
