export default {
  title: 'Cedra Docs',
  url: 'https://cedra-labs.github.io',   // GitHub Pages URL
  baseUrl: '/docs/',                      // Repository name with trailing slash
  organizationName: 'cedra-labs',         // GitHub org/user
  projectName: 'docs',                    // Repository name
  deploymentBranch: 'gh-pages',           // Branch for GitHub Pages deployment
  trailingSlash: false,                   // avoids double-slash URLs on GH Pages
  themeConfig: {
    navbar: {
      items: [
        {label: 'Code ↗︎', href: 'https://github.com/cedra-labs/cedra'},
      ],
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
