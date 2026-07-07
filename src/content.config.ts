import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Blog posts: one markdown file per post in src/content/blog/.
 * Required frontmatter: title, date, description. Optional: author.
 * The filename (minus .md) becomes the URL: /outreach/<filename>/
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    author: z.string().optional(),
  }),
});

export const collections = { blog };
