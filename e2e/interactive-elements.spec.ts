import { test, expect } from '@playwright/test';

test.describe('Interactive Elements - Cross Browser Compatibility', () => {
  test('Navigation links work correctly', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test main navigation links
    const homeLink = page.getByRole('link', { name: 'Home' }).first();
    if (await homeLink.isVisible()) {
      await expect(homeLink).toBeVisible();
      await expect(homeLink).toHaveAttribute('href', '/');
    }
    
    const aboutLink = page.getByRole('link', { name: 'About' }).first();
    if (await aboutLink.isVisible()) {
      await expect(aboutLink).toBeVisible();
      await expect(aboutLink).toHaveAttribute('href', '/about');
    }
    
    const offeringsLink = page.getByRole('link', { name: 'Offerings' }).first();
    if (await offeringsLink.isVisible()) {
      await expect(offeringsLink).toBeVisible();
      await expect(offeringsLink).toHaveAttribute('href', '/offerings');
    }
    
    const contactLink = page.getByRole('link', { name: 'Contact' }).first();
    if (await contactLink.isVisible()) {
      await expect(contactLink).toBeVisible();
      await expect(contactLink).toHaveAttribute('href', '/contact');
    }
  });

  test('Buttons are clickable and properly styled', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find CTA buttons
    const ctaButtons = page.locator('button, a[role="button"]').filter({
      hasText: /Book|Call|Contact|Get Started|Learn More/i
    });
    
    const buttonCount = await ctaButtons.count();
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = ctaButtons.nth(i);
      if (await button.isVisible()) {
        // Check button is clickable
        await expect(button).toBeVisible();
        await expect(button).toBeEnabled();
        
        // Check button has proper cursor
        const cursor = await button.evaluate((el) => 
          window.getComputedStyle(el).cursor
        );
        expect(cursor).toBe('pointer');
        
        // Check button has proper styling (not transparent)
        const opacity = await button.evaluate((el) => 
          window.getComputedStyle(el).opacity
        );
        expect(parseFloat(opacity)).toBeGreaterThan(0.5);
      }
    }
  });

  test('PPM Tool interactive elements work correctly', async ({ page, browserName }) => {
    await page.goto('/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Check Guided Rankings button
    const guidedButton = page.getByRole('button', { name: /Guided Rankings/i });
    if (await guidedButton.isVisible()) {
      await expect(guidedButton).toBeVisible();
      await expect(guidedButton).toBeEnabled();
      
      // Test click (should not throw error)
      await guidedButton.click();
      await page.waitForTimeout(1000); // Allow for any modal/overlay to appear
    }
    
    // Check Chart Comparison button
    const chartButton = page.getByRole('button', { name: /Chart Comparison/i });
    if (await chartButton.isVisible()) {
      await expect(chartButton).toBeVisible();
      await expect(chartButton).toBeEnabled();
    }
    
    // Check How It Works button
    const howItWorksButton = page.getByRole('button', { name: /How It Works/i });
    if (await howItWorksButton.isVisible()) {
      await expect(howItWorksButton).toBeVisible();
      await expect(howItWorksButton).toBeEnabled();
    }
    
    // Check filter buttons if present
    const filterButton = page.getByRole('button', { name: /Filter/i }).first();
    if (await filterButton.isVisible()) {
      await expect(filterButton).toBeVisible();
      await expect(filterButton).toBeEnabled();
    }
    
    // Check tool cards are interactive
    const toolCards = page.locator('[data-testid*="tool"], .tool-card, [class*="tool"]').filter({
      hasText: /Smartsheet|Airtable|Monday|ClickUp|Asana/i
    });
    
    const cardCount = await toolCards.count();
    if (cardCount > 0) {
      const firstCard = toolCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check card has hover effects
      await firstCard.hover();
      await page.waitForTimeout(500);
      
      // Should not have pointer-events: none
      const pointerEvents = await firstCard.evaluate((el) => 
        window.getComputedStyle(el).pointerEvents
      );
      expect(pointerEvents).not.toBe('none');
    }
  });

  test('Forms work correctly', async ({ page, browserName }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    // Look for contact form elements
    const nameInput = page.getByRole('textbox', { name: /name/i }).first();
    const emailInput = page.getByRole('textbox', { name: /email/i }).first();
    const companyInput = page.getByRole('textbox', { name: /company/i }).first();
    const messageInput = page.getByRole('textbox', { name: /message/i }).first();
    const submitButton = page.getByRole('button', { name: /submit|send/i }).first();
    
    // Check if form exists and test validation behavior
    if (await submitButton.isVisible()) {
      await expect(submitButton).toBeVisible();
      
      // Submit button should start disabled (correct behavior for form validation)
      await expect(submitButton).toBeDisabled();
      
      // Fill form if inputs exist
      let formFilled = true;
      
      if (await nameInput.isVisible()) {
        await expect(nameInput).toBeVisible();
        await expect(nameInput).toBeEditable();
        await nameInput.fill('Test User');
      } else {
        formFilled = false;
      }
      
      if (await emailInput.isVisible()) {
        await expect(emailInput).toBeVisible();
        await expect(emailInput).toBeEditable();
        await emailInput.fill('test@example.com');
      } else {
        formFilled = false;
      }
      
      if (await companyInput.isVisible()) {
        await expect(companyInput).toBeVisible();
        await expect(companyInput).toBeEditable();
        await companyInput.fill('Test Company');
      } else {
        formFilled = false;
      }
      
      if (await messageInput.isVisible()) {
        await expect(messageInput).toBeVisible();
        await expect(messageInput).toBeEditable();
        await messageInput.fill('Test message');
      } else {
        formFilled = false;
      }
      
      // After filling all required fields, button should become enabled
      if (formFilled) {
        await expect(submitButton).toBeEnabled();
      }
    }
  });

  test('Tooltips and hover effects work properly', async ({ page, browserName, isMobile }) => {
    // Skip hover tests on mobile devices
    if (isMobile) {
      test.skip('Skipping hover tests on mobile');
    }
    
    await page.goto('/ppm-tool');
    await page.waitForLoadState('networkidle');
    
    // Test tooltip functionality
    const infoButtons = page.getByRole('button', { name: /More information/i });
    const buttonCount = await infoButtons.count();
    
    if (buttonCount > 0) {
      const firstInfoButton = infoButtons.first();
      await expect(firstInfoButton).toBeVisible();
      
      // Hover over info button
      await firstInfoButton.hover();
      await page.waitForTimeout(1000);
      
      // Check if tooltip appeared
      const tooltip = page.getByRole('tooltip').first();
      if (await tooltip.isVisible({ timeout: 2000 })) {
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toHaveText(/.+/); // Should have some text
      }
    }
    
    // Test general hover effects on interactive elements
    const hoverableElements = page.locator('button:visible, a:visible, [role="button"]:visible').first();
    if (await hoverableElements.count() > 0) {
      const element = hoverableElements.first();
      
      // Get initial styles
      const initialTransform = await element.evaluate((el) => 
        window.getComputedStyle(el).transform
      );
      
      // Hover and check for changes
      await element.hover();
      await page.waitForTimeout(500);
      
      // Element should still be visible and interactable
      await expect(element).toBeVisible();
      
      const pointerEvents = await element.evaluate((el) => 
        window.getComputedStyle(el).pointerEvents
      );
      expect(pointerEvents).not.toBe('none');
    }
  });
});
