import { cx } from '../cx'
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
        <label className="settings-volume">
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
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
