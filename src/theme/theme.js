const THEME_STORAGE_KEY = 'fleet360.theme'
const THEMES = ['light', 'dark', 'system']

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(theme) {
  if (theme === 'system') {
    return systemPrefersDark() ? 'dark' : 'light'
  }
  return theme === 'dark' ? 'dark' : 'light'
}

export function getStoredTheme() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    if (THEMES.includes(value)) {
      return value
    }
  } catch {
    /* ignore */
  }
  return 'system'
}

export function applyThemeToDocument(theme = getStoredTheme()) {
  const resolved = resolveTheme(theme)
  document.documentElement.setAttribute('data-theme', resolved)
  document.documentElement.dataset.themePreference = theme
}

export function setTheme(theme) {
  if (!THEMES.includes(theme)) {
    return getStoredTheme()
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
  applyThemeToDocument(theme)
  return theme
}

export function cycleTheme() {
  const current = getStoredTheme()
  const index = THEMES.indexOf(current)
  const next = THEMES[(index + 1) % THEMES.length]
  return setTheme(next)
}

export function themeLabel(theme = getStoredTheme()) {
  const labels = { light: 'Light', dark: 'Dark', system: 'System' }
  return labels[theme] ?? 'System'
}

export function initTheme() {
  applyThemeToDocument(getStoredTheme())
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() === 'system') {
      applyThemeToDocument('system')
    }
  })
}
