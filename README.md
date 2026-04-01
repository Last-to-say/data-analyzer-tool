# Data Analyzer Tool

**Built with React · Powered by Claude AI**

---

## Description

A web app that takes a CSV or Excel file and returns an AI-generated data quality report, key business insights, visualizations, and a downloadable PDF — all in under 30 seconds. Data analysts, students, and anyone working with tabular data will find it useful for a fast first-pass understanding of an unfamiliar dataset.

---

## Demo

📸 Screenshot: [coming soon — run locally to see it in action]

---

## Features

- Drag-and-drop CSV and Excel upload
- Automatic data quality check with a scored report
- AI-generated insights and recommendations in plain business language
- 4 automatic data visualizations (histograms and bar charts)
- One-click PDF report download
- Built-in data limitation disclaimer

---

## Tech Stack

| Tool | Why it was chosen |
|---|---|
| **React + Vite** | Component model maps cleanly to the step-by-step analysis pipeline; Vite's dev server starts instantly and has no config overhead |
| **Papa Parse** | The most reliable browser-native CSV parser — handles encoding edge cases and large files without a backend |
| **SheetJS (xlsx)** | The only mature library that reads `.xlsx` and `.xls` directly in the browser without a server round-trip |
| **Recharts** | Built on top of D3 but exposes a declarative React API, so charts are components — no imperative DOM manipulation |
| **Anthropic API (claude-sonnet-4-20250514)** | Produces structured JSON analysis with genuine reasoning about data quality and business implications, not just statistical summaries |
| **jsPDF** | Generates PDFs entirely in the browser — no server needed, no file upload, nothing leaves the machine until the user saves it |
| **Tailwind CSS** | Utility classes keep styling co-located with markup; no context-switching between CSS files during rapid iteration |
| **Express (proxy server)** | Browsers block direct Anthropic API calls via CORS — a minimal Express server on port 3001 forwards the request and keeps the API key off the client |

---

## How to Run Locally

**Prerequisites:** Node.js 18+, free Anthropic API account

1. Clone the repo:
   ```bash
   git clone https://github.com/Last-to-say/data-analyzer-tool.git
   ```
2. Enter the project directory:
   ```bash
   cd data-analyzer-tool
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the project root:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```
5. Start the proxy server (Terminal 1):
   ```bash
   npm run server
   ```
6. Start the React dev server (Terminal 2):
   ```bash
   npm run dev
   ```
7. Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## AI Usage Transparency

- **Claude** (`claude-sonnet-4-20250514`) generates the data analysis in this project
- **What is sent to the API:** column names, data types, first 5 sample rows, row count, and quality warnings — never the full dataset, never personal data
- **Claude Code** was used to generate significant portions of the source code
- All AI-generated code was reviewed, tested, and verified by the developer
- AI analysis quality depends entirely on input data quality — if the data has issues, the analysis will reflect that
- The AI cannot detect bias in how the original data was collected or sampled

---

## Known Limitations

- Requires clean, representative data for meaningful insights
- Single file only — no joining or comparing multiple files
- Runs locally only — no cloud backend (by design for this version)
- Cannot detect sampling bias or methodology problems in source data
- AI analysis is a starting point for investigation, not a final conclusion

---

## Future Improvements

- Cloud deployment with a real backend (Vercel + Railway)
- Support for larger files via streaming
- User-defined analysis questions ("Focus on sales trends")
- Chart export as image
- Side-by-side comparison of two datasets

---

Made as a portfolio project by Stanislav — Data Analyst | 2026
