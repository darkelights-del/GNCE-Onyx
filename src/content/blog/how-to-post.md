---
title: How to post on this blog
date: 2026-07-07
description: The whole process is one markdown file. Here's the template, where it goes, and what happens when you push it.
author: GNCE Onyx
---

Every post on this page is a single file in the site's repo, under `src/content/blog/`. Write one, push it, and the site rebuilds itself. No admin panel, no login, nothing to break.

A post file looks like this:

```md
---
title: Demo night at the library
date: 2026-10-14
description: One line that shows up on the outreach page under the title.
author: GNCE Onyx
---

The post body goes here. Plain markdown: paragraphs,
**bold**, [links](https://example.com), lists, and photos.
```

The filename becomes the address. Save the example above as `library-demo-night.md` and it goes live at `/outreach/library-demo-night/`.

Three rules keep the page clean. Give every post a real `description`, because that line is what people see before they click. Use a date in `YYYY-MM-DD` form so posts sort correctly. And keep filenames lowercase with hyphens.

Photos go in the repo's `public/` folder; reference them in the post as `![what the photo shows](/GNCE-Onyx/photo-name.jpg)`.

Delete this post once the first real one is up.
