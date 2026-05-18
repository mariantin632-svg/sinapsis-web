import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/planes', name: 'Planes index' },
  { path: '/planes/essence', name: 'Plan Essence' },
  { path: '/planes/focus', name: 'Plan Focus' },
  { path: '/planes/total', name: 'Plan Total' },
  { path: '/planes/elite', name: 'Plan Elite' },
  { path: '/packs', name: 'Packs index' },
  { path: '/packs/sos-express', name: 'Pack SOS Express' },
  { path: '/packs/reset-lumbar', name: 'Pack Reset Lumbar' },
  { path: '/packs/cuello-libre', name: 'Pack Cuello Libre' },
  { path: '/packs/postura-pro', name: 'Pack Postura Pro' },
  { path: '/packs/rodilla-total', name: 'Pack Rodilla Total' },
  { path: '/packs/recovery-athlete', name: 'Pack Recovery Athlete' },
  { path: '/packs/retorno-seguro', name: 'Pack Retorno Seguro' },
  { path: '/packs/movilidad-60', name: 'Pack Movilidad +60' },
  { path: '/packs/mujer-bienestar', name: 'Pack Mujer Bienestar' },
  { path: '/packs/post-cirugia', name: 'Pack Post Cirugía' },
  { path: '/packs/empresa-10', name: 'Pack Empresa 10' },
  { path: '/servicios-sueltos', name: 'Servicios sueltos' },
  { path: '/equipo', name: 'Equipo' },
  { path: '/obras-sociales', name: 'Obras sociales' },
  { path: '/faq', name: 'FAQ' },
  { path: '/contacto', name: 'Contacto' },
];

for (const page of PAGES) {
  test(`${page.name} (${page.path}) loads with H1 and 200 status`, async ({ page: browserPage }) => {
    const response = await browserPage.goto(page.path);
    expect(response?.status()).toBe(200);
    await expect(browserPage.locator('h1').first()).toBeVisible();
  });
}

test('all WhatsApp links use wa.me with correct phone', async ({ page }) => {
  await page.goto('/');
  const whatsappLinks = page.locator('a[href*="wa.me"]');
  const count = await whatsappLinks.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const href = await whatsappLinks.nth(i).getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\/5491163678308/);
  }
});

test('Toggle de duración en planes section funciona', async ({ page }) => {
  await page.goto('/');
  const priceBefore = await page.locator('[data-plan-card][data-plan-slug="total"] [data-plan-price]').textContent();
  await page.locator('[data-duracion-btn][data-meses="1"]').click();
  const priceAfter = await page.locator('[data-plan-card][data-plan-slug="total"] [data-plan-price]').textContent();
  expect(priceBefore).not.toBe(priceAfter);
});

test('Filtros de packs ocultan/muestran items', async ({ page }) => {
  await page.goto('/packs');
  const totalItems = await page.locator('[data-pack-item]').count();
  expect(totalItems).toBe(11);
  await page.locator('[data-filter-btn][data-cat="deportistas"]').click();
  const visibles = await page.locator('[data-pack-item]:visible').count();
  expect(visibles).toBeLessThan(totalItems);
  expect(visibles).toBeGreaterThan(0);
});
