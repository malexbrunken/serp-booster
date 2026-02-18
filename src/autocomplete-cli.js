/**
 * Autocomplete CLI
 * Types search terms to influence Google/Bing autocomplete
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { BrowserManager } = require('./browser');
const { AutocompleteEngine } = require('./autocomplete-engine');

const program = new Command();

program
  .name('autocomplete-cli')
  .description('Google/Bing autocomplete influence tool')
  .version('0.1.0');

program
  .option('-t, --terms <file>', 'Terms CSV file (format: prefix|suggestion)')
  .option('-e, --engine <engine>', 'Search engine (google, bing, duckduckgo)', 'google')
  .option('-m, --mode <mode>', 'Typing mode (slow, medium, fast, random)', 'random')
  .option('-r, --repetitions <n>', 'Repetitions per term', '10')
  .option('-d, --delay <seconds>', 'Delay between iterations', '30')
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
if (!opts.terms) {
  console.error('Error: Must specify --terms <file>');
  console.error('Format: prefix|suggestion');
  process.exit(1);
}

// Load terms
function loadTerms(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const records = parse(content, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
    delimiter: '|'
  });
  
  return records.map(row => ({
    prefix: row[0],
    suggestion: row[1]
  }));
}

// Main execution
async function main() {
  console.log('='.repeat(50));
  console.log('Autocomplete CLI v0.1.0');
  console.log('='.repeat(50));
  
  const terms = loadTerms(opts.terms);
  
  console.log(`Terms: ${terms.length}`);
  console.log(`Engine: ${opts.engine}`);
  console.log(`Mode: ${opts.mode}`);
  console.log(`Repetitions: ${opts.repetitions}`);
  console.log(`Delay: ${opts.delay}s`);
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
  
  const engine = new AutocompleteEngine(browser, {
    engine: opts.engine,
    mode: opts.mode,
    repetitions: parseInt(opts.repetitions),
    delay: parseInt(opts.delay),
    outputDir: opts.output
  });
  
  // Run through all terms
  for (const term of terms) {
    console.log(`\n>>> Processing: "${term.prefix}" → "${term.suggestion}"`);
    
    await engine.runTerm(term);
    
    // Delay between terms
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
