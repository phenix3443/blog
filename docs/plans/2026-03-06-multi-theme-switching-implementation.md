# Multi-Theme Switching Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to dynamically switch between 3 Hugo themes (hugo-theme-bootstrap, FixIt, hugo-theme-next) in the browser with persistent preference storage.

**Architecture:** Multi-site build approach where each theme generates a complete static site in separate subdirectories (public/bootstrap/, public/fixit/, public/next/). Frontend JavaScript handles theme switching via URL navigation and localStorage for persistence.

**Tech Stack:** Hugo (static site generator), Hugo Modules (theme management), JavaScript (theme switcher), Bash (build automation), GitHub Actions (CI/CD)

---

## Task 1: Add New Themes as Hugo Modules

**Files:**
- Modify: `go.mod`
- Modify: `go.sum` (auto-generated)

**Step 1: Add FixIt theme module**

Run:
```bash
hugo mod get github.com/hugo-fixit/FixIt@latest
```

Expected: Module added to go.mod and go.sum updated

**Step 2: Add hugo-theme-next module**

Run:
```bash
hugo mod get github.com/hugo-next/hugo-theme-next@latest
```

Expected: Module added to go.mod and go.sum updated

**Step 3: Verify modules**

Run:
```bash
hugo mod graph
```

Expected: Output shows all 3 theme modules (bootstrap, FixIt, next)

**Step 4: Commit**

```bash
git add go.mod go.sum
git commit -m "feat: add FixIt and hugo-theme-next as Hugo modules"
```

---

## Task 2: Create Configuration Structure for Multiple Themes

**Files:**
- Create: `config/bootstrap/hugo.yaml`
- Create: `config/bootstrap/params.yaml`
- Create: `config/bootstrap/menu.yaml`
- Create: `config/fixit/hugo.yaml`
- Create: `config/fixit/params.yaml`
- Create: `config/fixit/menu.yaml`
- Create: `config/next/hugo.yaml`
- Create: `config/next/params.yaml`
- Create: `config/next/menu.yaml`

**Step 1: Create bootstrap theme config directory**

Run:
```bash
mkdir -p config/bootstrap
```

**Step 2: Move current config to bootstrap**

Run:
```bash
cp config/_default/hugo.yaml config/bootstrap/hugo.yaml
cp config/_default/params.yaml config/bootstrap/params.yaml
cp config/_default/menu.yaml config/bootstrap/menu.yaml
```

**Step 3: Update bootstrap hugo.yaml for subdirectory deployment**

Edit `config/bootstrap/hugo.yaml`:
```yaml
# Keep existing content, just ensure module import is correct
module:
  imports:
    - path: github.com/razonyang/hugo-theme-bootstrap
```

**Step 4: Create fixit theme config directory**

Run:
```bash
mkdir -p config/fixit
```

**Step 5: Create fixit hugo.yaml**

Create `config/fixit/hugo.yaml`:
```yaml
baseURL: https://blog.panghuli.cn/fixit/
title: phenix3443's blog
copyright: "Copyright © 2016-{year} phenix3443. All Rights Reserved."
defaultContentLanguage: zh-hans
hasCJKLanguage: true
enableRobotsTXT: true
enableEmoji: true
enableGitInfo: true

module:
  imports:
    - path: github.com/hugo-fixit/FixIt

taxonomies:
  category: categories
  series: series
  tag: tags

build:
  writeStats: true

markup:
  tableOfContents:
    endLevel: 4
    ordered: false
    startLevel: 1

frontmatter:
  lastmod: [":git", "lastmod", ":fileModTime", ":default"]
```

**Step 6: Create fixit params.yaml**

Create `config/fixit/params.yaml`:
```yaml
# FixIt theme parameters
version: "0.3.X"
description: phenix3443's blog.
keywords: [Hugo, Blog]
defaultTheme: auto
fingerprint: sha256
dateFormat: "2006-01-02"

# Header config
header:
  desktopMode: sticky
  mobileMode: auto
  title:
    name: phenix3443

# Footer config
footer:
  enable: true
  custom: "Copyright © 2016-{year} phenix3443. All Rights Reserved."
  hugo: false
  siteCopyright: true

# Home page config
home:
  profile:
    enable: true
    title: phenix3443's blog
    subtitle: 技术博客
    social: true
  posts:
    enable: true
    paginate: 10

# Social config
social:
  GitHub: phenix3443
  Email: phenix3443
  RSS: true

# Page config
page:
  toc:
    enable: true
    auto: true
  code:
    copy: true
    maxShownLines: 20
  math:
    enable: false
  comment:
    enable: true
```

