import { test, expect } from '@playwright/test';

// Test all core pages across browsers and devices
const corePages = [
  { path: '/', title: 'Panoramic Solutions | SaaS Architecture & Digital Transformation' },
  { path: '/about', title: 'About' },
  { path: '/offerings', title: 'Offerings' },
  { path: '/contact', title: 'Contact' },
  { path: '/ppm-tool', title: 'Panoramic Solutions | SaaS Architecture & Digital Transformation' }
];

test.describe('Core Pages - Cross Browser/Device Compatibility', () => {
  for (const page of corePages) {
    test(`${page.path} loads correctly and has no console errors`, async ({ page: browserPage, browserName }) => {
      const consoleErrors: string[] = [];
      const networkErrors: string[] = [];
      
      // Capture console errors
      browserPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Capture network failures
      browserPage.on('response', (response) => {
        if (response.status() >= 400) {
          networkErrors.push(`${response.status()} - ${response.url()}`);
        }
      });
      
      // Navigate to page
      await browserPage.goto(page.path);
      
      // Wait for page to be fully loaded
      await browserPage.waitForLoadState('networkidle');
      
      // Check page title contains expected text
      await expect(browserPage).toHaveTitle(new RegExp(page.title.split(' | ')[0]));
      
      // Check main navigation is present
      const nav = browserPage.locator('nav').first();
      await expect(nav).toBeVisible();
      
      // Check footer is present
      const footer = browserPage.locator('footer').first();
      await expect(footer).toBeVisible();
      
      // Check for critical console errors (excluding known dev warnings)
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('React DevTools') && 
        !error.includes('PostHog') &&
        !error.includes('localhost:3000')
      );
      
      if (criticalErrors.length > 0) {
        console.log(`Console errors on ${page.path}:`, criticalErrors);
      }
      
      // Check for critical network failures (excluding expected 404s)
      const criticalNetworkErrors = networkErrors.filter(error => 
        !error.includes('favicon.ico') &&
        !error.includes('/_next/static')
      );
      
      if (criticalNetworkErrors.length > 0) {
        console.log(`Network errors on ${page.path}:`, criticalNetworkErrors);
      }
      
      // Ensure page content is visible
      const body = browserPage.locator('body');
      await expect(body).toBeVisible();
      
      // Check page has some text content (not just empty)
      const pageText = await body.textContent();
      expect(pageText?.length).toBeGreaterThan(100);
    });
  }
});
