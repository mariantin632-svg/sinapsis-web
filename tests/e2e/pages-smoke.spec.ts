import { test, expect } from '@playwright/test';

test('home loads with H1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Sinapsis');
});
