# Rim Player
## Platform
Web. Standalone local React component prototype.
## Stack
React + TypeScript + Vite, accepted in the conversation. Motion for coordinated springs. Plain scoped CSS; no shadcn dependency needed for custom controls.
## Purpose
Single-track player for David's portfolio and eventual reusable public distribution. This pass proves the approved detached design and audio/morph behavior locally.
## Confirmed behavior
Independent playback and expansion; collapsing never pauses or resets audio. Real seekable waveform, gliding progress with inverted played region. Filename and visible duration removed by later design decisions. Desktop initially expanded, mobile compact; explicit initial state and locked modes override, manual selection survives resizing. Light and dark themes. Locked compact contains only Play/Pause; locked expanded contains Play/Pause and waveform with no expansion control. Play and Pause are both filled.
## Boundaries
One approved geometry. No playlists, extra transport, backend, hosting, public release, licensing choice, or website integration in this pass. A private GitHub repository named rim-player is authorized. Public release remains separately authorized. Generated test audio is temporary.
## Success
Review actual morph feel against the approved Paper study, while audio and accessible controls behave reliably.
