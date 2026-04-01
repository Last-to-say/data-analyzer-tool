import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const MAX_CHARTS = 4
const MISSING_THRESHOLD = 0.5
const MIN_UNIQUE_NUMERIC = 10
const MAX_UNIQUE_CATEGORICAL = 12

function isMissing(v) {
  return v === null || v === undefined || v === '' || v === 'NA'
}

function missingFraction(rows, col) {
  return rows.filter((r) => isMissing(r[col])).length / rows.length
}

function uniqueNonMissing(rows, col) {
  return new Set(rows.map((r) => r[col]).filter((v) => !isMissing(v)).map(String))
}

// ── Column selection ────────────────────────────────────────────────────────

function selectColumns(rows, columnTypes) {
  const numeric = []
  const categorical = []
  const date = []

  for (const [col, type] of Object.entries(columnTypes)) {
    if (missingFraction(rows, col) > MISSING_THRESHOLD) continue
    const uniq = uniqueNonMissing(rows, col)
    if (uniq.size <= 1) continue

    if (type === 'numeric' && uniq.size > MIN_UNIQUE_NUMERIC) {
      numeric.push(col)
    } else if (type === 'text' && uniq.size >= 2 && uniq.size <= MAX_UNIQUE_CATEGORICAL) {
      categorical.push(col)
    } else if (type === 'date') {
      date.push(col)
    }
  }

  const selected = []
  for (const col of [...numeric, ...categorical, ...date]) {
    if (selected.length >= MAX_CHARTS) break
    selected.push(col)
  }
  return selected
}

// ── Data builders ───────────────────────────────────────────────────────────

function buildHistogramData(rows, col) {
  const values = rows
    .map((r) => Number(r[col]))
    .filter((v) => !isNaN(v) && !isMissing(rows[0]?.[col]))

  // re-filter using raw row values to respect isMissing
  const nums = rows
    .filter((r) => !isMissing(r[col]) && !isNaN(Number(r[col])))
    .map((r) => Number(r[col]))

  if (nums.length === 0) return []

  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min || 1
  const bucketSize = range / 10

  const buckets = Array.from({ length: 10 }, (_, i) => {
    const lo = min + i * bucketSize
    const hi = lo + bucketSize
    return {
      label: `${Math.round(lo)}-${Math.round(hi)}`,
      count: 0,
      lo,
      hi,
    }
  })

  for (const v of nums) {
    let idx = Math.floor((v - min) / bucketSize)
    if (idx >= 10) idx = 9 // put max value in last bucket
    buckets[idx].count++
  }

  return buckets.map(({ label, count }) => ({ label, count }))
}

function buildBarData(rows, col) {
  const freq = {}
  for (const row of rows) {
    const v = row[col]
    if (isMissing(v)) continue
    const key = String(v)
    freq[key] = (freq[key] || 0) + 1
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
}

function buildLineData(rows, col) {
  const parsed = rows
    .map((r) => ({ raw: r[col], date: new Date(r[col]) }))
    .filter(({ raw, date }) => !isMissing(raw) && !isNaN(date.getTime()))

  if (parsed.length === 0) return []

  const dates = parsed.map(({ date }) => date)
  const minYear = Math.min(...dates.map((d) => d.getFullYear()))
  const maxYear = Math.max(...dates.map((d) => d.getFullYear()))
  const spanYears = maxYear - minYear

  const freq = {}
  for (const { date } of parsed) {
    const key =
      spanYears >= 2
        ? String(date.getFullYear())
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    freq[key] = (freq[key] || 0) + 1
  }

  return Object.entries(freq)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([label, count]) => ({ label, count }))
}

// ── Individual chart cards ──────────────────────────────────────────────────

function HistogramCard({ col, rows }) {
  const data = buildHistogramData(rows, col)
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Distribution of {col}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            label={{ value: col, position: 'insideBottom', offset: -16, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function BarCard({ col, rows }) {
  const data = buildBarData(rows, col)
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{col} Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            label={{ value: col, position: 'insideBottom', offset: -16, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function LineCard({ col, rows }) {
  const data = buildLineData(rows, col)
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Distribution of {col}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            label={{ value: col, position: 'insideBottom', offset: -16, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Main export ─────────────────────────────────────────────────────────────

export default function Charts({ rows, columnTypes }) {
  if (!rows || rows.length === 0) return null

  const selected = selectColumns(rows, columnTypes)
  if (selected.length === 0) return null

  return (
    <div className="mt-6">
      <h2 className="text-base font-semibold text-gray-800 mb-3">Charts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selected.map((col) => {
          const type = columnTypes[col]
          if (type === 'numeric') return <HistogramCard key={col} col={col} rows={rows} />
          if (type === 'date') return <LineCard key={col} col={col} rows={rows} />
          return <BarCard key={col} col={col} rows={rows} />
        })}
      </div>
    </div>
  )
}
