import { test, expect } from '@playwright/test';

// Logo 3D del footer: carga perezosa de Three.js y caída al PNG cuando corresponde.
test.describe('Logo 3D del footer', () => {
  test('no pide Three.js hasta llegar al footer y deja el PNG como respaldo', async ({ page }) => {
    const pedidos: string[] = [];
    page.on('request', (r) => pedidos.push(r.url()));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(pedidos.some((u) => u.includes('escena'))).toBe(false);

    const logo = page.locator('footer [data-logo3d]');
    await expect(logo.locator('img')).toHaveAttribute('alt', /Sinapsis/);

    await logo.scrollIntoViewIfNeeded();
    // Con WebGL pasa a "listo"; sin WebGL se queda "estatico" con el PNG visible
    await expect
      .poll(async () => (await logo.getAttribute('data-logo3d')) ?? '', { timeout: 15_000 })
      .toMatch(/listo|estatico/);
  });

  test('con "reducir movimiento" se queda el logo estático', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    const logo = page.locator('footer [data-logo3d]');
    await logo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await expect(logo).toHaveAttribute('data-logo3d', 'estatico');
    await expect(logo.locator('img')).toBeVisible();
    await ctx.close();
  });

  test('no genera scroll horizontal en celular', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.locator('footer [data-logo3d]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho).toBeLessThanOrEqual(375);
  });
});
