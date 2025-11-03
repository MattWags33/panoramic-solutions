import { test, expect } from '@playwright/test';

/**
 * Exit Intent Bumper Comprehensive Test Suite
 * Tests all scenarios for when ExitIntentBumper should show up
 * 
 * Updated for:
 * - 1 minute timer (changed from 2 minutes)
 * - Enhanced top bar detection (entire top area, not just corners)
 * - Comprehensive debugging logs with [EXIT_INTENT_DEBUG] prefix
 * 
 * Test scenarios:
 * 1. Timer requirement (1 minute)
 * 2. Criteria requirement (3+ criteria adjusted)
 * 3. Mouse movement detection (all top bar zones)
 * 4. All blocking scenarios
 * 5. Different trigger zones
 * 6. Debugging logs verification
 * 7. Edge cases
 */

// Helper function to wait with console logging
async function waitWithLog(page: any, seconds: number, reason: string) {
  console.log(`⏳ Waiting ${seconds}s: ${reason}`);
  await page.waitForTimeout(seconds * 1000);
}

// Helper function to get bumper state from page
async function getBumperState(page: any) {
  return await page.evaluate(() => {
    try {
      const { getUnifiedBumperState } = require('../src/ppm-tool/shared/utils/unifiedBumperState');
      return getUnifiedBumperState();
    } catch (e) {
      return null;
    }
  });
}

// Helper function to adjust criteria (adjust 3+ criteria sliders)
async function adjustCriteria(page: any, count: number = 3) {
  console.log(`📊 Adjusting ${count} criteria sliders...`);
  
  // Find all criteria sliders
  const sliders = await page.locator('[role="slider"]').all();
  
  if (sliders.length < count) {
    console.warn(`⚠️ Only ${sliders.length} sliders found, adjusting all available`);
  }
  
  // Adjust first 'count' sliders
  for (let i = 0; i < Math.min(count, sliders.length); i++) {
    const slider = sliders[i];
    const box = await slider.boundingBox();
    if (box) {
      // Move slider to value 4 (not default 3)
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
      await page.mouse.up();
      await page.waitForTimeout(200); // Small delay between adjustments
    }
  }
  
  console.log(`✅ Adjusted ${Math.min(count, sliders.length)} criteria`);
}

// Helper function to collect console logs
async function collectConsoleLogs(page: any, filter: string = 'EXIT_INTENT_DEBUG') {
  const logs: string[] = [];
  const handler = (msg: any) => {
    const text = msg.text();
    if (text.includes(filter)) {
      logs.push(text);
      console.log(`📝 [CONSOLE] ${text}`);
    }
  };
  page.on('console', handler);
  return { logs, removeHandler: () => page.removeListener('console', handler) };
}

