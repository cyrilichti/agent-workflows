import starlight from '@astrojs/starlight'
import { unified } from '@astrojs/markdown-remark'
import { defineConfig } from 'astro/config'
import rehypeRaw from 'rehype-raw'
import starlightThemeBlack from 'starlight-theme-black'
import externalLinks from './docs/plugins/external-links.ts'

const site = 'https://cyrilichti.github.io'

export default defineConfig({
  site,
  base: '/agent-workflows',
  srcDir: './docs',
  // MDX inherits this processor: https://docs.astro.build/en/guides/markdown-content/
  markdown: {
    processor: unified({
      rehypePlugins: [
        [rehypeRaw, { passThrough: [
          'mdxJsxFlowElement', 'mdxJsxTextElement',
          'mdxFlowExpression', 'mdxTextExpression', 'mdxjsEsm',
        ] }],
        [externalLinks, { site }],
      ],
    }),
  },
  integrations: [
    starlight({
      title: 'Agent Workflows',
      logo: {
        light: './docs/assets/agent-workflows-logo.svg',
        dark: './docs/assets/agent-workflows-logo-dark.svg',
        alt: '',
      },
      favicon: '/favicon.svg',
      description:
        'Move from work item to merged request with workflows that select the right skills, keep mutations explicit, and synchronize your providers.',
      customCss: ['./docs/styles/custom.css'],
      editLink: {
        baseUrl:
          'https://github.com/cyrilichti/agent-workflows/edit/main/',
      },
      lastUpdated: true,
      plugins: [
        starlightThemeBlack({
          navLinks: [
            {
              label: 'Installation',
              link: '/installation/',
            },
            {
              label: 'Providers',
              link: '/providers/',
            },
            {
              label: 'Workflows',
              link: '/workflows/',
            },
            {
              label: 'Orchestration',
              link: '/orchestration/',
            },
          ],
        }),
      ],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Overview', slug: 'index' },
            { label: 'Installation', slug: 'installation' },
            { label: 'Providers', slug: 'providers' },
            { label: 'Orchestration', slug: 'orchestration' },
          ],
        },
        {
          label: 'Workflows',
          items: [
            { label: 'Overview', slug: 'workflows' },
            { label: '/write', slug: 'workflows/write' },
            { label: '/pick', slug: 'workflows/pick' },
            { label: '/plan', slug: 'workflows/plan' },
            { label: '/refine', slug: 'workflows/refine' },
            { label: '/work', slug: 'workflows/work' },
            { label: '/ready', slug: 'workflows/ready' },
            { label: '/inspect', slug: 'workflows/inspect' },
            { label: '/done', slug: 'workflows/done' },
            { label: '/next', slug: 'workflows/next' },
            { label: '/project', slug: 'workflows/project' },
          ],
        },
      ],
      social: [
        {
          href: 'https://github.com/cyrilichti/agent-workflows',
          icon: 'github',
          label: 'GitHub',
        },
      ],
    }),
  ],
})
