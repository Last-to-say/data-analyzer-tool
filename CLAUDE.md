# Data Analyzer Tool — Project Instructions for Claude Code
## What this project is
A React web app where users upload CSV/Excel files, receive AI-generated data insigh
and charts, and can download a report as PDF. The AI analysis is invisible to the us
## Tech stack
- React + Vite — frontend framework
- Papa Parse — CSV file parsing
- SheetJS (xlsx) — Excel file parsing
- Recharts — charts and visualizations
- Anthropic API, model claude-sonnet-4-20250514 — AI analysis engine
- jsPDF — PDF report generation
- Tailwind CSS — styling
- Express + cors + dotenv — local proxy server
## CRITICAL ARCHITECTURE NOTE
The Anthropic API CANNOT be called directly from the browser.
Browsers block this with CORS security restrictions.
ALL Anthropic API calls must go through the local Express proxy server on port 3001.
The React app sends POST requests to http://localhost:3001/analyze
The proxy server calls Anthropic and returns the result.
NEVER call the Anthropic API directly from React components or utility functions.
## Environment variables
API key stored in .env as ANTHROPIC_API_KEY
The server reads it with process.env.ANTHROPIC_API_KEY
React components never need the API key — they call the proxy instead.
## Project structure
src/components/ React UI components
src/utils/ Pure helper functions (no UI)
server/index.js The Express proxy server
src/App.jsx Main app, holds all state
## Code rules
- Functional React components with hooks only
- Every async operation shows a loading state
- Every error is caught and shown to the user in plain language
- No hardcoded values — use constants or props
- One feature at a time — never build the next thing until current is tested
- One job per component — if it does two things, split it
## Build order — do not skip ahead
Step 1: File upload component
Step 2: Data quality checker
4. Save: Ctrl + S
CHECKPOINT 1
In the terminal, run:
Go to http://localhost:5173 in your browser.
Expected: The default Vite + React page with a spinning logo.
If you see it: Press Ctrl + C to stop the server. Phase 1 is complete.
If the browser shows "This site can't be reached": Wait 5 more seconds and refresh. Vite
sometimes takes a moment to start. If still nothing: check the terminal for error messages and
paste them to Luna.
If port 5173 is in use: Close any other terminal windows that might be running a dev server, then
retry.
Commit and push:
PHASE 2 — Install libraries, configure environment, build proxy server
Step 2.1 — Install all project libraries
Run these commands one group at a time. Wait for each to finish before running the next.
Main app libraries:
Step 3: AI analysis integration (via proxy server)
Step 4: Charts and visualizations
Step 5: Written insights polish
Step 6: PDF download