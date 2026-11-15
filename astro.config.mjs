import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://en.socratic.dev',
  integrations: [
    starlight({
      title: "socraticDev's blog",
      description: 'Talking about Technology, Philosophy and everything interesting',
      logo: {
        src: './src/assets/banner.svg',
        alt: 'socratic.dev',
        replacesTitle: true,
      },
      customCss: ['./src/styles/custom.css'],
      tableOfContents: false,
      social: [
        { icon: 'rss', label: 'RSS feed', href: 'https://en.socratic.dev/rss.xml' },
        { icon: 'translate', label: 'Version française — socratic.dev', href: 'https://socratic.dev' },
      ],
      head: [
        { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' } },
        { tag: 'link', attrs: { rel: 'shortcut icon', href: '/favicon.svg' } },
        {
          tag: 'link',
          attrs: {
            rel: 'alternate',
            type: 'application/rss+xml',
            title: "socraticDev's blog — RSS feed",
            href: 'https://en.socratic.dev/rss.xml',
          },
        },
        { tag: 'meta', attrs: { name: 'twitter:site', content: '@socraticDevBlog' } },
        // Google Analytics (GA4) — same measurement ID as the old Gatsby site
        {
          tag: 'script',
          attrs: { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-7SN1K62WBF' },
        },
        {
          tag: 'script',
          content: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-7SN1K62WBF', { anonymize_ip: true });`,
        },
      ],
      components: {
        // Dark theme by default, no "auto" option (see the components themselves).
        ThemeProvider: './src/components/ThemeProvider.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
        // Footer with the contact email and an RSS link.
        Footer: './src/components/Footer.astro',
      },
    }),
  ],
});
