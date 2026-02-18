#!/usr/bin/env node

/**
 * SERP Booster CLI
 * Strategic search ranking booster with whitelist/greylist/blacklist strategy
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { Engine } = require('./engine');
const { BrowserManager } = require('./browser');

const program = new Command();

program
  .name('serp-booster')
  .description('Strategic search ranking booster')
  .version('0.1.0');

program
  .option('-k, --keywords <file>', 'Keywords strategy CSV file')
  .option('-a, --autocomplete <file>', 'Autocomplete CSV file')
  .option('-e, --engine <engine>', 'Search engine (google, bing)', 'google')
  .option('-m, --mode <mode>', 'Strategy mode (aggressive, natural, stealth)', 'natural')
  .option('-d, --dwell <seconds>', 'Dwell time in seconds', '30')
  .option('-s, --sessions <number>', 'Number of sessions per keyword', '1')
  .option('-p, --proxies <file>', 'Proxy list file')
  .option('--headless', 'Run browser in headless mode', true)
  .option('-o, --output <dir>', 'Output directory', 'output')
  .parse(process.argv);

const opts = program.opts();

// Validate inputs
if (!opts.keywords && !opts.autocomplete) {
  console.error('Error: Must specify --keywords or --autocomplete');
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(opts.output)) {
  fs.mkdirSync(opts.output, { recursive: true });
}

// Load strategy file
function loadKeywords(file) {
  if (!file) return [];
  const content = fs.readFileSync(file, 'utf-8');
  const records = parse(content, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
    delimiter: '|'
  });
  
  return records.map(row => ({
    keyword: row[0],
    url: row[1],
    tier: row[2] || 'whitelist'
  }));
}

// Load autocomplete file
function loadAutocomplete(file) {
  if (!file) return [];
  const content = fs.readFileSync(file, 'utf-8');
  const records = parse(content, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
    delimiter: '|'
  });
  
  return records.map(row => ({
    prefix: row[0],
    term: row[1]
  }));
}

// Main execution
async function main() {
  console.log('='.repeat(50));
  console.log('SERP Booster v0.1.0');
  console.log('='.repeat(50));
  
  const keywords = loadKeywords(opts.keywords);
  const autocomplete = loadAutocomplete(opts.autocomplete);
  
  console.log(`Keywords: ${keywords.length}`);
  console.log(`Autocomplete terms: ${autocomplete.length}`);
  console.log(`Engine: ${opts.engine}`);
  console.log(`Mode: ${opts.mode}`);
  console.log(`Dwell: ${opts.dwell}s`);
  console.log(`Sessions: ${opts.sessions}`);
  console.log('-'.repeat(50));
  
  // Initialize browser
  const browser = new BrowserManager({
    headless: opts.headless,
    proxyFile: opts.proxies
  });
  
  await browser.launch();
  
  const engine = new Engine(browser, {
    engine: opts.engine,
    mode: opts.mode,
    dwell: parseInt(opts.dwell),
    sessions: parseInt(opts.sessions),
    outputDir: opts.output
  });
  
  // Run keyword strategy
  if (keywords.length > 0) {
    console.log('\n>>> Running SERP Boost Strategy...\n');
    await engine.runStrategy(keywords);
  }
  
  // Run autocomplete
  if (autocomplete.length > 0) {
    console.log('\n>>> Running Autocomplete Strategy...\n');
    await engine.runAutocomplete(autocomplete);
  }
  
  // Generate report
  engine.generateReport();
  
  await browser.close();
  
  console.log('\n✓ Complete!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
