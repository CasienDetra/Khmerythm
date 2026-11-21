import { useState } from 'react'

export interface Slice {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: Slice[]
  label: string
}

const SIZE = 180
const STROKE = 24
const RADIUS = SIZE / 2 - STROKE / 2 - 4
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 3

export default function DonutChart({ data, label }: DonutChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const denom = total || 1
  let offset = 0
  const arcs = data.map((d) => {
    const length = (d.value / denom) * CIRCUMFERENCE
    const arc = { ...d, length, offset }
    offset += length
    return arc
  })

  return (
    <div className="chart-donut">
      <div className="chart-donut-ring">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
          <circle className="chart-donut-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
          {arcs.map((arc, i) => (
            <circle
              key={arc.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
              stroke={arc.color}
              strokeDasharray={`${Math.max(arc.length - GAP, 0)} ${CIRCUMFERENCE}`}
              strokeDashoffset={-arc.offset}
              className={active === i ? 'is-active' : active !== null ? 'is-dimmed' : ''}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              onPointerEnter={() => setActive(i)}
              onClick={() => setActive(active === i ? null : i)}
            />
          ))}
        </svg>
        <div className="chart-donut-center" aria-hidden>
          <strong>{active === null ? total : data[active].value}</strong>
          <span>{active === null ? label : data[active].label}</span>
        </div>
      </div>
      <ul className="chart-legend">
        {data.map((d, i) => (
          <li key={d.label}>
            <button
              type="button"
              className={active === i ? 'is-active' : ''}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(active === i ? null : i)}
            >
              <span className="chart-legend-dot" style={{ background: d.color }} />
              <span>{d.label}</span>
              <b>{d.value}</b>
              <small>{Math.round((d.value / denom) * 100)}%</small>
            </button>
          </li>
        ))}
      </ul>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
