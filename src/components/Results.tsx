import { useEffect, useRef } from 'react'
import { cx } from '../cx'

export interface WpmPoint {
  time: number
  wpm: number
}

interface ResultsProps {
  visible: boolean
  avgWpm: number
  peakWpm: number
  finalAccuracy: number
  wpmHistory: WpmPoint[]
  selectedTestDuration: number
}

export default function Results({ visible, avgWpm, peakWpm, finalAccuracy, wpmHistory, selectedTestDuration }: ResultsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !canvasRef.current || !containerRef.current) return
    drawSpeedGraph(canvasRef.current, containerRef.current, wpmHistory, selectedTestDuration)
  }, [visible, wpmHistory, selectedTestDuration])

  return (
    <div id="results" className={cx('results', !visible && 'hidden')}>
      <div className="results-content">
        <div className="results-graph-section">
          <div className="graph-container" ref={containerRef}>
            <canvas id="speed-graph" ref={canvasRef} />
          </div>
        </div>
        <div className="results-stats-section">
          <div className="stat-block">
            <div className="stat-value" id="avg-wpm">
              {avgWpm}
            </div>
            <div className="stat-label-khmer">ពាក្យ/នាទី</div>
          </div>
          <div className="stat-block">
            <div className="stat-value" id="final-accuracy">
              {finalAccuracy}%
            </div>
            <div className="stat-label-khmer">ព្យញ្ជនៈ &amp; ស្រះ</div>
          </div>
          <div className="stat-block">
            <div className="stat-value" id="peak-wpm">
              {peakWpm}
            </div>
            <div className="stat-label-khmer">ល្បឿនលឿងបំផុត</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function drawSpeedGraph(canvas: HTMLCanvasElement, container: HTMLDivElement, wpmHistory: WpmPoint[], selectedTestDuration: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const displayWidth = container.clientWidth
  const displayHeight = container.clientHeight
  canvas.width = displayWidth * dpr
  canvas.height = displayHeight * dpr
  canvas.style.width = displayWidth + 'px'
  canvas.style.height = displayHeight + 'px'
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)
  const width = displayWidth
  const height = displayHeight
  const padding = { top: 56, right: 36, bottom: 40, left: 80 }
  ctx.clearRect(0, 0, width, height)

  let history = wpmHistory
  if (!history || history.length === 0) {
    history = [{ time: selectedTestDuration, wpm: 0 }]
  }

  const lastTime = history[history.length - 1]?.time ?? selectedTestDuration
  const wpmBySecond = Array(lastTime + 1).fill(0)
  history.forEach((point) => {
    if (typeof point.time === 'number') wpmBySecond[point.time] = point.wpm
  })
  for (let i = 1; i < wpmBySecond.length; i++) {
    if (wpmBySecond[i] === 0) wpmBySecond[i] = wpmBySecond[i - 1]
  }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxWPM = Math.max(...wpmBySecond) * 1.15 || 10
  const minWPM = 0
  const minTime = 0
  const maxTime = lastTime
  const xStep = plotWidth / (maxTime - minTime || 1)
  const yScale = plotHeight / (maxWPM - minWPM)

  ctx.save()
  ctx.strokeStyle = 'rgba(69,71,90,0.7)'
  ctx.lineWidth = 1.5
  ctx.font = '20px var(--font-stats)'
  ctx.fillStyle = '#cdd6f4'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  const yTicks = 5
  for (let i = 0; i <= yTicks; i++) {
    const wpmVal = minWPM + (maxWPM - minWPM) * (i / yTicks)
    const y = height - padding.bottom - (wpmVal - minWPM) * yScale
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()
    ctx.fillText(String(Math.round(wpmVal)), padding.left - 16, y)
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const xTicks = Math.min(6, wpmBySecond.length - 1)
  for (let i = 0; i <= xTicks; i++) {
    const timeVal = minTime + (maxTime - minTime) * (i / xTicks)
    const x = padding.left + (timeVal - minTime) * xStep
    ctx.beginPath()
    ctx.moveTo(x, height - padding.bottom)
    ctx.lineTo(x, height - padding.bottom + 8)
    ctx.stroke()
    ctx.fillText(String(Math.round(timeVal)), x, height - padding.bottom + 12)
  }
  ctx.restore()
  ctx.save()
  ctx.beginPath()
  for (let i = 0; i < wpmBySecond.length; i++) {
    const x = padding.left + (i - minTime) * xStep
    const y = height - padding.bottom - (wpmBySecond[i] - minWPM) * yScale
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.strokeStyle = '#f5c2e7'
  ctx.lineWidth = 3.5
  ctx.stroke()
  ctx.lineTo(padding.left + (wpmBySecond.length - 1) * xStep, height - padding.bottom)
  ctx.lineTo(padding.left, height - padding.bottom)
  ctx.closePath()
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
  gradient.addColorStop(0, 'rgba(245,194,231,0.20)')
  gradient.addColorStop(1, 'rgba(245,194,231,0.02)')
  ctx.fillStyle = gradient
  ctx.globalAlpha = 0.7
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()
}
