import { Image as ImageIcon, RotateCcw } from 'lucide-react'
import { Sparkline, type ChartPoint } from './charts'
import { cx } from '../cx'

export interface WpmPoint {
  time: number
  wpm: number
}

interface ResultsProps {
  visible: boolean
  avgWpm: number
  peakWpm: number
  rawWpm: number
  finalAccuracy: number
  correctChars: number
  incorrectChars: number
  wpmHistory: WpmPoint[]
  selectedTestDuration: number
  onRestart: () => void
}

function consistencyOf(history: WpmPoint[]): number {
  if (history.length < 2) return 100
  const values = history.map((p) => p.wpm)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  if (!avg) return 100
  const sd = Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length)
  return Math.max(0, Math.min(100, Math.round(100 - (sd / avg) * 100)))
}

export default function Results({
  visible,
  avgWpm,
  peakWpm,
  rawWpm,
  finalAccuracy,
  correctChars,
  incorrectChars,
  wpmHistory,
  selectedTestDuration,
  onRestart,
}: ResultsProps) {
  const series = wpmHistory.length ? wpmHistory : [
    { time: 0, wpm: 0 },
    { time: selectedTestDuration, wpm: 0 },
  ]
  const points: ChartPoint[] = series.map((p) => ({ label: `${p.time}s`, value: p.wpm }))

  const copyImage = async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 520
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#111113'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.font = '700 96px "Roboto Mono", monospace'
    ctx.fillStyle = '#ff7a3d'
    ctx.fillText(String(avgWpm), 60, 140)
    ctx.fillStyle = '#d8d8dd'
    ctx.fillText(`${finalAccuracy}%`, 330, 140)
    ctx.font = '400 20px "Roboto Mono", monospace'
    ctx.fillStyle = '#9b9ca5'
    ctx.fillText('WPM', 60, 180)
    ctx.fillText('ACCURACY', 330, 180)
    ctx.fillText(`RAW ${rawWpm}   CONSISTENCY ${consistencyOf(wpmHistory)}%   BEST ${peakWpm}`, 60, 230)
    const min = Math.min(...series.map((p) => p.wpm))
    const max = Math.max(...series.map((p) => p.wpm))
    const span = max - min || 1
    ctx.strokeStyle = '#ff7a3d'
    ctx.lineWidth = 3
    ctx.beginPath()
    series.forEach((p, i) => {
      const x = 60 + (i / Math.max(series.length - 1, 1)) * 880
      const y = 470 - ((p.wpm - min) / span) * 200
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    } catch {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'khmerythm-results.png'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div id="results" className={cx('results', !visible && 'hidden')}>
      <div className="results-content">
        <div className="results-hero" key={visible ? 'shown' : 'hidden'}>
          <div className="hero-stat">
            <strong className="hero-accent"><span className="hero-roll hero-roll-up">{avgWpm}</span></strong>
            <span>WPM</span>
          </div>
          <div className="hero-stat">
            <strong><span className="hero-roll hero-roll-down">{finalAccuracy}</span><small>%</small></strong>
            <span>ACCURACY</span>
          </div>
        </div>
        <div className="results-detail">
          <div><b>{rawWpm}</b><span>RAW</span></div>
          <div><b>{consistencyOf(wpmHistory)}%</b><span>CONSISTENCY</span></div>
          <div><b>{peakWpm}</b><span>BEST</span></div>
        </div>
        <div className="results-panel">
          <div className="results-panel-head">
            <div className="results-live">
              <span>WPM</span><b>{rawWpm}</b>
              <span>ACC</span><b>{finalAccuracy}%</b>
            </div>
            <div className="results-counts">
              <span>CORRECT <b>{correctChars}</b></span>
              <span>INCORRECT <b>{incorrectChars}</b></span>
            </div>
          </div>
          <Sparkline data={points} format={(v) => `${v} wpm`} />
          <div className="results-actions">
            <button className="restart-action" onClick={onRestart}><RotateCcw size={15} /> Restart</button>
            <button onClick={copyImage}><ImageIcon size={15} /> Copy image</button>
          </div>
        </div>
      </div>
    </div>
  )
}
