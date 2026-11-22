import type { CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { cx } from '../cx'
import { KEYBOARD_THEMES } from './keyboard/themes'
import type { KeyboardThemeName } from './keyboard/types'
import type { Settings, ThemeMode } from '../settings'

interface SettingsSidebarProps {
  open: boolean
  settings: Settings
  onChange: (next: Settings) => void
  keyboardVisible: boolean
  onToggleKeyboard: () => void
  onClose: () => void
}

const THEMES: ThemeMode[] = ['dark', 'light', 'system']
const KEYBOARD_THEME_NAMES = Object.keys(KEYBOARD_THEMES) as KeyboardThemeName[]

export default function SettingsSidebar({
  open,
  settings,
  onChange,
  keyboardVisible,
  onToggleKeyboard,
  onClose,
}: SettingsSidebarProps) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value })

  return (
    <aside className={cx('settings-sidebar', open && 'is-open')} aria-hidden={!open}>
      <div className="settings-head">
        <h2>Settings</h2>
        <button className="settings-close" onClick={onClose} aria-label="Close settings">×</button>
      </div>

      <div className="settings-section">
        <span className="settings-label">Audio</span>
        <div className="settings-option">
          <span>Key sound</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.sound}
            className={cx('settings-switch', settings.sound && 'is-on')}
            onClick={() => update('sound', !settings.sound)}
          >
            <span />
          </button>
        </div>
        <div className="settings-option">
          <span>Wrong-key sound</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.wrongSound}
            className={cx('settings-switch', settings.wrongSound && 'is-on')}
            onClick={() => update('wrongSound', !settings.wrongSound)}
          >
            <span />
          </button>
        </div>
        <label className="settings-volume">
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            style={{ '--fill': `${settings.volume * 100}%` } as CSSProperties}
            disabled={!settings.sound}
            onChange={(e) => update('volume', Number(e.target.value))}
          />
          <b>{Math.round(settings.volume * 100)}%</b>
        </label>
      </div>

      <div className="settings-section">
        <span className="settings-label">Appearance</span>
        <div className="settings-options">
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              className={cx('theme-option', settings.theme === theme && 'is-active')}
              aria-pressed={settings.theme === theme}
              onClick={() => update('theme', theme)}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <span className="settings-label">Focus</span>
        <div className="settings-option">
          <span>Ghost mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.ghostMode}
            className={cx('settings-switch', settings.ghostMode && 'is-on')}
            onClick={() => update('ghostMode', !settings.ghostMode)}
          >
            <span />
          </button>
        </div>
        <p className="settings-hint">Dims upcoming text so only the current character stays clear.</p>
      </div>

      <div className="settings-section">
        <span className="settings-label">Keyboard theme</span>
        <div className="keyboard-theme-grid">
          {KEYBOARD_THEME_NAMES.map((name) => {
            const active = settings.keyboardTheme === name
            const variants = KEYBOARD_THEMES[name].variants
            return (
              <button
                key={name}
                type="button"
                className={cx('keyboard-theme-option', active && 'is-active')}
                aria-pressed={active}
                onClick={() => update('keyboardTheme', name)}
              >
                <span className="keyboard-theme-swatches" aria-hidden>
                  <i style={{ background: variants.light.bg }} />
                  <i style={{ background: variants.dark.bg }} />
                  <i style={{ background: variants.accent.bg }} />
                </span>
                <span className="keyboard-theme-name">{name}</span>
                {active && <Check className="keyboard-theme-check" size={14} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="settings-section">
        <span className="settings-label">Keyboard</span>
        <div className="settings-option">
          <span>Show virtual keyboard</span>
          <button
            type="button"
            role="switch"
            aria-checked={keyboardVisible}
            className={cx('settings-switch', keyboardVisible && 'is-on')}
            onClick={onToggleKeyboard}
          >
            <span />
          </button>
        </div>
      </div>

      <p className="settings-hint">More settings coming soon.</p>
    </aside>
  )
}
