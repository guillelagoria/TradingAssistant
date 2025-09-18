#!/usr/bin/env node

/**
 * Test script for Economic Events API
 *
 * To use this script:
 * 1. Get a free API key from https://finnhub.io/register
 * 2. Add FINNHUB_API_KEY to your .env file
 * 3. Run: node scripts/test-economic-events.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/economic-events';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

async function testEndpoint(name, method, endpoint, data = null) {
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
  console.log(`${colors.cyan}${method} ${endpoint}${colors.reset}`);

  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      ...(data && { data })
    };

    const response = await axios(config);

    if (response.data.success) {
      console.log(`${colors.green}✓ Success${colors.reset}`);

      if (response.data.data) {
        const { data } = response.data;

        if (data.count !== undefined) {
          console.log(`  Events found: ${data.count}`);
        }

        if (data.events && data.events.length > 0) {
          console.log(`\n  ${colors.yellow}Sample Event:${colors.reset}`);
          const event = data.events[0];
          console.log(`    Event: ${event.event}`);
          console.log(`    Time: ${event.time}`);
          console.log(`    Impact: ${event.impact}`);
          console.log(`    Relevance: ${event.relevance}`);
        }

        if (data.stats) {
          console.log(`\n  ${colors.yellow}Cache Stats:${colors.reset}`);
          console.log(`    Hits: ${data.stats.hits}`);
          console.log(`    Misses: ${data.stats.misses}`);
          console.log(`    Keys: ${data.stats.keys}`);
        }
      }
    }
  } catch (error) {
    if (error.response?.data) {
      console.log(`${colors.red}✗ Error: ${error.response.data.error}${colors.reset}`);

      if (error.response.data.error.includes('API key')) {
        console.log(`${colors.yellow}  Tip: Add FINNHUB_API_KEY to your .env file${colors.reset}`);
        console.log(`${colors.yellow}  Get your free key at: https://finnhub.io/register${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }
  }
}

async function runTests() {
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}     Economic Events API Test Suite${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);

  // Test each endpoint
  await testEndpoint(
    "Today's ES/NQ Events",
    'GET',
    '/today'
  );

  await testEndpoint(
    'Upcoming Events (7 days)',
    'GET',
    '/upcoming?days=7'
  );

  await testEndpoint(
    'High Impact Events',
    'GET',
    '/high-impact'
  );

  await testEndpoint(
    'Filtered Events (FOMC & CPI)',
    'POST',
    '/filter',
    {
      impact: ['HIGH'],
      events: ['FOMC', 'CPI']
    }
  );

  await testEndpoint(
    'Cache Statistics',
    'GET',
    '/cache/stats'
  );

  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Test suite completed!${colors.reset}`);

  console.log(`\n${colors.yellow}ES/NQ Relevant Events Include:${colors.reset}`);
  console.log('  • Federal Reserve: FOMC, Interest Rate Decisions');
  console.log('  • Inflation: CPI, PPI, PCE');
  console.log('  • Employment: NFP, Jobless Claims, Unemployment Rate');
  console.log('  • Growth: GDP, ISM PMI, Retail Sales');
  console.log('  • Consumer: Consumer Confidence, Sentiment');
  console.log('  • Housing: Building Permits, Home Sales');

  console.log(`\n${colors.yellow}Impact Levels:${colors.reset}`);
  console.log('  • HIGH: Major market-moving events');
  console.log('  • MEDIUM: Significant but less volatile');
  console.log('  • LOW: Excluded from results');

  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:3001/health');
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log(`${colors.red}Error: Backend server is not running${colors.reset}`);
    console.log(`${colors.yellow}Please start the server with: npm run dev${colors.reset}`);
    process.exit(1);
  }

  await runTests();
})();