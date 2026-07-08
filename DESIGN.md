# Design System — "The Forge"

Four teams forged into one. The site is a night forge: coal-black fields,
one ember, medieval-robust type, machined edges. Typography carries the
identity; decoration exists only where it states something true.

This file is the source of truth for visual decisions. Read it (and the
skills in `.claude/skills/`) before touching UI.

## Principles

1. **Four colors, nothing else.** `#0A0908` coal, `#1A0F20` night,
   `#6E0D25` ember, `#E8E2DC` ash, plus ash transparencies for rules and
   muted text. No gradients except the single ember glow. No glows on
   components, no glassmorphism, no shadows.
2. **One ember.** The crimson is the accent everywhere: fills (solid
   buttons, the heat rail, timeline markers), accent text on coal, and the
   `.ember` radial glow, used at most once per page (hero, sponsor band,
   open menu).
3. **Typography is the imagery.** Grenze Gotisch does what photography
   would. Push scale hard (`clamp` up to 10rem+), keep body modest, and
   never set Grenze Gotisch in uppercase: blackletter capitals in runs are
   illegible. Mixed case always.
4. **Machined corners.** Radius 0 on everything except the gear button.
   No pills, no chips, no badges. Labels are bare small-caps text.
5. **Motion is purposeful.** Every animation answers "what does this
   communicate?" The forge scene tells the merge story; the gear turns
   with scroll because it drives the page; the heat rail is a progress
   gauge; reveals establish reading order. Nothing loops decoratively.
   Everything respects `prefers-reduced-motion` and degrades without JS
   or scroll-timeline support.
6. **Placeholders are loud.** Blocks awaiting content use
   `<Placeholder name="...">`; inline unknowns use `.stub`. Both visible.
7. **No em-dashes in visible copy.** Periods, commas, colons, hyphens.
8. **Copy earns its place.** Every visible sentence passes the
   no-slop-writing skill; anything that restates gets cut.

## Tokens (defined in `src/styles/global.css` `@theme`)

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#0a0908` | Page background (coal) |
| `--color-surface` | `#1a0f20` | Alternate bands, footer, slots (night) |
| `--color-line` | ash @ 15% | Hairline rules |
| `--color-ink` | `#e8e2dc` | Text (ash) |
| `--color-muted` | ash @ 62% | Secondary text, labels |
| `--color-accent` | `#6e0d25` | Ember: fills, accent text, glow |
| `--ease-out-strong` | `cubic-bezier(0.23,1,0.32,1)` | Entrances, UI feedback |
| `--ease-in-out-strong` | `cubic-bezier(0.77,0,0.175,1)` | Loader lift, on-screen movement |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | Gear spin only |

## Type

- **Display** (`.type-display`): Grenze Gotisch Variable, weight ~600,
  line-height 0.95, mixed case only. Headlines, nav menu, wordmark,
  roster names, blog titles.
- **Body** (default, no class): Vollkorn Variable. Dark, sturdy serif;
  muted color for long runs. Blog post bodies use `.post-body`.
- **Label** (`.type-label`): Vollkorn SC 600. Eyebrows (max one per
  page), spec keys, metadata, buttons, footer small print.
- **Code** (`--font-code`): a real monospace stack, used only in blog
  post code blocks (`.post-body code/pre`).

## Motifs

- `.ember` — the radial crimson glow with local grain; one per page max.
- `.slot` — empty media frame (night fill, hairline border) for photos
  and video awaiting content.
- `.rule-heavy` / SectionLabel's short ember rule — the anvil mark that
  opens a labeled section.
- Heat rail — 3px ember line on the left edge that fills with scroll
  (scroll-driven CSS, hidden where unsupported).
- Roman numerals (I-IV) in the gear menu only.

## Experience layer (BaseLayout + index)

