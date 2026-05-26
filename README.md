# Simple Poker

Visual React mockups for a tournament poker tracking app.

## Run locally

```bash
npm install
npm run dev
```

## Current scope

The app stores tournament results in Chrome local storage as JSON objects, separated by selected portfolio. Drew Martel starts empty; Sample starts with demo tournament results. Records support scheduled, live, and completed tournament states plus a final-table flag. Event and venue names are managed as portfolio-specific option lists before they can be selected on an MTT. Event options can include default buy-in and rake values that prefill new MTT entries. Results persist across normal browser restarts, but they can still be removed if browser/site data is manually cleared. The dashboard Share button captures the visible app window as a PNG and copies it to the clipboard, with PNG download as a browser compatibility fallback.

## GitHub Pages note

Vite is configured with a relative asset base so the built `dist/` folder can be published from GitHub Pages later.
