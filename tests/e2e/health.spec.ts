import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/contacto', name: 'contacto' },
  { path: '/equipo', name: 'equipo' },
  { path: '/faq', name: 'faq' },
  { path: '/obras-sociales', name: 'obras-sociales' },
  { path: '/packs', name: 'packs' },
  { path: '/planes', name: 'planes' },
  { path: '/servicios-sueltos', name: 'servicios-sueltos' },
  { path: '/tests', name: 'tests' },
];

for (const { path, name } of PAGES) {
  test(`${path} — sin errores de consola`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(path);
    await page.waitForLoadState('networkidle');

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: `tests/screenshots/${name}-375.png`,
      fullPage: true,
    });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: `tests/screenshots/${name}-768.png`,
      fullPage: true,
    });

    // Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({
      path: `tests/screenshots/${name}-1440.png`,
      fullPage: true,
    });

    expect(
      errors,
      `Errores de consola en ${path}:\n${errors.join('\n')}`
    ).toHaveLength(0);
  });
}
