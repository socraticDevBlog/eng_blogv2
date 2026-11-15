[![Netlify Status](https://api.netlify.com/api/v1/badges/813f3370-0abd-47a6-b7f0-e3cb35b55e28/deploy-status)](https://app.netlify.com/projects/engblogv2/deploys)

# socraticDev's blog — astro-blogv2

A rebuild of the Gatsby blog (`eng_blog`) as a minimal, single-theme
[Astro](https://astro.build) + [Starlight](https://starlight.astro.build) site.

The full prompt-by-prompt generation log (every request, decision, gotcha and
verification) is in **[PROMPT-BIBLE.md](./PROMPT-BIBLE.md)**.

## Stack

| Piece | Version |
|---|---|
| Node | v26.13.1 (LTS "Lithium") via nvm — pinned by `.nvmrc` (`26`) |
| Astro | 7.4.12 |
| @astrojs/starlight | 0.43.1 |
| graphql | ^17 (ports the old Gatsby `createPages` query) |
| @astrojs/rss | 4.0.19 |

## Quick start

```bash
nvm use            # reads .nvmrc -> Node 26
npm ci             # install from lockfile
npm run dev        # dev server
npm run build      # static build -> dist/ (120 pages)
npm run preview    # serve dist/
```

## What's inside

- **122 legacy posts** copied from the old site (`../eng_blog/src/pages/posts`),
  served as pages via a **GraphQL layer** (`src/lib/graphql.ts`) that mirrors the
  old `gatsby-node.js` query: `allPosts(filter: { is_archived: false }, sort: DESC)`
  — 41 archived posts are excluded everywhere (listings, tag pages, single pages, RSS).
- **Home page** = 10 latest posts as cards + pagination at `/page/2..9`
  (same UX as the original Gatsby site).
- **Post pages** `/posts/<slug>/` — image on top, full content width, before the title.
- **Tags**: `/tags/` index + `/tag/<slug>/` filtered listings (clickable pills), date-DESC.
- **RSS 2.0** at `/rss.xml` (`application/rss+xml` in dev/SSR), with autodiscovery link in `<head>`.
- **OpenGraph / Twitter Cards** on every page (per-post `og:image`, excerpt as description,
  `article:published_time`, `twitter:card=summary_large_image`, `twitter:site=@socraticDevBlog`).
- **Google Analytics GA4** `G-7SN1K62WBF` (same ID as the old site, `anonymize_ip: true`).
- **Dark theme by default**, no "auto" option (custom `ThemeProvider`/`ThemeSelect` overrides).
- **No side panels** (sidebar + "On this page" TOC removed).
- **Teal theme** matching the cloud logo (`#02a2c6` accent), header = cloud banner logo
  (`replacesTitle`), favicon = turquoise head (`public/favicon.svg`).
- **Custom 404** with a crying kitten and a "Back to safety" button.
- Header links: RSS feed + French site (`https://socratic.dev`). Footer: RSS + GitHub /
  Mastodon / X logos.

## Routes

`/` · `/page/2..9` · `/posts/` · `/posts/<slug>/` (81) · `/tags/` · `/tag/<slug>/` (27) ·
`/404.html` · `/rss.xml` · `/images/*` · `/favicon.svg`

## Config highlights (`astro.config.mjs`)

- `site: 'https://en.socratic.dev'`, title `socraticDev's blog`
- `logo`: `src/assets/banner.svg`, `replacesTitle: true` + `customCss` sizing
- `head`: favicon links, RSS autodiscovery, `twitter:site`, GA4 gtag pair
- `social`: RSS + French site
- `components` overrides: `ThemeProvider`, `ThemeSelect`, `Footer`

## Notes

- Posts live in `src/content/posts/*.md`; add a file and rebuild — pages, listings,
  tags, pagination and RSS all update automatically through the GraphQL layer.
- In the static build `/rss.xml` is served as `text/xml` by extension (accepted by all
  readers); for strict `application/rss+xml` in production, add a host `_headers` rule.
