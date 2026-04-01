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
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const MAX_CHARTS        = 4
const MISSING_THRESHOLD = 0.5   // skip columns with >50% missing
const NORMALIZE_ROWS    = 50    // show % instead of counts when dataset is this large

const GRID_COLOR = '#334155'
const AXIS_COLOR = '#64748b'

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: '#1E293B',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '8px 12px',
}
const TOOLTIP_LABEL_STYLE = { color: '#ffffff', fontSize: 11 }
const TOOLTIP_ITEM_STYLE  = { color: '#94a3b8', fontSize: 11 }

// ── Color helpers ────────────────────────────────────────────────────────────

function getColColor(col, rows) {
  const nonMissing = rows.map((r) => r[col]).filter((v) => !isMissing(v))
  const unique = new Set(nonMissing.map(String))
  if (unique.size === 2) return '#0EA5E9'
  const nums = nonMissing
    .filter((v) => !isNaN(Number(v)) && String(v).trim() !== '')
    .map(Number)
  const isNum = nonMissing.length > 0 && nums.length / nonMissing.length >= 0.8
  if (isNum) return (Math.max(...nums) - Math.min(...nums)) > 50 ? '#0EA5E9' : '#34D399'
  return unique.size <= 5 ? '#34D399' : '#8B5CF6'
}

const PIE_COLORS = ['#0EA5E9', '#34D399', '#8B5CF6', '#F59E0B', '#EF4444']

function getPieSliceColor(index) {
  return PIE_COLORS[index % PIE_COLORS.length]
}

// ── Missing / unique helpers ─────────────────────────────────────────────────

function isMissing(v) {
  return v === null || v === undefined || v === '' || v === 'NA'
}

function missingFraction(rows, col) {
  return rows.filter((r) => isMissing(r[col])).length / rows.length
}

function uniqueNonMissing(rows, col) {
  return new Set(rows.map((r) => r[col]).filter((v) => !isMissing(v)).map(String))
}

// ── Column role detection — purely data-driven, zero hardcoded names ─────────
//
//  Roles:
//   'binary'       → 2 unique values          → pie chart
//   'categorical'  → 3–12 unique text values   → bar chart
//                  → numeric 3–10 unique        → bar chart
//   'numeric-dist' → numeric > 10 unique        → histogram
//   'date'         → date column               → trend line
//   null           → skip (identifier / zero variance / too many categories)
//
//  Skip rules:
//   > 80 % unique values         → identifier (skip)
//   ≤ 1 unique value             → zero variance (skip)
//   text with > 12 unique        → too noisy (skip)
//   > 50 % missing               → skip

function detectColRole(rows, col, colType) {
  const total      = rows.length
  const nonMissing = rows.map((r) => r[col]).filter((v) => !isMissing(v))

  if (nonMissing.length / total < 1 - MISSING_THRESHOLD) return null

  // Date columns can have many unique values but are not identifiers
  if (colType === 'date') {
    const uniq = new Set(nonMissing.map(String))
    return uniq.size > 1 ? 'date' : null
  }

  const uniq = uniqueNonMissing(rows, col)

  if (uniq.size <= 1)           return null  // zero variance
  if (uniq.size / total > 0.8)  return null  // near-identifier

  if (uniq.size === 2) return 'binary'

  if (colType === 'numeric') {
    return uniq.size > 10 ? 'numeric-dist' : 'categorical'
  }

  // text
  return uniq.size <= 12 ? 'categorical' : null
}

// Priority score for a column — used to pick the best within each role slot.
// Higher = better chart candidate. No name patterns.
function roleScore(role, uniqSize) {
  if (role === 'binary')       return 10
  if (role === 'categorical')  return Math.max(1, 8 - uniqSize / 2)  // fewer categories = cleaner
  if (role === 'numeric-dist') return 5
  if (role === 'date')         return 3
  return 0
}

// ── Data builders ────────────────────────────────────────────────────────────

function buildHistogramData(rows, col) {
  const nums = rows
    .map((r) => r[col])
    .filter((v) => !isMissing(v) && !isNaN(Number(v)))
    .map(Number)

  if (nums.length === 0) return []

  const min        = Math.min(...nums)
  const max        = Math.max(...nums)
  const range      = max - min || 1
  const bucketSize = range / 10

  const buckets = Array.from({ length: 10 }, (_, i) => {
    const lo = min + i * bucketSize
    const hi = lo + bucketSize
    return { label: `${Math.round(lo)}–${Math.round(hi)}`, count: 0 }
  })

  for (const v of nums) {
    let idx = Math.floor((v - min) / bucketSize)
    if (idx >= 10) idx = 9
    buckets[idx].count++
  }

  return buckets
}

function buildBarData(rows, col) {
  const nonMissing = rows.filter((r) => !isMissing(r[col]))
  const freq = {}
  for (const row of nonMissing) {
    const key = String(row[col])
    freq[key] = (freq[key] || 0) + 1
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
}

function buildPieData(rows, col) {
  const nonMissing = rows.filter((r) => !isMissing(r[col]))
  const freq = {}
  for (const row of nonMissing) {
    const key = String(row[col])
    freq[key] = (freq[key] || 0) + 1
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))
}

