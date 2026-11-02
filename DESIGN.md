# Rim Player design

Base study: https://app.paper.design/file/01M6EQEAA2AXP2614R1BM3CP5T/p-1-0/320-0
Inspected through Paper on November 2, 2026. Subsequent user decisions below supersede the static study.

## Resting geometry
Compact Play 53×53 circle; expanded Play 60×53; toggle 32×32; gap 2px; waveform 410×48; inner screen 406×44; outer radius 24, inner 22. Transport icon 18px, filled; toggle icon 12px, 1.5px stroke. Collapsed order: Play, Expand. Expanded: Collapse, Play, waveform. The waveform shrinks to fit narrow hosts. No filename, shadows, gradients, or decorative visualizer.

Light palette: background #F2F1EA, border #C8C9C1, icon #555850, screen #E5E8E0, waveform #62645F. Resting button outlines are 1px. Dark mode and CSS custom properties are available.

## Authored liquid motion
Small control travels directly into the main body along the shared horizontal centreline. Contact stretches it horizontally; absorption briefly inflates the main body vertically; separation reverses this sequence. No vertical arc. The small glyph contracts while absorbed. Both endpoints preserve the approved resting geometry.

One phase spring (145 stiffness, 24 damping, 1.1 mass) coordinates shells and waveform, preserving velocity during reversal. Shells fuse with a bounded SVG blur/threshold filter held throughout contact. A smooth endpoint blend restores SourceGraphic without switching the filter. Main shell maximum vertical scale is 1.17; small shell maximum horizontal scale is 1.38. Waveform grows from zero width and height at full opacity, with undistorted waveform bars. A short neck links the emerging waveform.

Transport uses a single compound path between filled Play and Pause, with its own spring. Reduced motion skips all spatial deformation and removes the waveform neck. Expansion and playback are independent. Locked compact shows only Play/Pause; locked expanded shows Play/Pause and waveform without a toggle or reserved toggle space.

The demo is a quiet field around one focal interaction. Supporting test controls live outside the component. No new visual direction or registry dependency was introduced.
