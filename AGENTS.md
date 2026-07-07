# Agent guide

Astro 7 + Tailwind CSS 4 website for a rookie FIRST Tech Challenge (FTC)
robotics team. Currently a design/structure skeleton: all copy is Lorem
Ipsum placeholders awaiting a content pass.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

`npm run build` doubles as the type/syntax check.

## Before touching UI

1. Read `DESIGN.md` — visual direction ("Pit Bay Blueprint"), tokens, type,
   motion rules, component inventory. Follow it; don't invent new colors,
   easings, or patterns ad hoc.
2. Use the skills in `.claude/skills/` for any UI work: `emil-design-eng` +
   `animation-vocabulary` + `review-animations` (animation), `taste`
   (anti-generic frontend rules; note its em-dash ban and eyebrow-restraint
   rules), `frontend-design` (visual direction), and
   `redesign-existing-projects` (audit-first elevation).

## Architecture notes

- One shared shell: `src/layouts/BaseLayout.astro` (fonts, GearNav, Footer,
  Lenis smooth scroll, IntersectionObserver driving `[data-reveal]`).
- Navigation is `src/components/GearNav.astro` (orbital gear hub). Page list
  changes go in its `links` array AND `Footer.astro`.
- Design tokens live in the `@theme` block of `src/styles/global.css`;
  Tailwind v4 derives utilities from them (`bg-bg`, `text-accent`,
  `ease-out-strong`, ...). There is no `tailwind.config.*`.
- Scroll entrances: wrap content in `components/Reveal.astro`; stagger
  siblings by putting `data-reveal-group` on their parent.

## Placeholder convention (important)

Blocks awaiting real content are wrapped in `components/Placeholder.astro`
with a unique kebab-case `name`; small inline unknowns (team number, email,
handles, TBD dates) use a `.stub` span instead. When adding real content,
remove the wrapper/span and keep the children. Find all remaining slots:
`grep -rn "data-placeholder\|<Placeholder\|stub" src/`

## Writing copy (important)

Any prose that ships on the site (headlines, body, labels, captions, form
copy, alt text) goes through the `no-slop-writing` skill in
`.claude/skills/no-slop-writing/`. Run it every time you add or edit visible
copy: concrete over abstract, natural voice, no AI clichés, no em dashes
anywhere in visible text.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
