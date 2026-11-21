import { useCallback, useEffect, useRef, useState } from 'react'

export interface ChartPoint {
  label: string
  value: number
}

interface Spring {
  value: number
  target: number
  velocity: number
}

function smoothPath(points: Array<[number, number]>): string {
  if (points.length < 2) return ''
  let path = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    path += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return path
}

export default function Sparkline({ data, format = (v: number) => String(v) }: { data: ChartPoint[]; format?: (value: number) => string }) {
  const [index, setIndex] = useState(data.length - 1)
  const [active, setActive] = useState(false)
  const clipRef = useRef<SVGRectElement>(null)
  const lineRef = useRef<HTMLSpanElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef(0)
  const lastRef = useRef(0)
  const sx = useRef<Spring>({ value: 0, target: 0, velocity: 0 })
  const sy = useRef<Spring>({ value: 0, target: 0, velocity: 0 })

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = 504 / Math.max(data.length - 1, 1)
  const xAt = (i: number) => 8 + i * step
  const yAt = (v: number) => 10 + (1 - (v - min) / span) * 140
  const path = smoothPath(data.map((d, i) => [xAt(i), yAt(d.value)]))
  const area = `${path} L${xAt(data.length - 1)} 160 L${xAt(0)} 160 Z`
  const safeIndex = Math.max(0, Math.min(index, data.length - 1))
  const point = data[safeIndex]
  const labelEvery = Math.max(1, Math.ceil(data.length / 7))
  const labels = data.filter((_, i) => i % labelEvery === 0 || i === data.length - 1)

  const apply = useCallback((x: number, y: number) => {
    const cx = Math.min(Math.max(x, 0), 520)
    clipRef.current?.setAttribute('width', String(cx))
    if (lineRef.current) lineRef.current.style.left = `${(cx / 520) * 100}%`
    if (dotRef.current) {
      dotRef.current.style.left = `${(cx / 520) * 100}%`
      dotRef.current.style.top = `${(y / 160) * 100}%`
    }
    if (badgeRef.current) badgeRef.current.style.left = `${(Math.min(Math.max(cx, 72), 448) / 520) * 100}%`
  }, [])

  const stepSprings = useCallback(
    (time: number) => {
      const dt = Math.min((time - lastRef.current) / 1000, 0.032) || 0.016
      lastRef.current = time
      let moving = false
      for (const spring of [sx.current, sy.current]) {
        const force = -130 * (spring.value - spring.target) - 25 * spring.velocity
        spring.velocity += force * dt
        spring.value += spring.velocity * dt
        if (Math.abs(spring.value - spring.target) > 0.05 || Math.abs(spring.velocity) > 0.05) {
          moving = true
        } else {
          spring.value = spring.target
          spring.velocity = 0
        }
      }
      apply(sx.current.value, sy.current.value)
      rafRef.current = moving ? requestAnimationFrame(stepSprings) : 0
    },
    [apply],
  )

  const kick = useCallback(() => {
    if (rafRef.current) return
    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(stepSprings)
  }, [stepSprings])

  const moveTo = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(i, data.length - 1))
      sx.current.target = xAt(clamped)
      sy.current.target = yAt(data[clamped].value)
      setIndex(clamped)
      kick()
    },
    // xAt/yAt are derived from the current data on every render.
    [data, kick, min, span, step],
  )

  useEffect(() => {
    sx.current.value = sx.current.target = xAt(data.length - 1)
    sy.current.value = sy.current.target = yAt(data[data.length - 1].value)
    apply(sx.current.value, sy.current.value)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    // Position the crosshair when the series first mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply])

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
          moveTo(Math.round((x - 8) / step))
          setActive(true)
        }}
        onPointerLeave={() => {
          setActive(false)
          moveTo(data.length - 1)
        }}
        onFocus={() => {
          setActive(true)
          moveTo(safeIndex)
        }}
        onBlur={() => {
          setActive(false)
          moveTo(data.length - 1)
        }}
        onKeyDown={(e) => {
          const next: Record<string, number> = {
            ArrowLeft: safeIndex - 1,
            ArrowRight: safeIndex + 1,
            Home: 0,
            End: data.length - 1,
          }
          if (next[e.key] === undefined) return
          e.preventDefault()
          moveTo(next[e.key])
          setActive(true)
        }}
      >
        <svg viewBox="0 0 520 160" aria-hidden>
          <defs>
            <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <clipPath id="spark-reveal">
              <rect ref={clipRef} x="0" y="0" width="520" height="160" />
            </clipPath>
          </defs>
          <path className="spark-area" d={area} />
          <path className="spark-line-ghost" d={path} />
          <path className="spark-line" d={path} clipPath="url(#spark-reveal)" />
        </svg>
        <div className={active ? 'spark-cursor is-active' : 'spark-cursor'}>
          <span ref={lineRef} className="spark-cursor-line" />
          <span ref={dotRef} className="spark-cursor-dot" />
          <span ref={badgeRef} className="spark-tooltip">{format(point.value)}</span>
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
