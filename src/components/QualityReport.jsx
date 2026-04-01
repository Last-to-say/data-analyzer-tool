export default function QualityReport({ qualityReport }) {
  const { qualityScore, warnings } = qualityReport

  const badgeStyle =
    qualityScore > 80
      ? { background: '#D1FAE5', color: '#065F46' }
      : qualityScore >= 50
      ? { background: '#FEF3C7', color: '#92400E' }
      : { background: '#FEE2E2', color: '#991B1B' }

  return (
    <div className="mt-6">
      <div
        className="inline-block px-4 py-2 rounded-xl font-bold text-lg mb-4"
        style={badgeStyle}
      >
        Data Quality Score: {qualityScore}/100
      </div>

      {warnings.length === 0 ? (
        <p className="text-green-700 font-medium">No data quality issues detected</p>
      ) : (
        <ul className="space-y-1">
          {warnings.map((w, i) => (
            <li key={i} className="text-sm text-gray-700">
              <span className="mr-2">⚠️</span>
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
