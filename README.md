# Rim Player
Local single-track React audio player, built from the approved Paper minimal-rim study. Private repository; not deployed or integrated into the portfolio.

## Run
```sh
npm install
npm run dev
```
Open http://127.0.0.1:5178. The server binds to loopback only.

```sh
npm run build
npm test
```
Tests use locally installed Google Chrome. Start the dev server first.

## Component
Copy `src/AudioPlayer.tsx`, `src/motion.ts`, and `src/player.css` into a React project with `motion` installed.

```tsx
<AudioPlayer src="/track.mp3" label="My recording" />
<AudioPlayer src="/track.mp3" initialExpanded={false} />
<AudioPlayer src="/track.mp3" mode="expanded" theme="dark" />
```

Props: `src` required; `label` defaults to Audio; `initialExpanded` optional (otherwise desktop expanded/mobile compact at 640px); `mode` toggle/compact/expanded, default toggle; `theme` light/dark, default light; `className` and `style` optional. Manual expansion survives resizing. Locked modes omit the toggle entirely: compact is Play/Pause alone; expanded is Play/Pause plus waveform. Source changes reset audio, expansion never does. Apply CSS custom properties from player.css for colors; dark overrides may also be customized with CSS specificity.

Play/Pause: Space or Enter on the button. Seek: focus waveform, arrows ±5 seconds, Home/End start/end. Pointer dragging works through a native range. No autoplay. Unavailable audio shows a retry instruction; if decoding fails independently, playback and seeking still work with a flat placeholder. OS reduced motion removes travel and geometry animation.

## Local demo
Includes a generated 24-second musical test signal, not a portfolio recording. Choose an audio file to audition it in-browser; it is never uploaded. Demo input is limited to 40 MB. Waveform decoding loads the full file into memory and computes normalized RMS bars from the first channel, so this prototype is for short clips. Remote sources need appropriate CORS headers for waveform decoding. Streaming/live media and long podcasts need a precomputed-peaks path before release. Minimum embed width is 144px.

## Validation and limits
TypeScript + production build and six Chromium interaction tests. Checked desktop/light, 320px/dark, reduced motion, playback independence, end/replay, keyboard/pointer seeking, file replacement, errors, locked modes and rapid reversals. Browser playback state was verified; subjective listening and morph approval remain user review. Safari/Firefox and screen-reader/device testing remain before public release. Subtle approved borders are preserved and may need a separate contrast pass for release.

Motion APIs: https://motion.dev/docs/react-use-spring and https://motion.dev/docs/react-use-transform. The local Vite client build warns about upstream Motion `use client` directives; it still builds successfully. No server-component deployment is configured.

## Motion
The small control stretches into the larger button on their shared centreline, is absorbed, then emerges on the other side. The main body briefly inflates during absorption. One persistent SVG filter holds the fused silhouette during contact and smoothly returns to the original 1px outlines near rest. No last-frame filter switch. Compact Play is a 53×53 circle; expanded Play is 60×53; the toggle is 32×32. Both transport glyphs are filled, with a compound-path morph between them.

The waveform grows and retracts at full opacity. One interruptible spring coordinates the sequence (stiffness 145, damping 24, mass 1.1). Reduced motion jumps directly to the destination. Fluid Functionalism informed the motion approach; no registry components or additional dependencies were needed. The deliberately slower focal transition is an exception to its usual .24-second tier.
