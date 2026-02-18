# SERP Booster - Build Plan

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | 🔄 In Progress | MVP - Engines + Dashboard |
| Phase 2 | 📋 Planned | Intelligence Layer |
| Commercial | 📋 Planned | Full product |

---

## Phase 1: MVP

### Engine (CLI)

#### SERP Booster (Click-based)
| Feature | Status | Notes |
|---------|--------|-------|
| Three-tier lists | ✅ Complete | whitelist/greylist/blacklist |
| Position tracking | ✅ Complete | Before/after ranking |
| Strategy modes | ✅ Complete | aggressive/natural/stealth |
| Anti-detection | ✅ Complete | UA, viewport, mouse movement |
| Proxy support | ✅ Complete | Host/port/user/pass |
| State persistence | ⚠️ Partial | Works but basic |
| Error handling | ⚠️ Basic | Needs improvement |

#### Autocomplete (Type-based)
| Feature | Status | Notes |
|---------|--------|-------|
| Term input | ✅ Complete | CSV format |
| Typing behavior | 🔲 To Build | Speed, delays |
| Suggestion detection | 🔲 To Build | Check if appears |
| Proxy support | 🔲 To Build | With rotation |
| Drip campaigns | 🔲 To Build | Batch processing, state |
| Error handling | 🔲 To Build | Full error types |
| Logging | 🔲 To Build | Per-iteration JSON |

#### Bing Support
| Feature | Status | Notes |
|---------|--------|-------|
| Add to autocomplete (done) | 🔲 To Build | Search engine dropdown |
| Add to autocomplete (done), Bing to SERP booster | 🔲 To Build | Google, Bing, DuckDuckGo, Yahoo |

### Dashboard (Web UI)

| Feature | Status | Notes |
|---------|--------|-------|
| Lists management | ✅ Complete | whitelist/greylist/blacklist |
| Run booster | ✅ Complete | Basic execution |
| Results history | ✅ Complete | Table + chart |
| Settings fields | 🔲 To Build | Autocomplete settings |
| Error display | 🔲 To Build | Error log + recommendations |
| Autocomplete tab | 🔲 To Build | Term input + results |
| Real-time progress | 🔲 To Build | Live log updates |

---

## Phase 2: Intelligence Layer

| Feature | Status | Notes |
|---------|--------|-------|
| Error pattern detection | 📋 Planned | PROXY_BLOCKED, CAPTCHAs |
| Recommendations | 📋 Planned | Suggest fixes |
| Performance insights | 📋 Planned | Trends, optimal settings |
| Weekly summary | 📋 Planned | Auto-report |
| Insights tab | 📋 Planned | Dashboard integration |

---

## Task List

### Current Priorities

- [ ] Build autocomplete CLI engine
- [ ] Add Bing support to SERP booster
- [ ] Add autocomplete settings to dashboard
- [ ] Add error display to dashboard
- [ ] Test with residential proxy

### Future

- [ ] Intelligence layer
- [ ] Multiple search domains
- [ ] Mobile user agents
- [ ] Cloud deployment option

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           Dashboard (Express + HTML)         │
│  - Lists UI  - Run UI  - History  - Logs    │
└─────────────────┬───────────────────────────┘
                  │ API calls
                  ▼
┌─────────────────────────────────────────────┐
│              CLI Engine (Node.js)           │
│  - SERP Booster  - Autocomplete            │
│  - Strategy logic  - State management       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           Browser (Playwright)              │
│  - Proxy rotation  - Anti-detection        │
└─────────────────────────────────────────────┘
```

## Running the Project

```bash
# Install
npm install
npx playwright install chromium

# Start dashboard
npm start

# Run CLI directly
node src/cli.js --keywords keywords.csv
```

## Testing

- Local without proxy (limited)
- With residential proxy (full test)
- Drip campaign simulation

---

## Future Enhancements

### Phase 2 Anti-Detection
- [ ] Cookie clearing between iterations
- [ ] Fresh browser context per session
