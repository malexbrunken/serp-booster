# SERP Booster - Testing Plan

## Phase 1: Syntax & Structure Tests (No Browser Needed)

### 1.1 Code Syntax
| Test | How | Pass Criteria |
|------|-----|---------------|
| All JS files valid | `node -c <file.js>` | No syntax errors |
| package.json valid | `npm ls` | Dependencies resolve |
| Server starts | `node server.js` | Runs on port 3000 |

### 1.2 CLI Help
```bash
# Test autocomplete CLI help
node src/autocomplete-cli.js --help

# Test SERP clicks CLI help  
node src/serp-clicks-cli.js --help
```
Expected: Help text displays

### 1.3 File Structure
- [ ] All required files exist
- [ ] Examples directory has sample CSVs
- [ ] Public folder has dashboard HTML

---

## Phase 2: Dashboard Tests (No Browser Automation)

### 2.1 Web Server
```bash
npm start
# Open http://localhost:3000
```
- [ ] Dashboard loads
- [ ] All 4 tabs visible (Autocomplete, SERP, Lists, History)
- [ ] Forms are interactive

### 2.2 API Endpoints
```bash
# Test lists API
curl http://localhost:3000/api/lists

# Test history API  
curl http://localhost:3000/api/history
```
- [ ] Returns valid JSON
- [ ] No 500 errors

---

## Phase 3: Engine Tests (With Proxies - When Available)

### 3.1 Autocomplete Engine
| Test | Expected |
|------|-----------|
| Run with 1 term, 1 repetition | Executes without crash |
| Check output file created | CSV in output/ |
| Test error handling | Invalid proxy = clear error |

**Test command:**
```bash
node src/autocomplete-cli.js \
  --terms examples/autocomplete-terms.csv \
  --engine google \
  --repetitions 1
```

### 3.2 SERP Clicks Engine
| Test | Expected |
|------|-----------|
| Run with 1 keyword, 1 session | Executes |
| Check position tracking | Rankings CSV created |
| Test whitelist/greylist/blacklist | Correct tier handling |

**Test command:**
```bash
node src/serp-clicks-cli.js \
  --keywords examples/serp-keywords.csv \
  --engine google \
  --sessions 1
```

### 3.3 Search Engine Tests
| Engine | Test |
|--------|------|
| Google | ` --engine google` |
| Bing | `--engine bing` |
| DuckDuckGo | `--engine duckduckgo` |
| Yahoo | `--engine yahoo` |

### 3.4 Typing Speed Tests
| Mode | Test |
|------|------|
| Random | `--typing random` |
| Slow | `--typing slow` |
| Medium | `--typing medium` |
| Fast | `--typing fast` |

### 3.5 Proxy Tests
| Scenario | Test |
|----------|------|
| No proxy | Should work (local IP) |
| Invalid proxy | Clear error message |
| Valid residential proxy | Runs successfully |

---

## Phase 4: Stress Tests

### 4.1 High Volume
- 100 repetitions per term
- Multiple terms in sequence
- Run for extended period (30+ min)

### 4.2 Error Recovery
- Kill process mid-run, restart
- Network disconnection mid-run
- Proxy fails mid-run

### 4.3 Dashboard + CLI Combined
- Start campaign from dashboard
- Close browser, reopen dashboard
- Check history persists

---

## Test Checklist (User Can Do)

```
□ Pull latest code from GitHub
□ Run npm install
□ Run npm start
□ Open localhost:3000
□ Try clicking each tab
□ Try adding a term to Autocomplete
□ Try adding a keyword to Lists
□ Click Start Campaign (with proxy)
□ Watch console output
□ Check Results tab after
```

---

## Expected Issues (Likely)

1. **Browser not available** - Container may block Chrome
2. **Proxy required** - Most tests need residential proxy
3. **Network issues** - Firewall may block

---

## Error Mapping for User

| User Sees | Likely Cause |
|-----------|-------------|
| "Browser not found" | Chrome not installed |
| "Connection refused" | Proxy not working |
| "No terms defined" | Forgot to add terms |
| "Port in use" | Server already running |
| "module not found" | npm install not run |
