export default function AnalysisDisplay({ analysisResult, isLoading }) {
  if (isLoading) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 py-8">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <p className="text-gray-500 font-medium">AI is analyzing your data...</p>
      </div>
    )
  }

  if (!analysisResult) return null

  if (analysisResult.error) {
    return (
      <div className="mt-6 px-4 py-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
        <p className="font-medium">{analysisResult.message}</p>
        <p className="text-sm mt-1">Try uploading again</p>
      </div>
    )
  }

  const { summary, keyInsights, recommendations, dataWarnings } = analysisResult

  return (
    <div className="mt-6 space-y-6">
      {/* Summary */}
      <div className="px-4 py-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-sm leading-relaxed">
        {summary}
      </div>

      {/* Key Insights */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Key Insights</h2>
        <div className="space-y-3">
          {keyInsights.map((insight, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
            >
              <p className="font-semibold text-gray-800 text-sm">{insight.title}</p>
              <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recommendations</h2>
        <ol className="space-y-2 list-decimal list-inside">
          {recommendations.map((rec, i) => (
            <li key={i} className="text-sm text-gray-700">
              {rec}
            </li>
          ))}
        </ol>
      </div>

      {/* Data Warnings */}
      {dataWarnings && dataWarnings.length > 0 && (
        <div className="px-4 py-4 rounded-lg bg-amber-50 border border-amber-200">
          <h2 className="text-sm font-semibold text-amber-800 mb-2">Data Warnings</h2>
          <ul className="space-y-1">
            {dataWarnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-800">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
