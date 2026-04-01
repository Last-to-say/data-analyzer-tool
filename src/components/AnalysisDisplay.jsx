export default function AnalysisDisplay({ analysisResult, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <svg
          className="animate-spin h-8 w-8 text-sky-500"
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
        <p className="text-slate-400 font-medium">AI is analyzing your data...</p>
        <p className="text-xs text-slate-500">This usually takes 10–20 seconds</p>
      </div>
    )
  }

  if (!analysisResult) return null

  if (analysisResult.error) {
    return (
      <div className="px-4 py-4 rounded-lg bg-red-900/30 border border-red-800 text-red-400">
        <p className="font-medium">{analysisResult.message}</p>
        <p className="text-sm mt-1 text-red-500">Try uploading again</p>
      </div>
    )
  }

  const summary         = analysisResult.summary         || 'Summary unavailable.'
  const keyInsights     = analysisResult.keyInsights     || []
  const recommendations = analysisResult.recommendations || []
  const dataWarnings    = analysisResult.dataWarnings    || []

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="px-4 py-4 rounded-lg bg-sky-900/30 border border-sky-800">
        <p className="text-xs font-semibold text-sky-500 uppercase tracking-wider mb-2">
          AI Summary
        </p>
        <p className="text-sky-200 text-sm leading-relaxed">{summary}</p>
      </div>

      {/* Key Insights */}
      <div>
        <h2 className="text-base font-semibold text-slate-200 mb-3">Key Insights</h2>
        <div className="space-y-3">
          {keyInsights.map((insight, i) => (
            <div
              key={i}
              className="bg-slate-700 border border-slate-600 border-l-2 border-l-sky-500 rounded-lg px-4 py-3"
            >
              <p className="font-semibold text-slate-100 text-sm">{insight.title}</p>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-base font-semibold text-slate-200 mb-3">Recommendations</h2>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-900/60 text-sky-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Warnings */}
      {dataWarnings && dataWarnings.length > 0 && (
        <div className="px-4 py-4 rounded-lg bg-amber-900/30 border border-amber-800">
          <h2 className="text-sm font-semibold text-amber-300 mb-2.5 flex items-center gap-1.5">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            Data Warnings
          </h2>
          <ul className="space-y-1.5">
            {dataWarnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-400 flex gap-2">
                <span className="text-amber-600 mt-0.5 flex-shrink-0">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}
