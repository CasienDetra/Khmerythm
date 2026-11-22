import { cx } from '../cx'

interface SettingsSidebarProps {
  open: boolean
  keyboardVisible: boolean
  onToggleKeyboard: () => void
  onClose: () => void
}

export default function SettingsSidebar({ open, keyboardVisible, onToggleKeyboard, onClose }: SettingsSidebarProps) {
  return (
    <aside className={cx('settings-sidebar', open && 'is-open')} aria-hidden={!open}>
      <div className="settings-head">
        <h2>Settings</h2>
        <button className="settings-close" onClick={onClose} aria-label="Close settings">×</button>
      </div>
      <div className="settings-section">
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
