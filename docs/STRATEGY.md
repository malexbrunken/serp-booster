# SERP Booster - Specification

## Overview

Open-source tool to strategically boost search rankings through behavioral signals. Targets specific URLs while maintaining natural engagement patterns to outrank competitors.

**Use Cases:**
- Reputation repair campaigns
- Brand protection
- Promoting positive content over negative

---

## Core Concepts

### Three-Tier Strategy

| Tier | Definition | Behavior |
|------|------------|----------|
| **Whitelist** | URLs we want to promote | Always click, multiple times |
| **Greylist** | Benign competitors/neutral sites | Click 1-2 randomly for naturalness |
| **Blacklist** | Problematic URLs to outrank | Never click - goal is to displace them |

### Keyword Categories

| Category | Definition | Strategy |
|----------|------------|----------|
| **Promotion Terms** | Search queries where we want visibility | Click our whitelist |
| **Problematic Terms** | Queries returning bad results we want to bury | Click our whitelist to push blacklist down |
| **Autocomplete Terms** | Terms we want to dominate in Google suggestions | Build presence through repeated searches |

---

## Input Format

### Strategy File (`keywords.csv`)
```csv
# Format: keyword|target_url|tier
# tier: whitelist | greylist | blacklist

reputation management|[CLIENT_URL]|whitelist
best seo company|[CLIENT_URL]/services|whitelist
site:wikipedia.org [CLIENT_NAME]|[CLIENT_URL]|greylist
[CLIENT_NAME] scam|[CLIENT_URL]|blacklist
[CLIENT_NAME] fraud|[CLIENT_URL]|blacklist
who is [CLIENT_NAME]|[CLIENT_URL]|whitelist
[CLIENT_NAME] reviews|[CLIENT_URL]|whitelist
```

### Autocomplete File (`autocomplete.csv`)
```csv
# Format: prefix|autocomplete_term
# These terms appear when user types prefix in Google

[CLIENT_NAME]|[CLIENT_NAME] official
[CLIENT_NAME]|[CLIENT_NAME] verified
[CLIENT_NAME]|[CLIENT_NAME] official website
[CLIENT_NAME] real|[CLIENT_NAME] real
[CLIENT_NAME] news|[CLIENT_NAME] news
```

---

## Strategy Engine

### Click Logic

```
FOR EACH keyword IN strategy:
  1. Search on Google/Bing
  2. Parse SERP for all URLs
  3. Classify each result against whitelist/greylist/blacklist
  4. Determine click sequence:
     - ALWAYS click top whitelist result (if in top 10)
     - Randomly click 1-2 greylist results
     - NEVER click any blacklist result
     - Optionally: click 0-1 additional whitelist for reinforcement
  5. Execute with randomized delays
  6. Record positions before/after
```

### Strategy Modes

```javascript
const MODES = {
  // Maximum promotion, accepts some detectability risk
  aggressive: {
    whitelistClicks: 3,      // Click our URL 3 times
    greylistClicks: 1,      // One natural click
    minDwellSeconds: 20,
    randomization: 'low'
  },

  // Balanced approach
  natural: {
    whitelistClicks: 2,
    greylistClicks: 2,
    minDwellSeconds: 30,
    randomization: 'medium'
  },

  // Minimal footprint, maximum stealth
  stealth: {
    whitelistClicks: 1,
    greylistClicks: 3,
    minDwellSeconds: 45,
    randomization: 'high',
    randomPositionBias: true  // Don't always click #1
  }
};
```

### Displacement Algorithm

The tool aims to **push blacklist results down** by:

1. **Direct engagement** - Clicking our whitelist signals relevance
2. **Dwell time** - Longer time on our page = stronger signal
3. **Greylist noise** - Clicking benign sites makes our engagement look natural
4. **Pattern variation** - No two sessions identical

---

## Autocomplete Strategy

### Goal
Dominate Google autocomplete for brand-related terms

### Implementation
```
1. Load autocomplete.csv (prefix, term pairs)
2. For each term:
   - Type prefix in Google search box
   - Wait for autocomplete suggestions
   - Click our term if it appears
   - Optionally click search to execute
3. Vary typing speed and timing
4. Use different Google domains (.com, .co.uk, etc.)
```

### Autocomplete Modes
```javascript
const AUTOCOMPLETE_MODES = {
  // Build suggestions
  build: {
    typeTerm: true,
    clickSuggestion: true,
    executeSearch: false
  },

  // Click suggestion and visit page
  visit: {
    typeTerm: true,
    clickSuggestion: true,
    executeSearch: true,
    dwellSeconds: 30
  }
};
```

---

## Technical Architecture

