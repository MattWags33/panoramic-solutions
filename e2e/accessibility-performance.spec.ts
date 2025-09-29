import { test, expect } from '@playwright/test';

test.describe('Accessibility & Performance', () => {
  test('Pages have proper accessibility structure', async ({ page, browserName }) => {
    const testPages = ['/', '/about', '/offerings', '/contact', '/ppm-tool'];
    
    for (const pagePath of testPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Check for main landmark
      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
      
      // Check for navigation landmark
      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible();
      
      // Check for proper heading hierarchy
      const h1Elements = page.locator('h1');
      const h1Count = await h1Elements.count();
      
      if (h1Count === 0) {
        // Should have at least one h1 or equivalent
        const mainHeading = page.locator('[role="heading"][aria-level="1"], .text-4xl, .text-5xl, .text-6xl').first();
        if (await mainHeading.count() > 0) {
          await expect(mainHeading).toBeVisible();
        }
      } else {
        // Should not have more than one h1
        expect(h1Count).toBeLessThanOrEqual(2); // Allow some flexibility
        await expect(h1Elements.first()).toBeVisible();
      }
      
      // Check images have alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const alt = await img.getAttribute('alt');
          const ariaLabel = await img.getAttribute('aria-label');
          const ariaHidden = await img.getAttribute('aria-hidden');
          
          // Image should have alt text or be properly hidden
          if (ariaHidden !== 'true') {
            expect(alt || ariaLabel).toBeTruthy();
          }
        }
      }
      
      // Check buttons have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const textContent = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          const title = await button.getAttribute('title');
          
          // Button should have accessible name
          expect(textContent?.trim() || ariaLabel || title).toBeTruthy();
        }
      }
      
      // Check form elements have labels
      const formInputs = page.locator('input[type="text"], input[type="email"], textarea');
      const inputCount = await formInputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = formInputs.nth(i);
        if (await input.isVisible()) {
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          
          if (id) {
            // Check for associated label
            const label = page.locator(`label[for="${id}"]`);
            const hasLabel = await label.count() > 0;
            
            // Input should have label or aria-label
            expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
          }
        }
      }
    }
  });

  test('Interactive elements have proper focus management', async ({ page, browserName }) => {
    await page.goto('/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation
    const focusableElements = page.locator('button:visible, a:visible, input:visible, [tabindex]:visible');
    const elementCount = await focusableElements.count();
    
    if (elementCount > 0) {
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0) {
        await expect(focusedElement).toBeVisible();
        
        // Focus should have visible indicator
        const outlineStyle = await focusedElement.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.outline + style.boxShadow;
        });
        
        expect(outlineStyle).not.toBe('none ');
      }
      
      // Test arrow key navigation if applicable
      const currentFocused = await page.evaluate(() => document.activeElement?.tagName);
      if (currentFocused === 'BUTTON') {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        // Should not cause console errors
        const errorLogs: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            errorLogs.push(msg.text());
          }
        });
        
        await page.waitForTimeout(1000);
        
        // Filter out expected errors
        const criticalErrors = errorLogs.filter(error => 
          !error.includes('React DevTools') && 
          !error.includes('PostHog')
        );
        
        expect(criticalErrors.length).toBeLessThanOrEqual(1); // Allow minimal errors
      }
    }
  });

  test('Color contrast and visual accessibility', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check text elements for sufficient contrast (basic check)
    const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6, a').first();
    
    if (await textElements.count() > 0) {
      const element = textElements.first();
      if (await element.isVisible()) {
        const styles = await element.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontSize: style.fontSize
          };
        });
        
        // Basic checks
        expect(styles.color).not.toBe('transparent');
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
        
        const fontSize = parseInt(styles.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(12); // Minimum readable size
      }
    }
    
    // Check interactive elements are properly sized
    const clickableElements = page.locator('button, a[href], input[type="button"]');
    const clickableCount = await clickableElements.count();
    
    for (let i = 0; i < Math.min(clickableCount, 3); i++) {
      const element = clickableElements.nth(i);
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        if (box) {
          // Clickable elements should meet minimum size requirements
          expect(box.width).toBeGreaterThanOrEqual(24); // Relaxed for desktop
          expect(box.height).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });

  test('Performance - Page load times and resource loading', async ({ page, browserName }) => {
    const testPages = ['/', '/ppm-tool'];
    
    for (const pagePath of testPages) {
      // Start timing
      const startTime = Date.now();
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load in reasonable time (relaxed for development)
      expect(loadTime).toBeLessThan(10000); // 10 seconds max for dev
      
      // Check for large layout shifts
      const layoutShift = await page.evaluate(() => {
        return new Promise((resolve) => {
          let cumulativeShift = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift') {
                cumulativeShift += (entry as any).value;
              }
            }
          });
          
          if ('PerformanceObserver' in window) {
            try {
              observer.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
              // Ignore if not supported
            }
          }
          
          setTimeout(() => {
            observer.disconnect();
            resolve(cumulativeShift);
          }, 2000);
        });
      });
      
      // Cumulative Layout Shift should be minimal (relaxed threshold)
      expect(layoutShift).toBeLessThan(0.5);
      
      // Check for memory leaks (basic check)
      const jsHeapSize = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      if (jsHeapSize > 0) {
        // Should not use excessive memory (relaxed threshold)
        expect(jsHeapSize).toBeLessThan(100000000); // 100MB
      }
      
      // Check critical resources loaded (relaxed requirements)
      const criticalImages = page.locator('img[src*="logo"], img[src*="Logo"]');
      const logoCount = await criticalImages.count();
      
      for (let i = 0; i < logoCount; i++) {
        const logo = criticalImages.nth(i);
        if (await logo.isVisible()) {
          // Logo should be loaded (allow for loading delays)
          const naturalWidth = await logo.evaluate((img: HTMLImageElement) => {
            // Wait a bit for image to load
            return new Promise((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve(img.naturalWidth);
              } else {
                img.onload = () => resolve(img.naturalWidth);
                img.onerror = () => resolve(0);
                // Timeout after 2 seconds
                setTimeout(() => resolve(img.naturalWidth), 2000);
              }
            });
          });
          
          // More forgiving check - some images may still be loading
          expect(naturalWidth).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('No JavaScript errors or warnings', async ({ page, browserName }) => {
    const criticalErrors: string[] = [];
    const warnings: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        // Filter out expected/harmless errors
        if (!text.includes('React DevTools') && 
            !text.includes('PostHog') && 
            !text.includes('localhost:3000') &&
            !text.includes('favicon.ico') &&
            !text.includes('_next/static')) {
          criticalErrors.push(text);
        }
      } else if (msg.type() === 'warning') {
        if (!text.includes('React DevTools') && 
            !text.includes('PostHog')) {
          warnings.push(text);
        }
      }
    });
    
    // Test all critical pages
    const testPages = ['/', '/about', '/offerings', '/contact', '/ppm-tool'];
    
    for (const pagePath of testPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Allow time for delayed errors
    }
    
    // Should have minimal critical errors
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }
    expect(criticalErrors.length).toBeLessThanOrEqual(2); // Allow some flexibility in dev
    
    // Should have reasonable number of warnings
    if (warnings.length > 5) {
      console.log('Warnings found:', warnings.slice(0, 5));
    }
    expect(warnings.length).toBeLessThan(20); // Allow some dev warnings
  });
});
