export default function QualityReport({ qualityReport }) {
  const { qualityScore, warnings } = qualityReport

  const badgeStyle =
    qualityScore > 80
      ? { background: '#14532d', color: '#86efac' }
      : qualityScore >= 50
      ? { background: '#451a03', color: '#fcd34d' }
      : { background: '#450a0a', color: '#fca5a5' }

  return (
    <div>
      <div
        className="inline-block px-4 py-2 rounded-xl font-bold text-lg mb-4"
        style={badgeStyle}
      >
        Data Quality Score: {qualityScore}/100
      </div>

      {warnings.length === 0 ? (
        <p className="text-green-400 font-medium">No data quality issues detected</p>
      ) : (
        <ul className="space-y-1">
          {warnings.map((w, i) => (
            <li key={i} className="text-sm text-slate-300">
              <span className="mr-2">⚠️</span>
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
