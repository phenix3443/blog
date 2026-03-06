/**
 * Theme Switcher for Multi-Theme Hugo Blog
 * Handles theme detection, switching, and preference persistence
 */

(function() {
  'use strict';

  // Theme configuration
  const THEMES = {
    bootstrap: {
      name: 'Bootstrap',
      path: '/bootstrap/',
      displayName: 'Bootstrap'
    },
    fixit: {
      name: 'FixIt',
      path: '/fixit/',
      displayName: 'FixIt'
    },
    next: {
      name: 'Next',
      path: '/next/',
      displayName: 'Next'
    }
  };

  const DEFAULT_THEME = 'bootstrap';
  const STORAGE_KEY = 'preferred-theme';

  /**
   * Get current theme from URL path
   * @returns {string} Current theme key
   */
  function getCurrentTheme() {
    const path = window.location.pathname;

    for (const [key, theme] of Object.entries(THEMES)) {
      if (path.startsWith(theme.path)) {
        return key;
      }
    }

    return DEFAULT_THEME;
  }

  /**
   * Get preferred theme from localStorage
   * @returns {string|null} Preferred theme key or null
   */
  function getPreferredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  }

  /**
   * Save preferred theme to localStorage
   * @param {string} themeKey - Theme key to save
   */
  function savePreferredTheme(themeKey) {
    try {
      localStorage.setItem(STORAGE_KEY, themeKey);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  }

  /**
   * Switch to a different theme
   * @param {string} targetTheme - Target theme key
   */
  function switchTheme(targetTheme) {
    if (!THEMES[targetTheme]) {
      console.error('Invalid theme:', targetTheme);
      return;
    }

    const currentTheme = getCurrentTheme();

    if (currentTheme === targetTheme) {
      return; // Already on this theme
    }

    // Get current path without theme prefix
    let currentPath = window.location.pathname;
    const currentThemeConfig = THEMES[currentTheme];

    // Remove theme prefix from current path
    if (currentPath.startsWith(currentThemeConfig.path)) {
      currentPath = currentPath.substring(currentThemeConfig.path.length);
    }

    // Ensure path starts with /
    if (!currentPath.startsWith('/')) {
      currentPath = '/' + currentPath;
    }

    // Build new URL with target theme (remove leading / from currentPath)
    const targetPath = THEMES[targetTheme].path + (currentPath === '/' ? '' : currentPath.substring(1));

    // Save preference
    savePreferredTheme(targetTheme);

    // Navigate to new theme
    window.location.href = targetPath + window.location.search + window.location.hash;
  }

  /**
   * Initialize theme switcher UI
   */
  function initThemeSwitcher() {
    const currentTheme = getCurrentTheme();

    // Update all theme switcher dropdowns
    const switchers = document.querySelectorAll('.theme-switcher-select');
    switchers.forEach(function(select) {
      select.value = currentTheme;

      select.addEventListener('change', function(e) {
        switchTheme(e.target.value);
      });
    });

    // Update all theme switcher buttons
    const buttons = document.querySelectorAll('[data-theme-switch]');
    buttons.forEach(function(button) {
      const targetTheme = button.getAttribute('data-theme-switch');

      // Highlight current theme button
      if (targetTheme === currentTheme) {
        button.classList.add('active');
      }

      button.addEventListener('click', function(e) {
        e.preventDefault();
        switchTheme(targetTheme);
      });
    });
  }

  /**
   * Check if user should be redirected to preferred theme
   */
  function checkPreferredTheme() {
    // Only redirect on entry page (root of each theme)
    const path = window.location.pathname;
    const isRootPath = path === '/' ||
                       path === '/bootstrap/' ||
                       path === '/fixit/' ||
                       path === '/next/';

    if (!isRootPath) {
      return; // Don't redirect on deep links
    }

    const currentTheme = getCurrentTheme();
    const preferredTheme = getPreferredTheme();

    if (preferredTheme && preferredTheme !== currentTheme && THEMES[preferredTheme]) {
      // Redirect to preferred theme
      const targetPath = THEMES[preferredTheme].path;
      window.location.href = targetPath;
    }
  }

  /**
   * Expose API for manual theme switching
   */
  window.ThemeSwitcher = {
    switch: switchTheme,
    current: getCurrentTheme,
    themes: THEMES,
    getPreferred: getPreferredTheme,
    savePreferred: savePreferredTheme
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      checkPreferredTheme();
      initThemeSwitcher();
    });
  } else {
    checkPreferredTheme();
    initThemeSwitcher();
  }
})();
