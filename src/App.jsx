import { useState } from 'react'
import FileUpload from './components/FileUpload'

function App() {
  const [fileData, setFileData] = useState(null)

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Data Analyzer</h1>
          <FileUpload onDataLoaded={setFileData} />

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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