**Step 7: Create fixit menu.yaml**

Create `config/fixit/menu.yaml`:
```yaml
main:
  - identifier: posts
    name: 文章
    url: /posts/
    weight: 1
  - identifier: categories
    name: 分类
    url: /categories/
    weight: 2
  - identifier: tags
    name: 标签
    url: /tags/
    weight: 3
  - identifier: about
    name: 关于
    url: /about/
    weight: 4
```

**Step 8: Create next theme config directory**

Run:
```bash
mkdir -p config/next
```

**Step 9: Create next hugo.yaml**

Create `config/next/hugo.yaml`:
```yaml
baseURL: https://blog.panghuli.cn/next/
title: phenix3443's blog
copyright: "Copyright © 2016-{year} phenix3443. All Rights Reserved."
defaultContentLanguage: zh-hans
hasCJKLanguage: true
enableRobotsTXT: true
enableEmoji: true
enableGitInfo: true

module:
  imports:
    - path: github.com/hugo-next/hugo-theme-next

taxonomies:
  category: categories
  series: series
  tag: tags

build:
  writeStats: true

markup:
  tableOfContents:
    endLevel: 4
    ordered: false
    startLevel: 1

frontmatter:
  lastmod: [":git", "lastmod", ":fileModTime", ":default"]
```

**Step 10: Create next params.yaml**

Create `config/next/params.yaml`:
```yaml
# hugo-theme-next parameters
description: phenix3443's blog.
keywords: [Hugo, Blog]

# Scheme settings
scheme: Muse

# Menu settings
menu:
  home: /
  archives: /archives/
  categories: /categories/
  tags: /tags/
  about: /about/

# Sidebar settings
sidebar:
  position: left
  display: post

# Social links
social:
  GitHub: https://github.com/phenix3443
  Email: mailto:phenix3443

# Post settings
post:
  toc:
    enable: true
    number: true
  copyright:
    enable: true
    license: CC BY-NC-SA 4.0
```

**Step 11: Create next menu.yaml**

Create `config/next/menu.yaml`:
```yaml
main:
  - identifier: home
    name: 首页
    url: /
    weight: 1
  - identifier: archives
    name: 归档
    url: /archives/
    weight: 2
  - identifier: categories
    name: 分类
    url: /categories/
    weight: 3
  - identifier: tags
    name: 标签
    url: /tags/
    weight: 4
  - identifier: about
    name: 关于
    url: /about/
    weight: 5
```

**Step 12: Commit**

```bash
git add config/bootstrap config/fixit config/next
git commit -m "feat: create multi-theme configuration structure"
```

---

## Task 3: Create Theme Switcher JavaScript

**Files:**
- Create: `static/js/theme-switcher.js`

**Step 1: Create static/js directory**

Run:
```bash
mkdir -p static/js
```

**Step 2: Create theme-switcher.js**

