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
- `baseUrl`: The base URL path (currently set to `/`)
- `organizationName` and `projectName`: Used for GitHub Pages deployment

## Search Functionality

This documentation site uses Algolia DocSearch for powerful search capabilities.

### Local Development Setup

1. Create a `.env` file in the project root with your Algolia API keys:

```bash
ALGOLIA_APP_ID=YOUR_ACTUAL_APP_ID
ALGOLIA_API_KEY=YOUR_ACTUAL_API_KEY
ALGOLIA_INDEX_NAME=Main
```

2. The environment variables will be loaded automatically when you start the development server.

### GitHub Actions Setup

To use Algolia search in your deployed site, add these environment variables to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret" and add the following secrets:
   - Name: `ALGOLIA_APP_ID`, Value: Your Algolia application ID
   - Name: `ALGOLIA_API_KEY`, Value: Your Algolia API key
   - Name: `ALGOLIA_INDEX_NAME`, Value: Your Algolia index name (usually "Main")

4. Update your GitHub Actions workflow file (`.github/workflows/deploy.yml`) to include these environment variables:

```yaml
jobs:
  deploy:
    # ... existing configuration ...
    env:
      ALGOLIA_APP_ID: ${{ secrets.ALGOLIA_APP_ID }}
      ALGOLIA_API_KEY: ${{ secrets.ALGOLIA_API_KEY }}
      ALGOLIA_INDEX_NAME: ${{ secrets.ALGOLIA_INDEX_NAME }}
    # ... rest of the configuration ...
```

## Adding Content

- Documentation pages are in the `docs/` directory
- Sidebar navigation is configured in `sidebars.ts`
- Static assets go in the `static/` directory
