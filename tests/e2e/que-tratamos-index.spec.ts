import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { width: 375, height: 812, name: '375' },
  { width: 768, height: 1024, name: '768' },
  { width: 1440, height: 900, name: '1440' },
];

test.describe('/que-tratamos — índice de patologías', () => {
  test('carga sin errores de consola en 375/768/1440, con screenshots', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    const response = await page.goto('/que-tratamos');
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main h1')).toContainText('Tu lesión tiene nombre.');

    // La home y páginas largas usan scroll-reveal (IntersectionObserver + opacity
    // en BaseLayout.astro). Un fullPage screenshot sin scroll real captura las
    // secciones bajo el fold en su estado inicial (opacity 0). Se simula un
    // scroll real con la API de mouse para que el screenshot refleje lo que
    // ve un usuario, no un frame intermedio de la animación.
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
        path: `tests/screenshots/que-tratamos-${vp.name}.png`,
        fullPage: true,
      });
    }

    expect(pageErrors, `Errores de JS en /que-tratamos:\n${pageErrors.join('\n')}`).toHaveLength(0);
    expect(errors, `Errores de consola en /que-tratamos:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('la grilla muestra las 8 patologías del catálogo', async ({ page }) => {
    await page.goto('/que-tratamos');
    await page.waitForLoadState('networkidle');

    const grid = page.locator('h3', { hasText: 'Esguince de tobillo' }).locator('xpath=ancestor::a');
    await expect(grid).toBeVisible();

    const nombres = [
      'Esguince de tobillo',
      'Post-quirúrgico de LCA',
      'Lumbalgia',
      'Cervicalgia',
      'Hombro doloroso',
      'Tendinopatías',
      'Desgarros musculares',
      'Recuperación post-fractura',
    ];
    for (const nombre of nombres) {
      await expect(page.locator('h3', { hasText: nombre })).toBeVisible();
    }
  });

  test('la card de esguince navega al detalle', async ({ page }) => {
    await page.goto('/que-tratamos');
    await page.waitForLoadState('networkidle');

    const cardEsguince = page.locator('h3', { hasText: 'Esguince de tobillo' }).locator('xpath=ancestor::a');
    await expect(cardEsguince).toHaveAttribute('href', '/que-tratamos/esguince-de-tobillo');
    // No debe abrir en pestaña nueva: es navegación interna.
    await expect(cardEsguince).not.toHaveAttribute('target', '_blank');

    await cardEsguince.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/que-tratamos\/esguince-de-tobillo\/?$/);
    await expect(page.locator('main h1')).toHaveText('Esguince de tobillo');
  });

  test('las otras 7 cards abren WhatsApp con texto precargado por patología', async ({ page }) => {
    await page.goto('/que-tratamos');
    await page.waitForLoadState('networkidle');

    const casos: { nombre: string; textoEsperado: string }[] = [
      { nombre: 'Post-quirúrgico de LCA', textoEsperado: 'post-quirúrgico de lca' },
      { nombre: 'Lumbalgia', textoEsperado: 'lumbalgia' },
      { nombre: 'Cervicalgia', textoEsperado: 'cervicalgia' },
      { nombre: 'Hombro doloroso', textoEsperado: 'hombro doloroso' },
      { nombre: 'Tendinopatías', textoEsperado: 'tendinopatías' },
      { nombre: 'Desgarros musculares', textoEsperado: 'desgarros musculares' },
      { nombre: 'Recuperación post-fractura', textoEsperado: 'recuperación post-fractura' },
    ];

    for (const { nombre, textoEsperado } of casos) {
      const card = page.locator('h3', { hasText: nombre }).locator('xpath=ancestor::a');
      await expect(card).toHaveAttribute('target', '_blank');
      const href = await card.getAttribute('href');
      expect(href, `href de la card "${nombre}"`).toMatch(/^https:\/\/wa\.me\/5491163678308\?text=/);
      const decoded = decodeURIComponent(href!.split('text=')[1]);
      expect(decoded.toLowerCase()).toContain(textoEsperado);
    }
  });
});
