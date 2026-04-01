import { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls']

function detectColumnType(values) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '')
  const sample = nonEmpty.slice(0, 20)
  if (sample.length === 0) return 'text'

  const numericCount = sample.filter((v) => !isNaN(Number(v)) && v !== '').length
  if (numericCount / sample.length >= 0.8) return 'numeric'

  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
    /^\d{1,2}-\d{1,2}-\d{2,4}$/,
    /^\d{4}\/\d{2}\/\d{2}$/,
  ]
  const dateCount = sample.filter((v) =>
    datePatterns.some((p) => p.test(String(v).trim()))
  ).length
  if (dateCount / sample.length >= 0.8) return 'date'

  return 'text'
}

function buildResult(fileName, rows) {
  if (!rows || rows.length === 0) {
    return { fileName, columns: [], rows: [], sampleRows: [], rowCount: 0, columnTypes: {} }
  }
  const columns = Object.keys(rows[0])
  const columnTypes = {}
  columns.forEach((col) => {
    const values = rows.map((r) => r[col])
    columnTypes[col] = detectColumnType(values)
  })
  return {
    fileName,
    columns,
    rows,
    sampleRows: rows.slice(0, 5),
    rowCount: rows.length,
    columnTypes,
  }
}

function isValidFile(file) {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

export default function FileUpload({ onDataLoaded }) {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const inputRef = useRef(null)

  const processFile = useCallback(
    (file) => {
      setError(null)
      setSuccess(null)

      if (!isValidFile(file)) {
        setError('Unsupported file type. Please upload a .csv, .xlsx, or .xls file.')
        return
      }

      setLoading(true)
      const name = file.name.toLowerCase()

      if (name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            setLoading(false)
            if (result.errors.length > 0 && result.data.length === 0) {
              setError('Could not read the CSV file. It may be empty or malformed.')
              return
            }
            const data = buildResult(file.name, result.data)
            setSuccess(`${file.name} loaded successfully.`)
            onDataLoaded(data)
          },
          error: () => {
            setLoading(false)
            setError('Failed to parse the CSV file. Please check it is a valid CSV.')
          },
        })
      } else {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target.result, { type: 'array' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
            setLoading(false)
            const data = buildResult(file.name, rows)
            setSuccess(`${file.name} loaded successfully.`)
            onDataLoaded(data)
          } catch {
            setLoading(false)
            setError('Failed to parse the Excel file. Please check it is a valid .xlsx or .xls file.')
          }
        }
        reader.onerror = () => {
          setLoading(false)
          setError('Could not read the file. Please try again.')
        }
        reader.readAsArrayBuffer(file)
      }
    },
    [onDataLoaded]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !loading && inputRef.current.click()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${isDragging
            ? 'border-sky-500 bg-sky-900/20'
            : 'border-slate-600 bg-slate-700/30 hover:border-sky-500 hover:bg-slate-700/50'}
          ${loading ? 'cursor-not-allowed opacity-70' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleInputChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
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
            <p className="text-slate-400 font-medium">Reading file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="h-10 w-10 text-slate-500 mb-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-lg font-semibold text-slate-200">Upload your file</p>
            <p className="text-sm text-slate-400">
              Supports CSV and Excel files (.csv, .xlsx, .xls)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Drag & drop here, or{' '}
              <span className="text-sky-400 underline">click to browse</span>
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && !error && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-green-900/30 border border-green-800 text-green-400 text-sm">
          {success}
        </div>
      )}
    </div>
  )
}
