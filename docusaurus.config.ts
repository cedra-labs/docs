// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

export default {
  title: 'Cedra Docs',
  url: 'https://cedra-labs.github.io',   // GitHub Pages URL
  baseUrl: '/docs/',                      // Repository name with trailing slash
  organizationName: 'cedra-labs',         // GitHub org/user
  projectName: 'docs',                    // Repository name
  deploymentBranch: 'gh-pages',           // Branch for GitHub Pages deployment
  trailingSlash: false,                   // avoids double-slash URLs on GH Pages
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
    navbar: {
      title: '',
      logo: {
        alt: 'CEDRA developers',
        src: 'img/cedra-logo.svg',
      },
      items: [
        {
          label: 'Code', 
          href: 'https://github.com/cedra-labs/cedra',
          position: 'right'
        },
      ],
    },
    algolia: {
      appId: process.env.ALGOLIA_APP_ID || 'PLACEHOLDER_APP_ID',
      apiKey: process.env.ALGOLIA_API_KEY || 'PLACEHOLDER_API_KEY',
      indexName: process.env.ALGOLIA_INDEX_NAME || 'cedra',
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
