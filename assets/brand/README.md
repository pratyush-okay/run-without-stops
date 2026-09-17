# Running Without Stops — brand asset pack

Two marks, fully built out. Both run right-to-left.

- **`push-off/`** — the recommended mark. Rear leg drives back and down, so the
  stride reads as a stride and the direction of travel is unambiguous.
- **`original/`** — the earlier pose, rear leg kicked up behind. Included because
  you asked for both; be aware it reads less clearly at icon sizes, where the
  kicked-up leg sits at the same height as the rear arm and the silhouette goes
  close to symmetrical.

Everything is generated from the same geometry, so the two sets are otherwise identical.

## What's in each folder

```
<variant>/
├── svg/
│   ├── mark-neon.svg            mark only, #A8FF35, cropped tight to the ink
│   ├── mark-black.svg           for light backgrounds
│   ├── mark-white.svg           for photography / video
│   ├── mark-currentcolor.svg    inherits CSS `color` — handy inline
│   ├── icon-dark.svg            512 rounded tile, ink ground, neon figure
│   ├── icon-neon.svg            512 rounded tile, neon ground, ink figure
│   ├── icon-maskable.svg        512 square, safe-zone padding for Android
│   └── favicon.svg              tuned for 16–32 px
├── png/
│   ├── mark-neon-256/512/1024.png       transparent
│   ├── mark-black-512.png               transparent
│   ├── mark-white-512.png               transparent
│   ├── icon-dark-512/1024.png
│   └── icon-neon-512/1024.png
├── favicon/                     drop this folder's contents at your site root
│   ├── favicon.ico              16 + 32 + 48 in one file
│   ├── favicon.svg
│   ├── favicon-16x16.png  favicon-32x32.png  favicon-48x48.png
│   ├── apple-touch-icon.png     180, square — iOS masks the corners itself
│   ├── icon-192.png  icon-512.png
│   ├── icon-maskable-512.png
│   ├── site.webmanifest
│   └── head-snippet.html        paste into <head>
├── social/
│   ├── og-image.png             1200 × 630
│   └── og-square.png            1200 × 1200
└── lockup/
    └── lockup.html              live lockups (mark + wordmark, Google Fonts)
```

`brand.md` at the top level has the colours, type, construction rules, clear space
and minimum sizes.

## Quick start

1. Pick a variant folder (`push-off` unless you've decided otherwise).
2. Copy everything inside `favicon/` to your web root.
3. Paste `favicon/head-snippet.html` into your `<head>`.
4. Copy `social/og-image.png` to your web root too — the snippet points at it.
5. Use `svg/mark-neon.svg` in the app; it's tight-cropped, so apply your own padding.

## Notes

- The SVGs have no external references and no embedded fonts — safe to inline.
- The wordmark is set live in Archivo rather than converted to outlines, so it
  isn't shipped as an SVG. `lockup/lockup.html` shows the three approved lockups;
  open it in a browser to screenshot or print one at any size.
- PNGs are rendered from the same geometry at 4× and downsampled, so edges are clean
  at every size listed.
