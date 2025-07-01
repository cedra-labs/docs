// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

export default {
  title: 'Cedra Docs',
  url: 'https://docs.cedra.labs',        // Custom domain URL
  baseUrl: '/',                          // Use '/' for custom domain
  organizationName: 'cedra-labs',         // GitHub org/user
  projectName: 'cedra-docs',              // Repository name (update if different)
  deploymentBranch: 'gh-pages',           // Branch for GitHub Pages deployment
  trailingSlash: false,                   // avoids double-slash URLs on GH Pages
  favicon: 'favicon.ico',
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'algolia-site-verification',
        content: '91148BBB2BA8D18D'
      }
    }
  ],
  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: '',
      logo: {
        alt: 'CEDRA developers',
        src: 'data:image/svg+xml;base64,' + Buffer.from(`<svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="30" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="28" fill="#111827">CEDRA</text>
  <text x="105" y="30" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="14" fill="#6b7280">developers</text>
</svg>`).toString('base64'),
        srcDark: 'data:image/svg+xml;base64,' + Buffer.from(`<svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="30" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="28" fill="#ffffff">CEDRA</text>
  <text x="105" y="30" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="14" fill="#94a3b8">developers</text>
</svg>`).toString('base64'),
      },
      items: [
        {
          label: 'Build', 
          to: '/',
          position: 'right',
          className: 'navbar__item--contrast'
        },
        {
          label: 'Code', 
          href: 'https://github.com/cedra-labs/cedra-network',
          position: 'right'
        },
      ],
    },
    algolia: {
      appId: process.env.ALGOLIA_APP_ID || 'PLACEHOLDER_APP_ID',
      apiKey: process.env.ALGOLIA_API_KEY || 'PLACEHOLDER_API_KEY',
      indexName: process.env.ALGOLIA_INDEX_NAME || 'Main',
      contextualSearch: true,
      searchParameters: {},
      searchPagePath: 'search',
    },
  },
  presets: [
    ['@docusaurus/preset-classic', {
      docs: {
        routeBasePath: '/', // Serve the docs at the site's root
        sidebarPath: require.resolve('./sidebars.ts'),
        editUrl: 'https://github.com/cedra-labs/docs/edit/main/',
      },
      blog: false,
      theme: {
        customCss: require.resolve('./src/css/custom.css'),
      },
      pages: false, // Disable pages plugin
    }],
  ],
};
