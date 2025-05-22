# Cedra Documentation

This website is built using [Docusaurus](https://docusaurus.io/) and is automatically deployed to GitHub Pages.

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Deployment

### Automatic Deployment

This repository is configured with GitHub Actions to automatically deploy to GitHub Pages whenever changes are pushed to the `main` branch.

The deployment process:
1. When you push to `main`, the GitHub Action workflow is triggered
2. It builds the Docusaurus site
3. Deploys the built site to the `gh-pages` branch
4. GitHub Pages serves the content from the `gh-pages` branch

### Manual Deployment

If you need to deploy manually:

```bash
# Set your GitHub username
export GIT_USER=<Your GitHub username>

# Deploy to GitHub Pages
npm run deploy:github
```

## Configuration

The site configuration is in `docusaurus.config.ts`. Key settings include:

- `url`: The URL where the site is hosted (currently set to `https://cedra-labs.github.io`)
- `baseUrl`: The base URL path (currently set to `/docs/`)
- `organizationName` and `projectName`: Used for GitHub Pages deployment

## Adding Content

- Documentation pages are in the `docs/` directory
- Sidebar navigation is configured in `sidebars.ts`
- Static assets go in the `static/` directory
