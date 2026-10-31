import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/planes', name: 'Planes index' },
  { path: '/planes/kine-inicio', name: 'Plan KINE INICIO' },
  { path: '/planes/kine-10', name: 'Plan Kine 10' },
  { path: '/planes/evaluacion-postural', name: 'Evaluación postural' },
  { path: '/planes/evaluacion-deportiva', name: 'Evaluación deportiva' },
  { path: '/planes/evaluacion-nutricional', name: 'Evaluación nutricional' },
  { path: '/servicios-sueltos', name: 'Servicios sueltos' },
  { path: '/tests', name: 'Tests interactivos' },
  { path: '/orientador', name: 'Orientador' },
  { path: '/equipo', name: 'Equipo' },
  { path: '/obras-sociales', name: 'Obras sociales' },
  { path: '/faq', name: 'FAQ' },
  { path: '/contacto', name: 'Contacto' },
  { path: '/apoyar', name: 'Apoyá el proyecto' },
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
  expect(total).toBe(6);
  await page.locator('[data-plan-filtro][data-cat="evaluaciones"]').click();
  const visibles = await page.locator('[data-plan-item]:visible').count();
  expect(visibles).toBe(3);
  await page.locator('[data-plan-filtro][data-cat="all"]').click();
  const visiblesTodos = await page.locator('[data-plan-item]:visible').count();
  expect(visiblesTodos).toBe(6);
});
