# twitch-miner-go Telemetry — Design System

## 1. Design Direction

- **Atmosphere**: Ethereal Glass — dark mode with deep charcoal base + subtle radial mesh orbs (muted teal/indigo); light mode with warm-white base + soft atmospheric gradient.
- **Signature material**: Glass cards with double-bezel architecture (outer shell with hairline border + inner core with subtle inset highlight).
- **Color story**: Neutral charcoal/stone base + electric-teal accent (`#0EA5E9` → `#06B6D4`) for dark; warm off-white + same teal for light.
- **One moment visitor remembers**: The stats card row — each card is a glass tile with a glowing accent line, large animated number, and micro-icon that catches the eye.

## 2. Color Palette

### Dark Mode
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `oklch(0.13 0.01 240)` | Page background |
| `--bg-elevated` | `oklch(0.17 0.015 240)` | Card/surface background |
| `--bg-glass` | `oklch(0.2 0.02 240 / 0.6)` | Glass card fill |
| `--text-primary` | `oklch(0.95 0.01 240)` | Primary text |
| `--text-secondary` | `oklch(0.65 0.02 240)` | Muted/secondary text |
| `--accent` | `oklch(0.65 0.18 220)` | Interactive accent (teal) |
| `--accent-glow` | `oklch(0.65 0.18 220 / 0.15)` | Accent glow/aura |
| `--border-subtle` | `oklch(1 0 0 / 0.08)` | Hairline borders |
| `--border-glass` | `oklch(1 0 0 / 0.12)` | Glass card border |

### Light Mode
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `oklch(0.98 0.005 90)` | Page background |
| `--bg-elevated` | `oklch(1 0 0)` | Card/surface background |
| `--bg-glass` | `oklch(1 0 0 / 0.7)` | Glass card fill |
| `--text-primary` | `oklch(0.15 0.01 240)` | Primary text |
| `--text-secondary` | `oklch(0.5 0.02 240)` | Muted text |
| `--accent` | `oklch(0.55 0.18 220)` | Interactive accent |
| `--accent-glow` | `oklch(0.55 0.18 220 / 0.1)` | Accent glow |
| `--border-subtle` | `oklch(0 0 0 / 0.08)` | Hairline borders |
| `--border-glass` | `oklch(0 0 0 / 0.1)` | Glass card border |

## 3. Typography

| Role | Font | Weight | Tracking |
|------|------|--------|----------|
| Display/Headings | `Geist` (sans) | 600-700 | `-0.02em` |
| Body | `Geist` (sans) | 400 | normal |
| Mono/Data | `Geist Mono` / `JetBrains Mono` | 400-500 | `-0.01em` |
| Eyebrow/labels | `Geist Mono` | 500 | `0.08em` uppercase |

- Page uses `font-sans` as default (Geist via `--font-geist-sans`).
- Numeric data uses `tabular-nums` + `font-mono`.
- No font-family mixing — Geist family handles everything with mono variant for data.

## 4. Spacing & Layout

- Section padding: `py-8 md:py-10 lg:py-12`
- Card padding: `p-5 md:p-6`
- Grid gaps: `gap-4 md:gap-5 lg:gap-6`
- Page max-width: `max-w-[1440px] mx-auto`
- Content max-width: `max-w-[1600px] mx-auto`

## 5. Reusable Primitives

### Glass Card
```tsx
<div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-sm backdrop-blur-xl">
  {/* inner highlight */}
  <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" />
  {/* content */}
  {children}
</div>
```

**States**: Light mode swaps to `border-black/[0.06]` + `from-black/[0.02] to-transparent` + `shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]`.

### Stat Card
A glass card with:
- Top accent line (`h-0.5 w-full bg-gradient-to-r from-accent/0 via-accent to-accent/0`)
- Label in `text-xs font-medium tracking-wide text-secondary`
- Value in `text-3xl md:text-4xl font-bold tabular-nums text-primary`
- Optional icon in top-right corner (phosphor icon, `text-accent`)

### Pill Button / Toggle
`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300` with active state using `bg-accent/15 text-accent border-accent/30` and inactive using `text-secondary border-transparent hover:text-primary hover:bg-white/[0.05]`.

### Floating Header
Fixed top, `mx-auto mt-3`, `w-[calc(100%-2rem)] max-w-5xl`, `rounded-2xl`, glass background with `backdrop-blur-2xl`, `border border-white/[0.08]`, `px-4 py-2 md:px-6 md:py-3`.

### Chart Area
Recharts styling:
- Grid lines: `stroke="currentColor"` with `opacity={0.06}`
- Axis ticks: `fill="var(--text-secondary)"` `fontSize={11}`
- Tooltip: glass-style with `backdrop-blur-xl`, `border border-white/[0.1]`, `rounded-xl`
- Area fill: gradient from accent color at 20% to transparent
- Bar/Pie: accent colors with subtle gradient fills

### Table
- Header: `text-xs font-medium tracking-wide text-secondary uppercase`
- Rows: alternating subtle background, hover `bg-white/[0.03]`
- Cell: `text-sm py-3`
- Border: `border-b border-white/[0.06]`
- Search input: glass style with `bg-white/[0.04]` `border-white/[0.08]` `rounded-xl` `pl-9`

## 6. Motion

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page load (cards) | `translateY(16px)` → `translateY(0)` + `opacity(0→1)` | 600ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Stat cards stagger | Sequential with 80ms delay per card | — | — |
| Hover (cards) | Slight `translateY(-2px)` + shadow deepen | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Button active | `scale(0.97)` | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Theme toggle | Icon rotate | 400ms | `cubic-bezier(0.16, 1, 0.3, 1)` |

- All animations respect `prefers-reduced-motion`.
- No infinite loop animations on static content.
- Transitions use `transition-all duration-300 ease-out` as default.

## 7. Responsive Behavior

- **Mobile (< 768px)**: Single column, full-width cards, `px-4`, stack layout.
- **Tablet (768-1024px)**: 2-column grid for charts, compact header.
- **Desktop (> 1024px)**: Full bento layout, floating nav, multi-column grids.

## 8. Accessibility

- WCAG AA contrast minimum for all text.
- Focus rings: `ring-2 ring-accent ring-offset-2 ring-offset-bg-base`.
- Touch targets: minimum 44px for interactive elements.
- All interactive elements have `aria-label` where icon-only.