test.describe('Exit Intent Bumper - Comprehensive Test Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport (not mobile)
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Clear localStorage to reset state
    await page.goto('http://localhost:3000/ppm-tool');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.waitForLoadState('networkidle');
    console.log('🧹 Reset state - fresh test starting');
  });

  test.describe('Scenario 1: Timer Requirement (1 Minute)', () => {
    
    test('Should NOT trigger before 1 minute passes', async ({ page }) => {
      test.setTimeout(90000); // 90 seconds
      
      console.log('📋 Test: Exit Intent should NOT trigger before 1 minute');
      
      const { logs } = await collectConsoleLogs(page);
      
      // Adjust 3 criteria
      await adjustCriteria(page, 3);
      await waitWithLog(page, 2, 'After criteria adjustment');
      
      // Move mouse to top bar area (should trigger detection)
      await page.mouse.move(960, 50); // Top center area
      await waitWithLog(page, 2, 'Mouse in top bar zone');
      
      // Wait 30 seconds (less than 1 minute)
      await waitWithLog(page, 30, 'Waiting 30 seconds (less than 1 minute)');
      
      // Exit Intent should NOT be visible
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report|Free Comparison Report/i })
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(false);
      console.log('✅ PASS: Exit Intent correctly blocked - timer not met');
      
      // Verify debug logs show timer check
      const timerLogs = logs.filter(log => log.includes('Timer Check'));
      expect(timerLogs.length).toBeGreaterThan(0);
      console.log(`✅ PASS: Found ${timerLogs.length} timer check logs`);
    });
    
    test('Should trigger after 1 minute passes', async ({ page }) => {
      test.setTimeout(90000); // 90 seconds
      
      console.log('📋 Test: Exit Intent should trigger after 1 minute');
      
      const { logs } = await collectConsoleLogs(page);
      
      // Adjust 3 criteria
      await adjustCriteria(page, 3);
      await waitWithLog(page, 2, 'After criteria adjustment');
      
      // Wait for initial timer (10s) + mouse movement timer (3s)
      await waitWithLog(page, 13, 'Initial timers');
      
      // Move mouse to top bar area
      await page.mouse.move(960, 50); // Top center area
      await waitWithLog(page, 1, 'Mouse in top bar zone');
      
      // Wait remaining time to reach 1 minute total
      const elapsed = Date.now();
      const remaining = Math.max(0, 60000 - 13000); // 60s - 13s already waited
      console.log(`⏳ Waiting ${Math.ceil(remaining/1000)}s more to reach 1min total...`);
      await page.waitForTimeout(remaining + 2000); // +2s buffer
      
      // Exit Intent should be visible
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report|Free Comparison Report/i })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(true);
      console.log('✅ PASS: Exit Intent triggered after 1 minute');
      
      // Verify debug logs
      const triggerLogs = logs.filter(log => log.includes('TRIGGERING'));
      expect(triggerLogs.length).toBeGreaterThan(0);
      console.log(`✅ PASS: Found trigger logs: ${triggerLogs.length}`);
    });
  });

  test.describe('Scenario 2: Criteria Requirement (3+ Criteria)', () => {
    
    test('Should NOT trigger with less than 3 criteria adjusted', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Exit Intent should NOT trigger with <3 criteria');
      
      const { logs } = await collectConsoleLogs(page);
      
      // Adjust only 2 criteria (not enough)
      await adjustCriteria(page, 2);
      await waitWithLog(page, 2, 'After criteria adjustment');
      
      // Wait 1 minute
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // Move mouse to top bar area
      await page.mouse.move(960, 50);
      await waitWithLog(page, 2, 'Mouse in top bar zone');
      
      // Exit Intent should NOT be visible
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(false);
      console.log('✅ PASS: Exit Intent correctly blocked - not enough criteria');
      
      // Verify logs show blocked reason
      const blockedLogs = logs.filter(log => 
        log.includes('Not setting timeout') || 
        log.includes('Not enough criteria adjusted')
      );
      expect(blockedLogs.length).toBeGreaterThan(0);
      console.log(`✅ PASS: Found ${blockedLogs.length} blocking reason logs`);
    });
    
    test('Should trigger with exactly 3 criteria adjusted', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Exit Intent should trigger with 3 criteria');
      
      // Adjust exactly 3 criteria
      await adjustCriteria(page, 3);
      await waitWithLog(page, 2, 'After criteria adjustment');
      
      // Wait for timers
      await waitWithLog(page, 13, 'Initial timers');
      
      // Wait to 1 minute total
      await waitWithLog(page, 47, 'Waiting to 1 minute total');
      
      // Move mouse to top bar area
      await page.mouse.move(960, 50);
      await waitWithLog(page, 2, 'Mouse in top bar zone');
      
      // Exit Intent should be visible
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(true);
      console.log('✅ PASS: Exit Intent triggered with 3 criteria');
    });
  });

  test.describe('Scenario 3: Mouse Movement Detection Zones', () => {
    
    test('Top Bar Zone - Entire top area should trigger', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Top bar zone (entire top area) should trigger');
      
      const { logs } = await collectConsoleLogs(page);
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // Move mouse to top center (top bar zone)
      await page.mouse.move(960, 50); // Top center
      await waitWithLog(page, 1, 'Mouse in top bar zone');
      
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(true);
      console.log('✅ PASS: Top bar zone triggered Exit Intent');
      
      // Verify zone detection logs
      const zoneLogs = logs.filter(log => log.includes('top-bar') || log.includes('Active Zones'));
      expect(zoneLogs.length).toBeGreaterThan(0);
      console.log(`✅ PASS: Found ${zoneLogs.length} zone detection logs`);
    });
    
    test('Top-Right Corner Zone - X button area should trigger', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Top-right corner (X button) should trigger');
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // Move mouse to top-right corner (X button area)
      const viewport = page.viewportSize();
      await page.mouse.move((viewport?.width || 1920) - 50, 50); // Top-right
      await waitWithLog(page, 1, 'Mouse in top-right corner');
      
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(true);
      console.log('✅ PASS: Top-right corner triggered Exit Intent');
    });
    
    test('Top-Left Corner Zone - Menu/new tab area should trigger', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Top-left corner (menu/new tab) should trigger');
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // Move mouse to top-left corner
      await page.mouse.move(50, 50); // Top-left
      await waitWithLog(page, 1, 'Mouse in top-left corner');
      
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(true);
      console.log('✅ PASS: Top-left corner triggered Exit Intent');
    });
    
    test('Rapid Upward Movement - Moving toward top bar should trigger', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Rapid upward movement should trigger');
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // Start mouse at bottom, move rapidly upward
      const viewport = page.viewportSize();
      await page.mouse.move(960, (viewport?.height || 1080) - 100); // Bottom
      await page.waitForTimeout(100);
      await page.mouse.move(960, 100); // Rapid move to top
      await waitWithLog(page, 1, 'Rapid upward movement');
      
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(true);
      console.log('✅ PASS: Rapid upward movement triggered Exit Intent');
    });
  });

  test.describe('Scenario 4: Permanent Blocking Scenarios', () => {
    
    test('Should NOT trigger after Comparison Report closed (permanent block)', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Exit Intent permanently blocked after CR closed');
      
      const { logs } = await collectConsoleLogs(page);
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 2, 'After criteria adjustment');
      
      // Open Comparison Report
      const reportButton = page.locator('button').filter({ hasText: /Get.*Report|Comparison Report/i }).first();
      if (await reportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await reportButton.click();
        await waitWithLog(page, 1, 'Comparison Report opened');
        
        // Close Comparison Report
        const closeButton = page.locator('button').filter({ hasText: /Close|×|X/i }).first();
        await closeButton.click();
        await waitWithLog(page, 1, 'Comparison Report closed');
      }
      
      // Wait 1 minute
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // Move mouse to top bar
      await page.mouse.move(960, 50);
      await waitWithLog(page, 2, 'Mouse in top bar zone');
      
      // Exit Intent should NOT be visible (permanently blocked)
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(false);
      console.log('✅ PASS: Exit Intent permanently blocked after CR closed');
      
      // Verify permanent block logs
      const blockLogs = logs.filter(log => 
        log.includes('PERMANENTLY DISABLED') || 
        log.includes('Comparison Report was closed')
      );
      expect(blockLogs.length).toBeGreaterThan(0);
      console.log(`✅ PASS: Found ${blockLogs.length} permanent block logs`);
    });
    
    test('Should NOT trigger after Guided Rankings clicked (permanent block)', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Exit Intent permanently blocked after GR clicked');
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 2, 'After criteria adjustment');
      
      // Click Guided Rankings button
      const guidedButton = page.locator('button').filter({ hasText: /Guided|Ranking/i }).first();
      if (await guidedButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await guidedButton.click();
        await waitWithLog(page, 1, 'Guided Rankings opened');
        
        // Close Guided Rankings
        const closeButton = page.locator('button').filter({ hasText: /Close|×|X/i }).first();
        await closeButton.click();
        await waitWithLog(page, 1, 'Guided Rankings closed');
      }
      
      // Wait 1 minute
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // Move mouse to top bar
      await page.mouse.move(960, 50);
      await waitWithLog(page, 2, 'Mouse in top bar zone');
      
      // Exit Intent should NOT be visible (permanently blocked)
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(false);
      console.log('✅ PASS: Exit Intent permanently blocked after GR clicked');
    });
  });

  test.describe('Scenario 5: Temporary Blocking Scenarios', () => {
    
    test('Should NOT trigger when Guided Rankings is currently open', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Exit Intent blocked when GR is open');
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // Open Guided Rankings
      const guidedButton = page.locator('button').filter({ hasText: /Guided|Ranking/i }).first();
      if (await guidedButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await guidedButton.click();
        await waitWithLog(page, 1, 'Guided Rankings opened');
        
        // Move mouse to top bar while GR is open
        await page.mouse.move(960, 50);
        await waitWithLog(page, 2, 'Mouse in top bar zone while GR open');
        
        // Exit Intent should NOT be visible
        const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
          .filter({ hasText: /Get My Free Comparison Report/i })
          .isVisible({ timeout: 1000 })
          .catch(() => false);
        
        expect(exitIntentVisible).toBe(false);
        console.log('✅ PASS: Exit Intent blocked when GR is open');
      }
    });
    
    test('Should NOT trigger when Comparison Report is currently open', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Exit Intent blocked when CR is open');
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // Open Comparison Report
      const reportButton = page.locator('button').filter({ hasText: /Get.*Report|Comparison Report/i }).first();
      if (await reportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await reportButton.click();
        await waitWithLog(page, 1, 'Comparison Report opened');
        
        // Move mouse to top bar while CR is open
        await page.mouse.move(960, 50);
        await waitWithLog(page, 2, 'Mouse in top bar zone while CR open');
        
        // Exit Intent should NOT be visible
        const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
          .filter({ hasText: /Get My Free Comparison Report/i })
          .isVisible({ timeout: 1000 })
          .catch(() => false);
        
        expect(exitIntentVisible).toBe(false);
        console.log('✅ PASS: Exit Intent blocked when CR is open');
      }
    });
  });

  test.describe('Scenario 6: Debugging Logs Verification', () => {
    
    test('Console logs should show all debug information', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Verify debugging logs are present');
      
      const { logs } = await collectConsoleLogs(page);
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 10, 'Initial wait');
      
      // Move mouse around to trigger logs
      await page.mouse.move(960, 50); // Top bar
      await waitWithLog(page, 1, 'Mouse in top bar');
      await page.mouse.move(960, 200); // Move down
      await waitWithLog(page, 1, 'Mouse moved down');
      await page.mouse.move(960, 50); // Back to top bar
      await waitWithLog(page, 2, 'Mouse back in top bar');
      
      // Check that debug logs were captured
      expect(logs.length).toBeGreaterThan(0);
      console.log(`✅ PASS: Found ${logs.length} debug log messages`);
      
      // Verify specific log types
      const hasMousePosition = logs.some(m => m.includes('Mouse Position'));
      const hasActiveZones = logs.some(m => m.includes('Active Zones'));
      const hasTimerCheck = logs.some(m => m.includes('Timer Check'));
      const hasShouldShow = logs.some(m => m.includes('Should Show Check'));
      
      console.log('📊 Log Type Verification:');
      console.log(`  - Mouse Position: ${hasMousePosition ? '✅' : '❌'}`);
      console.log(`  - Active Zones: ${hasActiveZones ? '✅' : '❌'}`);
      console.log(`  - Timer Check: ${hasTimerCheck ? '✅' : '❌'}`);
      console.log(`  - Should Show Check: ${hasShouldShow ? '✅' : '❌'}`);
      
      expect(hasMousePosition).toBe(true);
      expect(hasActiveZones).toBe(true);
      expect(hasTimerCheck).toBe(true);
      expect(hasShouldShow).toBe(true);
      
      console.log('✅ PASS: All expected debug log types present');
      console.log('📋 Log Summary (first 10):');
      logs.slice(0, 10).forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.substring(0, 150)}...`);
      });
    });
  });

  test.describe('Scenario 7: Edge Cases', () => {
    
    test('Should handle rapid mouse movement correctly', async ({ page }) => {
      test.setTimeout(90000);
      
      console.log('📋 Test: Rapid mouse movement handling');
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // Rapidly move mouse in and out of top bar zone
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(960, 50); // Top bar
        await page.waitForTimeout(100);
        await page.mouse.move(960, 500); // Middle
        await page.waitForTimeout(100);
      }
      
      // Final move to top bar
      await page.mouse.move(960, 50);
      await waitWithLog(page, 1, 'Final move to top bar');
      
      // Exit Intent should still trigger
      const exitIntentVisible = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      expect(exitIntentVisible).toBe(true);
      console.log('✅ PASS: Exit Intent triggered after rapid movement');
    });
    
    test('Should NOT trigger twice (already shown)', async ({ page }) => {
      test.setTimeout(120000);
      
      console.log('📋 Test: Exit Intent should not trigger twice');
      
      await adjustCriteria(page, 3);
      await waitWithLog(page, 65, 'Waiting 1 minute');
      
      // First trigger
      await page.mouse.move(960, 50);
      await waitWithLog(page, 2, 'Mouse in top bar zone');
      
      const exitIntentVisible1 = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      expect(exitIntentVisible1).toBe(true);
      console.log('✅ First trigger successful');
      
      // Close Exit Intent
      const closeButton = page.locator('button').filter({ hasText: /Close|×|X/i }).first();
      await closeButton.click();
      await waitWithLog(page, 1, 'Exit Intent closed');
      
      // Try to trigger again
      await page.mouse.move(960, 50);
      await waitWithLog(page, 2, 'Mouse in top bar zone again');
      
      // Exit Intent should NOT appear again
      const exitIntentVisible2 = await page.locator('[role="dialog"][aria-modal="true"]')
        .filter({ hasText: /Get My Free Comparison Report/i })
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      
      expect(exitIntentVisible2).toBe(false);
      console.log('✅ PASS: Exit Intent correctly blocked from showing twice');
    });
  });
});
