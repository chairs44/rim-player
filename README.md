# Rim Player

A React audio player with a seekable waveform and a liquid transition between compact and expanded controls. Five optional greyscale layouts cover single recordings and playlists.

![Rim Player expanding and collapsing while playback continues](docs/media/rim-player.gif)

- Playback continues when the waveform collapses.
- Light and dark themes, keyboard controls, and reduced-motion support.
- Plain CSS and Motion. No shadcn or UI framework required.

## Use

Copy [`AudioPlayer.tsx`](src/AudioPlayer.tsx), [`useWaveform.ts`](src/useWaveform.ts), [`motion.ts`](src/motion.ts), and [`player.css`](src/player.css) into the same folder in your React project, then install Motion:

```bash
npm install motion@^14.9.0
```

```tsx
import { AudioPlayer } from './components/rim-player/AudioPlayer';

export default function Example() {
  return <AudioPlayer src="/audio/track.mp3" label="Track preview" />;
}
```

Provided as source files, not an npm package. Tested with React 19.3 and Motion 14.9. Your build must support TypeScript and CSS imports.

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `src` | `string` | Required audio URL |
| `label` | `string` | `'Audio'` |
| `mode` | `'toggle' \| 'compact' \| 'expanded'` | `'toggle'` |
| `initialExpanded` | `boolean` | Expanded at viewport widths ≥640px |
| `theme` | `'light' \| 'dark'` | `'light'` |
| `className` | `string` | `''` |
| `style` | `CSSProperties` | — |

`compact` shows Play/Pause only; `expanded` keeps the waveform visible. Both omit the toggle. In toggle mode, a manual choice survives resizing. Changing `src` resets the player.

```tsx
<AudioPlayer src="/audio/track.mp3" mode="expanded" theme="dark" />
<AudioPlayer src="/audio/track.mp3" initialExpanded={false} />
```

## Design and behavior

### Flat greyscale variants

Open the [local comparison](http://127.0.0.1:5178/variants/) to audition five alternatives. `RimPlayerVariant` takes a single `track` for `fine-rail` and `waveform`, or a `tracks` array for `inline`, `inline-no-time` and `shared`.

```tsx
import { RimPlayerVariant, type RimTrack } from './RimPlayerVariant';

const tracks: RimTrack[] = [
  { title: 'Episode excerpt', src: '/audio/excerpt.mp3', duration: 302 },
  { title: 'Series theme', src: '/audio/theme.mp3', duration: 55 },
];

<RimPlayerVariant variant="waveform" track={tracks[0]} />
<RimPlayerVariant variant="shared" tracks={tracks} label="Best Practice" />
```

Each player starts paused. A playlist shares one audio element, advances through its queue and stops after the final track. `initialTrack` selects the starting row by zero-based index. Duration hints are optional, and measured metadata takes priority. Give entries with the same URL distinct `id` values. Pass a normalized `waveform` array to skip decoding, or let Rim generate it from the recording. A native range supports touch, drag, arrow keys and Home/End.

The alternate component uses [RimPlayerVariant.tsx](src/RimPlayerVariant.tsx), [useRimPlaylist.ts](src/useRimPlaylist.ts), the shared waveform decoder, [audiocn’s time formatter](src/audioTime.ts), [variants.css](src/variants.css) and its [Geist font](src/assets/geist-variable.woff2). The [audiocn](docs/licenses/audiocn.txt) and [Geist](docs/licenses/geist.txt) licences accompany these files. No additional runtime dependency is required.

The portable comparison includes three local demo recordings. In development, the gallery can also read `review/variant-audio/sets.json` with an array of `{ id, name, tracks }` collections. This ignored directory holds this checkout’s M/P/J and Best Practice listening copies. The build includes only the portable samples.

### Original player

Compact Play is a 53px circle; expanded Play is 60×53px. The 32px toggle merges through its centreline. The waveform grows to 410×48px and contracts to fit its container. Expandable embeds need at least 144px of width.

An interruptible spring coordinates the SVG shells and waveform. Reduced motion skips spatial animation. Colors can be overridden with the `--apc-*` CSS properties. See [design and technical specs](docs/specification.md).

Use Space/Enter on buttons. Focus the waveform to seek with Left/Right (5 seconds) or Home/End. Pointer and touch input are supported. Audio never autoplays.

## Limits

Designed for short, finite clips. Waveform generation downloads and decodes the full file, using the first audio channel. Remote audio needs CORS permission for waveform decoding; if decoding fails, playback and seeking can still work. Long recordings and live streams are outside this version's scope.

The component has no analytics, upload service, or storage. It requests the audio URL you provide. Files selected in the demo stay in the browser; the demo limits them to 40 MB. That size limit is not enforced by the component.

## Development

Use Node.js 22.12+ and npm.

```bash
npm ci --ignore-scripts
npm run dev
```

Open [localhost:5178](http://127.0.0.1:5178). The demo includes generated test audio.

```bash
npx playwright install firefox webkit
npm test -- --workers=3
npm run build
```

Tests also require Google Chrome. The suite covers the original player and all five variants in Chromium, Firefox and WebKit. One original-player test skips Firefox’s unsupported touch emulation. Physical-device and screen-reader testing remains open. See [compatibility notes](docs/compatibility.md).
