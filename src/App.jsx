import { useState } from 'react'
import FileUpload from './components/FileUpload'
import QualityReport from './components/QualityReport'
import AnalysisDisplay from './components/AnalysisDisplay'
import Charts from './components/Charts'
import checkQuality from './utils/qualityChecker'
import analyzeData from './utils/analyzeData'
import exportReport from './utils/exportReport'

const PDF_IDLE = 'Download Report'
const PDF_WORKING = 'Generating PDF...'
const PDF_DONE = 'Downloaded!'

function StepBadge({ label }) {
  return (
    <div className="mt-8 mb-2">
      <span className="inline-flex items-center gap-1.5 bg-green-900/40 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10.28 2.28a.75.75 0 00-1.06 0L4.5 6.99 2.78 5.28a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l5.25-5.25a.75.75 0 000-1.06z"
            clipRule="evenodd"
          />
        </svg>
        {label}
      </span>
    </div>
  )
}

function App() {
  const [fileData, setFileData] = useState(null)
  const [qualityReport, setQualityReport] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [pdfLabel, setPdfLabel] = useState(PDF_IDLE)

  async function handleDataLoaded(data) {
    setAnalysisResult(null)
    setPdfLabel(PDF_IDLE)
    const report = checkQuality(data)
    setFileData(data)
    setQualityReport(report)
    setIsAnalyzing(true)
    const result = await analyzeData(data, report)
    setIsAnalyzing(false)
    setAnalysisResult(result)
  }

  function handleReset() {
    setFileData(null)
    setQualityReport(null)
    setAnalysisResult(null)
    setIsAnalyzing(false)
    setPdfLabel(PDF_IDLE)
  }

  function handleDownload() {
    setPdfLabel(PDF_WORKING)
    exportReport(analysisResult, qualityReport, fileData.fileName)
    setPdfLabel(PDF_DONE)
    setTimeout(() => setPdfLabel(PDF_IDLE), 2000)
  }

  const analysisReady = analysisResult && !analysisResult.error

  return (
    <div className="min-h-screen bg-slate-900">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-y-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Data Analyzer</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Upload your data. Get instant AI-powered insights.
            </p>
          </div>
          <a
            href="https://www.linkedin.com/in/stanislav-patlakha-0b51893b2/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-slate-600 rounded-lg px-3.5 py-1.5 hover:bg-slate-700 transition-colors flex-shrink-0"
          >
            <div
              className="flex items-center justify-center rounded text-white font-bold text-sm flex-shrink-0"
              style={{ background: '#0A66C2', width: 24, height: 24, borderRadius: 4 }}
            >
              in
            </div>
            <div className="text-center">
              <p className="text-slate-500 leading-tight" style={{ fontSize: 10 }}>Created by</p>
              <p className="text-xs font-medium text-slate-200 leading-tight">Stanislav Patlakha</p>
              <p className="text-slate-500 leading-tight" style={{ fontSize: 10 }}>Data Analyst</p>
            </div>
          </a>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Upload card + disclaimer */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <FileUpload onDataLoaded={handleDataLoaded} />
          <div className="mt-4 flex gap-3 px-4 py-3 rounded-lg bg-sky-900/30 border border-sky-800">
            <svg
              className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-sky-300 leading-relaxed">
              For best results, upload clean and representative data. This tool detects common data
              quality issues automatically, but cannot identify bias in how your data was originally
              collected.
            </p>
          </div>
        </div>

        {fileData && (
          <>
            {/* Step 1 — File summary */}
            <StepBadge label="Step 1 — File loaded" />
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-green-400 font-medium mb-4">
                <span>✓</span>
                <span>
                  {fileData.fileName} loaded — {fileData.rowCount} rows,{' '}
                  {fileData.columns.length} columns
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700 border-b border-slate-600">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-slate-300">
                        Column Name
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-slate-300">
                        Detected Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileData.columns.map((col, i) => (
                      <tr
                        key={col}
                        className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700/50'}
                      >
                        <td className="px-4 py-2 text-slate-200">{col}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              fileData.columnTypes[col] === 'numeric'
                                ? 'bg-sky-900/60 text-sky-400'
                                : fileData.columnTypes[col] === 'date'
                                ? 'bg-purple-900/60 text-purple-400'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {fileData.columnTypes[col]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 2 — Quality report */}
            {qualityReport && (
              <>
                <StepBadge label="Step 2 — Quality checked" />
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <QualityReport qualityReport={qualityReport} />
                </div>
              </>
            )}

            {/* Spinner — shown only while analysis is running */}
            {isAnalyzing && (
              <div className="mt-8 bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <AnalysisDisplay analysisResult={null} isLoading={true} />
              </div>
            )}

            {/* Step 3 — Analysis results */}
            {analysisResult && (
              <>
                {analysisReady && <StepBadge label="Step 3 — Analysis complete" />}
                <div className={analysisReady ? 'bg-slate-800 border border-slate-700 rounded-2xl p-6' : 'mt-8'}>
                  <AnalysisDisplay analysisResult={analysisResult} isLoading={false} />
                </div>
              </>
            )}

            {/* Charts — only after analysis complete */}
            {analysisReady && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mt-8">
                <Charts rows={fileData.rows} columnTypes={fileData.columnTypes} />
              </div>
            )}

            {/* Download + start over */}
            {analysisReady && (
              <div className="mt-8 flex flex-col items-center gap-4 pb-4">
                <button
                  onClick={handleDownload}
                  disabled={pdfLabel !== PDF_IDLE}
                  className="bg-sky-500 hover:bg-sky-400 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {pdfLabel}
                </button>
                <button
                  onClick={handleReset}
                  className="text-sm text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
                >
                  Analyze another file
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
