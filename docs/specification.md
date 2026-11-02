# Specification

## Layout

| Element | Resting dimensions |
| --- | --- |
| Compact Play | 53×53px |
| Expanded Play | 60×53px |
| Expand/collapse control | 32×32px |
| Waveform | Up to 410×48px |
| Gap between controls | 2px |
| Button outline | 1px |

Compact order: Play, Expand. Expanded order: Collapse, Play, waveform. The waveform fits the available host width; minimum expandable width is 144px. Locked compact mode needs 53px. The 53px-high stage does not grow during animation; allow visible overflow for temporary inflation and focus outlines.

The default viewport breakpoint is 640px. Explicit initialExpanded overrides that default; mode can lock either layout. Playback is independent of expansion. Source replacement remounts the player.

## Motion and styling

The small control travels along the larger button's centreline, stretches into it, and emerges on the opposite side. A persistent SVG filter blends fused shells into crisp resting outlines. Filled Play and Pause icons share a morphing path. The waveform expands at full opacity without stretching its bars.

The shared spring uses stiffness 145, damping 24 and mass 1.1. Glyph motion uses stiffness 230, damping 26 and mass 0.85. Reversals preserve velocity; reduced-motion preference skips spatial deformation.

CSS is scoped with the `apc` prefix. Theme tokens are `--apc-bg`, `--apc-border`, `--apc-icon`, `--apc-screen`, `--apc-ink` and `--apc-focus`. Override them through a scoped stylesheet; dark selectors have higher specificity than the base class.

## Implementation

React and TypeScript; Motion for spring values; native HTML audio and range controls; Web Audio for waveform decoding; ResizeObserver for host sizing. Vite serves the demo and builds its static assets. There is no backend, account system, telemetry or persistent storage.

Waveform generation computes 512 normalized RMS samples from the first audio channel and renders bars for the available width. It loads the complete file into memory. Use finite, short clips in browser-supported formats. Remote waveform requests are subject to browser CORS rules. Serve production media over HTTPS and avoid embedding private credentials in source URLs.

The component owns playback and expansion state. It does not expose an imperative transport API, playlist, volume control, live-stream support, or precomputed-peak input. Multiple instances have independent audio. It is distributed as source, not an npm package or shadcn registry entry.
