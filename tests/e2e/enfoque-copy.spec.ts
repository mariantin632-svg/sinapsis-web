import { test, expect } from '@playwright/test';

test.describe('EnfoqueCards — copy actualizado en "Nuestro enfoque"', () => {
  test('la card "Atención humanizada" muestra el copy nuevo, sin errores de consola', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('Nuestro enfoque');
    await expect(
      page.locator('body')
    ).toContainText('Atención personalizada, con seguimiento real de tu evolución.');

    // El copy viejo ya no debe estar
    await expect(page.locator('body')).not.toContainText('Sesiones uno a uno');

    const card = page.locator('h3', { hasText: 'Atención humanizada' }).locator('..');
    await expect(card).toBeVisible();

    // La sección usa scroll-reveal (opacity 0 -> 1 via IntersectionObserver).
    // Se scrollea a la vista real para que el screenshot muestre el estado
    // final que ve un usuario, no el frame intermedio de la animación.
    const section = page.locator('main > section', { hasText: 'Nuestro enfoque' });
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveClass(/is-visible/);
    await page.waitForTimeout(800); // deja terminar la transición de 0.7s

    await section.screenshot({
      path: 'tests/screenshots/enfoque-copy.png',
    });

    expect(errors, `Errores de consola en /:\n${errors.join('\n')}`).toHaveLength(0);
  });
});
