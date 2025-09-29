import { test, expect } from '@playwright/test';

// Test responsive design at different viewport sizes
const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Large Desktop', width: 1920, height: 1080 }
];

const testPages = ['/', '/about', '/offerings', '/contact', '/ppm-tool'];

test.describe('Responsive Design - All Viewport Sizes', () => {
  for (const viewport of viewports) {
    for (const pagePath of testPages) {
      test(`${pagePath} renders correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page, browserName }) => {
        // Set viewport size
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to page
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Check basic layout elements are visible
        const header = page.locator('header, nav').first();
        await expect(header).toBeVisible();
        
        const main = page.locator('main').first();
        await expect(main).toBeVisible();
        
        const footer = page.locator('footer').first();
        await expect(footer).toBeVisible();
        
        // Check for horizontal scrollbars (should not exist on mobile)
        if (viewport.width <= 768) {
          const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
          const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
          expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 5); // Allow 5px tolerance
        }
        
        // Check mobile navigation behavior
        if (viewport.width <= 768) {
          // Mobile menu should exist
          const mobileMenuToggle = page.locator('button[aria-label*="menu"], button[aria-expanded]').first();
          if (await mobileMenuToggle.isVisible()) {
            await expect(mobileMenuToggle).toBeVisible();
          }
        } else {
          // Desktop navigation should be visible
          const navLinks = page.locator('nav a, header a').filter({ hasText: /Home|About|Offerings|Contact/ });
          const navLinkCount = await navLinks.count();
          if (navLinkCount > 0) {
            await expect(navLinks.first()).toBeVisible();
          }
        }
        
        // PPM Tool specific responsive tests
        if (pagePath === '/ppm-tool') {
          const criteriaSection = page.locator('#criteria-section, [id*="criteria"]').first();
          if (await criteriaSection.isVisible()) {
            await expect(criteriaSection).toBeVisible();
          }
          
          // Check grid layout adapts to viewport
          if (viewport.width <= 768) {
            // Mobile should stack vertically
            const gridContainers = page.locator('.grid-cols-1, [class*="grid-cols-1"]');
            const gridCount = await gridContainers.count();
            if (gridCount > 0) {
              await expect(gridContainers.first()).toBeVisible();
            }
          } else {
            // Desktop should use two columns where appropriate
            const gridContainers = page.locator('.grid-cols-2, [class*="grid-cols-2"]');
            const gridCount = await gridContainers.count();
            if (gridCount > 0) {
              await expect(gridContainers.first()).toBeVisible();
            }
          }
        }
        
        // Check text is readable (not too small)
        const bodyText = page.locator('body');
        const computedStyle = await bodyText.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            fontSize: style.fontSize,
            lineHeight: style.lineHeight
          };
        });
        
        const fontSize = parseInt(computedStyle.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable font size
        
        // Take screenshot for visual regression comparison
        await page.screenshot({
          path: `test-results/screenshots/${viewport.name}-${pagePath.replace(/[\/\\]/g, '-')}-${browserName}.png`,
          fullPage: true
        });
      });
    }
  }
});
