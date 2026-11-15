import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  posts: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      author: z.string().optional(),
      image: z.string().optional(),
      tags: z.array(z.string()).optional(),
      is_archived: z.boolean().optional(),
    }),
  }),
};
