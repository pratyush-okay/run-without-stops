# Running Without Stops — brand basics

## Colour

| Role | Hex | Notes |
|---|---|---|
| Ink (background) | `#0A0C0B` | The default ground. Near-black, very slightly green. |
| Neon (accent) | `#A8FF35` | The mark, links, primary actions. One accent only. |
| Paper (text on ink) | `#F2F4F1` | Body text on dark. |
| Muted (text on ink) | `#8A9287` | Captions, labels. 6:1 on Ink. |
| Dim (supporting) | `#2F3A2A` | Dividers, disabled, inactive strokes. |

**Contrast:** neon on ink is ~15:1 — safe for anything. Neon on white is ~1.4:1 —
never set neon text on a light background, and use `mark-black.svg` when the mark
has to sit on light.

## Type

- **Archivo** 700, tracked `0.16em`–`0.24em`, uppercase — the wordmark and headings.
- **Space Grotesk** 400/500 — UI and body.

Both are on Google Fonts:
`https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Space+Grotesk:wght@400;500&display=swap`

## Construction

The figure is built on a fixed system. If you redraw it, these are the rules:

- One bar weight throughout: **44 units**, and nothing else.
- Every angle is **0°, 45° or 90°**. No other angle exists in the mark.
- Ends are **square cut** (butt caps), corners are **mitred**. Never round them.
- The head is a **separate circle**, r 34, never joined to the body.

## Clear space

Keep clear space on all four sides equal to the **bar weight** — one sixth of the
mark's height. Nothing else enters that box.

## Minimum sizes

| Use | Minimum |
|---|---|
| Bare mark | 20 px wide |
| Dark tile / favicon | 16 px |
| Maskable icon | content stays inside the inner 60% |

## Don't

- Don't rotate, skew, or flip it vertically. (Horizontal mirroring is a deliberate
  choice already made — the figure runs right-to-left.)
- Don't change the bar weight, or make the arms a different weight from the legs.
- Don't outline it, add a gradient, a glow, or a drop shadow.
- Don't recolour outside the palette above.
- Don't place the neon mark on a light background — swap to the black mark.
