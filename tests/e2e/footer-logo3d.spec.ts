import { test, expect } from '@playwright/test';

// Logo 3D (footer y barra de arriba): carga perezosa de Three.js y caída al PNG cuando corresponde.
test.describe('Logo 3D del footer', () => {
  test('Three.js no entra en la carga inicial y el footer deja el PNG como respaldo', async ({ page }) => {
    // El chunk de la escena se pide recién después del evento load (barra) o al llegar al footer:
    // nunca como recurso de la carga inicial ni como modulepreload en el HTML.
    const antesDelLoad: string[] = [];
    let cargo = false;
    page.on('load', () => { cargo = true; });
    page.on('request', (r) => { if (!cargo) antesDelLoad.push(r.url()); });
    const respuesta = await page.goto('/');
    const html = (await respuesta?.text()) ?? '';
    expect(html).not.toContain('escena');
    expect(antesDelLoad.some((u) => u.includes('escena'))).toBe(false);

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
    await expect(page.locator('[data-variante="barra"]').first()).toHaveAttribute('data-logo3d', 'estatico');
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

  for (const path of ['/', '/equipo']) {
    test(`${path} — la barra de arriba carga el logo 3D sin esperar al scroll y sigue linkeando al inicio`, async ({ page }) => {
      const errores: string[] = [];
      page.on('pageerror', (e) => errores.push(e.message));
      await page.goto(path);
      const barra = page.locator('a[href="/"] [data-variante="barra"]').first();
      await expect(barra.locator('img')).toHaveAttribute('alt', /Sinapsis/);
      await expect
        .poll(async () => (await barra.getAttribute('data-logo3d')) ?? '', { timeout: 15_000 })
        .toMatch(/listo|estatico/);
      await barra.hover();
      await page.waitForTimeout(500);
      expect(errores).toEqual([]);
    });
  }
});
