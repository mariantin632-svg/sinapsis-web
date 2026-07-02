import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/planes', name: 'Planes index' },
  { path: '/planes/premier-kine', name: 'Plan PREMIER KINE' },
  { path: '/planes/premier-kine-plus', name: 'Plan PREMIER KINE +' },
  { path: '/planes/performance', name: 'Plan PERFORMANCE' },
  { path: '/planes/conecta', name: 'Plan CONECTA' },
  { path: '/planes/osteo-mantenimiento', name: 'Plan Osteo Mantenimiento' },
  { path: '/planes/kine-10', name: 'Plan Kine 10' },
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
  { path: '/tests', name: 'Tests interactivos' },
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

test('Filtros de planes en la home ocultan/muestran cards', async ({ page }) => {
  await page.goto('/');
  const total = await page.locator('[data-plan-item]').count();
  expect(total).toBe(8);
  await page.locator('[data-plan-filtro][data-cat="osteopatia"]').click();
  const visibles = await page.locator('[data-plan-item]:visible').count();
  expect(visibles).toBe(2);
  await page.locator('[data-plan-filtro][data-cat="all"]').click();
  const visiblesTodos = await page.locator('[data-plan-item]:visible').count();
  expect(visiblesTodos).toBe(8);
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
