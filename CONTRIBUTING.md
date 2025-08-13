# Contributing to Cedra Documentation

Thank you for your interest in contributing! This guide will help you get started quickly.

## Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/cedra-docs
cd cedra-docs

# 2. Setup environment
npm install

# 3. Create new branch
git checkout -b my-feature

# 4. Start local development
npm start

# 5. Submit PR
git push origin my-feature
```

## Code of Conduct
By participating, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### 🐛 Reporting Bugs

Before reporting, check if the issue already exists. Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Clear description and steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version)
- Error messages and screenshots if applicable

### 💡 Suggesting Features

Check existing documentation first. Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) and describe:
- The documentation gap you're addressing
- Your proposed solution
- Alternative approaches considered

### 📝 Your First Contribution

Start with issues labeled:
- `good-first-issue` - Simple fixes, great for beginners
- `help-wanted` - More complex but well-defined tasks

## Development Guidelines

### Documentation Style Guide

- **Clear and Concise**: Write simple, direct explanations
- **Code Examples**: Include practical examples for all features
- **Consistent Formatting**: Use proper Markdown formatting
- **Accessibility**: Ensure content is accessible to all readers

### Writing Standards

Every documentation page needs:
- **Title and Description**: Clear page title and meta description
- **Introduction**: Brief overview of the topic
- **Code Examples**: Practical, working examples
- **References**: Links to related documentation

Example documentation structure:
```markdown
# Feature Title

Brief description of what this feature does.

## Overview

More detailed explanation of the feature.

## Installation

```bash
# Installation commands
```

## Usage

### Basic Example

```move
// Code example
```

### Advanced Example

```move
// More complex example
```

## API Reference

Details about available methods and parameters.

## Related Topics

- [Link to related topic](./related-topic.md)
```

### Testing Documentation

Before submitting:
- **Build locally**: Run `npm run build` to ensure no build errors
- **Check links**: Verify all internal and external links work
- **Review formatting**: Ensure consistent markdown formatting
- **Test examples**: Verify all code examples are accurate

## Commit Guidelines

Format: `<type>: <subject>`

Types:
- `feat` - New documentation or feature
- `fix` - Documentation fix
- `docs` - Documentation improvements
- `style` - Formatting changes
- `refactor` - Documentation restructuring
- `chore` - Maintenance tasks

Examples:
```
feat: add flash loan documentation
fix: correct Move syntax in examples
docs: improve getting started guide
```

## Pull Request Process

1. **Before submitting:**
   - Run build: `npm run build`
   - Test locally: `npm start`
   - Update sidebar if adding new pages

2. **PR must include:**
   - Clear description of changes
   - Link to related issue(s)
   - Screenshots if UI-related
   - List of pages affected

3. **Review process:**
   - Automated CI checks must pass
   - At least one maintainer review required
   - Address all feedback

## Local Development

### Setting up Algolia Search (Optional)

1. Create a `.env` file:
```bash
ALGOLIA_APP_ID=YOUR_APP_ID
ALGOLIA_API_KEY=YOUR_API_KEY
ALGOLIA_INDEX_NAME=Main
```

2. Start development server:
```bash
npm start
```

### Common Commands

```bash
# Start development server
npm start

# Build the site
npm run build

# Type checking
npm run typecheck

# Serve built site locally
npm run serve
```

## Getting Help

- **TG Builders**: [Link](https://t.me/+Ba3QXd0VG9U0Mzky)
- **Discord**: [Link](https://discord.com/invite/cedranetwork)

## Recognition

Contributors with merged PRs receive:
- Credit in CONTRIBUTORS.md
- Exclusive Cedra Developer Perks
- Access to contributor calls
- Mysterious project participation

**Ready to contribute?** Pick an issue labeled `good-first-issue` and start documenting! 🚀