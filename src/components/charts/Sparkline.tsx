import { useState } from 'react'

export interface ChartPoint {
  label: string
  value: number
}

export default function Sparkline({ data, format = (v: number) => String(v) }: { data: ChartPoint[]; format?: (value: number) => string }) {
  const [index, setIndex] = useState(data.length - 1)
  const [active, setActive] = useState(false)
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = 504 / Math.max(data.length - 1, 1)
  const xAt = (i: number) => 8 + i * step
  const yAt = (v: number) => 10 + (1 - (v - min) / span) * 140
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)} ${yAt(d.value).toFixed(1)}`).join(' ')
  const area = `${line} L${xAt(data.length - 1)} 160 L${xAt(0)} 160 Z`
  const safeIndex = Math.max(0, Math.min(index, data.length - 1))
  const point = data[safeIndex]
  const tipX = Math.min(Math.max(xAt(safeIndex), 72), 448)
  const labelEvery = Math.max(1, Math.ceil(data.length / 7))
  const labels = data.filter((_, i) => i % labelEvery === 0 || i === data.length - 1)

  const move = (key: string) => {
    const next: Record<string, number> = {
      ArrowLeft: safeIndex - 1,
      ArrowRight: safeIndex + 1,
      Home: 0,
      End: data.length - 1,
    }
    if (next[key] === undefined) return
    setIndex(Math.min(Math.max(next[key], 0), data.length - 1))
    setActive(true)
  }

  return (
    <div className="sparkline">
      <div
        className={active ? 'spark-plot is-hovering' : 'spark-plot'}
        role="group"
        tabIndex={0}
        aria-label={`WPM chart, ${data.length} points. Use arrow keys to read values.`}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - box.left) / box.width) * 520
          setIndex(Math.min(Math.max(Math.round((x - 8) / step), 0), data.length - 1))
          setActive(true)
        }}
        onPointerLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        onKeyDown={(e) => move(e.key)}
      >
        <svg viewBox="0 0 520 160" aria-hidden>
          <defs>
            <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="spark-area" d={area} />
          <path className="spark-line" d={line} pathLength={1} />
        </svg>
        <div className={active ? 'spark-cursor is-active' : 'spark-cursor'}>
          <span className="spark-cursor-line" style={{ left: `${(xAt(safeIndex) / 520) * 100}%` }} />
          <span
            className="spark-cursor-dot"
            style={{ left: `${(xAt(safeIndex) / 520) * 100}%`, top: `${(yAt(point.value) / 160) * 100}%` }}
          />
          <span className="spark-tooltip" style={{ left: `${(tipX / 520) * 100}%` }}>
            {format(point.value)}
          </span>
        </div>
      </div>
      <div className="spark-axis" aria-hidden>
        {labels.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>WPM over time</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
