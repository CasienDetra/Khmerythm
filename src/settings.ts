export type ThemeMode = 'dark' | 'light' | 'system'

export interface Settings {
  sound: boolean
  volume: number
  theme: ThemeMode
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  volume: 0.5,
  theme: 'dark',
}

const STORAGE_KEY = 'khmerythm-settings'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* Private browsing may block storage; settings still apply this session. */
  }
}