function buildDateLineData(rows, col) {
  const parsed = rows
    .map((r) => r[col])
    .filter((v) => !isMissing(v))
    .map((v) => new Date(v))
    .filter((d) => !isNaN(d.getTime()))

  if (parsed.length === 0) return []

  const minYear  = Math.min(...parsed.map((d) => d.getFullYear()))
  const maxYear  = Math.max(...parsed.map((d) => d.getFullYear()))
  const spanYears = maxYear - minYear

  const freq = {}
  for (const date of parsed) {
    const key = spanYears >= 2
      ? String(date.getFullYear())
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    freq[key] = (freq[key] || 0) + 1
  }

  return Object.entries(freq)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([label, count]) => ({ label, count }))
}

// ── Insight generators — plain language, derived from actual chart data ───────

function insightFromHistogram(data, col) {
  if (!data || data.length === 0) return null
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return null
  const peak = data.reduce((a, b) => (b.count > a.count ? b : a))
  const pct  = Math.round((peak.count / total) * 100)
  return `About ${pct}% of ${col} values fall in the ${peak.label} range — this is where the data concentrates most.`
}

function insightFromBar(rawData, col) {
  if (!rawData || rawData.length === 0) return null
  const total  = rawData.reduce((s, d) => s + d.count, 0)
  if (total === 0) return null
  const top    = rawData[0]
  const topPct = Math.round((top.count / total) * 100)
  if (topPct >= 60) {
    return `"${top.label}" accounts for ${topPct}% of all records — this group strongly dominates the rest.`
  }
  if (topPct < 30 && rawData.length >= 4) {
    return `No single group stands out: "${top.label}" leads at just ${topPct}%, suggesting a fairly even spread across categories.`
  }
  return `"${top.label}" is the most common value at ${topPct}%, with other categories sharing the remainder.`
}

function insightFromPie(data, col) {
  if (!data || data.length === 0) return null
  const total  = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null
  const top    = data[0]
  const topPct = Math.round((top.value / total) * 100)
  if (data.length === 2) {
    const pct2    = 100 - topPct
    const balance = Math.abs(topPct - 50) < 10
      ? 'a near-even split'
      : topPct > 65
      ? 'a clear majority leaning toward'
      : 'a moderate tilt toward'
    return `The ${col} split shows ${balance} "${top.name}" (${topPct}% vs ${pct2}%).`
  }
  if (topPct >= 50) {
    return `"${top.name}" makes up more than half of this breakdown — it's the dominant group by a wide margin.`
  }
  return `"${top.name}" leads at ${topPct}%, but no single value fully dominates this breakdown.`
}

function insightFromDateLine(data) {
  if (!data || data.length < 2) return null
  const peak  = data.reduce((a, b) => (b.count > a.count ? b : a))
  const first = data[0]
  const last  = data[data.length - 1]
  const trend = last.count > first.count * 1.15
    ? 'growing'
    : last.count < first.count * 0.85
    ? 'declining'
    : 'roughly stable'
  return `Volume peaks around ${peak.label} and the overall trend has been ${trend} across this period.`
}

// ── Shared components ────────────────────────────────────────────────────────

function InsightLine({ text }) {
  if (!text) return null
  return (
    <p className="mt-3 pt-3 border-t border-slate-600/60 text-xs italic text-slate-400 leading-relaxed">
      <span className="not-italic font-medium text-slate-300">Insight: </span>{text}
    </p>
  )
}

function pctFormatter(total) {
  return (value) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, 'Count']
}

// ── Chart cards ──────────────────────────────────────────────────────────────

function HistogramCard({ col, rows }) {
  const data    = buildHistogramData(rows, col)
  const color   = getColColor(col, rows)
  const insight = insightFromHistogram(data, col)
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">Distribution of {col}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            label={{ value: col, position: 'insideBottom', offset: -16, fontSize: 11, fill: AXIS_COLOR }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 11, fill: AXIS_COLOR }}
          />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={pctFormatter(rows.length)}
          />
          <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <InsightLine text={insight} />
    </div>
  )
}

function BarCard({ col, rows }) {
  const normalize = rows.length > NORMALIZE_ROWS
  const rawData   = buildBarData(rows, col)
  const total     = rawData.reduce((s, d) => s + d.count, 0)
  const data      = rawData.map((d) => ({
    label: d.label,
    value: normalize ? Math.round((d.count / total) * 1000) / 10 : d.count,
    count: d.count,
  }))
  const color      = getColColor(col, rows)
  const insight    = insightFromBar(rawData, col)
  const yLabel     = normalize ? '%' : 'Count'
  const tooltipFmt = normalize
    ? (v) => [`${v}%`, 'Share']
    : pctFormatter(rows.length)
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">{col} Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            label={{ value: col, position: 'insideBottom', offset: -16, fontSize: 11, fill: AXIS_COLOR }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: AXIS_COLOR }}
          />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={tooltipFmt}
          />
          <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <InsightLine text={insight} />
    </div>
  )
}