The whole motion system lives in one module, `src/scripts/forge-motion.ts`
(GSAP + ScrollTrigger, wired to Lenis so smooth scroll and scroll-driven
animation share one clock). It is strictly progressive: the head sets
`html.will-animate` synchronously so first paint already hides what is
about to move (no flash), and clears it once the module boots; a 2.6s
failsafe (and the module's own try/catch) reveal everything if it never
does. Under `prefers-reduced-motion` the module bows out entirely and the
static CSS composition stands alone.

- **Forge loader**: once per session (sessionStorage `forged`), skipped
  under reduced motion and no-JS, with an inline failsafe that lifts the
  cover after 2s even if the module never runs. Wordmark strikes up, the
  cover lifts into the hero entrance.
- **Forge scene** (`index.astro` + `initHero`): a GSAP timeline pins the
  stage (`ScrollTrigger` pin, `end: +=210%`) and choreographs the merge.
  On load the four team numbers fly in from the corners; as you scroll
  they lift and burn out like sparks, "Four teams." disintegrates letter
  by letter on its X axis, "One Onyx." is struck in from the center out,
  and the ember swells. The load intro plays as the loader lifts; the CTA
  is anchored (visible the whole time). Without JS or under reduced motion
  a clean static hero shows instead (only "One Onyx." + sub + CTA).
- **Split text** (`[data-split]`): hero and section headings are split
  per character (hand-rolled splitter: `aria-label` on the element,
  `aria-hidden` chars) and assembled on scroll-in. Headings with inline
  markup (an accent `<span>`) stay as clip reveals instead.
- **Parallax** (`[data-parallax="±px"]`): depth via a scrubbed y shift.
- **Magnetic** (`[data-magnetic="strength"]`): CTAs lean toward the
  cursor (pointer-fine only); the scattered hero numbers drift with the
  pointer too. Not applied to the gear (would fight its scroll-spin).
- **View transitions**: cross-document fade/rise via `@view-transition`;
  browsers without it just navigate.
- **Reveals** (`[data-reveal]`, up/left/right/scale/clip): the supporting
  cast (copy, cards, rows). GSAP owns them when active (`ScrollTrigger`
  per element, richer easing + group stagger via `data-reveal-group`);
  the CSS transition is the reduced-motion fallback. Clip lives on an
  inner wrapper (Chromium quirk).

## The blog (Outreach)

Outreach is a markdown blog (Astro content collection, `src/content/blog/`).
`outreach/index.astro` lists posts as hairline-ruled rows; `outreach/[id].astro`
renders a post in `.post-body` with a `ViewCounter` (GoatCounter) and
`Comments` (giscus). Both third-party widgets show marked stubs until their
IDs are set in `src/lib/services.ts` (see README, "Blog").

## Component inventory

| Component | Purpose |
| --- | --- |
| `scripts/forge-motion.ts` | The motion engine: GSAP + ScrollTrigger + Lenis, the pinned hero, split text, parallax, magnetic pull, and `[data-reveal]` entrances. Reduced-motion safe. |
| `layouts/BaseLayout.astro` | Shell: fonts, loader, heat rail, view transitions, GearNav, footer, imports the motion engine. |
| `components/GearNav.astro` | The gear (turns with scroll) + full-screen menu with staggered display-type lines. |
| `components/Reveal.astro` | Scroll entrance wrapper. |
| `components/Placeholder.astro` | Dashed ember frame + small-caps tag on content slots. |
| `components/SectionLabel.astro` | Ember rule + small-caps section label; `index` only for real sequences. |
| `components/Footer.astro` | Plain-link nav fallback + identity. |
| `components/ViewCounter.astro` | Per-post view count (GoatCounter), stub until configured. |
| `components/Comments.astro` | Post comments + reactions (giscus), stub until configured. |

## Page conventions

- Content column: `mx-auto max-w-5xl px-5 sm:px-8` (blog post bodies use
  `max-w-3xl` for reading measure).
- Section rhythm varies on purpose (py-24 through py-44); don't
  metronome identical sections.
- Rows and ledgers over cards; hairline `border-t` separation.
- At most one `.type-label` eyebrow per page opening a section; most
  sections open with a display headline.
