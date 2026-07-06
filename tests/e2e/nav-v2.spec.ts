import { test, expect } from '@playwright/test';

test.describe('Nav v2 — barra superior de páginas interiores', () => {
  test('desktop: píldora con página activa y CTAs', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('body > nav').first();
    await expect(nav.locator('a[aria-current="page"]')).toHaveText('FAQ');
    await expect(nav.locator('a', { hasText: 'Agendar turno' })).toHaveAttribute('href', /turnito\.app/);
    await expect(nav.locator('a[aria-label="Instagram de Sinapsis"]')).toBeVisible();

    expect(errors, `Errores de consola:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('mobile: hamburguesa abre y cierra el menú fullscreen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/equipo');
    await page.waitForLoadState('networkidle');

    const menu = page.locator('#nav-menu-mobile');
    await expect(menu).toBeHidden();

    await page.locator('button[data-nav-menu-toggle]').first().click();
    await expect(menu).toBeVisible();
    await expect(menu.locator('a', { hasText: 'Inicio' })).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/nav-v2-menu-mobile.png' });

    await menu.locator('button[data-nav-menu-toggle]').click();
    await expect(menu).toBeHidden();
  });
});
