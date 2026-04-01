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

  function handleDownload() {
    setPdfLabel(PDF_WORKING)
    exportReport(analysisResult, qualityReport, fileData.fileName)
    setPdfLabel(PDF_DONE)
    setTimeout(() => setPdfLabel(PDF_IDLE), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Data Analyzer</h1>
            <a
              href="https://www.linkedin.com/in/stanislav-patlakha-0b51893b2/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-3.5 py-1.5 hover:bg-gray-50 transition-colors flex-shrink-0"
              style={{ borderWidth: '0.5px' }}
            >
              <div
                className="flex items-center justify-center rounded text-white font-bold text-sm flex-shrink-0"
                style={{ background: '#0A66C2', width: 24, height: 24, borderRadius: 4 }}
              >
                in
              </div>
              <div className="text-center">
                <p className="text-gray-400 leading-tight" style={{ fontSize: 10 }}>Created by</p>
                <p className="text-xs font-medium text-gray-800 leading-tight">Stanislav Patlakha</p>
                <p className="text-gray-400 leading-tight" style={{ fontSize: 10 }}>Data Analyst</p>
              </div>
            </a>
          </div>
          <FileUpload onDataLoaded={handleDataLoaded} />

          {fileData && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-4">
                <span>✓</span>
                <span>
                  {fileData.fileName} loaded — {fileData.rowCount} rows,{' '}
                  {fileData.columns.length} columns
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">
                        Column Name
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">
                        Detected Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileData.columns.map((col, i) => (
                      <tr
                        key={col}
                        className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-4 py-2 text-gray-800">{col}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              fileData.columnTypes[col] === 'numeric'
                                ? 'bg-blue-100 text-blue-700'
                                : fileData.columnTypes[col] === 'date'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600'
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

              {qualityReport && <QualityReport qualityReport={qualityReport} />}
              <AnalysisDisplay analysisResult={analysisResult} isLoading={isAnalyzing} />
              <Charts rows={fileData.rows} columnTypes={fileData.columnTypes} />

              {analysisResult && !analysisResult.error && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleDownload}
                    disabled={pdfLabel !== PDF_IDLE}
                    className="bg-gray-900 text-white font-medium px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {pdfLabel}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
