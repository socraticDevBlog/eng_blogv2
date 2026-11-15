// OpenGraph / Twitter Card meta entries for Starlight's frontmatter `head`.
// Starlight already emits og:title, og:type, og:url, og:locale, og:description,
// og:site_name and twitter:card — this helper adds the social image and the
// remaining twitter/article tags without duplicating those.
export type HeadEntry = {
  tag: 'meta';
  attrs: Record<string, string>;
  content?: string;
};

export function socialImageHead(args: {
  image: string;
  title: string;
  description: string;
  publishedTime?: string;
}): HeadEntry[] {
  const { image, title, description, publishedTime } = args;
  const entries: HeadEntry[] = [
    { tag: 'meta', attrs: { property: 'og:image', content: image } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: title } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: image } },
    { tag: 'meta', attrs: { name: 'twitter:title', content: title } },
    { tag: 'meta', attrs: { name: 'twitter:description', content: description } },
  ];
  if (publishedTime) {
    entries.push({ tag: 'meta', attrs: { property: 'article:published_time', content: publishedTime } });
  }
  return entries;
}

export function defaultOgImage(site: URL): string {
  return new URL('/images/devops-knows.png', site).toString();
}
