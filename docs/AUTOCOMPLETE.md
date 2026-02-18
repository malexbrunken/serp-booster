# SERP Booster - Autocomplete Module Specification

## Overview

Google/Bing Autocomplete module for SERP Booster. Focused on US market, drip campaign approach, with robust error reporting.

---

## 1. Target Terms (Input)

| Field | Description | Example |
|-------|-------------|---------|
| Prefix | What user types | "johndoe" |
| Suggestion | What we want to appear | "john doe verified" |

Format: `prefix|suggestion` (CSV)

---

## 2. Campaign Settings

### Basic Settings

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Search Engine | dropdown | Google | Options: Google, Bing |
| Google Domain | dropdown | google.com | For Google only |
| Language | dropdown | en-US | US only for now |
| Repetitions | number | 100 | Total per term |
| Searches Per Batch | number | 5 | Process in batches |

### Drip Campaign Settings

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Daily Limit | number | 5 | Searches per day per term |
| Ramp Up Schedule | array | [5,10,15,20] | Day 1=5, Day 8=10, Day 15=15, etc. |
| Delay Between Batches | number | 300 | Seconds (5 min default) |
| Delay Between Iterations | number | 30 | Seconds |

### Behavior Settings

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Typing Speed | dropdown | Random | Options: Slow(150ms), Medium(80ms), Fast(40ms), Random |
| After Suggestion | dropdown | Click | Options: Click suggestion, Press Enter, Do nothing |
| Dwell Time | number | 2 | Seconds to wait after typing before action |
| Random Delays | checkbox | true | Add 2-10s random variation |
| Visit Result | toggle | OFF | 🔒 Coming soon - Navigate to result page after clicking suggestion |

### Visit Result Settings (Coming Soon)

| Field | Type | Notes |
|-------|------|-------|
| Visit Duration | number | Seconds to stay on result page |
| Scroll Pages | checkbox | Scroll through the page? |
| Click Links | checkbox | Click any links on the page? |
| Bounce Back | checkbox | Return to Google after X seconds? |

---

## 3. Proxy Configuration

| Field | Type | Notes |
|-------|------|-------|
| Proxy Host | text | e.g., gateway.example.com |
| Proxy Port | number | e.g., 7000 |
| Username | text | Proxy auth username |
| Password | text | Proxy auth password |
| Rotate After Errors | number | Rotate IP after X consecutive errors |

---

## 4. State Management

### Campaign State File

```json
{
  "terms": [
    {
      "prefix": "johndoe",
      "suggestion": "john doe verified",
      "repetitionsDone": 7,
      "lastRun": "2026-02-18T14:30:00Z"
    }
  ],
  "currentTermIndex": 0,
  "currentBatch": 3,
  "totalBatchesDone": 15,
  "startDate": "2026-02-15T00:00:00Z",
  "dailyCount": 5,
  "rampUpSchedule": [
    { "day": 1, "count": 5 },
    { "day": 8, "count": 10 },
    { "day": 15, "count": 15 },
    { "day": 22, "count": 20 }
  ],
  "status": "running" | "paused" | "completed" | "error"
}
```

### Persistence

- Save state after every iteration
- On restart, resume from last position
- Don't lose progress on crash

---

## 5. Error Handling

### Error Types

| Error | Cause | Action |
|-------|-------|--------|
| PROXY_AUTH_FAILED | Invalid credentials | Stop, alert user |
| PROXY_TIMEOUT | Proxy slow/unreachable | Rotate IP, retry |
| PROXY_BLOCKED | Search engine blocked this IP | Rotate IP, log, continue |
| PROXY_CONN_REFUSED | Proxy not responding | Rotate IP, retry |
| SEARCH_CAPTCHA | Search engine detected automation | Pause, alert user |
| SEARCH_RATE_LIMIT | Too many requests | Slow down, wait |
| SEARCH_ERROR | Search engine error message | Log error, continue |
| SUCCESS | Completed iteration | Log, continue |

### Error Response to Dashboard

```json
{
  "iteration": 47,
  "term": "johndoe",
  "status": "error",
  "errorType": "PROXY_BLOCKED",
  "errorMessage": "Search engine blocked this IP - 403 Forbidden",
  "timestamp": "2026-02-18T14:30:22Z",
  "searchEngine": "Google",
  "proxy": "123.45.67.89",
  "suggestionAppeared": false,
  "suggestionsShown": [],
  "actionTaken": "skipped"
}
```

### Dashboard Error Display

| Display | Source |
|---------|--------|
| Error count | Total errors this run |
| Current status | Running/Paused/Error |
| Last error | Most recent error message |
| Error breakdown | Count by type (proxy vs search engine) |
| Recommendations | "Try different proxy provider" if >5 proxy errors |

### Error Recommendations

| If Error Pattern | Show Recommendation |
|-----------------|---------------------|
| >3 PROXY_BLOCKED | "Proxy quality low. Consider upgrading residential proxy." |
| >3 SEARCH_CAPTCHA | "Detection likely. Slow down or use better proxies." |
| >3 PROXY_TIMEOUT | "Proxy slow. Check proxy provider or rotate more." |
| AUTH_FAILED | "Check proxy credentials." |

---

## 6. Execution Flow

```
START CAMPAIGN
  │
  ├─► Load saved state (or create new)
  │
  ├─► Calculate daily limit based on ramp schedule
  │
  └─► FOR EACH term:
       │
       ├─► FOR EACH batch (5 at a time):
       │    │
       │    ├─► Load/verify proxy
       │    │
       │    ├─► Navigate to search engine
       │    │
       │    ├─► Type prefix (with typing speed)
       │    │
       │    ├─► Wait for suggestions
       │    │
       │    ├─► Check if target suggestion appears
       │    │
       │    ├─► Action (click/enter)
       │    │
       │    ├─► Log result
       │    │
       │    ├─► Handle errors (log, rotate, continue)
       │    │
       │    └─► Random delay between iterations
       │
       ├─► Save state
       │
       └─► Check daily limit (if reached, pause until tomorrow)
```

---

## 7. Logging

### Per Iteration Log

```json
{
  "timestamp": "2026-02-18T14:30:22Z",
  "term": "johndoe",
  "suggestion": "john doe verified",
  "iteration": 47,
  "searchEngine": "Google",
  "googleDomain": "google.com",
  "proxy": "123.45.67.89",
  "typingSpeed": 85,
  "suggestionAppeared": true,
  "suggestionPosition": 1,
  "action": "clicked",
  "success": true,
  "error": null
}
```

### Dashboard Display

- Real-time log (last 20 entries)
- Success rate %
- Suggestions appeared count
- Errors by type
- Progress bar (iterations done / total)

---

## 8. Run Modes

| Mode | Description |
|------|-------------|
| Continuous | Run until manually stopped |
| Scheduled | Run only during certain hours |
| Single Pass | Run once through all terms |

---

## 9. Future Considerations (Not Now)

- Multiple search domains (.co.uk, .de, etc.)
- Mobile user agents
- Browser extension option
- Cloud deployment
