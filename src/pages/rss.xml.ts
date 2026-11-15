import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { queryPosts } from '../lib/graphql';

// RSS 2.0 feed of all non-archived posts, newest first — same GraphQL query
// as the site itself.
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(context: APIContext) {
  const result = await queryPosts(`
    {
      allPosts(filter: { is_archived: false }, sort: DESC) {
        slug
        excerpt
        frontmatter {
          title
          date
          author
          tags
        }
      }
    }
  `);
  if (result.errors) throw new Error(JSON.stringify(result.errors, null, 2));
  const posts = result.data!.allPosts;

  const site = context.site ?? new URL('https://en.socratic.dev');
  const feedUrl = new URL('/rss.xml', site).toString();
  const newest = posts[0]?.frontmatter.date;

  const response = await rss({
    title: "socraticDev's blog",
    description: 'Talking about Technology, Philosophy and everything interesting',
    site,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      dc: 'http://purl.org/dc/elements/1.1/',
    },
    customData: [
      '<language>en-us</language>',
      newest ? `<pubDate>${new Date(newest).toUTCString()}</pubDate>` : '',
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
      '<generator>Astro</generator>',
    ].join(''),
    items: posts.map((post) => ({
      title: post.frontmatter.title,
      description: post.excerpt,
      link: `/posts/${post.slug}/`,
      pubDate: new Date(post.frontmatter.date),
      categories: post.frontmatter.tags ?? [],
      customData: post.frontmatter.author
        ? `<dc:creator>${escapeXml(post.frontmatter.author)}</dc:creator>`
        : '',
    })),
  });
  // Serve with the IANA-registered RSS media type so any reader/validator accepts it.
  response.headers.set('Content-Type', 'application/rss+xml; charset=utf-8');
  return response;
}
