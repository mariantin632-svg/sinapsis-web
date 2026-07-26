import { test, expect } from '@playwright/test';

test.describe('Planes — escalera de menos a más', () => {
  test('la grilla arranca por el plan más barato y termina en el más caro', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/planes');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[data-plan-item]');
    await expect(cards).toHaveCount(8);
    await expect(cards.first()).toContainText('KINE 10');
    await expect(cards.first()).toContainText('$252.000');
    await expect(cards.last()).toContainText('PREMIER OSTEO');
    await expect(cards.last()).toContainText('$1.799.000');

    expect(errors, `Errores de consola:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('las cards con dos duraciones entran por la semestral', async ({ page }) => {
    await page.goto('/planes');
    await page.waitForLoadState('networkidle');

    const premierKine = page.locator('[data-plan-item]', { hasText: 'PREMIER KINE' }).first();
    const visible = premierKine.locator('[data-plan-precio]:not(.hidden)');

    await expect(visible).toContainText('Desde');
    await expect(visible).toContainText('$599.000');
  });

  test('el toggle de duración cambia el precio a la anual', async ({ page }) => {
    await page.goto('/planes');
    await page.waitForLoadState('networkidle');

    const premierKine = page.locator('[data-plan-item]', { hasText: 'PREMIER KINE' }).first();
    await premierKine.locator('[data-plan-toggle] button', { hasText: '12 meses' }).click();

    const visible = premierKine.locator('[data-plan-precio]:not(.hidden)');
    await expect(visible).toContainText('$1.049.000');
    await expect(visible).toContainText('Total');
    await expect(visible).not.toContainText('$599.000');
  });

  test('ningun plan promete un ahorro que no existe', async ({ page }) => {
    await page.goto('/planes');
    await page.waitForLoadState('networkidle');

    // PREMIER OSTEO: 48 osteo sueltas son $2.400.000, el plan sale $1.799.000.
    // El 25% es real, va como % off.
    const premierOsteo = page.locator('[data-plan-item]', { hasText: 'PREMIER OSTEO' }).first();
    await expect(premierOsteo).toContainText('25% off');

    // OSTEO MANTENIMIENTO: contra 24 osteo sueltas el ahorro es de apenas 8%,
    // no da para mostrarlo como descuento. Va el anclaje anti-inflación.
    const osteoMant = page.locator('[data-plan-item]', { hasText: 'OSTEO MANTENIMIENTO' }).first();
    await expect(osteoMant).toContainText('Sin aumentos por 12 meses');
    await expect(osteoMant).not.toContainText('% off');
  });
});
