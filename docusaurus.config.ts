export default {
  title: 'Cedra Docs',
  url: 'https://docs.cedra.xyz',   // root of the sub-domain
  baseUrl: '/',                    // '/' because we're on a sub-domain
  organizationName: 'cedra-labs',  // GitHub org/user
  projectName: 'cedra-docs',       // this repo
  deploymentBranch: 'gh-pages',    // only for GitHub Pages
  trailingSlash: false,            // avoids double-slash URLs on GH Pages
  themeConfig: {
    navbar: {
      items: [
        {label: 'Code ↗︎', href: 'https://github.com/cedra-labs/cedra'},
        {label: 'Move API', to: '/move/overview'},
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
