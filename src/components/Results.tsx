import { BarChart, DonutChart, Gauge, Sparkline, type BarDatum, type ChartPoint, type Slice } from './charts'
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

function buildBars(series: WpmPoint[]): BarDatum[] {
  if (series.length <= 10) {
    return series.map((p) => ({ label: `${p.time}s`, value: p.wpm }))
  }
  const bucket = Math.ceil(series.length / 10)
  const bars: BarDatum[] = []
  for (let i = 0; i < series.length; i += bucket) {
    const chunk = series.slice(i, i + bucket)
    const avg = Math.round(chunk.reduce((sum, p) => sum + p.wpm, 0) / chunk.length)
    bars.push({ label: `${chunk[0].time}s`, value: avg })
  }
  return bars
}

export default function Results({ visible, avgWpm, peakWpm, finalAccuracy, wpmHistory, selectedTestDuration }: ResultsProps) {
  const series = wpmHistory.length ? wpmHistory : [
    { time: 0, wpm: 0 },
    { time: selectedTestDuration, wpm: 0 },
  ]
  const points: ChartPoint[] = series.map((p) => ({ label: `${p.time}s`, value: p.wpm }))
  const bars = buildBars(series)
  const barMax = Math.max(10, Math.ceil(peakWpm / 10) * 10)
  const ticks = [0, Math.round(barMax / 2), barMax]
  const slices: Slice[] = [
    { label: 'ត្រឹមត្រូវ', value: wpmHistory.length ? finalAccuracy : 0, color: '#ff7a3d' },
    { label: 'ខុស', value: wpmHistory.length ? 100 - finalAccuracy : 0, color: '#f38ba8' },
  ]

  return (
    <div id="results" className={cx('results', !visible && 'hidden')}>
      <div className="results-content">
        <div className="results-charts">
          <section className="chart-card chart-card-wide">
            <Sparkline data={points} title="ល្បឿនតាមពេលវេលា" format={(v) => `${v} wpm`} />
          </section>
          <section className="chart-card">
            <Gauge value={finalAccuracy} label="ភាពត្រឹមត្រូវ" />
          </section>
          <section className="chart-card chart-card-wide">
            <BarChart data={bars} max={barMax} ticks={ticks} suffix="wpm" label="ល្បឿនក្នុងមួយចន្លោះ" />
          </section>
          <section className="chart-card">
            <DonutChart data={slices} label="តួអក្សរ" />
          </section>
        </div>
        <div className="results-stats-section">
          <div className="stat-block">
            <div className="stat-value" id="avg-wpm">{avgWpm}</div>
            <div className="stat-label-khmer">ពាក្យ/នាទី</div>
          </div>
          <div className="stat-block">
            <div className="stat-value" id="final-accuracy">{finalAccuracy}%</div>
            <div className="stat-label-khmer">ព្យញ្ជនៈ &amp; ស្រះ</div>
          </div>
          <div className="stat-block">
            <div className="stat-value" id="peak-wpm">{peakWpm}</div>
            <div className="stat-label-khmer">ល្បឿនលឿនបំផុត</div>
          </div>
        </div>
      </div>
    </div>
  )
}
