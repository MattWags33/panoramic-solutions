import { test, expect } from '@playwright/test';

/**
 * Debug test for Match Score Tooltip on Mobile Tool Cards
 * 
 * Issues to investigate:
 * 1. Tooltip click propagation to card expand button
 * 2. Tooltip positioning on mobile
 * 3. First-click reliability
 * 4. Z-index stacking issues
 */

test.describe('Match Score Tooltip - Mobile Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to PPM Tool page
    await page.goto('/ppm-tool');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should identify tooltip and expand button elements', async ({ page }) => {
    // Wait for tool cards to appear
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });
    
    // Find the first tool card with N/A Match Score
    const toolCard = page.locator('[class*="Card"]').first();
    
    // Log card structure
    console.log('=== CARD STRUCTURE ===');
    const cardHTML = await toolCard.innerHTML();
    console.log(cardHTML.substring(0, 500)); // First 500 chars
    
    // Find match score tooltip button
    const tooltipButton = toolCard.locator('button[aria-label="Match Score Information"]');
    const tooltipExists = await tooltipButton.count() > 0;
    console.log('\n=== TOOLTIP BUTTON ===');
    console.log('Exists:', tooltipExists);
    
    if (tooltipExists) {
      const tooltipBoundingBox = await tooltipButton.boundingBox();
      console.log('Position:', tooltipBoundingBox);
      console.log('Classes:', await tooltipButton.getAttribute('class'));
    }
    
    // Find expand button
    const expandButton = toolCard.locator('text=/View Details|Hide Details/').first();
    const expandExists = await expandButton.count() > 0;
    console.log('\n=== EXPAND BUTTON ===');
    console.log('Exists:', expandExists);
    
    if (expandExists) {
      const expandBoundingBox = await expandButton.boundingBox();
      console.log('Position:', expandBoundingBox);
    }
    
    // Check for click event handlers
    console.log('\n=== EVENT HANDLERS ===');
    const cardClickable = await toolCard.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    console.log('Card cursor style:', cardClickable);
  });

  test('should test tooltip click behavior', async ({ page }) => {
    // Wait for tool cards
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });
    
    const toolCard = page.locator('[class*="Card"]').first();
    const tooltipButton = toolCard.locator('button[aria-label="Match Score Information"]');
    
    // Check if card is initially collapsed
    const initialExpandedState = await toolCard.locator('text=/Hide Details/').count();
    console.log('\n=== INITIAL STATE ===');
    console.log('Card initially expanded:', initialExpandedState > 0);
    
    // Click the tooltip button
    console.log('\n=== CLICKING TOOLTIP BUTTON ===');
    await tooltipButton.click();
    
    // Wait a moment for any animations
    await page.waitForTimeout(500);
    
    // Check if tooltip appeared
    const tooltipVisible = await page.locator('.fixed.z-\\[9999\\]').count();
    console.log('Tooltip appeared:', tooltipVisible > 0);
    
    // Check if card expanded (this shouldn't happen)
    const cardExpandedAfterTooltip = await toolCard.locator('text=/Hide Details/').count();
    console.log('Card expanded after tooltip click:', cardExpandedAfterTooltip > 0);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/tooltip-after-click.png',
      fullPage: true 
    });
    
    // If tooltip is visible, check its position
    if (tooltipVisible > 0) {
      const tooltip = page.locator('.fixed.z-\\[9999\\]').first();
      const tooltipBox = await tooltip.boundingBox();
      const buttonBox = await tooltipButton.boundingBox();
      
      console.log('\n=== TOOLTIP POSITIONING ===');
      console.log('Tooltip position:', tooltipBox);
      console.log('Button position:', buttonBox);
      
      if (tooltipBox && buttonBox) {
        const distance = Math.abs(tooltipBox.y - buttonBox.y);
        console.log('Vertical distance from button:', distance, 'px');
        
        // Check if tooltip is centered on screen (bad) vs near button (good)
        const screenCenter = 375 / 2;
        const tooltipCenter = tooltipBox.x + tooltipBox.width / 2;
        const distanceFromCenter = Math.abs(tooltipCenter - screenCenter);
        console.log('Distance from screen center:', distanceFromCenter, 'px');
      }
    }
  });

  test('should test multiple clicks on tooltip', async ({ page }) => {
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });
    
    const toolCard = page.locator('[class*="Card"]').first();
    const tooltipButton = toolCard.locator('button[aria-label="Match Score Information"]');
    
    console.log('\n=== TESTING MULTIPLE CLICKS ===');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\nClick attempt ${i}:`);
      
      await tooltipButton.click();
      await page.waitForTimeout(300);
      
      const tooltipVisible = await page.locator('.fixed.z-\\[9999\\]').count();
      const cardExpanded = await toolCard.locator('text=/Hide Details/').count();
      
      console.log(`  - Tooltip visible: ${tooltipVisible > 0}`);
      console.log(`  - Card expanded: ${cardExpanded > 0}`);
      
      // Close tooltip if open by clicking outside
      if (tooltipVisible > 0) {
        await page.click('body', { position: { x: 10, y: 10 } });
        await page.waitForTimeout(200);
      }
    }
  });

  test('should inspect z-index stacking', async ({ page }) => {
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });
    
    const toolCard = page.locator('[class*="Card"]').first();
    const tooltipButton = toolCard.locator('button[aria-label="Match Score Information"]');
    
    // Click to open tooltip
    await tooltipButton.click();
    await page.waitForTimeout(500);
    
    // Check z-index values
    console.log('\n=== Z-INDEX ANALYSIS ===');
    
    const cardZIndex = await toolCard.evaluate((el) => {
      return {
        zIndex: window.getComputedStyle(el).zIndex,
        position: window.getComputedStyle(el).position,
        overflow: window.getComputedStyle(el).overflow
      };
    });
    console.log('Card styles:', cardZIndex);
    
    const tooltipExists = await page.locator('.fixed.z-\\[9999\\]').count();
    if (tooltipExists > 0) {
      const tooltip = page.locator('.fixed.z-\\[9999\\]').first();
      const tooltipZIndex = await tooltip.evaluate((el) => {
        return {
          zIndex: window.getComputedStyle(el).zIndex,
          position: window.getComputedStyle(el).position
        };
      });
      console.log('Tooltip styles:', tooltipZIndex);
      
      // Check if tooltip is actually visible (not covered)
      const isVisible = await tooltip.isVisible();
      console.log('Tooltip is visible:', isVisible);
      
      // Get computed styles that might affect visibility
      const opacity = await tooltip.evaluate((el) => window.getComputedStyle(el).opacity);
      const display = await tooltip.evaluate((el) => window.getComputedStyle(el).display);
      console.log('Tooltip opacity:', opacity);
      console.log('Tooltip display:', display);
    }
  });

  test('should test stopPropagation effectiveness', async ({ page }) => {
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });
    
    // Add event listeners to track propagation
    await page.evaluate(() => {
      const clicks: string[] = [];
      (window as any).clickLog = clicks;
      
      // Listen to all clicks on the document
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        clicks.push(`Click on: ${target.tagName} ${target.className}`);
      }, true);
    });
    
    const toolCard = page.locator('[class*="Card"]').first();
    const tooltipButton = toolCard.locator('button[aria-label="Match Score Information"]');
    
    // Click tooltip
    await tooltipButton.click();
    await page.waitForTimeout(500);
    
    // Get click log
    const clickLog = await page.evaluate(() => (window as any).clickLog);
    console.log('\n=== CLICK PROPAGATION LOG ===');
    console.log(clickLog);
  });
});

test.describe('Match Score Tooltip - Desktop Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/ppm-tool');
    await page.waitForLoadState('networkidle');
  });

  test('should test desktop hover behavior', async ({ page }) => {
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });
    
    const toolCard = page.locator('[class*="Card"]').first();
    const tooltipButton = toolCard.locator('button[aria-label="Match Score Information"]');
    
    console.log('\n=== DESKTOP HOVER TEST ===');
    
    // Hover over the tooltip button
    await tooltipButton.hover();
    await page.waitForTimeout(500); // Wait for tooltip delay
    
    // Check if tooltip appeared (should use BasicHoverTooltip on desktop)
    const tooltipVisible = await page.locator('[role="tooltip"]').count();
    console.log('Tooltip appeared on hover:', tooltipVisible > 0);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/tooltip-desktop-hover.png',
      fullPage: false 
    });
  });
});

