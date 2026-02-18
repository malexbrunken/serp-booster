# SERP Booster - Setup Guide

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/serp-booster.git
cd serp-booster

# Install dependencies
npm install
```

## Browser Setup

SERP Booster uses Playwright for browser automation. Install Chromium:

```bash
npx playwright install chromium
```

## Configuration

### Create Your Strategy File

Copy the example and customize:

```bash
cp examples/keywords.csv my-campaign.csv
```

Format:
```
keyword|target_url|tier
```

Tiers:
- `whitelist` - URLs to promote (will be clicked)
- `greylist` - Neutral sites to click for naturalness  
- `blacklist` - Problematic URLs to outrank (never clicked)

### Create Autocomplete File (Optional)

```bash
cp examples/autocomplete.csv my-autocomplete.csv
```

Format:
```
prefix|autocomplete_term
```

## Usage

### Basic SERP Boosting

```bash
node src/cli.js --keywords my-campaign.csv --mode natural
```

### With Options

```bash
node src/cli.js \
  --keywords my-campaign.csv \
  --engine google \
  --mode natural \
  --dwell 30 \
  --sessions 3
```

### Autocomplete Only

```bash
node src/cli.js --autocomplete my-autocomplete.csv --mode build
```

### Combined

```bash
node src/cli.js \
  --keywords my-campaign.csv \
  --autocomplete my-autocomplete.csv \
  --mode natural
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-k, --keywords` | Strategy CSV file | - |
| `-a, --autocomplete` | Autocomplete CSV file | - |
| `-e, --engine` | Search engine (google/bing) | google |
| `-m, --mode` | Strategy mode | natural |
| `-d, --dwell` | Dwell time (seconds) | 30 |
| `-s, --sessions` | Sessions per keyword | 1 |
| `-p, --proxies` | Proxy list file | - |
| `--headless` | Run headless | true |
| `-o, --output` | Output directory | output |

## Strategy Modes

### aggressive
- 3 whitelist clicks
- 1 greylist click
- 20s minimum dwell
- Lower randomization

### natural (recommended)
- 2 whitelist clicks
- 2 greylist clicks
- 30s minimum dwell
- Medium randomization

### stealth
- 1 whitelist click
- 3 greylist clicks
- 45s minimum dwell
- High randomization

## Proxies

Create a file with one proxy per line:

```
http://user:pass@proxy1.com:8080
socks5://user:pass@proxy2.com:1080
```

Usage:
```bash
node src/cli.js --keywords my-campaign.csv --proxies proxies.txt
```

## Output

Results are saved to the `output/` directory:

- `clicks_TIMESTAMP.csv` - Click log
- `rankings_TIMESTAMP.csv` - Position changes
- `autocomplete_TIMESTAMP.csv` - Autocomplete results
- `summary_TIMESTAMP.txt` - Summary report

## Troubleshooting

### "Browser not found"
Run: `npx playwright install chromium`

### "Timeout" errors
Try increasing delays or using `--headless` mode

### Detection issues
- Use `stealth` mode
- Add more proxies
- Increase dwell times
