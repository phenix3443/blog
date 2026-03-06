#!/bin/bash
set -e

# Multi-Theme Build Script
# Builds all three Hugo themes and creates entry page

echo "=========================================="
echo "Multi-Theme Build Script"
echo "=========================================="

# Configuration
THEMES=("bootstrap" "fixit" "next")
BASE_URL="${BASE_URL:-https://blog.panghuli.cn}"
BUILD_DIR="public"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Clean previous builds
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# Build each theme
for theme in "${THEMES[@]}"; do
  echo ""
  echo -e "${BLUE}=========================================="
  echo -e "Building theme: ${GREEN}${theme}${NC}"
  echo -e "==========================================${NC}"

  hugo \
    --config "config/_default,config/${theme}" \
    --baseURL "${BASE_URL}/${theme}/" \
    --destination "${BUILD_DIR}/${theme}" \
    --gc \
    --minify

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ ${theme} theme built successfully${NC}"
  else
    echo -e "${RED}✗ ${theme} theme build failed${NC}"
    exit 1
  fi
done

# Create entry page that redirects to preferred theme
echo ""
echo -e "${BLUE}Creating entry page...${NC}"

cat > "${BUILD_DIR}/index.html" <<'EOF'
<!DOCTYPE html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>phenix3443's blog</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.2rem;
      opacity: 0.9;
    }
    .spinner {
      margin: 2rem auto;
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .theme-links {
      margin-top: 2rem;
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .theme-link {
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-radius: 0.5rem;
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s;
    }
    .theme-link:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: white;
      transform: translateY(-2px);
    }
  </style>
  <script>
    (function() {
      // Try to get preferred theme from localStorage
      var preferredTheme = null;
      try {
        preferredTheme = localStorage.getItem('preferred-theme');
      } catch (e) {
        console.warn('localStorage not available');
      }

      // Redirect to preferred theme or default to bootstrap
      var theme = preferredTheme || 'bootstrap';
      var validThemes = ['bootstrap', 'fixit', 'next'];

      if (validThemes.indexOf(theme) === -1) {
        theme = 'bootstrap';
      }

      // Redirect after a short delay to show loading
      setTimeout(function() {
        window.location.href = '/' + theme + '/';
      }, 500);
    })();
  </script>
</head>
<body>
  <div class="container">
    <h1>phenix3443's blog</h1>
    <div class="spinner"></div>
    <p>正在加载...</p>
    <div class="theme-links">
      <a href="/bootstrap/" class="theme-link">Bootstrap</a>
      <a href="/fixit/" class="theme-link">FixIt</a>
      <a href="/next/" class="theme-link">Next</a>
    </div>
  </div>
</body>
</html>
EOF

echo -e "${GREEN}✓ Entry page created${NC}"

# Create a simple robots.txt if it doesn't exist
if [ ! -f "${BUILD_DIR}/robots.txt" ]; then
  echo ""
  echo -e "${BLUE}Creating robots.txt...${NC}"
  cat > "${BUILD_DIR}/robots.txt" <<EOF
User-agent: *
Allow: /

Sitemap: ${BASE_URL}/bootstrap/sitemap.xml
Sitemap: ${BASE_URL}/fixit/sitemap.xml
Sitemap: ${BASE_URL}/next/sitemap.xml
EOF
  echo -e "${GREEN}✓ robots.txt created${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Build Summary"
echo -e "==========================================${NC}"
echo -e "Base URL: ${BASE_URL}"
echo -e "Output directory: ${BUILD_DIR}"
echo ""

for theme in "${THEMES[@]}"; do
  if [ -d "${BUILD_DIR}/${theme}" ]; then
    size=$(du -sh "${BUILD_DIR}/${theme}" | cut -f1)
    echo -e "${GREEN}✓${NC} ${theme}: ${size}"
  fi
done

total_size=$(du -sh "${BUILD_DIR}" | cut -f1)
echo ""
echo -e "Total size: ${total_size}"
echo ""
echo -e "${GREEN}All themes built successfully!${NC}"
