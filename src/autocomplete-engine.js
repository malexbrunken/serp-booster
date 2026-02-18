/**
 * Autocomplete Engine
 * Core logic for typing and suggestion handling
 */

const fs = require('fs');
const path = require('path');

class AutocompleteEngine {
  constructor(browser, options = {}) {
    this.browser = browser;
    this.options = {
      engine: 'google',
      mode: 'random',
      repetitions: 10,
      delay: 30,
      outputDir: 'output',
      ...options
    };
    
    this.results = {
      iterations: [],
      errors: [],
      success: 0,
      failed: 0
    };
    
    // Typing speeds in ms per character
    this.typingSpeeds = {
      slow: 150,
      medium: 80,
      fast: 40,
      random: () => 40 + Math.random() * 120
    };
  }
  
  async runTerm(term) {
    console.log(`Processing: "${term.prefix}" -> "${term.suggestion}"`);
    
    for (let i = 0; i < this.options.repetitions; i++) {
      console.log(`  Iteration ${i + 1}/${this.options.repetitions}...`);
      
      const result = await this.runIteration(term, i + 1);
      this.results.iterations.push(result);
      
      if (result.success) {
        this.results.success++;
      } else {
        this.results.failed++;
      }
      
      // Delay between iterations
      if (i < this.options.repetitions - 1) {
        const delay = this.options.delay + Math.random() * 20;
        await this.randomDelay(delay * 1000, delay * 1000 + 5000);
      }
    }
    
    console.log(`  Done: ${this.results.success} success, ${this.results.failed} failed`);
  }
  
  async runIteration(term, iterationNum) {
    const result = {
      timestamp: new Date().toISOString(),
      prefix: term.prefix,
      suggestion: term.suggestion,
      iteration: iterationNum,
      success: false,
      suggestionAppeared: false,
      suggestionPosition: null,
      action: null,
      error: null,
      errorType: null,
      engine: this.options.engine
    };
    
    try {
      // Navigate to search engine
      await this.browser.gotoSearchEngine(this.options.engine);
      
      // Find search box - different selectors for Google vs Bing
      const searchBox = await this.getSearchBox();
      if (!searchBox) {
        throw new Error('SEARCH_ERROR: Could not find search box');
      }
      
      // Click to focus
      await searchBox.click();
      await this.randomDelay(200, 500);
      
      // Clear any existing text
      await this.browser.page.keyboard.press('Control+a');
      await this.browser.page.keyboard.press('Backspace');
      
      // Type prefix with variable speed
      const speed = this.getTypingSpeed();
      await this.browser.page.keyboard.type(term.prefix, { delay: speed });
      
      // Wait for suggestions to appear
      await this.randomDelay(1500, 3000);
      
      // Check for suggestions
      const suggestions = await this.getSuggestions();
      
      if (suggestions.length > 0) {
        result.suggestionAppeared = true;
        
        // Find our target suggestion
        const targetIndex = suggestions.findIndex(s => 
          s.toLowerCase().includes(term.suggestion.toLowerCase())
        );
        
        if (targetIndex >= 0) {
          result.suggestionPosition = targetIndex + 1;
          
          // Click the suggestion
          await this.clickSuggestion(targetIndex);
          result.action = 'clicked';
          result.success = true;
          console.log(`    OK Suggestion appeared at position ${targetIndex + 1}`);
        } else {
          // Our suggestion not in list
          result.action = 'not_found';
          console.log(`    - Suggestion not found, ${suggestions.length} suggestions shown`);
        }
      } else {
        result.action = 'no_suggestions';
        console.log(`    - No suggestions appeared`);
      }
      
    } catch (error) {
      result.error = error.message;
      result.errorType = this.categorizeError(error.message);
      console.log(`    X Error: ${error.message}`);
    }
    
    return result;
  }
  
  async getSearchBox() {
    const engine = this.options.engine;
    
    if (engine === 'bing') {
      // Bing search box selectors
      return await this.browser.page.$('#sb_form_q') ||
             await this.browser.page.$('input[name="q"]') ||
             await this.browser.page.$('.sb_form input');
    } else {
      // Google search box (default)
      return await this.browser.page.$('input[name="q"]') ||
             await this.browser.page.$('textarea[name="q"]');
    }
  }
  
  getTypingSpeed() {
    const mode = this.options.mode;
    if (mode === 'random') {
      return this.typingSpeeds.random();
    }
    return this.typingSpeeds[mode] || this.typingSpeeds.medium;
  }
  
