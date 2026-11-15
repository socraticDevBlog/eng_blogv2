import { buildSchema, graphql } from 'graphql';
import { getCollection } from 'astro:content';
import { slugify } from './slugify';

// Mirrors the page-creation queries of the old Gatsby site (gatsby-node.js /
// src/pages/index.js / src/templates/posts-list.js):
//   allMarkdownRemark(
//     filter: { frontmatter: { is_archived: { eq: false }, tags: { in: [$tag] } } }
//     sort: { frontmatter: { date: DESC } }
//     limit: ..., skip: ...
//   )
export const schema = buildSchema(`
  enum SortOrder {
    ASC
    DESC
  }

  input PostFilter {
    is_archived: Boolean
    tag: String
  }

  type Frontmatter {
    title: String!
    date: String!
    author: String
    image: String
    tags: [String!]
    is_archived: Boolean
  }

  type Post {
    id: String!
    slug: String!
    excerpt: String!
    frontmatter: Frontmatter!
  }

  type Tag {
    name: String!
    slug: String!
    count: Int!
  }

  type PostsPage {
    posts: [Post!]!
    total: Int!
    page: Int!
    perPage: Int!
    pageCount: Int!
  }

  type Query {
    allPosts(filter: PostFilter, sort: SortOrder = DESC, limit: Int, offset: Int): [Post!]!
    allTags(filter: PostFilter): [Tag!]!
    postsPage(filter: PostFilter, sort: SortOrder = DESC, page: Int = 1, perPage: Int = 10): PostsPage!
  }
`);

function makeExcerpt(body: string, length = 280): string {
  const text = (body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, ' ')
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

type Args = {
  filter?: { is_archived?: boolean; tag?: string };
  sort?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
  page?: number;
  perPage?: number;
};

async function loadPosts(args: Args) {
  let entries = await getCollection('posts');

  if (args.filter?.is_archived !== undefined) {
    entries = entries.filter((entry) => (entry.data.is_archived ?? false) === args.filter!.is_archived);
  }

  if (args.filter?.tag !== undefined && args.filter.tag !== null) {
    entries = entries.filter((entry) => (entry.data.tags ?? []).includes(args.filter!.tag!));
  }

  const direction = args.sort === 'ASC' ? 1 : -1;
  const sorted = [...entries].sort((a, b) => {
    const byDate = direction * (new Date(a.data.date).getTime() - new Date(b.data.date).getTime());
    return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
  });

  return sorted.map((entry) => ({
    id: entry.id,
    slug: slugify(entry.data.title),
    excerpt: makeExcerpt(entry.body ?? ''),
    frontmatter: {
      ...entry.data,
      date: new Date(entry.data.date).toISOString().slice(0, 10),
    },
  }));
}

export async function queryPosts(source: string) {
  const rootValue = {
    allPosts: async (args: Args) => {
      const posts = await loadPosts(args);
      const offset = args.offset ?? 0;
      return args.limit !== undefined && args.limit !== null ? posts.slice(offset, offset + args.limit) : posts.slice(offset);
    },
    allTags: async (args: Args) => {
      const posts = await loadPosts({ filter: { is_archived: args.filter?.is_archived } });
      const counts = new Map<string, number>();
      for (const post of posts) {
        for (const tag of post.frontmatter.tags ?? []) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
      // like tagsSorted() in the old site: most used tags first
      return [...counts.entries()]
        .map(([name, count]) => ({ name, slug: slugify(name), count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    },
    postsPage: async (args: Args) => {
      const perPage = args.perPage ?? 10;
      const all = await loadPosts(args);
      const total = all.length;
      const pageCount = Math.max(1, Math.ceil(total / perPage));
      const page = Math.min(Math.max(1, args.page ?? 1), pageCount);
      return {
        posts: all.slice((page - 1) * perPage, page * perPage),
        total,
        page,
        perPage,
        pageCount,
      };
    },
  };

  return graphql({ schema, source, rootValue });
}
