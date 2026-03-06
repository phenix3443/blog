# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog built with Hugo (static site generator) using the hugo-theme-bootstrap theme. The blog is written primarily in Chinese (zh-hans) and is automatically deployed to GitHub Pages via GitHub Actions.

- **Site URL**: https://blog.panghuli.cn
- **Hugo Version**: 0.147.2 (extended) in CI/CD
- **Theme**: github.com/razonyang/hugo-theme-bootstrap v1.13.3
- **Primary Language**: Chinese (zh-hans)
- **Content Location**: `content/posts/` (main blog posts)

## Development Commands

### Local Development
```bash
# Start Hugo development server
hugo server

# Start with drafts visible
hugo server -D

# Build the site (output to public/)
hugo --gc --minify
```

### Content Management
```bash
# Create a new post using the archetype
hugo new posts/post-name/index.md

# The archetype (archetypes/default.md) includes:
# - title, description, slug, date
# - featured, draft, comment, toc, reward, pinned, carousel, math flags
# - series, categories, tags, images arrays
```

### Theme Management
```bash
# Update the hugo-theme-bootstrap theme
./upgrade-hugo-theme-bootstrap.sh

# This script:
# 1. Updates the Hugo module to latest master
# 2. Regenerates package.json from theme
# 3. Updates npm dependencies
# 4. Commits changes with "Update the theme" message
```

### Dependencies
```bash
# Install Node.js dependencies (required for theme assets)
npm install

# Or if using pnpm
pnpm install
```

## Architecture

### Hugo Module System
The theme is loaded as a Hugo module (not a git submodule):
- Defined in `go.mod`: `github.com/razonyang/hugo-theme-bootstrap v1.13.3`
- Theme dependencies are mirrored in `package.json` with comments pointing to the theme
- Use `hugo mod` commands to manage the theme module

### Content Structure
```
content/
├── posts/          # Main blog posts (mainSections)
├── about/          # About page
├── archives/       # Archives listing
├── authors/        # Author profiles
├── blog/           # Alternative blog section
├── categories/     # Category taxonomy pages
├── series/         # Series taxonomy pages
├── tags/           # Tag taxonomy pages
└── search/         # Search page
```

### Custom Layouts
Custom layout overrides are in `layouts/`:
- `layouts/partials/sidebar/` - Customized sidebar widgets (about.html, posts.html, profile.html, profile/)
- `layouts/_default/` - Default layout overrides
- `layouts/posts/` - Post-specific layouts
- `layouts/shortcodes/` - Custom shortcodes

### Configuration
Configuration is split across multiple files in `config/`:
- `config/_default/hugo.yaml` - Main Hugo configuration (baseURL, taxonomies, permalinks, module imports)
- `config/_default/params.yaml` - Theme parameters (brand, palette, social links, features)
- `config/_default/languages.yaml` - Language configuration
- `config/_default/menu.yaml` - Navigation menus
- `config/_default/pagination.yaml` - Pagination settings
- `config/_default/server.yaml` - Development server settings
- `config/production/params.yaml` - Production-specific overrides

### Post Front Matter
Posts use YAML front matter with these key fields:
- `title`, `description`, `slug`, `date`
- `draft: false` - Must be false for production
- `categories`, `tags`, `series` - Taxonomies
- `featured`, `pinned`, `carousel` - Display options
- `math`, `toc`, `comment`, `reward` - Feature toggles
- `<!--more-->` - Summary separator in content

### Git Integration
- `enableGitInfo: true` - Hugo uses git history for lastmod dates
- Front matter lastmod priority: `:git`, `lastmod`, `:fileModTime`, `:default`
- Ensure git history is available when building (GitHub Actions uses `fetch-depth: 0`)

## Deployment

The site deploys automatically via GitHub Actions (`.github/workflows/hugo.yml`):
1. Triggers on push to `main` branch
2. Installs Hugo 0.147.2 extended and Dart Sass
3. Runs `npm ci` to install dependencies
4. Builds with `hugo --gc --minify`
5. Deploys to GitHub Pages

The workflow uses Hugo cache to speed up builds and sets `TZ: Asia/Shanghai` for correct timestamps.

## Important Notes

- **Chinese Content**: The blog is primarily in Chinese. Respect the language when creating or editing content.
- **Theme Updates**: Always use `upgrade-hugo-theme-bootstrap.sh` to update the theme, not manual `hugo mod get`.
- **Git Quotepath**: The CI workflow sets `git config core.quotepath false` to handle Chinese filenames correctly.
- **Custom Sidebar**: The sidebar has custom partials in `layouts/partials/sidebar/` that override theme defaults.
- **No Scripts in package.json**: There are no npm scripts defined; use Hugo commands directly.
