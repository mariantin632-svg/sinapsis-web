import { test, expect } from '@playwright/test';

test.describe('Apoyá el proyecto', () => {
  test('la página carga con hero, destinos y aviso de aporte voluntario', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const response = await page.goto('/apoyar');
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toContainText('Sinapsis se construye');
    await expect(page.getByRole('heading', { name: 'El lugar' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'La atención' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'El equipo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Un espacio más grande' })).toBeVisible();
    await expect(page.getByText('Es un aporte voluntario, sin contraprestación.')).toBeVisible();

    expect(errors, `Errores de consola:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('no expone datos bancarios (CBU ni número de cuenta)', async ({ page }) => {
    await page.goto('/apoyar');
    const texto = (await page.locator('main').innerText()).toLowerCase();
    expect(texto).not.toContain('cbu');
    expect(texto).not.toMatch(/\b\d{22}\b/); // CBU
    expect(texto).not.toMatch(/\b20-?41449429-?4\b/); // CUIT
  });

  test('el CTA principal apunta a Cafecito o, si no está configurado, a WhatsApp', async ({ page }) => {
    await page.goto('/apoyar');
    const cta = page.locator('main a').filter({ hasText: /Invitanos un cafecito|Quiero colaborar/ }).first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/^https:\/\/(cafecito\.app\/|wa\.me\/5491163678308)/);
  });

  test('está enlazada desde el nav (desktop y mobile) y desde el footer', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/faq');
    await expect(page.locator('body > nav a[href="/apoyar"]')).toBeVisible();
    await expect(page.locator('footer a[href="/apoyar"]')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.locator('button[data-nav-menu-toggle]').first().click();
    await expect(page.locator('#nav-menu-mobile a[href="/apoyar"]')).toBeVisible();
  });

  test('la home también la enlaza en su header propio (desktop y mobile)', async ({ page }) => {
    // La home no usa el Nav de interiores: tiene su propio header dentro del Hero.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('header a[href="/apoyar"]')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.locator('button[data-menu-toggle]').first().click();
    await expect(page.locator('#menu-mobile a[href="/apoyar"]')).toBeVisible();
  });

  test('las dos barras siguen entrando en una sola línea en desktop', async ({ page }) => {
    const barras = [
      { url: '/apoyar', selector: 'body > nav > div.relative', nombre: 'nav de interiores' },
      { url: '/', selector: 'header', nombre: 'header de la home' },
    ];
    for (const barra of barras) {
      for (const width of [1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(barra.url);
        const fila = page.locator(barra.selector).first();
        const { scrollWidth, clientWidth } = await fila.evaluate((el) => ({
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        }));
        expect(scrollWidth, `overflow del ${barra.nombre} a ${width}px`).toBeLessThanOrEqual(clientWidth + 1);
      }
    }
  });
});
