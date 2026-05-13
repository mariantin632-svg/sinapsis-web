import { test, expect } from '@playwright/test';

test('home loads with 200, correct title, H1 and styled Tailwind class', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);

  await expect(page).toHaveTitle(/Sinapsis/);

  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible();
  await expect(h1).toContainText('Tu cuerpo en las mejores manos');

  // Validates the full Tailwind 4 / Vite plugin / @theme chain:
  await expect(h1).toHaveCSS('color', 'rgb(26, 14, 61)');
  await expect(h1).toHaveCSS('font-weight', '700');
});
