import { useState } from 'react'

export interface BarDatum {
  label: string
  value: number
}

interface BarChartProps {
  data: BarDatum[]
  max: number
  ticks: number[]
  suffix: string
  label: string
}

export default function BarChart({ data, max, ticks, suffix, label }: BarChartProps) {
  const [active, setActive] = useState<number | null>(null)

  return (
    <div className="chart-bars">
      <div className="chart-bars-ticks" aria-hidden>
        {ticks.map((t) => (
          <span key={t} style={{ bottom: `${(t / max) * 100}%` }}>
            {t}
          </span>
        ))}
      </div>
      <div className="chart-bars-plot" role="group" aria-label={label}>
        {ticks.map((t) => (
          <div key={t} className="chart-gridline" style={{ bottom: `${(t / max) * 100}%` }} />
        ))}
        {data.map((d, i) => (
          <div
            key={`${d.label}-${i}`}
            className={active === i ? 'chart-bar is-active' : active !== null ? 'chart-bar is-dimmed' : 'chart-bar'}
            style={{ height: `${Math.min((d.value / max) * 100, 100)}%` }}
            role="img"
            aria-label={`${d.label}, ${d.value} ${suffix}`}
            tabIndex={0}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            <span className="chart-bar-tooltip">{d.value} {suffix}</span>
          </div>
        ))}
      </div>
      <div className="chart-bars-labels" aria-hidden>
        {data.map((d, i) => (
          <span key={`${d.label}-${i}`}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}