Create `static/js/theme-switcher.js`:
```javascript
(function() {
  'use strict';

  const THEMES = {
    bootstrap: { name: 'Bootstrap', path: '/bootstrap/' },
    fixit: { name: 'FixIt', path: '/fixit/' },
    next: { name: 'Next', path: '/next/' }
  };

  const DEFAULT_THEME = 'bootstrap';

  // Get current theme from URL
  function getCurrentTheme() {
    const path = window.location.pathname;
    for (const [key, theme] of Object.entries(THEMES)) {
      if (path.startsWith(theme.path)) {
        return key;
      }
    }
    return DEFAULT_THEME;
  }

  // Switch to a different theme
  function switchTheme(themeName) {
    if (!THEMES[themeName]) {
      console.error('Unknown theme:', themeName);
      return;
    }

    const currentTheme = getCurrentTheme();
    if (currentTheme === themeName) {
      return; // Already on this theme
    }

    const currentPath = window.location.pathname;
    let contentPath = currentPath;

    // Remove current theme prefix
    if (currentTheme !== DEFAULT_THEME) {
      contentPath = currentPath.replace(THEMES[currentTheme].path, '/');
    }

    // Add new theme prefix
    const newPath = THEMES[themeName].path + contentPath.substring(1);

    // Save preference
    localStorage.setItem('preferred-theme', themeName);

    // Navigate to new theme
    window.location.href = newPath;
  }

  // Create theme switcher UI
  function createThemeSwitcher() {
    const currentTheme = getCurrentTheme();

    // Create container
    const container = document.createElement('div');
    container.id = 'theme-switcher';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Create label
    const label = document.createElement('div');
    label.textContent = '主题切换';
    label.style.cssText = `
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
    `;
    container.appendChild(label);

    // Create buttons
    for (const [key, theme] of Object.entries(THEMES)) {
      const button = document.createElement('button');
      button.textContent = theme.name;
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 16px;
        margin-bottom: 4px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: ${key === currentTheme ? '#007bff' : '#fff'};
        color: ${key === currentTheme ? '#fff' : '#333'};
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      `;

      button.onmouseover = function() {
        if (key !== currentTheme) {
          this.style.background = '#f5f5f5';
        }
      };

      button.onmouseout = function() {
        if (key !== currentTheme) {
          this.style.background = '#fff';
        }
      };

      button.onclick = function() {
        switchTheme(key);
      };

      container.appendChild(button);
    }

    document.body.appendChild(container);
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createThemeSwitcher);
  } else {
    createThemeSwitcher();
  }

  // Expose switchTheme globally
  window.switchTheme = switchTheme;
})();
```

**Step 3: Commit**

```bash
git add static/js/theme-switcher.js
git commit -m "feat: add theme switcher JavaScript"
```

---

## Task 4: Create Theme Switcher Partial for Bootstrap

**Files:**
- Create: `layouts/partials/custom/head.html`

**Step 1: Create custom partials directory**

Run:
```bash
mkdir -p layouts/partials/custom
```

**Step 2: Create head.html to inject theme switcher**

Create `layouts/partials/custom/head.html`:
```html
<!-- Theme Switcher -->
<script src="/js/theme-switcher.js" defer></script>
```

**Step 3: Commit**

```bash
git add layouts/partials/custom/head.html
git commit -m "feat: add theme switcher injection for bootstrap theme"
```

---

## Task 5: Create Build Script for All Themes

**Files:**
- Create: `scripts/build-all-themes.sh`

**Step 1: Create scripts directory**

Run:
```bash
mkdir -p scripts
```

**Step 2: Create build-all-themes.sh**

Create `scripts/build-all-themes.sh`:
```bash
#!/bin/bash
set -e

echo "=========================================="
echo "Building all themes for multi-theme blog"
echo "=========================================="

THEMES=("bootstrap" "fixit" "next")
BASE_URL="https://blog.panghuli.cn"

