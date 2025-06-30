# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the documentation site for Cedra Network, built with Docusaurus 3.7.0. The site is deployed to GitHub Pages at https://cedra-labs.github.io/cedra-docs/.

## Essential Commands

### Development
```bash
# Install dependencies
npm install

# Start development server (opens at http://localhost:3000)
npm start

# Build static site
npm run build

# Serve built site locally (after build)
npm run serve

# Type check TypeScript files
npm run typecheck
```

### Deployment
```bash
# Deploy to GitHub Pages (requires GIT_USER environment variable)
GIT_USER=<GITHUB_USERNAME> npm run deploy:github

# Build and deploy in one command
npm run deploy:local
```

## Architecture and Structure

### Project Layout
```
cedra-docs/
├── docs/                    # Main documentation content
│   ├── intro.md            # Homepage after landing
│   ├── handbook-for-newcomers.md
│   ├── architecture.mdx    # Architecture overview
│   ├── getting-started/    # Getting started guides
│   ├── cli/               # CLI documentation
│   └── guides/            # Real-world implementation guides
├── src/                   # React components and custom pages
│   ├── components/       # Reusable React components
│   ├── css/             # Global styles
│   └── pages/           # Custom pages (landing page)
├── static/              # Static assets
│   ├── img/            # Images and logos
│   └── CNAME          # GitHub Pages custom domain
├── docusaurus.config.js # Main configuration
├── sidebars.ts         # Sidebar navigation structure
└── package.json        # Dependencies and scripts
```

### Key Configuration Details

The site is configured in `docusaurus.config.js` with:
- **URL**: https://cedra-labs.github.io
- **Base URL**: /cedra-docs/
- **Organization**: cedra-labs
- **Project**: cedra-docs
- **Deployment Branch**: gh-pages
- **Algolia Search**: Integrated with environment variables (ALGOLIA_APP_ID, ALGOLIA_API_KEY)

### Documentation Structure

The sidebar navigation (defined in `sidebars.ts`) organizes content into:
1. **Getting Started** - Basic setup and first steps
2. **Introduction to Cedra** - Core concepts and architecture
3. **CLI Usage** - Command-line interface documentation
4. **Real World Guides** - Practical implementation examples

### Deployment Process

**Automatic Deployment**: 
- Configured via `.github/workflows/deploy.yml`
- Triggers on push to `main` branch
- Uses Node.js 18 and GitHub Pages action
- Requires Algolia credentials set as GitHub secrets

**Manual Deployment**:
- Must set GIT_USER environment variable
- Deploys to `gh-pages` branch
- GitHub Pages serves from this branch

### Working with Content

**Adding New Documentation**:
1. Create `.md` or `.mdx` files in appropriate `docs/` subdirectory
2. Add frontmatter with `sidebar_position` for ordering
3. Update `sidebars.ts` if creating new categories

**Static Assets**:
- Place images in `static/img/`
- Reference as `/img/filename.ext` in markdown
- Logo files: `logo.svg` (light) and `logo-dark.svg` (dark mode)

### Environment Setup

**Local Development**:
- Create `.env` file for Algolia credentials (optional)
- No linting or pre-commit hooks configured
- TypeScript checking available via `npm run typecheck`

**GitHub Actions**:
- Set ALGOLIA_APP_ID and ALGOLIA_API_KEY as repository secrets
- Deployment automatically handled on main branch pushes

### Common Tasks

**Update Navigation**: Edit `sidebars.ts` to modify sidebar structure

**Change Site Metadata**: Update `docusaurus.config.js` for title, tagline, or other site-wide settings

**Customize Styling**: Edit `src/css/custom.css` for global styles

**Add Search Functionality**: Algolia DocSearch is pre-configured; ensure environment variables are set

**Create Interactive Content**: Use `.mdx` files to include React components in documentation