# SERP Booster

Open-source tool to strategically boost search rankings through behavioral signals, with a full web dashboard.

## Features

- **Web Dashboard** - User-friendly interface to manage lists and run campaigns
- **Three-Tier Strategy** - Whitelist/Greylist/Blacklist for precise targeting
- **Autocomplete Control** - Dominate Google autocomplete suggestions
- **Anti-Detection** - Randomized behavior to avoid detection
- **Position Tracking** - See results over time with charts

## Quick Start

```bash
# Install dependencies
npm install

# Install browser (if needed)
npx playwright install chromium

# Run dashboard
npm start
```

Then open **http://localhost:3000** in your browser.

## Using the Dashboard

### Lists Tab
- **Whitelist** - Your websites to promote ( be clicked)
-will **Greylist** - Neutral sites to click for natural appearance
- **Blacklist** - Problematic sites to outrank (never clicked)

### Autocomplete Tab
- Add terms to control what Google suggests
- Example: Prefix "johndoe" → Term "john doe verified"

### Run Tab
- Select strategy mode (Natural/Stealth/Aggressive)
- Set dwell time
- Click "Start SERP Booster"

### History Tab
- Track blacklist position changes over time
- See charts of your campaign effectiveness

## CLI Usage (Advanced)

```bash
# Run with keywords file
node src/cli.js --keywords keywords.csv --mode natural

# With autocomplete
node src/cli.js --keywords keywords.csv --autocomplete autocomplete.csv

# Full options
node src/cli.js --keywords keywords.csv --mode stealth --dwell 45 --sessions 3
```

## Strategy Modes

| Mode | Whitelist Clicks | Greylist Clicks | Detectability |
|------|-----------------|-----------------|---------------|
| Aggressive | 3 | 1 | Higher |
| Natural | 2 | 2 | Medium |
| Stealth | 1 | 3 | Lower |

## Input Format

### Keywords CSV (`keyword|url|tier`)
```
reputation management|https://mysite.com|whitelist
bad review site|https://problem.com|blacklist
```

### Autocomplete CSV (`prefix|term`)
```
johndoe|john doe verified
johndoe|john doe official
```

## Architecture

```
serp-booster/
├── server.js        # Dashboard backend
├── public/          # Dashboard frontend (HTML/CSS/JS)
├── src/             # Booster CLI engine
│   ├── cli.js       # Entry point
│   ├── engine.js    # Strategy logic
│   └── browser.js   # Playwright automation
├── data/            # Lists, history (created on first run)
└── docs/            # Documentation
```

## Disclaimer

For educational and legitimate purposes only (reputation management, brand protection). Use at your own risk.
