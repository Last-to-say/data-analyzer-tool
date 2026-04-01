const apiUrl = import.meta.env.VITE_API_URL || '/analyze';

function buildPrompt(data, qualityReport) {
  const { columns, columnTypes, sampleRows, rowCount } = data;

  const columnList = columns
    .map((col) => `  - ${col} (${columnTypes[col]})`)
    .join('\n');

  const header = columns.join(' | ');
  const divider = columns.map(() => '---').join(' | ');
  const sampleTableRows = sampleRows
    .map((row) => columns.map((col) => String(row[col] ?? '')).join(' | '))
    .join('\n');
  const sampleTable = `${header}\n${divider}\n${sampleTableRows}`;

  const qualityLines =
    qualityReport.warnings.length > 0
      ? qualityReport.warnings.map((w) => `  - ${w}`).join('\n')
      : '  No quality issues';

  return `You are an expert data analyst. Analyze this dataset.

Columns:
${columnList}

Sample data (first 5 rows):
${sampleTable}

Stats: Total rows: ${rowCount}

Data quality issues:
${qualityLines}

IMPORTANT: Respond ONLY with a raw JSON object.
Do not include any text before or after the JSON.
Do not use markdown formatting. Do not use backticks.
Your response must start with { and end with }.
The JSON must have exactly these four keys:
summary (string: 2-3 sentences about this dataset in plain English),
keyInsights (array of objects, each with title string and description string, 3-5 items, written in business language not technical jargon),
recommendations (array of 2-3 plain strings, each an actionable suggestion),
dataWarnings (array of strings about data quality concerns, empty array if none)`;
}

export default async function analyzeData(data, qualityReport) {
  try {
    const prompt = buildPrompt(data, qualityReport);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with status ${response.status}`);
    }

    const responseData = await response.json();
    const result = JSON.parse(responseData.result);
    return result;
  } catch (error) {
    return { error: true, message: 'Analysis failed: ' + error.message };
  }
}