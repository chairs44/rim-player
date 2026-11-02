import { createElement } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { AudioPlayer, type AudioPlayerProps } from '../src/AudioPlayer';
const config = (window as unknown as {fixtureProps?: AudioPlayerProps[]}).fixtureProps ?? [{src:'/demo.wav',label:'First'},{src:'/demo.wav',label:'Second'}];
const node = document.getElementById('fixture')!;
const markup = (window as unknown as {fixtureMarkup?: string}).fixtureMarkup;
// Test-only markup produced by renderToString; never populated from user input.
if (markup) node.innerHTML = markup;
const children = config.map((props, key) => createElement(AudioPlayer, {...props, key}));
if (node.hasChildNodes()) hydrateRoot(node, children);
else createRoot(node).render(children);
