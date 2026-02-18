/**
 * SERP Clicks CLI
 * Click search results to influence rankings
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { BrowserManager } = require('./browser');
const { SerpClicksEngine } = require('./serp-clicks-engine');

const program = new Command();

program
  .name('serp-clicks-cli')
  .description('SERP clicks tool to influence search rankings')
  .version('0.1.0');

program
  .option('-k, --keywords <file>', 'Keywords CSV file (format: keyword|target_url|tier)')
  .option('-e, --engine <engine>', 'Search engine (google, bing, duckduckgo, yahoo)', 'google')
  .option('-m, --mode <mode>', 'Strategy mode (aggressive, natural, stealth)', 'natural')
  .option('-t, --typing <mode>', 'Typing speed (slow, medium, fast, random)', 'random')
  .option('-d, --dwell <seconds>', 'Dwell time on clicked page', '30')
  .option('-s, --sessions <n>', 'Number of sessions per keyword', '1')
  .option('-p, --proxies <file>', 'Proxy list file')
  .option('--proxy-host <host>', 'Proxy host')
  .option('--proxy-port <port>', 'Proxy port')
  .option('--proxy-user <user>', 'Proxy username')
  .option('--proxy-pass <pass>', 'Proxy password')
  .option('--headless', 'Run browser headless', true)
  .option('-o, --output <dir>', 'Output directory', 'output')
  .parse(process.argv);

const opts = program.opts();

// Validate inputs
if (!opts.keywords) {
  console.error('Error: Must specify --keywords <file>');
  console.error('Format: keyword|target_url|tier');
  console.error('Tier: whitelist (click), greylist (maybe), blacklist (never)');
  process.exit(1);
}

// Load keywords
function loadKeywords(file) {
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

// Main execution
async function main() {
  console.log('='.repeat(50));
  console.log('SERP Clicks CLI v0.1.0');
  console.log('='.repeat(50));
  
  const keywords = loadKeywords(opts.keywords);
  
  console.log(`Keywords: ${keywords.length}`);
  console.log(`Engine: ${opts.engine}`);
  console.log(`Mode: ${opts.mode}`);
  console.log(`Dwell: ${opts.dwell}s`);
  console.log(`Sessions: ${opts.sessions}`);
  console.log('-'.repeat(50));
  
  // Initialize browser
  const browser = new BrowserManager({
    headless: opts.headless,
    proxyHost: opts.proxyHost,
    proxyPort: opts.proxyPort,
    proxyUser: opts.proxyUser,
    proxyPass: opts.proxyPass
  });
  
  await browser.launch();
  
  const engine = new SerpClicksEngine(browser, {
    typingMode: opts.typing,
    engine: opts.engine,
    mode: opts.mode,
    dwell: parseInt(opts.dwell),
    typingMode: opts.typing || 'random',
    sessions: parseInt(opts.sessions),
    outputDir: opts.output
  });
  
  // Run through all keywords
  for (const keyword of keywords) {
    console.log(`\n>>> Processing: "${keyword.keyword}" (${keyword.tier})`);
    
    // Get position before
    const positionBefore = await engine.getPosition(keyword.keyword, keyword.url);
    console.log(`  Position before: ${positionBefore || 'not found'}`);
    
    // Execute clicks based on tier
    if (keyword.tier === 'whitelist') {
      await engine.clickWhitelist(keyword);
    } else if (keyword.tier === 'greylist') {
      await engine.clickGreylist(keyword);
    }
    // Blacklist: never click
    
    // Get position after
    await engine.randomDelay(2000, 5000);
    const positionAfter = await engine.getPosition(keyword.keyword, keyword.url);
    console.log(`  Position after: ${positionAfter || 'not found'}`);
    
    // Record result
    engine.recordResult(keyword, positionBefore, positionAfter);
    
    // Delay between keywords
    await engine.randomDelay(5000, 15000);
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