### File Structure
```
serp-booster/
├── src/
│   ├── cli.js              # Command-line interface
│   ├── engine.js           # Core strategy engine
│   ├── browser.js          # Playwright browser management
│   ├── behavior.js         # Click/dwell/scroll patterns
│   ├── parser.js           # SERP parsing logic
│   ├── ranker.js           # Position tracking
│   └── autocomplete.js     # Autocomplete logic
├── config/
│   └── default.json        # Default settings
├── examples/
│   ├── keywords.csv        # Example strategy file
│   └── autocomplete.csv    # Example autocomplete
├── docs/
│   ├── STRATEGY.md         # This file
│   └── SETUP.md           # Installation guide
└── package.json
```

### Dependencies
- Playwright (browser automation)
- Puppeteer (alternative backend)
- csv-parse (file handling)
- axios (HTTP requests for ranking)
- random-user-agent (UA rotation)

---

## CLI Usage

### Basic Execution
```bash
# Run with strategy file
node serp-booster.js --keywords keywords.csv

# Specify engine
node serp-booster.js --keywords keywords.csv --engine google
node serp-booster.js --keywords keywords.csv --engine bing

# Set strategy mode
node serp-booster.js --keywords keywords.csv --mode natural

# With custom dwell time (seconds)
node serp-booster.js --keywords keywords.csv --dwell 45

# Use proxies
node serp-booster.js --keywords keywords.csv --proxies proxies.txt

# Run multiple sessions
node serp-booster.js --keywords keywords.csv --sessions 5
```

### Autocomplete Mode
```bash
# Build autocomplete dominance
node serp-booster.js --autocomplete autocomplete.csv --autocomplete-mode build

# Full visit cycle
node serp-booster.js --autocomplete autocomplete.csv --autocomplete-mode visit
```

### Combined
```bash
# Run both SERP boosting and autocomplete
node serp-booster.js \
  --keywords keywords.csv \
  --autocomplete autocomplete.csv \
  --mode natural \
  --sessions 3
```

---

## Output

### Logs
```
output/
├── clicks_2026-02-18_143022.csv
│   # timestamp, keyword, url, position, dwell_seconds
│   2026-02-18T14:30:22Z,reputation management,https://client.com,4,32

├── rankings_2026-02-18_143022.csv
│   # keyword, url, tier, position_before, position_after
│   reputation management,https://client.com,whitelist,4,2

├── autocomplete_2026-02-18_143022.csv
│   # prefix, term, appeared, position
│   clientname,clientname official,true,1

└── summary_2026-02-18_143022.txt
    # Whitelist moved up X positions
    # Blacklist moved down Y positions
```

### Summary Report
```
SERP Booster Report - 2026-02-18
================================
Keywords Processed: 15
Total Clicks: 47
Whitelist Avg Position Change: -2.3 (improved)
Blacklist Avg Position Change: +1.8 (demoted)
Autocomplete Terms Secured: 3/8

Whitelist Success: 80%
Blacklist Displaced: 60%
```

---

## Configuration

### `config/default.json`
```json
{
  "engine": "google",
  "mode": "natural",
  "dwell": 30,
  "sessions": 1,
  "delayMin": 2000,
  "delayMax": 8000,
  "viewport": { "width": 1920, "height": 1080 },
  "headless": true,
  "userAgent": "random",
  "proxy": {
    "enabled": false,
    "file": "proxies.txt"
  },
  "autocomplete": {
    "enabled": false,
    "mode": "build"
  }
}
```

### Proxy Format (`proxies.txt`)
```
# format: protocol://user:pass@host:port
http://user:pass@proxy1.example.com:8080
socks5://user:pass@proxy2.example.com:1080
```

---

## Detection Avoidance (Critical)

### Browser Fingerprinting

```javascript
// Block detection vectors - add to browser.js init
await page.addInitScript(() => {
  // Hide webdriver flag
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  
  // Fake plugins (Playwright exposes empty array)
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  
  // Fake languages
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
});
```

### Behavioral Randomization

| Factor | Bad (Detectable) | Good (Stealth) |
|--------|------------------|-----------------|
| Mouse movement | Linear, direct | Bezier curves, overshoots |
| Typing | Perfect speed | Variable 50-150ms per char |
| Dwell time | Fixed 30s | 20-90s random |
| Page sequence | Same each time | Random order |

### Session Management

- **Reuse browser context** - Keep cookies between keywords
- **Randomize order** - Don't process in same order
- **Pause between** - 5-15 min between runs
- **Residential proxies** - Never datacenter IPs

### Detection Checklist

- [ ] `navigator.webdriver` = undefined
- [ ] Viewport not default 1920x1080
- [ ] Mouse movements curved, not linear
- [ ] Typing has variable delay
- [ ] Using residential proxy

### Strategy Tips
1. Start with `stealth` mode, escalate as needed
2. Run consistently over days/weeks (not bulk)
3. Target position 1-5 for whitelist (where Google counts clicks)
4. Use greylists from Wikipedia, news sites (trusted sources)
5. Monitor blacklist positions - they should drop as whitelist rises

---

## Disclaimer

This tool is for educational and legitimate purposes (reputation management, brand protection). Search engines' terms of service prohibit artificial engagement. Use responsibly and at your own risk.