function PieCard({ col, rows }) {
  const normalize  = rows.length > NORMALIZE_ROWS
  const data       = buildPieData(rows, col)
  const total      = data.reduce((sum, d) => sum + d.value, 0)
  const insight    = insightFromPie(data, col)
  const tooltipFmt = normalize
    ? (value, name) => [`${((value / total) * 100).toFixed(1)}%`, name]
    : (value, name) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">{col} Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={75}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            labelLine={{ stroke: AXIS_COLOR }}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={getPieSliceColor(i)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={tooltipFmt}
          />
        </PieChart>
      </ResponsiveContainer>
      <InsightLine text={insight} />
    </div>
  )
}

function DateLineCard({ col, rows }) {
  const data    = buildDateLineData(rows, col)
  const color   = getColColor(col, rows)
  const insight = insightFromDateLine(data)
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">Trend over time ({col})</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            label={{ value: col, position: 'insideBottom', offset: -16, fontSize: 11, fill: AXIS_COLOR }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 11, fill: AXIS_COLOR }}
          />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={pctFormatter(rows.length)}
          />
          <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <InsightLine text={insight} />
    </div>
  )
}

// ── Chart selection ──────────────────────────────────────────────────────────
//
//  Slots (filled in order):
//   slot 1 — binary (pie)
//   slot 2 — categorical (bar)
//   slot 3 — numeric-dist or date (histogram / line)
//   slot 4 — wildcard: best remaining column
//
//  After filling, a diversity guard ensures at least 2 distinct chart types
//  when the dataset has columns of different roles.

function buildSpecs(rows, columnTypes) {
  return Object.keys(columnTypes).flatMap((col) => {
    const role = detectColRole(rows, col, columnTypes[col])
    if (!role) return []
    const uniqSize = uniqueNonMissing(rows, col).size
    return [{ col, role, score: roleScore(role, uniqSize) }]
  })
}

function specToChartType(role) {
  if (role === 'binary')       return 'pie'
  if (role === 'categorical')  return 'bar'
  if (role === 'numeric-dist') return 'histogram'
  if (role === 'date')         return 'line'
  return 'other'
}

function selectCharts(specs) {
  const byRole = {
    binary:   specs.filter((s) => s.role === 'binary').sort((a, b) => b.score - a.score),
    cat:      specs.filter((s) => s.role === 'categorical').sort((a, b) => b.score - a.score),
    numDist:  specs.filter((s) => s.role === 'numeric-dist').sort((a, b) => b.score - a.score),
    date:     specs.filter((s) => s.role === 'date'),
  }

  const selected = []
  const usedCols = new Set()

  function take(list) {
    const c = list.find((s) => !usedCols.has(s.col))
    if (c) { selected.push(c); usedCols.add(c.col) }
  }

  take(byRole.binary)                             // slot 1 — pie
  take(byRole.cat)                                // slot 2 — bar
  take([...byRole.numDist, ...byRole.date])       // slot 3 — histogram or line

  // slot 4 — wildcard: best remaining from any role
  const remaining = [
    ...byRole.binary,
    ...byRole.cat,
    ...byRole.numDist,
    ...byRole.date,
  ]
    .filter((s) => !usedCols.has(s.col))
    .sort((a, b) => b.score - a.score)
  take(remaining)

  // Diversity guard: if all selected charts share the same visual type,
  // swap the last (lowest-priority) for the best available alternative type
  if (selected.length >= 2) {
    const types = new Set(selected.map((s) => specToChartType(s.role)))
    if (types.size < 2) {
      const dominantRole = selected[selected.length - 1].role
      const allSpecs = [...byRole.binary, ...byRole.cat, ...byRole.numDist, ...byRole.date]
      const alt = allSpecs.find(
        (s) => s.role !== dominantRole && !usedCols.has(s.col)
      )
      if (alt) {
        usedCols.delete(selected[selected.length - 1].col)
        selected[selected.length - 1] = alt
      }
    }
  }

  return selected.slice(0, MAX_CHARTS)
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function Charts({ rows, columnTypes }) {
  if (!rows || rows.length === 0) return null

  const specs  = buildSpecs(rows, columnTypes)
  const charts = selectCharts(specs)
  if (charts.length === 0) return null

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-200 mb-1">Charts</h2>
      <p className="text-xs text-slate-500 mb-4">
        Selected based on the most analytically meaningful columns in your dataset.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {charts.map((spec) => {
          const key = `${spec.role}-${spec.col}`
          if (spec.role === 'binary')       return <PieCard       key={key} col={spec.col} rows={rows} />
          if (spec.role === 'categorical')  return <BarCard       key={key} col={spec.col} rows={rows} />
          if (spec.role === 'numeric-dist') return <HistogramCard key={key} col={spec.col} rows={rows} />
          if (spec.role === 'date')         return <DateLineCard  key={key} col={spec.col} rows={rows} />
          return null
        })}
      </div>
    </div>
  )
}
