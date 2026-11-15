# Prompt Bible — generation of `astro-blogv2`

A replayable record of how this web app was generated, prompt by prompt.
Each phase lists the user request, what was done, the key files, the decisions
taken, and how it was verified.

## 0. Stack & environment (fixed for the whole session)

| Piece | Version | Note |
|---|---|---|
| Node | v26.13.1 (LTS "Lithium") via nvm, npm 11.20.0 | shell default was Node 14 — the root cause of the old blog's failures. Always run with `nvm use` in this dir (`.nvmrc` = `26`) or `export PATH=/home/s/.nvm/versions/node/v26.13.1/bin:$PATH` |
| Astro | 7.4.12 | engines: node >= 22.23.4 (26 satisfies) |
| @astrojs/starlight | 0.43.1 | peer: astro ^7.2.10 |
| graphql | ^17.1.0 | used to port the old Gatsby `createPages` query |
| @astrojs/rss | 4.0.19 | RSS 2.0 feed |
| sharp | ^0.34.5 | image pipeline |

Run commands:

```bash
cd astro-blogv2
nvm use            # reads .nvmrc -> v26.13.1
npm install
npm run dev        # dev server
npm run build      # static build -> dist/ (120 pages)
npm run preview    # serve dist/
```

Site metadata (from the old Gatsby `gatsby-config.js`): title `socraticDev's blog`,
description `Talking about Technology, Philosophy and everything interesting`,
site `https://en.socratic.dev`, twitter `@socraticDevBlog`, default OG image
`/images/devops-knows.png` (720x240), socials: GitHub `socraticDevBlog`,
Mastodon `mastodon.social/@socdev`, X `x.com/socraticdevblog`, French site
`https://socratic.dev`, contact email `hello@socratic.dev` (later removed from UI).

---

## 1. "Start again: basic Astro site, one theme, in `astro-blogv2/`, Node 26, latest Astro. Propose 3 themes."

- Checked environment: default node was v14.20.0 (nvm); installed Node 26 via
  `nvm install 26` -> v26.13.1. Latest Astro at the time: **7.4.12**.
