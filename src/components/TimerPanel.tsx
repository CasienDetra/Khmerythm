import { cx } from '../cx'

export interface TimerToggle {
  time: number
  label: string
  cls: string
}

interface TimerPanelProps {
  visible: boolean
  toggles: TimerToggle[]
  selected: number
  onToggle: (time: number) => void
}

export default function TimerPanel({ visible, toggles, selected, onToggle }: TimerPanelProps) {
  if (!visible) return null
  return (
    <div id="timer-display" className="timer-display timer-box">
      <div className="timer-toggle">
        {toggles.map((t) => (
          <button
            key={t.time}
            className={cx('timer-toggle-option', t.cls, t.time === selected && 'selected')}
            data-time={t.time}
            onClick={() => onToggle(t.time)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
