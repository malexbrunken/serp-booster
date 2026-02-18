/**
 * SERP Clicks Engine
 * Core logic for clicking search results
 */

const fs = require('fs');
const path = require('path');

class SerpClicksEngine {
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
      rankings: []
    };
    
    // Strategy modes
    this.strategies = {
      aggressive: {
        whitelistClicks: 3,
        greylistClicks: 1,
        minDwell: 20
      },
      natural: {
        whitelistClicks: 2,
        greylistClicks: 2,
        minDwell: 30
      },
      stealth: {
        whitelistClicks: 1,
        greylistClicks: 3,
        minDwell: 45
      }
    };
    
    this.strategy = this.strategies[this.options.mode] || this.strategies.natural;
    
    // Typing speeds
    this.typingSpeeds = {
      slow: 150,
      medium: 80,
      fast: 40,
      random: () => 40 + Math.random() * 120
    };
  }
  
  async getPosition(keyword, targetUrl) {
    const searchUrl = this.getSearchUrl(keyword);
    
    try {
      await this.browser.page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
    } catch (e) {
      console.log('  Navigation timeout');
      return null;
    }
    
    // Wait for results
    await this.browser.randomDelay(1000, 3000);
    
    try {
      await this.browser.page.waitForSelector('#search, #results, #maincontent', { timeout: 5000 });
    } catch (e) {}
    
    // Find all search result links
    const results = await this.browser.page.$$('a[href]');
    const targetDomain = targetUrl.replace(/^https?:\/\//, '').split('/')[0];
    
    let position = 0;
    for (let i = 0; i < results.length; i++) {
      const href = await results[i].getAttribute('href');
      if (href && href.includes(targetDomain)) {
        position = i + 1;
        break;
      }
    }
    
    return position || null;
  }
  
  async clickWhitelist(item) {
    const clicks = this.strategy.whitelistClicks;
    console.log(`  Clicking whitelist ${clicks} time(s)...`);
    
    for (let i = 0; i < clicks; i++) {
      const found = await this.searchAndClick(item.keyword, item.url);
      
      if (found) {
        // Dwell on the page
        console.log(`    Dwell: ${this.options.dwell}s...`);
        await this.browser.randomDelay(this.options.dwell * 1000, this.options.dwell * 1000 + 5000);
        
        // Go back to search
        await this.browser.page.goBack();
        await this.browser.randomDelay(2000, 5000);
      }
      
      // Record click
      this.results.clicks.push({
        timestamp: new Date().toISOString(),
        keyword: item.keyword,
        url: item.url,
        tier: 'whitelist',
        session: i + 1,
        success: found
      });
      
      if (i < clicks - 1) {
        await this.browser.randomDelay(5000, 15000);
      }
    }
  }
  
  async clickGreylist(item) {
    // Greylist: click sometimes for naturalness
    if (Math.random() > 0.5) {
      console.log(`  Clicking greylist (naturalness)...`);
      const found = await this.searchAndClick(item.keyword, item.url);
      
      if (found) {
        // Shorter dwell
        await this.browser.randomDelay(this.options.dwell * 500, this.options.dwell * 1000);
        await this.browser.page.goBack();
      }
      
      this.results.clicks.push({
        timestamp: new Date().toISOString(),
        keyword: item.keyword,
        url: item.url,
        tier: 'greylist',
        success: found
      });
    }
  }
  
  async searchAndClick(keyword, targetUrl) {
    const searchUrl = this.getSearchUrl(keyword);
    
    try {
      await this.browser.page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
    } catch (e) {
      console.log('    Navigation error');
      return false;
    }
    
    await this.browser.randomDelay(1000, 3000);
    
    // Find target link
    const results = await this.browser.page.$$('a[href]');
    let targetFound = false;
    
    for (const result of results) {
      const href = await result.getAttribute('href');
      const domain = targetUrl.replace(/^https?:\/\//, '').split('/')[0];
      
      if (href && href.includes(domain)) {
        // Human-like mouse movement
        try {
          await this.browser.humanMouseMove(result);
        } catch (e) {
          await result.scrollIntoViewIfNeeded();
        }
        
        await result.click();
        targetFound = true;
        break;
      }
    }
    
    return targetFound;
  }
  
  getSearchUrl(keyword) {
    const encoded = encodeURIComponent(keyword);
    const engine = this.options.engine;
    
    let url = 'https://www.google.com';
    if (engine === 'bing') url = 'https://www.bing.com';
    else if (engine === 'duckduckgo') url = 'https://duckduckgo.com';
    else if (engine === 'yahoo') url = 'https://search.yahoo.com';
    
    return `${url}/search?q=${encoded}`;
  }
  
  recordResult(keyword, positionBefore, positionAfter) {
    this.results.rankings.push({
      timestamp: new Date().toISOString(),
      keyword: keyword.keyword,
      url: keyword.url,
      tier: keyword.tier,
      positionBefore,
      positionAfter,
      change: positionBefore && positionAfter ? positionBefore - positionAfter : 0
    });
  }
  
  generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dir = this.options.outputDir;
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Clicks CSV
    const clicksPath = path.join(dir, `clicks_${timestamp}.csv`);
    let clicksContent = 'timestamp,keyword,url,tier,session,success\n';
    
    this.results.clicks.forEach(c => {
      clicksContent += `${c.timestamp},"${c.keyword}",${c.url},${c.tier},${c.session || ''},${c.success}\n`;
    });
    
    fs.writeFileSync(clicksPath, clicksContent);
    console.log(`\nClicks: ${clicksPath}`);
    
    // Rankings CSV
    const rankingsPath = path.join(dir, `rankings_${timestamp}.csv`);
    let rankingsContent = 'timestamp,keyword,url,tier,position_before,position_after,change\n';
    
    this.results.rankings.forEach(r => {
      rankingsContent += `${r.timestamp},"${r.keyword}",${r.url},${r.tier},${r.positionBefore || ''},${r.positionAfter || ''},${r.change}\n`;
    });
    
    fs.writeFileSync(rankingsPath, rankingsContent);
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
    const summary = `SERP Clicks Report - ${timestamp}
${'='.repeat(40)}
Search Engine: ${this.options.engine}
Mode: ${this.options.mode}
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
}

module.exports = { SerpClicksEngine };
