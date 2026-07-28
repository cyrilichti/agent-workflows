import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightThemeBlack from 'starlight-theme-black'

export default defineConfig({
  site: 'https://cyrilichti.github.io',
  base: '/agent-workflows',
  srcDir: './docs',
  integrations: [
    starlight({
      title: 'agent-workflows',
      description:
        'Install controlled workflows that select and sequence the right skills, keep approvals explicit, and connect work items to providers.',
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
          ],
        },
        {
          label: 'Workflows',
          items: [
            { label: 'Overview', slug: 'workflows' },
            { label: '/write', slug: 'workflows/write' },
            { label: '/pick', slug: 'workflows/pick' },
            { label: '/plan', slug: 'workflows/plan' },
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
