/**
 * Browser Manager
 * Playwright wrapper for SERP interactions
 */

const { chromium } = require('playwright');

class BrowserManager {
  constructor(options = {}) {
    this.options = {
      headless: true,
      proxyFile: null,
      ...options
    };
    this.browser = null;
    this.context = null;
    this.page = null;
    this.proxies = [];
    
    if (this.options.proxyFile) {
      this.loadProxies(this.options.proxyFile);
    }
  }
  
  loadProxies(file) {
    try {
      const content = require('fs').readFileSync(file, 'utf-8');
      this.proxies = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      console.log(`Loaded ${this.proxies.length} proxies`);
    } catch (e) {
      console.warn(`Could not load proxies: ${e.message}`);
    }
  }
  
  getRandomProxy() {
    if (this.proxies.length === 0) return null;
    return this.proxies[Math.floor(Math.random() * this.proxies.length)];
  }
  
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
  
  async launch() {
    const launchOptions = {
      headless: this.options.headless,
      channel: 'chromium',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-first-run',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu'
      ]
    };
    
    // Add proxy if available
    const proxy = this.getRandomProxy();
    if (proxy) {
      launchOptions.proxy = { server: proxy };
    }
    
    this.browser = await chromium.launch(launchOptions);
    
    // Randomize viewport (not default 1920x1080)
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1280, height: 720 }
    ];
    const viewport = viewports[Math.floor(Math.random() * viewports.length)];
    
    this.context = await this.browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation']
    });
    
    // Anti-detection: hide webdriver
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });
    
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(30000);
  }
  
  async searchAndClick(keyword, targetUrl, engine = 'google') {
    const searchUrl = this.getSearchUrl(keyword, engine);
    
    try {
      await this.page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
      console.log('  Navigation timeout, continuing...');
    }
    
    // Random delay after load
    await this.randomDelay(1000, 3000);
    
    // Wait for results
    await this.page.waitForSelector('#search, #results', { timeout: 5000 }).catch(() => {});
    
    // Find target link
    const results = await this.page.$$('a[href]');
    let targetFound = false;
    
    for (const result of results) {
      const href = await result.getAttribute('href');
      if (href && href.includes(targetUrl.replace(/^https?:\/\//, '').split('/')[0])) {
        // Human-like mouse approach
        await this.humanMouseMove(result);
        
        // Click
        await result.click();
        targetFound = true;
        break;
      }
    }
    
    return targetFound;
  }
  
  async humanMouseMove(element) {
    try {
      const box = await element.boundingBox();
      if (!box) return;
      
      const targetX = box.x + box.width / 2 + (Math.random() - 0.5) * 20;
      const targetY = box.y + box.height / 2 + (Math.random() - 0.5) * 20;
      
      // Overshoot and correct (human-like)
      await this.page.mouse.move(targetX + 50, targetY + 50);
      await this.page.mouse.move(targetX - 30, targetY - 30);
      await this.page.mouse.move(targetX, targetY);
      
      // Small pause before click
      await this.randomDelay(100, 300);
    } catch (e) {
      // Fallback to regular hover
      await element.hover();
    }
  }
  
  async getPosition(keyword, targetUrl, engine = 'google') {
    const searchUrl = this.getSearchUrl(keyword, engine);
    
    try {
      await this.page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
      console.log('  Navigation timeout, continuing...');
      return null;
    }
    
    // Wait for results
    await this.page.waitForSelector('#search, #results', { timeout: 5000 }).catch(() => {});
    
    // Find all search result links
    const results = await this.page.$$('a[href]');
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
  
  async typeAndWait(prefix, term, engine = 'google') {
    // Go to search engine
    const baseUrl = engine === 'duckduckgo' ? 'https://duckduckgo.com' : (engine === 'bing' ? 'https://www.bing.com' : 'https://www.google.com');
    await this.page.goto(baseUrl, { waitUntil: 'networkidle' });
    
    // Find search box
    const searchBox = await this.page.$('input[name="q"]');
    if (!searchBox) return false;
    
    // Type prefix slowly
    await searchBox.click();
    await this.page.keyboard.type(prefix, { delay: 100 + Math.random() * 100 });
    
    // Wait for suggestions
    await this.randomDelay(1000, 2000);
    
    // Check if our term appears in suggestions
    const suggestions = await this.page.$$('ul[role="listbox"] li, .sbsb_b li');
    let found = false;
    
    for (const suggestion of suggestions) {
      const text = await suggestion.textContent();
      if (text && text.toLowerCase().includes(term.toLowerCase())) {
        found = true;
        // Click it
        await suggestion.click();
        break;
      }
    }
    
    return found;
  }
  
  async dwell(seconds) {
    console.log(`    Dwell: ${seconds}s...`);
    await this.randomDelay(seconds * 1000, seconds * 1000 + 5000);
  }
  
  getSearchUrl(keyword, engine = 'google') {
    const encoded = encodeURIComponent(keyword);
    if (engine === 'bing') {
      return `https://www.bing.com/search?q=${encoded}`;
    }
    return `https://www.google.com/search?q=${encoded}`;
  }
  
  randomDelay(min, max) {
    const ms = Math.floor(Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
  
  // Additional methods for autocomplete
  async gotoSearchEngine(engine = 'google') {
    const baseUrl = engine === 'duckduckgo' ? 'https://duckduckgo.com' : (engine === 'bing' ? 'https://www.bing.com' : 'https://www.google.com');
    
    try {
      await this.page.goto(baseUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
      
      // Random delay after load
      await this.randomDelay(1000, 3000);
      
      return true;
    } catch (e) {
      console.log(`  Navigation error: ${e.message}`);
      return false;
    }
  }
  
  getProxyConfig() {
    // Priority: explicit config > random from file
    if (this.options.proxyHost) {
      return {
        server: `${this.options.proxyHost}:${this.options.proxyPort}`,
        username: this.options.proxyUser,
        password: this.options.proxyPass
      };
    }
    
    const proxy = this.getRandomProxy();
    if (proxy) {
      return { server: proxy };
    }
    
    return null;
  }
}
