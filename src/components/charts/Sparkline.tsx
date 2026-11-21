import { useState } from 'react'

export interface ChartPoint {
  label: string
  value: number
}

interface SparklineProps {
  data: ChartPoint[]
  title: string
  format?: (value: number) => string
}

export default function Sparkline({ data, title, format = (v) => String(v) }: SparklineProps) {
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
  const area = `${line} L${xAt(data.length - 1)} 160 L8 160 Z`
  const last = data[data.length - 1]
  const delta = last.value - data[0].value
  const safeIndex = Math.max(0, Math.min(index, data.length - 1))
  const point = data[safeIndex]
  const tipX = Math.min(Math.max(xAt(safeIndex), 72), 448)

  const move = (key: string) => {
    const next: Record<string, number> = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      Home: 0,
      End: data.length - 1,
    }
    if (next[key] === undefined) return
    setIndex(Math.min(Math.max(next[key], 0), data.length - 1))
    setActive(true)
  }

  return (
    <div className="chart-sparkline">
      <div className="chart-heading">
        <div>
          <p className="chart-title">{title}</p>
          <p className="chart-value">{format(last.value)}</p>
        </div>
        <p className="chart-delta">
          <span>{delta > 0 ? '+' : delta < 0 ? '-' : ''}{format(Math.abs(delta))}</span> vs {data[0].label}
        </p>
      </div>
      <div
        className="chart-plot"
        role="group"
        tabIndex={0}
        aria-label={`${title}, ${data.length} points. Use arrow keys to read values.`}
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
          <path className="chart-area" d={area} />
          <path className="chart-line" d={line} pathLength={1} />
        </svg>
        <div className={active ? 'chart-cursor is-active' : 'chart-cursor'}>
          <span className="chart-cursor-line" style={{ left: `${(xAt(safeIndex) / 520) * 100}%` }} />
          <span
            className="chart-cursor-dot"
            style={{ left: `${(xAt(safeIndex) / 520) * 100}%`, top: `${(yAt(point.value) / 160) * 100}%` }}
          />
          <span className="chart-tooltip" style={{ left: `${(tipX / 520) * 100}%` }}>
            <b>{format(point.value)}</b> {point.label}
          </span>
        </div>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
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
