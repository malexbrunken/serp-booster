const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const LISTS_FILE = path.join(DATA_DIR, 'lists.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const AUTOCOMPLETE_FILE = path.join(DATA_DIR, 'autocomplete.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
if (!fs.existsSync(LISTS_FILE)) {
  fs.writeFileSync(LISTS_FILE, JSON.stringify({
    whitelist: [],
    greylist: [],
    blacklist: []
  }, null, 2));
}

if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(AUTOCOMPLETE_FILE)) {
  fs.writeFileSync(AUTOCOMPLETE_FILE, JSON.stringify({
    terms: []
  }, null, 2));
}

// API Routes

// Get all lists
app.get('/api/lists', (req, res) => {
  const lists = JSON.parse(fs.readFileSync(LISTS_FILE, 'utf-8'));
  res.json(lists);
});

// Save lists
app.post('/api/lists', (req, res) => {
  fs.writeFileSync(LISTS_FILE, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// Get autocomplete terms
app.get('/api/autocomplete', (req, res) => {
  const data = JSON.parse(fs.readFileSync(AUTOCOMPLETE_FILE, 'utf-8'));
  res.json(data);
});

// Save autocomplete terms
app.post('/api/autocomplete', (req, res) => {
  fs.writeFileSync(AUTOCOMPLETE_FILE, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// Get history
app.get('/api/history', (req, res) => {
  const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  res.json(history);
});

// Get blacklist position history (for charting)
app.get('/api/blacklist-history', (req, res) => {
  const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  const blacklistHistory = history.map(entry => ({
    date: entry.date,
    avgPosition: entry.blacklistAvgPosition,
    changes: entry.blacklistChanges
  }));
  res.json(blacklistHistory);
});

// Run SERP Booster
app.post('/api/run', (req, res) => {
  const lists = JSON.parse(fs.readFileSync(LISTS_FILE, 'utf-8'));
  const autocomplete = JSON.parse(fs.readFileSync(AUTOCOMPLETE_FILE, 'utf-8'));
  
  // Build keywords CSV from lists
  const keywords = [];
  
  // Add whitelist entries
  lists.whitelist.forEach(item => {
    keywords.push(`${item.keyword}|${item.url}|whitelist`);
  });
  
  // Add greylist entries
  lists.greylist.forEach(item => {
    keywords.push(`${item.keyword}|${item.url}|greylist`);
  });
  
  // Add blacklist entries
  lists.blacklist.forEach(item => {
    keywords.push(`${item.keyword}|${item.url}|blacklist`);
  });
  
  // Build autocomplete CSV
  const autocompleteLines = autocomplete.terms.map(t => `${t.prefix}|${t.term}`);
  
  // Write temp files
  const keywordsPath = path.join(DATA_DIR, 'temp_keywords.csv');
  const autocompletePath = path.join(DATA_DIR, 'temp_autocomplete.csv');
  
  fs.writeFileSync(keywordsPath, keywords.join('\n'));
  if (autocompleteLines.length > 0) {
    fs.writeFileSync(autocompletePath, autocompleteLines.join('\n'));
  }
  
  // Run the booster
  const mode = req.body.mode || 'natural';
  const dwell = req.body.dwell || 30;
  
  // The booster CLI is in src/cli.js
  let cmd = `node src/cli.js --keywords ${keywordsPath} --mode ${mode} --dwell ${dwell}`;
  if (autocompleteLines.length > 0) {
    cmd += ` --autocomplete ${autocompletePath}`;
  }
  
  exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
    // Parse results from output
    const results = parseResults(stdout);
    
    // Save to history
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    history.push({
      date: new Date().toISOString(),
      ...results,
      mode,
      dwell
    });
    
    // Keep last 100 entries
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    
    // Cleanup temp files
    try {
      fs.unlinkSync(keywordsPath);
      if (autocompleteLines.length > 0) fs.unlinkSync(autocompletePath);
    } catch (e) {}
    
    res.json({ success: true, results, stdout, stderr: stderr.substring(0, 500) });
  });
});

function parseResults(stdout) {
  // Simple parsing of results
  const lines = stdout.split('\n');
  let whitelistImprovement = 0;
  let blacklistDemotion = 0;
  let clicks = 0;
  
  const whitelistMatch = stdout.match(/Whitelist Avg Improvement:\s*([\d.]+)/);
  const blacklistMatch = stdout.match(/Blacklist Avg Demotion:\s*([\d.]+)/);
  const clicksMatch = stdout.match(/Total Clicks:\s*(\d+)/);
  
  return {
    whitelistImprovement: whitelistMatch ? parseFloat(whitelistMatch[1]) : 0,
    blacklistDemotion: blacklistMatch ? parseFloat(blacklistMatch[1]) : 0,
    clicks: clicksMatch ? parseInt(clicksMatch[1]) : 0,
    output: stdout.substring(0, 2000)
  };
}

app.listen(PORT, () => {
  console.log(`SERP Booster Dashboard running at http://localhost:${PORT}`);
});