  async getSuggestions() {
    const suggestions = [];
    const engine = this.options.engine;
    
    try {
      if (engine === 'bing') {
        // Bing suggestions - multiple selectors
        let bingSuggestions = await this.browser.page.$$('.sa_bgbg li, #sa_ul li, .b_symans li, [class*="sa_"] li');
        
        for (const el of bingSuggestions) {
          const text = await el.textContent();
          if (text && text.trim()) {
            suggestions.push(text.trim());
          }
        }
      } else {
        // Google suggestions (default)
        const googleSuggestions = await this.browser.page.$$('ul[role="listbox"] li, .sbsb_b li, .erkvQe li');
        
        for (const el of googleSuggestions) {
          const text = await el.textContent();
          if (text && text.trim()) {
            suggestions.push(text.trim());
          }
        }
      }
    } catch (e) {
      // Suggestions not found
    }
    
    return suggestions;
  }
  
  async clickSuggestion(index) {
    const engine = this.options.engine;
    
    try {
      let suggestionEls = [];
      
      if (engine === 'bing') {
        suggestionEls = await this.browser.page.$$('.sa_bgbg li, #sa_ul li, .b_symans li');
      } else {
        // Google (default)
        suggestionEls = await this.browser.page.$$('ul[role="listbox"] li, .sbsb_b li, .erkvQe li');
      }
      
      if (suggestionEls[index]) {
        await suggestionEls[index].click();
        await this.randomDelay(500, 1000);
      }
    } catch (e) {
      // Fallback: press down arrow and enter
      await this.browser.page.keyboard.press('ArrowDown');
      await this.randomDelay(100, 200);
      await this.browser.page.keyboard.press('Enter');
    }
  }
  
  categorizeError(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('403') || msg.includes('blocked') || msg.includes('forbidden')) {
      return 'PROXY_BLOCKED';
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'PROXY_TIMEOUT';
    }
    if (msg.includes('captcha')) {
      return 'SEARCH_CAPTCHA';
    }
    if (msg.includes('authentication') || msg.includes('auth')) {
      return 'PROXY_AUTH_FAILED';
    }
    if (msg.includes('connection') || msg.includes('refused')) {
      return 'PROXY_CONN_REFUSED';
    }
    if (msg.includes('rate limit')) {
      return 'SEARCH_RATE_LIMIT';
    }
    
    return 'SEARCH_ERROR';
  }
  
  generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dir = this.options.outputDir;
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Results CSV
    const resultsPath = path.join(dir, `autocomplete_${timestamp}.csv`);
    let content = 'timestamp,prefix,suggestion,iteration,engine,success,suggestion_appeared,position,action,error,error_type\n';
    
    this.results.iterations.forEach(r => {
      content += `${r.timestamp},"${r.prefix}","${r.suggestion}",${r.iteration},${r.engine},${r.success},${r.suggestionAppeared},${r.suggestionPosition || ''},${r.action || ''},"${r.error || ''}",${r.errorType || ''}\n`;
    });
    
    fs.writeFileSync(resultsPath, content);
    console.log(`\nResults: ${resultsPath}`);
    
    // Summary
    const successRate = this.results.iterations.length > 0 
      ? ((this.results.success / this.results.iterations.length) * 100).toFixed(1) 
      : 0;
    
    const summaryPath = path.join(dir, `summary_${timestamp}.txt`);
    const summary = `Autocomplete Report - ${timestamp}
${'='.repeat(40)}
Search Engine: ${this.options.engine}
Terms processed: ${Math.ceil(this.results.iterations.length / this.options.repetitions)}
Total iterations: ${this.results.iterations.length}
Success: ${this.results.success}
Failed: ${this.results.failed}
Success rate: ${successRate}%

Suggestions appeared: ${this.results.iterations.filter(r => r.suggestionAppeared).length}
Suggestions clicked: ${this.results.success}

Errors by type:
${this.getErrorBreakdown()}
`;
    fs.writeFileSync(summaryPath, summary);
    console.log(`Summary: ${summaryPath}`);
    console.log('\n' + summary);
  }
  
  getErrorBreakdown() {
    const errors = {};
    this.results.iterations.forEach(r => {
      if (r.errorType) {
        errors[r.errorType] = (errors[r.errorType] || 0) + 1;
      }
    });
    
    return Object.entries(errors)
      .map(([type, count]) => `  ${type}: ${count}`)
      .join('\n') || '  None';
  }
  
  randomDelay(min, max) {
    const ms = Math.floor(Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { AutocompleteEngine };
