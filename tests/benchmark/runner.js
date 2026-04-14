/**
 * Hybrid ATS + Semantic Resume Matcher Test Runner
 * 
 * Usage:
 *   node tests/benchmark/runner.js [options]
 * 
 * Options:
 *   --api-url=URL       Target API endpoint (default: http://localhost:3000)
 *   --category=CAT      Run only specific category (strong|moderate|weak|edge)
 *   --verbose           Show detailed output
 *   --save-report       Save JSON report to file
 *   --help              Show this help message
 */

import { benchmarkDataset, validationConfig, driftThresholds } from './dataset.js';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.replace('--', '').split('=');
    acc[key] = value || true;
  }
  return acc;
}, {});

if (args.help) {
  console.log(`
Hybrid Resume Matcher Test Runner
==================================

Usage: node tests/benchmark/runner.js [options]

Options:
  --api-url=URL       Target API endpoint (default: http://localhost:3000)
  --category=CAT      Run only specific category (strong|moderate|weak|edge)
  --verbose           Show detailed output
  --save-report       Save JSON report to file
  --help              Show this help message

Examples:
  node tests/benchmark/runner.js
  node tests/benchmark/runner.js --category=strong
  node tests/benchmark/runner.js --api-url=http://localhost:3001 --verbose
  node tests/benchmark/runner.js --category=edge --save-report
`);
  process.exit(0);
}

// Configuration
const API_URL = args['api-url'] || 'http://localhost:3000';
const TARGET_CATEGORY = args.category;
const VERBOSE = args.verbose;
const SAVE_REPORT = args['save-report'];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  categories: {},
  driftDetected: [],
  testCases: []
};

// Initialize category tracking
Object.keys(validationConfig).forEach(cat => {
  results.categories[cat] = { total: 0, passed: 0, failed: 0, scores: [] };
});

/**
 * Call the resume matching API
 */
