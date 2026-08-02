import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { width: 375, height: 812, name: '375' },
  { width: 768, height: 1024, name: '768' },
  { width: 1440, height: 900, name: '1440' },
];

test.describe('/que-tratamos/esguince-de-tobillo — detalle', () => {
  test('carga sin errores de consola en 375/768/1440, con screenshots', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    const response = await page.goto('/que-tratamos/esguince-de-tobillo');
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main h1')).toHaveText('Esguince de tobillo');

    // Idem home: scroll-reveal via IntersectionObserver. Se simula scroll real
    // para que el fullPage screenshot muestre el estado final, no el inicial.
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < scrollHeight; y += 300) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(400);
    // Volver arriba antes de las capturas: si queda scrolleado, el nav
    // sticky se captura "pegado" en medio de la imagen fullPage en vez
    // de en la posición real (artefacto de la propia mecánica de captura,
    // no del sitio).
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.screenshot({
        path: `tests/screenshots/que-tratamos-esguince-${vp.name}.png`,
        fullPage: true,
      });
    }

    expect(pageErrors, `Errores de JS:\n${pageErrors.join('\n')}`).toHaveLength(0);
    expect(errors, `Errores de consola:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('secciones de contenido: chips, razones, señales de alarma, fases, qué incluye', async ({ page }) => {
    await page.goto('/que-tratamos/esguince-de-tobillo');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('Grados I, II y III');
    await expect(page.locator('body')).toContainText('4 de 10');
    await expect(page.locator('h3', { hasText: 'Consultá cuanto antes' })).toBeVisible();
    await expect(page.locator('body')).toContainText('No podés dar cuatro pasos apoyando el pie');

    // Timeline de fases: 5 pasos (0..3 + alta)
    const fases = page.locator('.fase');
    await expect(fases).toHaveCount(5);
    await expect(fases.first()).toContainText('Evaluación inicial con informe');
    await expect(fases.last()).toContainText('Alta con criterios objetivos');

    await expect(page.locator('body')).toContainText('Sesiones personalizadas');
  });

  test('card del plan sugerido muestra $269.000 leído de planes.json', async ({ page }) => {
    await page.goto('/que-tratamos/esguince-de-tobillo');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('Plan sugerido para esta lesión');
    await expect(page.locator('body')).toContainText('KINE 10');
    await expect(page.locator('body')).toContainText('$269.000');

    const linkPlan = page.locator('a', { hasText: 'Conocé el plan completo' });
    await expect(linkPlan).toHaveAttribute('href', '/planes/kine-10');
  });

  test('FAQ con details/summary abre y cierra', async ({ page }) => {
    await page.goto('/que-tratamos/esguince-de-tobillo');
    await page.waitForLoadState('networkidle');

    const primeraFaq = page.locator('details.faq-item').first();
    await expect(primeraFaq).not.toHaveAttribute('open', '');

    await primeraFaq.locator('summary').click();
    await expect(primeraFaq).toHaveAttribute('open', '');
    await expect(primeraFaq.locator('p')).toContainText('grado');

    await primeraFaq.locator('summary').click();
    await expect(primeraFaq).not.toHaveAttribute('open', '');
  });

  test('CTAs apuntan a Turnito y WhatsApp con texto de la patología', async ({ page }) => {
    await page.goto('/que-tratamos/esguince-de-tobillo');
    await page.waitForLoadState('networkidle');

    const turnitoLinks = page.locator('a', { hasText: 'Agendar evaluación' });
    await expect(turnitoLinks.first()).toHaveAttribute('href', /turnito\.app/);

    const whatsappLinks = page.locator('a', { hasText: /Consultar por WhatsApp|Escribinos por WhatsApp/ });
    const count = await whatsappLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await whatsappLinks.nth(i).getAttribute('href');
      expect(href).toMatch(/^https:\/\/wa\.me\/5491163678308\?text=/);
      expect(decodeURIComponent(href!).toLowerCase()).toContain('esguince de tobillo');
    }
  });

  test('el link "← Qué tratamos" vuelve al índice', async ({ page }) => {
    await page.goto('/que-tratamos/esguince-de-tobillo');
    await page.waitForLoadState('networkidle');

    await page.locator('a', { hasText: '← Qué tratamos' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/que-tratamos\/?$/);
  });
});
