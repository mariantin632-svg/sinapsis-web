import { test, expect } from '@playwright/test';

test.describe('Link "Qué tratamos" — nav interior, header home y footer', () => {
  test('nav interior (desktop) de una página interior tiene el link y navega', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('body > nav').first();
    const link = nav.locator('a', { hasText: 'Qué tratamos' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/que-tratamos');

    await link.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/que-tratamos\/?$/);

    // Y queda marcado como activo en la píldora al estar parado en /que-tratamos
    const navEnDestino = page.locator('body > nav').first();
    await expect(navEnDestino.locator('a[aria-current="page"]')).toHaveText('Qué tratamos');
  });

  test('nav interior (mobile) tiene el link en el menú fullscreen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');

    await page.locator('button[data-nav-menu-toggle]').first().click();
    const menu = page.locator('#nav-menu-mobile');
    await expect(menu).toBeVisible();
    await expect(menu.locator('a', { hasText: 'Qué tratamos' })).toHaveAttribute('href', '/que-tratamos');
  });

  test('header integrado de la home tiene el link "Qué tratamos"', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header').first();
    const link = header.locator('a', { hasText: 'Qué tratamos' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/que-tratamos');
  });

  test('footer tiene el link "Qué tratamos" en servicios', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer').first();
    const link = footer.locator('a', { hasText: 'Qué tratamos' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/que-tratamos');
  });
});