async function callMatchAPI(testCase) {
  try {
    const formData = new FormData();
    
    // Create a mock file from the resume text
    const resumeBlob = new Blob([testCase.resume], { type: 'text/plain' });
    formData.append('resume', resumeBlob, 'resume.txt');
    formData.append('jobDescription', testCase.jobDescription);
    formData.append('requiredSkills', testCase.requiredSkills.join(','));

    const response = await fetch(`${API_URL}/api/ai/match`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Run a single test case
 */
async function runTest(testCase) {
  const startTime = Date.now();
  
  if (VERBOSE) {
    console.log(`\n${colorize('▶', 'cyan')} Running: ${colorize(testCase.id, 'bright')} - ${testCase.name}`);
  }

  try {
    const result = await callMatchAPI(testCase);
    const duration = Date.now() - startTime;

    if (result.error) {
      return {
        id: testCase.id,
        name: testCase.name,
        category: testCase.category,
        status: 'FAILED',
        error: result.error,
        duration
      };
    }

    const score = result.overallScore || 0;
    const expectedRange = testCase.expectedRange || validationConfig[testCase.category];
    
    // Check if score is within expected range
    const inRange = score >= expectedRange.min && score <= expectedRange.max;
    
    // Check for drift (if we have historical data)
    const expectedMid = (expectedRange.min + expectedRange.max) / 2;
    const drift = Math.abs(score - expectedMid);
    const driftAlert = drift > driftThresholds.maxScoreVariance;

    const status = inRange ? 'PASSED' : 'FAILED';

    if (VERBOSE) {
      const scoreColor = inRange ? 'green' : 'red';
      const emoji = inRange ? '✓' : '✗';
      console.log(`  ${emoji} Score: ${colorize(score + '%', scoreColor)} (expected: ${expectedRange.min}-${expectedRange.max}%)`);
      console.log(`  ⏱ Duration: ${duration}ms`);
      if (driftAlert) {
        console.log(`  ⚠ ${colorize('Drift detected!', 'yellow')} Score differs ${drift.toFixed(1)} from expected mid`);
      }
      if (result.atsRecommendation) {
        console.log(`  📊 ATS: ${result.atsRecommendation}`);
      }
    }

    return {
      id: testCase.id,
      name: testCase.name,
      category: testCase.category,
      status,
      score,
      expectedRange,
      drift,
      driftAlert,
      duration,
      result: {
        atsRecommendation: result.atsRecommendation,
        semanticSimilarityScore: result.semanticSimilarityScore,
        skillScore: result.skillScore,
        experienceScore: result.experienceScore
      }
    };

  } catch (error) {
    if (VERBOSE) {
      console.log(`  ${colorize('✗ Error:', 'red')} ${error.message}`);
    }
    return {
      id: testCase.id,
      name: testCase.name,
      category: testCase.category,
      status: 'ERROR',
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

/**
 * Generate and print summary report
 */
function printReport() {
  console.log('\n' + colorize('='.repeat(70), 'bright'));
  console.log(colorize('           HYBRID RESUME MATCHER - BENCHMARK REPORT', 'bright'));
  console.log(colorize('='.repeat(70), 'bright'));

  // Overall summary
  const passRate = (results.passed / results.total * 100).toFixed(1);
  const overallStatus = passRate >= driftThresholds.minPassRate * 100 ? 'PASSED' : 'FAILED';
  const overallColor = overallStatus === 'PASSED' ? 'green' : 'red';

  console.log(`\n${colorize('OVERALL RESULT:', 'bright')} ${colorize(overallStatus, overallColor)}`);
  console.log(`  Total Tests:     ${results.total}`);
  console.log(`  ${colorize('Passed:', 'green')}          ${results.passed} (${passRate}%)`);
  console.log(`  ${colorize('Failed:', 'red')}          ${results.failed}`);
  console.log(`  Skipped:         ${results.skipped}`);

  // Category breakdown
  console.log(`\n${colorize('CATEGORY BREAKDOWN:', 'bright')}`);
  console.log('-'.repeat(70));
  console.log(`${'Category'.padEnd(12)} ${'Total'.padStart(6)} ${'Passed'.padStart(8)} ${'Failed'.padStart(8)} ${'Avg Score'.padStart(10)} ${'Status'.padStart(10)}`);
  console.log('-'.repeat(70));

  Object.entries(results.categories).forEach(([cat, data]) => {
    if (data.total === 0) return;
    
    const avgScore = data.scores.length > 0 
      ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)
      : 'N/A';
    const catPassRate = (data.passed / data.total * 100).toFixed(0);
    const status = catPassRate >= 70 ? colorize('✓ OK', 'green') : colorize('✗ LOW', 'red');
    
    console.log(
      `${cat.padEnd(12)} ${data.total.toString().padStart(6)} ` +
      `${colorize(data.passed.toString().padStart(8), 'green')} ` +
      `${colorize(data.failed.toString().padStart(8), data.failed > 0 ? 'red' : 'reset')} ` +
      `${avgScore.toString().padStart(10)} ` +
      `${status.padStart(10)}`
    );
  });

  // Drift alerts
  if (results.driftDetected.length > 0) {
    console.log(`\n${colorize('⚠ DRIFT DETECTED:', 'yellow')}`);
    results.driftDetected.forEach(d => {
      console.log(`  - ${d.id}: ${d.score}% (expected ~${d.expected}%) - drift: ${d.drift.toFixed(1)}`);
    });
  }

  // Failed tests detail
  const failedTests = results.testCases.filter(t => t.status === 'FAILED' || t.status === 'ERROR');
  if (failedTests.length > 0) {
    console.log(`\n${colorize('✗ FAILED/ERROR TESTS:', 'red')}`);
    failedTests.forEach(t => {
      console.log(`  - ${t.id}: ${t.name}`);
      if (t.error) console.log(`    Error: ${t.error}`);
      else console.log(`    Score: ${t.score}% (expected: ${t.expectedRange.min}-${t.expectedRange.max}%)`);
    });
  }

  console.log('\n' + colorize('='.repeat(70), 'bright'));
  
  // Save report if requested
  if (SAVE_REPORT) {
    const reportPath = path.join(process.cwd(), 'tests', 'benchmark', `report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(colorize('\n🏃 Hybrid Resume Matcher - Test Runner', 'bright'));
  console.log(`Target API: ${colorize(API_URL, 'cyan')}\n`);

  // Filter test cases if category specified
  const testCases = TARGET_CATEGORY 
    ? benchmarkDataset.filter(t => t.category === TARGET_CATEGORY)
    : benchmarkDataset;

  if (testCases.length === 0) {
    console.log(colorize('✗ No test cases found for category: ' + TARGET_CATEGORY, 'red'));
    process.exit(1);
  }

  console.log(`Running ${colorize(testCases.length.toString(), 'cyan')} test cases...`);
  if (TARGET_CATEGORY) {
    console.log(`Category filter: ${colorize(TARGET_CATEGORY, 'cyan')}`);
  }
  console.log('');

  // Run tests sequentially to avoid rate limiting
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    
    // Update counters
    results.total++;
    results.testCases.push(result);
    
    const cat = results.categories[result.category];
    cat.total++;
    
    if (result.status === 'PASSED') {
      results.passed++;
      cat.passed++;
      cat.scores.push(result.score);
    } else if (result.status === 'FAILED') {
      results.failed++;
      cat.failed++;
      cat.scores.push(result.score);
    } else {
      results.skipped++;
    }

    // Track drift
    if (result.driftAlert) {
      results.driftDetected.push({
        id: result.id,
        score: result.score,
        expected: (result.expectedRange.min + result.expectedRange.max) / 2,
        drift: result.drift
      });
    }
  }

  // Print final report
  printReport();

  // Exit with appropriate code
  const passRate = results.passed / results.total;
  process.exit(passRate >= driftThresholds.minPassRate ? 0 : 1);
}

// Run main
main().catch(err => {
  console.error(colorize('\n✗ Fatal error:', 'red'), err.message);
  process.exit(1);
});
