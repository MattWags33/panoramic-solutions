#!/usr/bin/env node
/**
 * Exit Intent Bumper Test Runner
 * 
 * This script runs comprehensive tests for Exit Intent Bumper scenarios
 * using Playwright MCP or standard Playwright test runner.
 * 
 * Usage:
 *   npm run test:exit-intent
 *   or
 *   npx playwright test e2e/exit-intent-bumper-comprehensive.spec.ts
 * 
 * Test Scenarios:
 * 1. Timer requirement (1 minute)
 * 2. Criteria requirement (3+ criteria)
 * 3. Mouse movement detection zones
 * 4. Permanent blocking scenarios
 * 5. Temporary blocking scenarios
 * 6. Debugging logs verification
 * 7. Edge cases
 */

import { execSync } from 'child_process';
import { resolve } from 'path';

const testFile = resolve(__dirname, '../e2e/exit-intent-bumper-comprehensive.spec.ts');

console.log('🧪 Exit Intent Bumper Comprehensive Test Suite');
console.log('📋 Running all test scenarios...');
console.log('');

try {
  // Run Playwright tests
  execSync(`npx playwright test ${testFile} --reporter=list`, {
    stdio: 'inherit',
    cwd: resolve(__dirname, '..')
  });
  
  console.log('');
  console.log('✅ All tests completed!');
} catch (error) {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
}

