import { test, expect } from '@playwright/test';

test.describe('Equipo v2 — página completa restyled', () => {
  test('renderiza los 4 perfiles con placas integradas y sin errores', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/equipo');
    await page.waitForLoadState('networkidle');

    // main h1: el dev toolbar de Astro inyecta h1 propios fuera de <main>
    await expect(page.locator('main h1')).toHaveText('Nuestro equipo profesional');

    // Un perfil por profesional, anclado por slug
    const perfiles = page.locator('article');
    await expect(perfiles).toHaveCount(4);
    for (const slug of ['martin-niro', 'dante-centellas', 'santiago-duhau', 'jimena-avalos']) {
      await expect(page.locator(`article#${slug}`)).toBeVisible();
    }

    // Placas de presentación integradas al perfil (no en sección aparte)
    await expect(page.locator('article#martin-niro img')).toHaveAttribute('src', '/equipo/presentacion-martin-niro.jpg');
    await expect(page.locator('article#santiago-duhau img')).toHaveAttribute('src', '/equipo/presentacion-santiago-duhau.jpg');
    await expect(page.locator('article#jimena-avalos img')).toHaveAttribute('src', '/equipo/presentacion-jimena-avalos.jpg');

    // Dante va sin foto a propósito: iniciales visibles, ningún <img>
    await expect(page.locator('article#dante-centellas img')).toHaveCount(0);
    await expect(page.locator('article#dante-centellas span', { hasText: 'DC' })).toBeVisible();

    // Las matrículas PLACEHOLDER no se muestran
    await expect(page.locator('body')).not.toContainText('PLACEHOLDER');

    // CTAs por perfil: turnito + WhatsApp
    for (const slug of ['martin-niro', 'dante-centellas', 'santiago-duhau', 'jimena-avalos']) {
      const perfil = page.locator(`article#${slug}`);
      await expect(perfil.locator('a', { hasText: 'Reservar turno' })).toHaveAttribute('href', /turnito\.app/);
      await expect(perfil.locator('a', { hasText: 'Consultar' })).toHaveAttribute('href', /wa\.me/);
    }

    await page.screenshot({
      path: 'tests/screenshots/equipo-v2.png',
      fullPage: true,
    });

    expect(errors, `Errores de consola en /equipo:\n${errors.join('\n')}`).toHaveLength(0);
  });
});
