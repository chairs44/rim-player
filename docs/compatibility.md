# Compatibility

Verified November 2, 2026 with React 19.3.1, Motion 14.9.0 and Playwright 1.64.1.

| Browser engine | Tested version |
| --- | --- |
| Google Chrome | 156.0.8078.74 |
| Firefox | 157.0 |
| Playwright WebKit | 27.2 |

The suite passes 38 checks. One Firefox touch-emulation case is explicitly skipped because Playwright does not support it. TypeScript and the production build pass.

Coverage includes playback and replay, independent expansion, keyboard/pointer seeking, emulated touch, narrow layouts, source replacement, error recovery, decoding failure, multiple instances, server-rendered hydration, rapid reversals, reduced motion and keyboard-focus recovery. axe reports no automated WCAG A/AA violations in the tested light/dark and toggle/compact/expanded states.

These results are not a complete accessibility certification or a minimum-browser-version guarantee. Playwright WebKit is not the installed Safari app. Physical iPhone/Android, VoiceOver/TalkBack, older browsers, low-end devices and full Next.js integration remain unverified.

The 32px toggle exceeds the 24px WCAG AA minimum target size but not the 44px enhanced width. The subtle outlines are decorative; icons, waveform and focus indicators provide the functional contrast. Preserve their contrast when overriding colors.

The development build may report non-blocking `use client` directive notices. Screenshots, logs and local review material are excluded from the repository.
