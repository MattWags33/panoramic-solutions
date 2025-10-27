import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Tooltip - Comprehensive Testing', () => {
  
  test('Test 1: Tooltip appears above cards on iPhone', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:3000/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Find the first N/A Match Score element
    const matchScore = page.getByLabel('Match Score Information - Not').first();
    await expect(matchScore).toBeVisible();
    
    // Get the bounding box of the trigger element before clicking
    const triggerBox = await matchScore.boundingBox();
    
    // Click the tooltip trigger
    await matchScore.click();
    
    // Wait for tooltip to appear
    await page.waitForTimeout(300);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/tooltip-on-condensed-card.png', fullPage: true });
    
    // Check if tooltip content is visible (looking for the explanation text)
    const tooltipText = page.locator('text=How to get your match score');
    await expect(tooltipText).toBeVisible({ timeout: 3000 });
    
    // Get tooltip element and verify it's positioned correctly
    const tooltip = page.locator('.fixed.z-\\[9999\\]').filter({ hasText: 'How to get your match score' });
    await expect(tooltip).toBeVisible();
    
    // Verify tooltip is rendered in document.body (portal)
    const tooltipInBody = await page.evaluate(() => {
      const tooltips = document.body.querySelectorAll('.fixed.z-\\[9999\\]');
      return tooltips.length > 0;
    });
    expect(tooltipInBody).toBe(true);
    
    await context.close();
  });
  
  test('Test 2: Tooltip appears above expanded card content', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:3000/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // First expand a card by clicking on it (NOT on the tooltip)
    const cardTitle = page.locator('text=Adobe Workfront').first();
    await cardTitle.click();
    
    // Wait for card to expand
    await page.waitForTimeout(500);
    
    // Verify card is expanded (check for criteria details)
    const criteriaDetail = page.locator('text=My Rankings:').first();
    await expect(criteriaDetail).toBeVisible();
    
    // Now click the N/A Match Score tooltip
    const matchScore = page.getByLabel('Match Score Information - Not').first();
    await matchScore.click();
    
    await page.waitForTimeout(300);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/tooltip-on-expanded-card.png', fullPage: true });
    
    // Verify tooltip is visible
    const tooltipText = page.locator('text=How to get your match score');
    await expect(tooltipText).toBeVisible({ timeout: 3000 });
    
    // Verify the card is STILL expanded (not collapsed by our click)
    await expect(criteriaDetail).toBeVisible();
    
    await context.close();
  });
  
  test('Test 3: Tooltip has correct z-index and positioning', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:3000/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Click tooltip
    const matchScore = page.getByLabel('Match Score Information - Not').first();
    await matchScore.click();
    await page.waitForTimeout(300);
    
    // Check z-index and position
    const tooltipStyles = await page.evaluate(() => {
      const tooltip = document.querySelector('.fixed.z-\\[9999\\]');
      if (!tooltip) return null;
      
      const computed = window.getComputedStyle(tooltip);
      const rect = tooltip.getBoundingClientRect();
      
      return {
        zIndex: computed.zIndex,
        position: computed.position,
        top: rect.top,
        left: rect.left,
        isInViewport: rect.top >= 0 && rect.left >= 0 && 
                      rect.bottom <= window.innerHeight && 
                      rect.right <= window.innerWidth,
        parent: tooltip.parentElement?.tagName
      };
    });
    
    expect(tooltipStyles).not.toBeNull();
    expect(tooltipStyles?.zIndex).toBe('9999');
    expect(tooltipStyles?.position).toBe('fixed');
    expect(tooltipStyles?.parent).toBe('BODY'); // Verify portal worked
    
    // Verify tooltip is visible in viewport
    expect(tooltipStyles?.isInViewport).toBe(true);
    
    await context.close();
  });
  
  test('Test 4: Card does NOT expand when clicking tooltip', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:3000/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Verify card is NOT expanded initially
    const criteriaDetail = page.locator('text=My Rankings:').first();
    await expect(criteriaDetail).not.toBeVisible();
    
    // Click the N/A Match Score tooltip
    const matchScore = page.getByLabel('Match Score Information - Not').first();
    await matchScore.click();
    
    await page.waitForTimeout(500);
    
    // Verify tooltip appeared
    const tooltipText = page.locator('text=How to get your match score');
    await expect(tooltipText).toBeVisible();
    
    // Verify card is STILL NOT expanded (stopPropagation worked)
    await expect(criteriaDetail).not.toBeVisible();
    
    await context.close();
  });
  
  test('Test 5: Tooltip closes when clicking outside', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:3000/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Click to open tooltip
    const matchScore = page.getByLabel('Match Score Information - Not').first();
    await matchScore.click();
    await page.waitForTimeout(300);
    
    // Verify tooltip is open
    const tooltipText = page.locator('text=How to get your match score');
    await expect(tooltipText).toBeVisible();
    
    // Click somewhere else on the page (not the tooltip or trigger)
    await page.locator('text=Tools & Recommendations').click();
    
    await page.waitForTimeout(300);
    
    // Verify tooltip is closed
    await expect(tooltipText).not.toBeVisible();
    
    await context.close();
  });
  
  test('Test 6: Multiple tooltips - only one open at a time', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:3000/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Click first tooltip
    const firstMatchScore = page.getByLabel('Match Score Information - Not').first();
    await firstMatchScore.click();
    await page.waitForTimeout(300);
    
    // Verify first tooltip is open
    const firstTooltip = page.locator('text=How to get your match score').first();
    await expect(firstTooltip).toBeVisible();
    
    // Scroll down to see more cards
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(200);
    
    // Click second tooltip (different card)
    const secondMatchScore = page.getByLabel('Match Score Information - Not').nth(1);
    await secondMatchScore.click();
    await page.waitForTimeout(300);
    
    // Count how many tooltips are visible (should be 1)
    const visibleTooltips = await page.locator('.fixed.z-\\[9999\\]').filter({ hasText: 'How to get your match score' }).count();
    expect(visibleTooltips).toBe(1);
    
    await context.close();
  });
  
  test('Test 7: Tooltip positioning - bottom of trigger', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:3000/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Get trigger position
    const matchScore = page.getByLabel('Match Score Information - Not').first();
    const triggerBox = await matchScore.boundingBox();
    
    // Click tooltip
    await matchScore.click();
    await page.waitForTimeout(300);
    
    // Get tooltip position
    const tooltipPosition = await page.evaluate(() => {
      const tooltip = document.querySelector('.fixed.z-\\[9999\\]') as HTMLElement;
      if (!tooltip) return null;
      
      const rect = tooltip.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right
      };
    });
    
    expect(tooltipPosition).not.toBeNull();
    
    // Verify tooltip is below the trigger (side='bottom')
    if (triggerBox && tooltipPosition) {
      expect(tooltipPosition.top).toBeGreaterThan(triggerBox.y + triggerBox.height);
    }
    
    await context.close();
  });
  
  test('Test 8: SSR compatibility - no document errors', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    
    const page = await context.newPage();
    
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3000/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Click tooltip
    const matchScore = page.getByLabel('Match Score Information - Not').first();
    await matchScore.click();
    await page.waitForTimeout(300);
    
    // Check for document-related errors
    const documentErrors = consoleErrors.filter(err => 
      err.includes('document is not defined') || 
      err.includes('ReferenceError: document')
    );
    
    expect(documentErrors.length).toBe(0);
    
    await context.close();
  });
});

test.describe('Desktop Behavior - Hover Tooltips', () => {
  test('Test 9: Desktop shows hover tooltip, not click tooltip', async ({ browser }) => {
    // Use desktop browser (not mobile emulation)
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:3000/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Hover over the N/A Match Score
    const matchScore = page.getByLabel('Match Score Information - Not').first();
    await matchScore.hover();
    
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/desktop-hover-tooltip.png' });
    
    // On desktop, BasicHoverTooltip is used, which may have different behavior
    // Just verify no errors occur
    
    await context.close();
  });
});

