# Changelog
## 2026-11-02
Built the approved detached minimal-rim player with real waveform decoding, independent playback, seeking, coordinated spring expansion, light/dark styles, responsive defaults and locked states. Added a local review page and Chromium interaction tests. Preserved all Paper/vault originals.

### Motion revision
Slowed and softened expansion with an interruptible physics spring, transitional bubble fusion and restrained squash/stretch. Replaced icon crossfade with compound-path morph; Pause is filled. Removed toggle and reserved spacing from both locked modes. Six browser tests pass; local review artifacts under review/motion-v2.

### Centreline revision
Compact Play is now a 53×53px circle in both toggle and locked-compact modes, morphing to the existing 60×53px expanded shape. Both transport glyphs are filled. The small control moves horizontally through the larger bubble on their common centreline; its glyph contracts during overlap. Vertical arc travel removed. Production build and six Chromium tests pass; measured centres remain aligned throughout motion.

### Solid waveform reveal and clean outlines
The waveform now grows from zero width/height and retracts to its origin at full opacity, without the previous fade or secondary horizontal wipe. Bubble spring updated to stiffness 145, damping 24, mass 1.1 for a slightly quicker settle. The SVG alpha-threshold/morphology filter is bypassed at rest: button shells use native 1px vector strokes in the original border color. Fusion remains during movement. Verified unfiltered resting outlines at DPR 1 and opacity 1 during expansion; build and six Chromium tests pass. Local only.

### Settling-pop correction
Reviewed the user recording frame by frame. Replaced the discrete filtered/unfiltered shell switch with a continuous arithmetic blend between fusion and SourceGraphic inside one persistent SVG filter. Native vector appearance is recovered smoothly as the fusion weight approaches zero; there is no filter swap on the final frame. Late-frame screenshots reviewed; sampled filter changes: zero. Waveform width converges continuously. Build and six Chromium tests pass.

## Liquid contact and absorption, November 2
Restored full fusion through overlap instead of diluting it with the original intersecting outlines. Added horizontal toggle stretch and main-body inflation while keeping both centres aligned. Smooth endpoint blend preserves the settling-pop fix. Waveform reveal and audio behavior unchanged. Consolidated current design/status/readme to remove superseded specifications.
