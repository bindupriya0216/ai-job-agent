# AI Job Agent

Playwright + TypeScript job discovery assistant for finding and ranking QA job listings from Seek NZ.

This project is part of Bindu Priya Karedla's QA automation portfolio. It currently focuses on browser automation, data extraction, structured JSON output, and keyword-based job matching. It is an early foundation for a future AI-assisted job matching workflow.

## What This Project Does

- Opens Seek NZ QA job search results
- Scrapes multiple job cards instead of only one
- Opens each job detail page
- Extracts title, company, location, link, and full description
- Matches each job against QA automation keywords
- Adds a simple `matchScore`
- Saves ranked results to `jobs.json`
- Uses Playwright assertions so the workflow behaves like a testable automation project

## What This Project Does Not Do Yet

- It does not call an AI model yet
- It does not auto-apply to jobs
- It does not send applications or personal data
- It does not bypass job board protections

## Tech Stack

- Playwright
- TypeScript
- Node.js

## Project Structure

```text
ai-job-agent/
  tests/job-scraper.spec.ts   Playwright workflow that scrapes and ranks jobs
  jobs.json                   Latest generated job results
  playwright.config.ts        Playwright browser, report, trace, and artifact settings
  package.json                Project commands and dependencies
```

## Getting Started

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npm run install:browsers
```

Run the scraper:

```bash
npm run scrape
```

Open the Playwright report:

```bash
npm run report
```

## Configuration

You can customize the workflow with environment variables.

| Variable | Default | Purpose |
| --- | --- | --- |
| `SEARCH_URL` | `https://www.seek.co.nz/qa-jobs` | Job search results page |
| `MAX_JOBS` | `3` | Maximum number of jobs to scrape |
| `KEYWORDS` | `qa,tester,automation,playwright,selenium,api,testing` | Keywords used for ranking |
| `OUTPUT_PATH` | `jobs.json` | JSON output file |

PowerShell example:

```powershell
$env:MAX_JOBS="10"; $env:KEYWORDS="qa,automation,playwright,api"; npm run scrape
```

## Example Output

```json
[
  {
    "title": "QA Automation Tester",
    "company": "Example Company",
    "location": "Auckland",
    "link": "https://www.seek.co.nz/job/example",
    "description": "Full job description...",
    "matchedKeywords": ["qa", "automation", "playwright"],
    "matchScore": 3
  }
]
```

## QA Skills Demonstrated

- Browser automation with Playwright
- Reliable locator usage
- Waiting for real page state instead of fixed sleeps
- Data extraction and JSON reporting
- Test assertions around scraped output
- Configurable test data through environment variables
- Trace, screenshot, and video artifacts on failure

## Future Improvements

- Add AI scoring against a resume or skills profile
- Add duplicate filtering across multiple runs
- Export results to CSV
- Add GitHub Actions scheduled runs
- Add richer job matching categories such as skills, location, salary, and seniority
