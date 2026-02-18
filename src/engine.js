/**
 * Strategy Engine
 * Core logic for click execution and ranking manipulation
 */

const fs = require('fs');
const path = require('path');

class Engine {
  constructor(browser, options = {}) {
    this.browser = browser;
    this.options = {
      engine: 'google',
      mode: 'natural',
      dwell: 30,
      sessions: 1,
      outputDir: 'output',
      ...options
    };
    
    this.results = {
      clicks: [],
      rankings: [],
      autocomplete: []
    };
    
    this.strategy = this.getStrategy(this.options.mode);
  }
  
  getStrategy(mode) {
    const strategies = {
      aggressive: {
        whitelistClicks: 3,
        greylistClicks: 1,
        minDwell: 20,
        randomization: 'low'
      },
      natural: {
        whitelistClicks: 2,
        greylistClicks: 2,
        minDwell: 30,
        randomization: 'medium'
      },
      stealth: {
        whitelistClicks: 1,
        greylistClicks: 3,
        minDwell: 45,
        randomization: 'high'
      }
    };
    return strategies[mode] || strategies.natural;
  }
  
  async runStrategy(keywords) {
    console.log(`Running ${keywords.length} keywords with ${this.options.mode} strategy...\n`);
    
    for (const item of keywords) {
      console.log(`Processing: "${item.keyword}" (${item.tier})`);
      
      // Get initial position
      const positionBefore = await this.browser.getPosition(item.keyword, item.url, this.options.engine);
      console.log(`  Position before: ${positionBefore || 'not found'}`);
      
      // Execute clicks based on tier
      if (item.tier === 'whitelist') {
        await this.clickWhitelist(item);
      } else if (item.tier === 'greylist') {
        await this.clickGreylist(item);
      }
      // Blacklist: never click
      
      // Get final position
      await this.sleep(2000);
      const positionAfter = await this.browser.getPosition(item.keyword, item.url, this.options.engine);
      console.log(`  Position after: ${positionAfter || 'not found'}`);
      
      // Record result
      this.results.rankings.push({
        keyword: item.keyword,
        url: item.url,
        tier: item.tier,
        positionBefore,
        positionAfter,
        change: positionBefore && positionAfter ? positionBefore - positionAfter : 0
      });
      
      // Random delay between keywords
      await this.randomDelay(3000, 8000);
    }
  }
  
  async clickWhitelist(item) {
    const clicks = this.strategy.whitelistClicks;
    console.log(`  Clicking whitelist ${clicks} time(s)...`);
    
    for (let i = 0; i < clicks; i++) {
      await this.browser.searchAndClick(item.keyword, item.url, this.options.engine);
      await this.browser.dwell(this.options.dwell);
      
      if (i < clicks - 1) {
        await this.randomDelay(5000, 15000);
      }
    }
    
    // Record clicks
    for (let i = 0; i < clicks; i++) {
      this.results.clicks.push({
        timestamp: new Date().toISOString(),
        keyword: item.keyword,
        url: item.url,
        tier: 'whitelist',
        session: i + 1
      });
    }
  }
  
  async clickGreylist(item) {
    // Greylist: click sometimes for naturalness
    if (Math.random() > 0.5) {
      console.log(`  Clicking greylist (naturalness)...`);
      await this.browser.searchAndClick(item.keyword, item.url, this.options.engine);
      await this.browser.dwell(this.options.dwell * 0.5);
      
      this.results.clicks.push({
        timestamp: new Date().toISOString(),
        keyword: item.keyword,
        url: item.url,
        tier: 'greylist'
      });
    }
  }
  
  async runAutocomplete(terms) {
    console.log(`Running autocomplete for ${terms.length} terms...\n`);
    
    for (const item of terms) {
      console.log(`Autocomplete: "${item.prefix}" -> "${item.term}"`);
      
      const appeared = await this.browser.typeAndWait(item.prefix, item.term, this.options.engine);
      console.log(`  Appeared in suggestions: ${appeared}`);
      
      this.results.autocomplete.push({
        timestamp: new Date().toISOString(),
        prefix: item.prefix,
        term: item.term,
        appeared
      });
      
      await this.randomDelay(2000, 5000);
    }
  }
  
  generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dir = this.options.outputDir;
    
    // Clicks CSV
    const clicksPath = path.join(dir, `clicks_${timestamp}.csv`);
    let clicksContent = 'timestamp,keyword,url,tier,session\n';
    this.results.clicks.forEach(c => {
      clicksContent += `${c.timestamp},"${c.keyword}",${c.url},${c.tier},${c.session || ''}\n`;
    });
    fs.writeFileSync(clicksPath, clicksContent);
    console.log(`Clicks: ${clicksPath}`);
    
    // Rankings CSV
    const rankingsPath = path.join(dir, `rankings_${timestamp}.csv`);
    let rankingsContent = 'keyword,url,tier,position_before,position_after,change\n';
    this.results.rankings.forEach(r => {
      rankingsContent += `"${r.keyword}",${r.url},${r.tier},${r.positionBefore || ''},${r.positionAfter || ''},${r.change}\n`;
    });
    fs.writeFileSync(rankingsPath, rankingsPath);
    console.log(`Rankings: ${rankingsPath}`);
    
    // Summary
    const whitelistChanges = this.results.rankings
      .filter(r => r.tier === 'whitelist')
      .map(r => r.change)
      .filter(c => c > 0);
    const blacklistChanges = this.results.rankings
      .filter(r => r.tier === 'blacklist')
      .map(r => r.change)
      .filter(c => c < 0);
    
    const summaryPath = path.join(dir, `summary_${timestamp}.txt`);
    const summary = `SERP Booster Report - ${timestamp}
${'='.repeat(40)}
Keywords: ${this.results.rankings.length}
Total Clicks: ${this.results.clicks.length}
Whitelist Avg Improvement: ${whitelistChanges.length ? (whitelistChanges.reduce((a,b)=>a+b,0)/whitelistChanges.length).toFixed(1) : 0} positions
Blacklist Avg Demotion: ${blacklistChanges.length ? (blacklistChanges.reduce((a,b)=>a+b,0)/blacklistChanges.length).toFixed(1) : 0} positions
`;
    fs.writeFileSync(summaryPath, summary);
    console.log(`Summary: ${summaryPath}`);
    console.log('\n' + summary);
  }
  
  randomDelay(min, max) {
    const ms = Math.floor(Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { Engine };