# Clean old builds
echo "Cleaning old builds..."
rm -rf public/*

# Build each theme
for theme in "${THEMES[@]}"; do
  echo ""
  echo "Building theme: $theme"
  echo "----------------------------------------"

  hugo \
    --config "config/_default,config/$theme" \
    --baseURL "$BASE_URL/$theme/" \
    --destination "public/$theme" \
    --gc \
    --minify

  echo "✓ Theme $theme built successfully"
done

# Create root index.html for theme redirection
echo ""
echo "Creating root index.html..."
cat > public/index.html <<'EOF'
<!DOCTYPE html>
<html lang="zh-hans">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>phenix3443's blog</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #007bff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  <script>
    (function() {
      const preferredTheme = localStorage.getItem('preferred-theme') || 'bootstrap';
      const themes = {
        bootstrap: '/bootstrap/',
        fixit: '/fixit/',
        next: '/next/'
      };
      const targetPath = themes[preferredTheme] || themes.bootstrap;
      window.location.href = targetPath;
    })();
  </script>
</head>
<body>
  <div class="container">
    <h1>正在跳转到您偏好的主题...</h1>
    <div class="spinner"></div>
    <p>如果没有自动跳转，请点击：</p>
    <p>
      <a href="/bootstrap/">Bootstrap 主题</a> |
      <a href="/fixit/">FixIt 主题</a> |
      <a href="/next/">Next 主题</a>
    </p>
  </div>
</body>
</html>
EOF

echo "✓ Root index.html created"

echo ""
echo "=========================================="
echo "All themes built successfully!"
echo "=========================================="
echo ""
echo "Output directories:"
for theme in "${THEMES[@]}"; do
  size=$(du -sh "public/$theme" | cut -f1)
  echo "  - public/$theme/ ($size)"
done
echo ""
```

**Step 3: Make script executable**

Run:
```bash
chmod +x scripts/build-all-themes.sh
```

**Step 4: Test the build script**

Run:
```bash
./scripts/build-all-themes.sh
```

Expected: All 3 themes build successfully, output to public/bootstrap/, public/fixit/, public/next/

**Step 5: Commit**

```bash
git add scripts/build-all-themes.sh
git commit -m "feat: add build script for all themes"
```

---

## Task 6: Update GitHub Actions Workflow

**Files:**
- Modify: `.github/workflows/hugo.yml`

**Step 1: Read current workflow**

Run:
```bash
cat .github/workflows/hugo.yml
```

**Step 2: Update workflow to use build script**

Edit `.github/workflows/hugo.yml`, replace the "Build with Hugo" step:

```yaml
      - name: Build with Hugo
        run: |
          chmod +x scripts/build-all-themes.sh
          ./scripts/build-all-themes.sh
```

**Step 3: Update Hugo version if needed**

Ensure `HUGO_VERSION` is set to a recent version that supports all themes (0.147.2 should work).

**Step 4: Commit**

```bash
git add .github/workflows/hugo.yml
git commit -m "ci: update workflow to build all themes"
```

---

## Task 7: Test Local Build and Theme Switching

**Files:**
- None (testing only)

**Step 1: Build all themes locally**

Run:
```bash
./scripts/build-all-themes.sh
```

Expected: Successful build of all 3 themes

**Step 2: Start local server**

Run:
```bash
cd public && python3 -m http.server 8000
```

**Step 3: Test bootstrap theme**

Open browser: http://localhost:8000/bootstrap/

Expected: Site loads with bootstrap theme, theme switcher visible in bottom-right

**Step 4: Test theme switching to FixIt**

Click "FixIt" button in theme switcher

Expected: Page navigates to /fixit/ with FixIt theme

**Step 5: Test theme switching to Next**

Click "Next" button in theme switcher

Expected: Page navigates to /next/ with Next theme

**Step 6: Test persistence**

Refresh page after switching themes

Expected: Stays on selected theme (localStorage working)

**Step 7: Test root redirect**

Open browser: http://localhost:8000/

Expected: Redirects to /bootstrap/ (or last selected theme)

**Step 8: Stop server**

Run:
```bash
# Press Ctrl+C in terminal
```

---

## Task 8: Create Documentation

**Files:**
- Modify: `CLAUDE.md`
- Create: `docs/MULTI-THEME.md`

**Step 1: Update CLAUDE.md**

Add to `CLAUDE.md` after "Development Commands" section:

```markdown
### Multi-Theme System
```bash
# Build all themes (bootstrap, fixit, next)
./scripts/build-all-themes.sh

# Build single theme for testing
hugo --config "config/_default,config/bootstrap" --baseURL "http://localhost:1313/bootstrap/" -D server

# Test locally after building all themes
cd public && python3 -m http.server 8000
# Visit: http://localhost:8000/
```

The blog supports 3 themes that users can switch between:
- hugo-theme-bootstrap (default)
- FixIt
- hugo-theme-next

Each theme has its own configuration in `config/<theme>/`.
```

**Step 2: Create multi-theme documentation**

Create `docs/MULTI-THEME.md`:
```markdown
# Multi-Theme System Documentation

## Overview

This blog supports dynamic theme switching between 3 Hugo themes:
- **hugo-theme-bootstrap** - Current default theme
- **FixIt** - Modern, feature-rich theme
- **hugo-theme-next** - Clean, minimalist theme

Users can switch themes via a floating button in the bottom-right corner. Their preference is saved in browser localStorage.

## Architecture

### Build Process
- Each theme is built independently to its own subdirectory
- Output structure: `public/bootstrap/`, `public/fixit/`, `public/next/`
- Root `index.html` redirects to user's preferred theme

### Theme Switching
- JavaScript-based switcher (`static/js/theme-switcher.js`)
- Preserves current URL path when switching
- Stores preference in localStorage

### Configuration
- Shared config: `config/_default/`
- Theme-specific config: `config/<theme>/`
- Each theme has: `hugo.yaml`, `params.yaml`, `menu.yaml`

## Development

### Building All Themes
```bash
./scripts/build-all-themes.sh
```

### Building Single Theme
```bash
hugo --config "config/_default,config/bootstrap" --baseURL "http://localhost:1313/bootstrap/" server
```

### Testing Locally
```bash
./scripts/build-all-themes.sh
cd public && python3 -m http.server 8000
# Open http://localhost:8000/
```

## Adding a New Theme

1. Add theme as Hugo module:
   ```bash
   hugo mod get github.com/author/theme-name@latest
   ```

2. Create configuration directory:
   ```bash
   mkdir -p config/themename
   ```

3. Create theme config files:
   - `config/themename/hugo.yaml`
   - `config/themename/params.yaml`
   - `config/themename/menu.yaml`

4. Update build script:
   - Add theme to `THEMES` array in `scripts/build-all-themes.sh`

5. Update theme switcher:
   - Add theme to `THEMES` object in `static/js/theme-switcher.js`

## Troubleshooting

### Theme not building
- Check Hugo module is properly imported in `go.mod`
- Verify theme config files exist in `config/<theme>/`
- Check baseURL is set correctly for subdirectory deployment

### Theme switcher not appearing
- Ensure `static/js/theme-switcher.js` is included in build
- Check browser console for JavaScript errors
- Verify theme switcher injection in theme templates

### Content not displaying correctly
- Check front matter compatibility with theme
- Review theme documentation for required fields
- Test with a simple post first

## Maintenance

### Updating Themes
```bash
hugo mod get -u github.com/razonyang/hugo-theme-bootstrap
hugo mod get -u github.com/hugo-fixit/FixIt
hugo mod get -u github.com/hugo-next/hugo-theme-next
hugo mod tidy
```

### Checking Build Size
```bash
./scripts/build-all-themes.sh
du -sh public/*
```

## CI/CD

GitHub Actions workflow (`.github/workflows/hugo.yml`) automatically:
1. Installs Hugo and dependencies
2. Runs `./scripts/build-all-themes.sh`
3. Deploys all themes to GitHub Pages

Build time: ~5-10 minutes
Deploy size: ~210MB (3 themes × ~70MB each)
```

**Step 3: Commit**

```bash
git add CLAUDE.md docs/MULTI-THEME.md
git commit -m "docs: add multi-theme system documentation"
```

---

## Task 9: Final Testing and Deployment

**Files:**
- None (testing and deployment)

**Step 1: Clean build test**

Run:
```bash
rm -rf public resources
./scripts/build-all-themes.sh
```

Expected: Clean build succeeds for all themes

**Step 2: Verify output structure**

Run:
```bash
ls -la public/
```

Expected: Directories bootstrap/, fixit/, next/, and index.html exist

**Step 3: Check build sizes**

Run:
```bash
du -sh public/*
```

Expected: Each theme directory ~70-100MB

**Step 4: Test theme switcher in each theme**

Run:
```bash
cd public && python3 -m http.server 8000
```

Test:
1. Visit http://localhost:8000/bootstrap/ - switcher works
2. Visit http://localhost:8000/fixit/ - switcher works
3. Visit http://localhost:8000/next/ - switcher works
4. Switch between themes - URLs update correctly
5. Refresh page - theme preference persists

**Step 5: Push to GitHub**

Run:
```bash
git push origin main
```

Expected: GitHub Actions workflow triggers

**Step 6: Monitor GitHub Actions**

1. Go to repository on GitHub
2. Click "Actions" tab
3. Watch workflow execution

Expected: Workflow completes successfully in ~5-10 minutes

**Step 7: Verify deployment**

Visit: https://blog.panghuli.cn/

Expected:
- Root redirects to preferred theme
- All 3 themes accessible
- Theme switcher works
- Content displays correctly in all themes

**Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete multi-theme switching implementation"
git push origin main
```

---

## Success Criteria

- ✅ All 3 themes build successfully
- ✅ Theme switcher appears in all themes
- ✅ Users can switch between themes seamlessly
- ✅ Theme preference persists across sessions
- ✅ All 203 posts display correctly in each theme
- ✅ GitHub Actions deploys all themes automatically
- ✅ Documentation is complete and accurate

## Notes

- Build time will increase from ~2 minutes to ~6-8 minutes
- Deploy size will increase from ~71MB to ~210MB
- Some theme-specific features may not work in all themes
- Front matter may need adjustments for optimal display in each theme
- Consider adding theme preview screenshots in the future
