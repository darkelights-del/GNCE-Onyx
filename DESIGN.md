# Design System — "Pit Bay Blueprint"

The visual direction for the team site: a robotics pit bay crossed with an
engineering drawing. Near-black and dark #2B1B2F surfaces, one deep crimson
accent, machine-cut display type, and mono "callout" micro-labels everywhere
— the site should feel like a technical document that moves.

This file is the source of truth for visual decisions. Read it (and
`.claude/skills/emil-design-eng/SKILL.md`) before touching UI.

## Principles

1. **Four colors, nothing else.** The whole site uses only `#0A0908`,
   `#2B1B2F`, `#6E0D25`, `#E8E2DC`, plus transparencies of the ink for
   hairlines and muted text. No derived hues.
2. **One accent.** Deep crimson (`--color-accent`, `#6E0D25`) is the accent
   everywhere: as a fill (solid buttons, the current nav bubble, the timeline
   marker) and as accent text directly on the near-black (hero words, numbers,
   labels, brackets, placeholder tags). Ink (`#E8E2DC`) is kept for text that
   was always light (headlines, body, callout labels), not as an accent.
3. **Drawing, not dashboard.** Texture comes from hairlines, blueprint grids,
   hatching, corner registration marks, and mono callouts — not from cards,
   shadows, or gradients. No glassmorphism, no glow.
4. **Motion is mechanical and earned.** Entrances use strong ease-out;
   interactive UI stays under 300ms; the gear hub is the only playful
   (springy) element. Everything respects `prefers-reduced-motion`.
5. **Placeholders are loud.** Blocks awaiting content are wrapped in
   `<Placeholder name="...">`; inline unknowns use a `.stub` span. Both are
   impossible to miss in the browser.
6. **Eyebrow restraint.** `SectionLabel` callouts appear on at most a couple
   of sections per page, and get an `index` only when the order itself is
   content (e.g. the season timeline). Most sections open with a display
   headline instead (see the `taste` skill's eyebrow rules).
7. **No em-dashes in visible copy** (see the `taste` skill). Use periods,
   commas, colons, or hyphens.

## Tokens (defined in `src/styles/global.css` `@theme`)

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#0a0908` | Page background (near-black) |
| `--color-surface` | `#2b1b2f` | Cards, alternate bands, footer, nav bubbles, form inputs |
| `--color-panel` | `#2b1b2f` | Same as surface (cards are set apart by their border) |
| `--color-line` | `#e8e2dc` @ 15% | All hairline borders (ink at low opacity) |
| `--color-ink` | `#e8e2dc` | Primary text (warm off-white) |
| `--color-muted` | `#e8e2dc` @ 62% | Secondary text, labels (ink at low opacity) |
| `--color-accent` | `#6e0d25` | Deep crimson — the accent, as fills and as text |
| `--ease-out-strong` | `cubic-bezier(0.23,1,0.32,1)` | Entrances, UI feedback |
| `--ease-in-out-strong` | `cubic-bezier(0.77,0,0.175,1)` | On-screen movement, clip reveals |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | Gear hub fan-out only |

Tailwind maps these automatically: `bg-bg`, `bg-surface`, `bg-panel`,
`text-ink`, `text-muted`, `text-accent`, `border-line`, `font-display`,
`font-mono`, `ease-out-strong`, etc.

## Type

- **Display** (`.type-display`): Archivo Variable, stretched to 118%, weight
  800, uppercase, tight leading. Headlines and big numbers. Size with
  Tailwind clamp-y utilities, e.g. `text-[clamp(2.5rem,8vw,7rem)]`.
- **Callout** (`.type-callout`): JetBrains Mono, 11px, uppercase, wide
  tracking. Section labels, annotations, metadata, tags.
- **Body**: Archivo at normal width via `font-display`, `text-base/relaxed`,
  usually `text-muted` for long Lorem Ipsum runs.

## Motifs

- `.bp-grid` — faint blueprint grid background (heroes, section bands).
- `.bp-hatch` — diagonal hatching (image/frame placeholders, "unbuilt" areas).
- `.bp-corners` — corner registration marks on panels and frames.
- `SectionLabel` — `[ THE ROBOT ]` callout with a trailing rule; used on at
  most a couple of sections per page (see Principles 5).
- Mono metadata as garnish only where it states something real (dates,
  team numbers, match IDs); never decorative version stamps.

## Motion rules (from the emil-design-eng skill)

- Only animate `transform`, `opacity`, `clip-path`. Never `all`.
- Entrances: `ease-out-strong`; scroll reveals 640ms (clip variant 820ms).
- Interactive UI: 120–300ms. Buttons get `scale(0.97)` on `:active`.
- Hover effects only inside `@media (hover: hover) and (pointer: fine)`.
- Nothing enters from `scale(0)`; minimum `scale(0.9)` + opacity.
- Stagger 45–60ms between siblings, capped (~360ms max delay).
- `prefers-reduced-motion`: movement is removed, opacity fades remain.

## Component inventory

| Component | Purpose |
| --- | --- |
| `layouts/BaseLayout.astro` | Shared shell: fonts, GearNav, footer, Lenis smooth scroll, reveal observer. Props: `title`, `description`. |
| `components/GearNav.astro` | Orbital gear hub navigation (bottom-right). Update `links` there when pages change. |
| `components/Reveal.astro` | Scroll entrance wrapper. `variant`: `up` (default) / `left` / `right` / `scale` / `clip`; optional `delay` ms. Put `data-reveal-group` on a parent to auto-stagger children. |
| `components/Placeholder.astro` | Dashed frame + tag marking Lorem Ipsum slots. Required `name`. |
| `components/SectionLabel.astro` | `[ title ]` section callout; optional `index` only for real sequences. |
| `components/Footer.astro` | Plain-link nav fallback + placeholder identity. |

## Page conventions

- Content column: `mx-auto max-w-6xl px-5 sm:px-8`.
- Section rhythm: `py-24 sm:py-32`; hero sections `min-h-svh`.
- Alternate `bg-bg` and `bg-surface` bands for large sections.
- Every page: `<BaseLayout title="...">`, sections opened with
  `SectionLabel`, entrances via `Reveal`.
- Placeholder names are kebab-case and unique per slot
  (`grep -r "data-placeholder" src/` lists all remaining work).
