const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  /^\d{1,2}-\d{1,2}-\d{2,4}$/,
  /^\d{4}\/\d{2}\/\d{2}$/,
]

function isMissing(value) {
  return value === null || value === undefined || value === '' || value === 'NA'
}

function isNumeric(value) {
  return !isNaN(Number(value)) && String(value).trim() !== ''
}

function isDate(value) {
  return DATE_PATTERNS.some((p) => p.test(String(value).trim()))
}

function matchesType(value, type) {
  if (type === 'numeric') return isNumeric(value)
  if (type === 'date') return isDate(value)
  return true // text columns always match
}

export default function checkQuality(data) {
  const { rows, columns, columnTypes } = data
  const totalRows = rows.length

  // --- missingValues ---
  const missingValues = {}
  for (const col of columns) {
    const count = rows.filter((r) => isMissing(r[col])).length
    if (count > 0) {
      missingValues[col] = {
        count,
        percentage: Math.round((count / totalRows) * 1000) / 10,
      }
    }
  }

  // --- duplicateRows ---
  const serialized = rows.map((r) => JSON.stringify(r))
  const freq = {}
  for (const s of serialized) {
    freq[s] = (freq[s] || 0) + 1
  }
  const duplicateRows = serialized.filter((s) => freq[s] > 1).length

  // --- mixedTypeColumns ---
  const mixedTypeColumns = []
  for (const col of columns) {
    const type = columnTypes[col]
    if (type === 'text') continue
    const nonEmpty = rows.map((r) => r[col]).filter((v) => !isMissing(v))
    if (nonEmpty.length === 0) continue
    const mismatchCount = nonEmpty.filter((v) => !matchesType(v, type)).length
    if (mismatchCount / nonEmpty.length > 0.2) {
      mixedTypeColumns.push(col)
    }
  }

  // --- singleValueColumns ---
  const singleValueColumns = []
  for (const col of columns) {
    const nonEmpty = rows.map((r) => r[col]).filter((v) => !isMissing(v))
    if (nonEmpty.length === 0) continue
    const unique = new Set(nonEmpty.map((v) => String(v)))
    if (unique.size === 1) {
      singleValueColumns.push(col)
    }
  }

  // --- qualityScore ---
  const missingDeduction = Object.keys(missingValues).reduce((sum, col) => {
    const pct = missingValues[col].percentage
    if (pct > 50) return sum + 15
    if (pct > 5) return sum + 5
    return sum
  }, 0)
  let score = 100
  score -= Math.min(missingDeduction, 40)
  score -= Math.min(mixedTypeColumns.length * 10, 20)
  if (duplicateRows > 0) score -= 5
  score -= Math.min(singleValueColumns.length * 5, 15)
  const qualityScore = Math.max(0, score)

  // --- warnings ---
  const warnings = []

  for (const col of Object.keys(missingValues)) {
    const { count, percentage } = missingValues[col]
    warnings.push(
      `Column '${col}' has ${percentage}% missing values (${count} of ${totalRows} rows)`
    )
  }

  if (duplicateRows > 0) {
    warnings.push(`${duplicateRows} duplicate rows detected`)
  }

  for (const col of mixedTypeColumns) {
    warnings.push(`Column '${col}' contains mixed data types`)
  }

  for (const col of singleValueColumns) {
    warnings.push(`Column '${col}' has only one unique value — not useful for analysis`)
  }

  return {
    missingValues,
    duplicateRows,
    mixedTypeColumns,
    singleValueColumns,
    totalRows,
    qualityScore,
    warnings,
  }
}
