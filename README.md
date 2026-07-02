# Team XXXXX — FTC Team Website

Website skeleton for a rookie [FIRST Tech Challenge](https://www.firstinspires.org/robotics/ftc)
team. **Everything textual is placeholder Lorem Ipsum** — structure, design
system, and navigation are real; copy is not (yet).

## Stack

- [Astro](https://astro.build) — static site framework
- [Tailwind CSS 4](https://tailwindcss.com) — styling (tokens in `src/styles/global.css`)
- [Lenis](https://lenis.darkroom.engineering) — smooth scrolling
- Archivo Variable + JetBrains Mono Variable (self-hosted via Fontsource)

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview the production build |

## Structure

```
src/
├── layouts/
│   └── BaseLayout.astro   # Shared shell: nav, footer, smooth scroll, reveals
├── components/
│   ├── GearNav.astro      # Orbital gear hub navigation (the centerpiece)
│   ├── Reveal.astro       # Scroll-driven entrance wrapper
│   ├── Placeholder.astro  # Marks every Lorem Ipsum slot
│   ├── SectionLabel.astro # [ 01 / SECTION ] callouts
│   └── Footer.astro       # Plain-link nav fallback
├── pages/
│   ├── index.astro        # Home / Welcome
│   ├── season.astro       # Season Recap (first season)
│   └── contact.astro      # Contact + Donate (not wired up)
└── styles/
    └── global.css         # Design tokens, textures, reveal system
```

## Dropping in real content

Every block that still holds Lorem Ipsum is wrapped in
`<Placeholder name="...">` — a dashed orange frame with a visible tag in the
browser. To find every remaining slot:

```sh
grep -rn "data-placeholder\|<Placeholder" src/
```

Replace the Lorem Ipsum inside, then remove the `<Placeholder>` wrapper
(keep its children). The contact form and donate buttons are intentionally
not functional yet.

## Design system

Visual direction, tokens, type, and motion rules live in [`DESIGN.md`](./DESIGN.md).
Animation philosophy comes from the Emil Kowalski skills installed in
[`.claude/skills/`](./.claude/skills/) — Claude Code picks these up
automatically when working in this repo.
