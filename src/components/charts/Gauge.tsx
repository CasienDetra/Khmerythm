interface GaugeProps {
  value: number
  label: string
  threshold?: number
}

const CX = 100
const CY = 100
const R = 84
const TICKS = 41

function pointAt(percent: number, radius: number): [number, number] {
  const angle = Math.PI * (1 - percent / 100)
  const round = (n: number) => Math.round(n * 1000) / 1000
  return [round(CX + radius * Math.cos(angle)), round(CY - radius * Math.sin(angle))]
}

export default function Gauge({ value, label, threshold = 85 }: GaugeProps) {
  const clamped = Math.round(Math.min(Math.max(value, 0), 100))

  return (
    <div className="chart-gauge" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}>
      <div className="chart-gauge-wrap">
        <svg viewBox="0 0 200 110" aria-hidden>
          {Array.from({ length: TICKS }, (_, i) => {
            const percent = (i / (TICKS - 1)) * 100
            const [x1, y1] = pointAt(percent, R - 8)
            const [x2, y2] = pointAt(percent, R + 8)
            const lit = percent <= clamped
            const danger = percent > threshold
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={2.5}
                strokeLinecap="round"
                className={lit ? (danger ? 'is-lit is-danger' : 'is-lit') : danger ? 'is-danger' : ''}
              />
            )
          })}
        </svg>
        <span className="chart-gauge-value" aria-hidden>
          {clamped}<small>%</small>
        </span>
      </div>
      <span className="chart-title">{label}</span>
    </div>
  )
}
