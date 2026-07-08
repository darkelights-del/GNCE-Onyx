# GNCE Onyx — FTC Team Website

Website for GNCE Onyx, a rookie [FIRST Tech Challenge](https://www.firstinspires.org/robotics/ftc)
team at Weston High School competing in the 2026-2027 BIOBUZZ season.
Design system, navigation, and core content are in; season content, photos,
the team number, and contact handles are still marked placeholders.

## Stack

- [Astro](https://astro.build) — static site framework
- [Tailwind CSS 4](https://tailwindcss.com) — styling (tokens in `src/styles/global.css`)
- [Lenis](https://lenis.darkroom.engineering) — smooth scrolling
- Grenze Gotisch + Vollkorn + Vollkorn SC (self-hosted via Fontsource)

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
│   ├── GearNav.astro      # Gear + full-screen menu (the centerpiece)
│   ├── Reveal.astro       # Scroll-driven entrance wrapper
│   ├── Placeholder.astro  # Marks every Lorem Ipsum slot
│   ├── SectionLabel.astro # Small-caps section labels
│   └── Footer.astro       # Plain-link nav fallback
├── pages/
│   ├── index.astro        # Home / Welcome
│   ├── season.astro       # Season Recap (first season)
│   ├── outreach/          # Blog: index + one page per post
│   └── contact.astro      # Contact + Donate (link + channels)
├── content/
│   └── blog/              # Blog posts (one .md file per post)
└── styles/
    └── global.css         # Design tokens, textures, reveal system
```

## Blog

The Outreach page is a blog. Each post is one markdown file in
`src/content/blog/` with `title`, `date`, `description` (and optional
`author`) frontmatter; the filename becomes the URL. The full walkthrough is
the "How to post" post itself (`src/content/blog/how-to-post.md`). Delete
that post once real ones exist.

Views, likes, and comments need two free accounts (config in
`src/lib/services.ts`; the site shows marked stubs until these are set):

1. **giscus** (comments + likes). Enable Discussions on this repo
   (Settings → General → Features), install the giscus app
   (github.com/apps/giscus) for the repo, then open giscus.app, enter the
   repo, pick the "Blog comments" category (create it as an Announcements
   category in Discussions), and copy the `repoId` and `categoryId` values
   into `src/lib/services.ts`.
2. **GoatCounter** (view counts). Create a site at goatcounter.com, then put
   your site code in `src/lib/services.ts`.

Comment safety: commenting requires GitHub sign-in, which blocks anonymous
spam. Everything posted lands in this repo's Discussions tab, where the team
can delete comments, report users, or lock a thread. Check it when a post
gets traffic.

## Dropping in remaining content

Two kinds of placeholder marks:

- **Blocks** still waiting on content (robot photo/specs, season log, match
  results, gallery, sponsorship tiers) are wrapped in `<Placeholder name="...">`,
  a dashed orange frame with a visible tag. Replace the contents, then remove
  the wrapper (keep its children).
- **Inline stubs** (team `#XXXXX`, `[placeholder]@gmail.com`, `@placeholder`,
  TBD dates) carry a dashed-underline `.stub` span. Replace text, drop the span.

Find every remaining slot:

```sh
grep -rn "data-placeholder\|<Placeholder\|class=\"stub\"\|stub\"" src/
```

The contact-form link, email, and Instagram are stubs until the real ones exist.

## Design system

Visual direction, tokens, type, and motion rules live in [`DESIGN.md`](./DESIGN.md).
Animation philosophy comes from the Emil Kowalski skills installed in
[`.claude/skills/`](./.claude/skills/) — Claude Code picks these up
automatically when working in this repo.