- Proposed 3 themes: **Starlight** (official, vanilla CSS, zero-risk), **AstroPaper**
  (minimal pure-CSS blog), **Fuwari** (feature-rich, Tailwind v4 — risky given the
  repo's history of Tailwind build failures).
- User picked **Starlight**.
- Scaffolded by hand (no interactive CLI): `package.json`, `astro.config.mjs`,
  `tsconfig.json`, `src/content.config.ts`, `.nvmrc`, `.gitignore`, plus two sample
  docs pages. Installed, built (4 pages), previewed, curl-verified 200s.
- Gotcha: Starlight >= 0.39 removed `autogenerate` at sidebar-group level; correct
  form is `items: [{ autogenerate: { directory: 'blog' } }]`.

## 2. "Copy blog posts from `../src/pages/posts` + images `../src/images/`, implement the GraphQL logic to create all posts, sorted descending datetime."

- Source: old Gatsby site — 122 markdown posts (`src/pages/posts/*.md`, frontmatter
  `title/date/author/image: ../../images/x/tags/is_archived`), 137 images, and
  `gatsby-node.js` `createPages` with
  `allMarkdownRemark(filter: {frontmatter: {is_archived: {eq: false}}}, sort: {frontmatter: {date: DESC}})`.
- Copied posts to `src/content/posts/` (image refs rewritten `../../images/` ->
  `/images/`), images to `public/images/`. 41 posts are archived -> 81 pages, same
  filter as Gatsby.
- Added `graphql` dep; wrote `src/lib/graphql.ts`: `buildSchema` + `rootValue`
  resolver over a `posts` glob collection (`src/content.config.ts`), replicating the
  Gatsby query as `allPosts(filter, sort: DESC)`, with the old `slugify()` copied
  verbatim into `src/lib/slugify.ts` (no slug collisions across 122 titles).
- Pages: `src/pages/posts/[slug].astro` (`getStaticPaths` runs the GraphQL query) +
  `src/pages/posts/index.astro`.
- Gotchas: one post (`067-platformengineering.md`) had a YAML title split across two
  lines — Astro's strict `yaml` parser rejected it; joined to one line. Astro 5+
  removed `entry.render()` -> use `render(entry)` from `astro:content`.
- Verified: build 84 pages; `/posts/` lists 81 posts strictly date-descending
  (`sort -r -c` passes; first = 2026-11-01 = newest non-archived); preview 200s
  incl. `/images/demarco.jpg`.

## 3. "Same UX as the original: posts listed on main page, post image on top before title, pagination (10 latest on main page, rest on other pages)."

- Ported the old `src/pages/index.js` (list + `page-links.js` pagination) and
  `src/components/post.js` (card: image top, title, "date by author", excerpt,
  tags, Read more) and `templates/posts-list.js` (`/page/N`).
- GraphQL schema extended: `allPosts(..., limit, offset)`, `postsPage(page, perPage)`
  returning `{posts,total,page,perPage,pageCount}`, and `excerpt` on `Post`
  (markdown stripped, ~280 chars).
- New: `src/components/PostCard.astro`, `src/components/PageLinks.astro`,
  `src/pages/index.astro` (home = 10 latest + pagination), `src/pages/page/[page].astro`
  (`getStaticPaths` creates `/page/2..9`, page 1 stays at `/` like Gatsby).
  Sample docs pages removed; Starlight splash homepage removed so `/` is free.
- Post page `[slug].astro`: image on top before the title via Starlight hero
  `image.html` + CSS override forcing the hero to stack (Starlight's scoped hero CSS
  caps the image at `min(70%,20rem)` mobile / `min(100%,25rem)` desktop side column —
  needed `!important` overrides to win).
- Verified: `/` has exactly 10 cards, `/page/2..8` 10 each, `/page/9` 1; dates
  descending everywhere; `<img>` before `<h1>` in post HTML; pagination links
  `/` + `/page/2..9`; preview 200s.

## 4. "Remove the right 'On this page' panel."

- `tableOfContents: false` in the Starlight config. Verified: zero "On this page"
  in dist HTML, 92 pages still build.

## 5. "Remove the blank left panel too."

- The blank panel was Starlight's sidebar: `hasSidebar: props.hasSidebar ?? template !== 'splash'`.
  All pages are custom `StarlightPage`s, so passed `hasSidebar={false}` to
  `<StarlightPage>` in all four page templates. Verified: `data-has-sidebar` gone
  from all HTML, no sidebar `<nav>` rendered, content full width.

## 6. "Post image is kind of small — same width as body text."

- Root cause: Starlight hero CSS caps the hero image (`width: min(70%, 20rem)` /
  `min(100%, 25rem)`), and its attribute-scoped selectors beat plain overrides.
  Fixed in `[slug].astro` with `!important` rules: hero `grid-template-columns: 100%`,
  `.hero-html`/img `width: 100%`, `height: auto` (natural aspect). Verified the
  rules are inlined in every post page and the `<img>` has no limiting attributes.

## 7. "Tags page: each tag clickable, filtered list per tag, datetime descending."

- Mirrors old `/tags` + `/tag/<slug>` pages from `gatsby-node.js` (`tagsSorted` by
  count desc).
- GraphQL: `PostFilter.tag`, new `allTags(filter)` query returning
  `{name, slug, count}` sorted count desc / name asc.
- New: `src/pages/tags/index.astro`, `src/pages/tag/[tag].astro` (paths from
  `allTags`, posts from `allPosts(filter: {is_archived: false, tag: "…"}, sort: DESC)`).
  Tag pills in `PostCard.astro` and on post pages now link to `/tag/<slug>/`.
- Verified: 27 tag pages (matches independent YAML parse of source frontmatter),
  `/tag/growth/` has 33 cards all tagged growth, dates descending; home/post pages
  contain `/tag/...` links; preview 200s.

## 8. "Dark theme on by default, remove the 'automatic' option."

- Starlight 0.43 has no config flag; used component overrides in
  `astro.config.mjs` `components:`:
  - `src/components/ThemeProvider.astro` — inline anti-FOUC script now
    `dataset.theme = storedTheme === 'light' ? 'light' : 'dark'` (was
    `prefers-color-scheme` fallback = the "auto" behavior).
  - `src/components/ThemeSelect.astro` — dropdown with only Dark (selected default)
    + Light; stored `auto` coerced to dark; `prefers-color-scheme` listener removed;
    same `starlight-theme` localStorage key. Icons are inline SVGs (Starlight's
    `Icon` isn't exported, only `components/*` are).
- Verified: `value="auto"` in 0 pages, `value="dark" selected` + `value="light"`,
  `<html data-theme="dark">`, dark-default script on home and post pages.

## 9. "RSS feed for all posts, industry-standard, usable by any reader."

- `npm i @astrojs/rss` (4.0.19); new endpoint `src/pages/rss.xml.ts` fed by the same
  GraphQL query (`allPosts(filter: {is_archived:false}, sort: DESC)`).
- RSS 2.0 with `xmlns:atom` + `xmlns:dc`; channel: title/link/description/language/
  pubDate (newest post)/lastBuildDate/`atom:link rel="self"`/generator; items:
  title, link (absolute), pubDate (RFC-822), auto `guid isPermaLink="true"`,
  `categories` from tags, `dc:creator` for the author name (`<author>` requires an
  email per spec, so dc:creator is the compliant element). Response header forced to
  `application/rss+xml; charset=utf-8`.
- `astro.config.mjs`: `site: 'https://en.socratic.dev'` (old blog's domain) +
  `head` entry `<link rel="alternate" type="application/rss+xml" ...>` for autodiscovery.
- Verified with a real XML parser: well-formed, `rss version="2.0"`, 81 items, all
  with title/link/pubDate/guid, absolute links under en.socratic.dev, first item =
  newest post; preview 200 (`/rss.xml`); dev server serves
  `Content-Type: application/rss+xml; charset=utf-8`. Note: in the static build the
  file is served by extension as `text/xml` (fine for readers; for strict
  `application/rss+xml` in production add a host `_headers` rule for `/rss.xml`).

## 10. "Blog email is hello@socratic.dev; no RSS button in the header menu."

- Starlight `social` config renders header icon buttons: added
  `{ icon: 'rss', href: 'https://en.socratic.dev/rss.xml' }` and
  `{ icon: 'email', href: 'mailto:hello@socratic.dev' }` (both icons exist in
  Starlight's set). Added `src/components/Footer.astro` (registered via
  `components.Footer`, wraps the default) with email + RSS text links.

## 11. "Remove the email button; footer gets Mastodon/X/GitHub logo links."

- Header `social` reduced to RSS only. Footer gained a "SocraticDev elsewhere on
  the web" row with inline brand SVGs (GitHub octocat, Mastodon, X — simple-icons
  paths) linking to the old footer's URLs (from `src/components/footer.js`):
  github.com/socraticDevBlog, mastodon.social/@socdev, x.com/socraticdevblog.
- Verified: header has RSS `rel="me"` button and no mailto button; footer has the
  3 logo links with aria-labels; then the email text line was removed from the
  footer (next prompt) — zero `mailto:`/`hello@socratic.dev` in dist.

## 12. "Add a link to the French website https://socratic.dev — top or bottom panel, best design."

- Chose the top header (conventional spot for cross-site/language links):
  `social` entry `{ icon: 'translate', label: 'Version française — socratic.dev', href: 'https://socratic.dev' }`.
  Verified on home + post pages.

## 13. "Is OpenGraph / social preview implemented?"

- Before: Starlight already emitted `og:title/type/url/locale/description/site_name`
  + `twitter:card`, but **no `og:image`/`twitter:image`**, and post pages reused the
  generic site description.
- Added `src/lib/head.ts` (`socialImageHead()` emitting `og:image`, `og:image:alt`,
  `twitter:image/title/description`, optional `article:published_time`) injected via
  frontmatter `head` (supported by Starlight's schema; avoids duplicating
  Starlight's own tags). Global `twitter:site=@socraticDevBlog` in config `head`.
- Post pages: `og:image` = post's own image (absolute), `og:description` = excerpt,
  `article:published_time` = date. List pages: default
  `https://en.socratic.dev/images/devops-knows.png` (old Gatsby default).
- Verified: post page has exactly one `og:image` (post image), excerpt as
  `og:description`, `article:published_time=2026-11-01`, `twitter:card=summary_large_image`;
  home uses the default banner.

## 14. "Change title to the English blog's title, the head icon, and the main graphic (turquoise cloud with '{...}') — copy from the original blog."

- Title -> `socraticDev's blog` (Starlight config; flows to header, `<title>`,
  `og:site_name`, `twitter:title`). Home `<title>` overridden via `head` entry to
  avoid "X | X" duplication.
- Favicon: copied old `src/images/head.svg` -> `public/favicon.svg` +
  `<link rel="icon" type="image/svg+xml">` / `shortcut icon` in config `head`.
- Main graphic: `src/images/banner.svg` (the turquoise cloud with `{ }` and
  "socratic.dev" lettering) shown centered on the homepage at `min(30%,360px)`
  (old `#main_logo`/`.center` sizing: width ~30%, padding-top 2em).

## 15. "Add the turquoise head as a prefix to the blog title AND as favicon."

- Favicon was already done (same `head.svg`). Title prefix: Starlight `logo` option —
  copied `head.svg` to `src/assets/head.svg`, `logo: { src, alt, replacesTitle: false }`
  renders the icon before the title text in the header.

## 16. "Header duplicates the title — remove it, use the big cloud logo as the title instead (it has 'socratic.dev' lettering)."

- `logo` switched to `src/assets/banner.svg` with `replacesTitle: true` (title text
  becomes `sr-only`, still accessible). `src/styles/custom.css` (via `customCss`)
  caps it: `.site-title img { height: 2.25rem; width: auto; }`.
- Then the visible duplicate was the homepage `<h1>` inside `content-panel > sl-container`
  (right under the cloud hero). Fixed by hiding the home h1 only:
  `main .content-panel h1#_top { display: none; }` (in `index.astro`, is:global).
  `<title>`/OG unchanged. Post pages keep their h1.
- Follow-up: "place the cloud logo in the sl-container section" — done by rendering
  the banner as the homepage **hero** (`hero.image.html` in `index.astro`), so
  `Page.astro` puts hero + content in a single `content-panel > sl-container`;
  hero stacked full-width via the same `!important` overrides as post pages.
- Verified: `dist/index.html` shows `<div class="sl-container"><div class="hero">…<img src="/images/banner.svg">`; header is logo-only; h1-hidden rule only on home.

## 17. "Custom 404: useful (big 'back to safety' button) and funny (crying kitten)."

- Starlight custom 404 = `src/content/docs/404.md` (this also resolved the earlier
  "Entry docs → 404 was not found" warning). Splash template with hero: crying
  kitten image + tagline + primary action button "Back to safety" -> `/`.
- No kitten existed in the old images, so drew one: `public/images/404-kitten.svg`
  (orange kitten, squeezed eyes, teardrops, wavy mouth, "meow?").
- Verified: `/404.html` -> 200; unknown URL -> HTTP 404 serving the page
  (contains the `sl-link-button primary` "Back to safety" link to `/` and the
  kitten img); `/images/404-kitten.svg` -> 200.

---

## Architecture map

```
astro-blogv2/
├── .nvmrc                     # "26"
├── package.json               # engines node>=26; astro ^7.4.12, starlight ^0.43.1, graphql, @astrojs/rss, sharp
├── astro.config.mjs           # site=https://en.socratic.dev; starlight(): title, logo(banner.svg, replacesTitle),
│                              #   tableOfContents:false, customCss, head (favicon/rss/twitter:site), social (rss + FR link),
│                              #   components overrides (ThemeProvider, ThemeSelect, Footer)
├── public/
│   ├── favicon.svg            # old src/images/head.svg
│   └── images/                # 137 old images + banner.svg + 404-kitten.svg
├── src/
│   ├── assets/{head.svg,banner.svg}   # header logo (banner) — processed by Vite
│   ├── content.config.ts      # docs (starlight loader) + posts (glob over src/content/posts, zod schema)
│   ├── content/posts/         # 122 copied posts (image refs -> /images/...)
│   ├── content/docs/404.md    # custom 404 (splash)
│   ├── lib/graphql.ts         # buildSchema + resolvers: allPosts(filter{is_archived,tag},sort,limit,offset),
│   │                          #   allTags(filter), postsPage(...); loadPosts over getCollection('posts')
│   ├── lib/slugify.ts         # verbatim port of old util-functions.js slugify
│   ├── lib/head.ts            # socialImageHead() OG/Twitter meta helper, defaultOgImage()
│   ├── components/            # PostCard, PageLinks, Footer, ThemeProvider, ThemeSelect
│   ├── pages/
│   │   ├── index.astro        # home: hero cloud banner + postsPage(page:1, perPage:10) cards + PageLinks
│   │   ├── page/[page].astro  # /page/2..9 from postsPage.pageCount
│   │   ├── posts/index.astro  # all posts list
│   │   ├── posts/[slug].astro # getStaticPaths via allPosts(DESC); hero image on top, render(entry)
│   │   ├── tags/index.astro   # allTags
│   │   ├── tag/[tag].astro    # paths from allTags; posts filtered by tag, DESC
│   │   └── rss.xml.ts         # RSS 2.0 feed via allPosts(DESC)
│   └── styles/custom.css      # header logo sizing
└── dist/                      # 120 pages: /, /page/2..9, /posts/*, /posts/<slug>/* (81), /tags/, /tag/* (27), /404.html, /rss.xml
```

Routes: `/` (10 latest), `/page/2..9`, `/posts/` (all), `/posts/<slug>/` (81 non-archived),
`/tags/`, `/tag/<slug>/` (27), `/404.html`, `/rss.xml`, `/images/*`, `/favicon.svg`.

## Gotchas & lessons (do not rediscover)

1. **Node version**: every shell defaults to Node 14 via nvm. Use `nvm use` (.nvmrc=26)
   or the explicit PATH prefix. This alone broke the previous Astro attempt.
2. Starlight >= 0.39 sidebar autogenerate must be nested in `items: [...]`.
3. Astro 5+ content layer: use `render(entry)` from `astro:content`, not `entry.render()`.
4. Astro's glob loader parses frontmatter with strict `yaml` — one legacy post had a
   multi-line quoted title; fixed by joining it. Scan all frontmatter if copying more.
5. Starlight hero CSS caps hero images (`min(70%,20rem)` / `min(100%,25rem)`) with
   attribute-scoped selectors — overrides need `!important`.
6. `hasSidebar={false}` on `<StarlightPage>` removes the left panel;
   `tableOfContents: false` in config removes the right TOC.
7. Starlight component overrides go in `components: {…}`; `Icon` is NOT exported —
   use inline SVGs; wrap defaults via `import Default from '@astrojs/starlight/components/X.astro'`.
8. Frontmatter `head: [{tag, attrs, content}]` adds per-page meta (incl. `<title>`);
   Starlight dedupes against its own generated tags.
9. `@astrojs/rss` auto-sets `guid isPermaLink` from item link; `<author>` must be an
   email, so author names go in `dc:creator` with `xmlns:dc` declared via `xmlns:`.
   Static hosts serve `.xml` as `text/xml` (fine for readers); dev/SSR honors the
   endpoint's `application/rss+xml` header.
10. `astro preview` daemonizes and can leave stale listeners; kill by pid
    (`ss -tlnp | grep :43xx`) when ports seem stuck.
11. Archived posts (41/122) are excluded everywhere via the GraphQL
    `filter: { is_archived: false }` — same as the old Gatsby query.

## Reproduce from scratch

1. `nvm install 26 && nvm use 26` (or set PATH to the v26.13.1 bin dir).
2. `mkdir astro-blogv2` and create `package.json` (deps above), `.nvmrc` (`26`),
   `.gitignore`, `tsconfig.json` (`extends: astro/tsconfigs/strict`).
3. Write `astro.config.mjs` exactly as in the repo (starlight config incl. logo,
   head, social, components overrides, customCss, tableOfContents:false, site).
4. `src/content.config.ts` with the `docs` (starlight loader) + `posts` (glob) collections.
5. Copy posts/images from the old site (`cp ../src/pages/posts/*.md src/content/posts/`,
   `cp ../src/images/* public/images/`, `sed -i 's#\.\./\.\./images/#/images/#g' src/content/posts/*.md`),
   fix any YAML frontmatter errors the strict parser reports.
6. Write `src/lib/{slugify,graphql,head}.ts`, the components, and the 7 pages + rss endpoint.
7. `npm install && npm run build` -> expect **120 pages**, then `npm run preview` and
   curl `/`, `/page/2/`, `/posts/`, `/posts/<slug>/`, `/tags/`, `/tag/growth/`,
   `/404.html` (and an unknown path -> 404), `/rss.xml`, `/favicon.svg`.
