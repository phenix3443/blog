# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog built with Hugo (static site generator) with **multi-theme switching** capability. Users can dynamically switch between 3 different themes in the browser. The blog is written primarily in Chinese (zh-hans) and is automatically deployed to GitHub Pages via GitHub Actions.

- **Site URL**: https://blog.panghuli.cn
- **Hugo Version**: 0.147.2 (extended) in CI/CD
- **Themes**:
  - hugo-theme-bootstrap v1.13.3 (default)
  - FixIt v0.4.3
  - hugo-theme-next
- **Primary Language**: Chinese (zh-hans)
- **Content Location**: `content/posts/` (main blog posts)

## Development Commands

### Local Development
```bash
# Start Hugo development server (default theme: bootstrap)
hugo server

# Start with a specific theme
hugo server --config "config/_default,config/bootstrap"
hugo server --config "config/_default,config/fixit"
hugo server --config "config/_default,config/next"

# Start with drafts visible
hugo server -D

# Build all themes (recommended)
./scripts/build-all-themes.sh

# Build a single theme
hugo --config "config/_default,config/bootstrap" --destination "public/bootstrap" --gc --minify
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
# Build all themes at once
./scripts/build-all-themes.sh

# Update the hugo-theme-bootstrap theme
./upgrade-hugo-theme-bootstrap.sh

# Update all theme modules
hugo mod get -u
hugo mod tidy

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
Multiple themes are loaded as Hugo modules (not git submodules):
- Defined in `go.mod`:
  - `github.com/razonyang/hugo-theme-bootstrap v1.13.3`
  - `github.com/hugo-fixit/FixIt v0.4.3`
  - `github.com/hugo-next/hugo-theme-next`
- Theme dependencies are mirrored in `package.json` with comments pointing to the theme
- Use `hugo mod` commands to manage theme modules

### Multi-Theme Architecture
The blog supports 3 themes with user-side dynamic switching:
- **Build approach**: Each theme generates a complete static site in separate subdirectories
  - `public/bootstrap/` - Bootstrap theme
  - `public/fixit/` - FixIt theme
  - `public/next/` - Next theme
- **Theme switching**: JavaScript-based with localStorage persistence
  - Script: `static/js/theme-switcher.js`
  - UI component: `layouts/partials/theme-switcher.html`
  - Injected via: `layouts/partials/head.html` and `layouts/partials/header.html`
- **Entry page**: `public/index.html` redirects to user's preferred theme
- **Build script**: `scripts/build-all-themes.sh` builds all themes at once

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
- `layouts/partials/head.html` - Injects theme switcher script
- `layouts/partials/header.html` - Injects theme switcher UI
- `layouts/partials/theme-switcher.html` - Theme switcher dropdown component
- `layouts/_default/` - Default layout overrides
- `layouts/posts/` - Post-specific layouts
- `layouts/shortcodes/` - Custom shortcodes

### Configuration
Configuration is split across multiple directories in `config/`:
- `config/_default/` - Shared base configuration for all themes
  - `hugo.yaml` - Base Hugo configuration
  - `params.yaml` - Shared parameters
  - `languages.yaml` - Language configuration
  - `menu.yaml` - Menu configuration template
- `config/bootstrap/` - Bootstrap theme-specific configuration
  - `hugo.yaml` - Theme config with baseURL `/bootstrap/`
  - `params.yaml` - Bootstrap parameters
  - `menu.yaml` - Bootstrap menu
- `config/fixit/` - FixIt theme-specific configuration
  - `hugo.yaml` - Theme config with baseURL `/fixit/`
  - `params.yaml` - FixIt parameters
  - `menu.yaml` - FixIt menu
- `config/next/` - Next theme-specific configuration
  - `hugo.yaml` - Theme config with baseURL `/next/`
  - `params.yaml` - Next parameters
  - `menu.yaml` - Next menu

Additional shared configuration files:
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
