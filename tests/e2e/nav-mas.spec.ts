import { test, expect } from '@playwright/test';

// La píldora del desktop muestra 4 links primarios y agrupa el resto en un
// desplegable "Más". El menú mobile y el footer siguen mostrando todo.

const PRIMARIOS = ['Orientador', 'Servicios', 'Planes', 'Equipo'];
const EN_MAS = ['Qué tratamos', 'Obras sociales', 'Preguntas frecuentes', 'Ubicación', 'Apoyá el proyecto'];

test.describe('Menú desktop — píldora con desplegable "Más"', () => {
  for (const { nombre, url, barra } of [
    { nombre: 'home', url: '/', barra: 'header' },
    { nombre: 'interiores', url: '/faq', barra: 'body > nav' },
  ]) {
    test(`${nombre}: la píldora muestra 5 elementos y el resto está en "Más"`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(url);

      const pildora = page.locator(`${barra} div.rounded-full`).first();
      const detalle = page.locator(`${barra} details[data-menu-mas]`);

      // 4 links sueltos + el summary "Más"
      for (const label of PRIMARIOS) {
        await expect(pildora.locator('> a', { hasText: label })).toBeVisible();
      }
      await expect(pildora.locator('> a')).toHaveCount(PRIMARIOS.length);
      await expect(detalle.locator('summary')).toBeVisible();

      // el panel arranca cerrado
      for (const label of EN_MAS) {
        await expect(detalle.locator('a', { hasText: label })).toBeHidden();
      }

      // y se abre con un clic
      await detalle.locator('summary').click();
      for (const label of EN_MAS) {
        await expect(detalle.locator('a', { hasText: label })).toBeVisible();
      }
    });
  }

  test('el desplegable cierra al clickear afuera, con Escape y al elegir una opción', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/faq');
    const detalle = page.locator('body > nav details[data-menu-mas]');

    await detalle.locator('summary').click();
    await expect(detalle).toHaveAttribute('open', '');
    await page.mouse.click(700, 600);
    await expect(detalle).not.toHaveAttribute('open', '');

    await detalle.locator('summary').click();
    await page.keyboard.press('Escape');
    await expect(detalle).not.toHaveAttribute('open', '');

    await detalle.locator('summary').click();
    await detalle.locator('a', { hasText: 'Ubicación' }).click();
    await expect(page).toHaveURL(/\/contacto\/?$/);
  });

  test('mobile: el menú fullscreen sigue mostrando todas las secciones', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/');
    await page.locator('button[data-menu-toggle]').first().click();
    for (const label of [...PRIMARIOS.slice(1), ...EN_MAS]) {
      await expect(page.locator('#menu-mobile nav a', { hasText: label }).first()).toBeVisible();
    }

    await page.goto('/faq');
    await page.locator('button[data-nav-menu-toggle]').first().click();
    for (const label of [...PRIMARIOS.slice(1), ...EN_MAS]) {
      await expect(page.locator('#nav-menu-mobile nav a', { hasText: label }).first()).toBeVisible();
    }
  });

  test('la home navega por anclas y los interiores por rutas', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/');
    const header = page.locator('header').first();
    await expect(header.locator('a', { hasText: 'Servicios' })).toHaveAttribute('href', '#servicios');
    await header.locator('details[data-menu-mas] summary').click();
    await expect(header.locator('a', { hasText: 'Obras sociales' })).toHaveAttribute('href', '#obras');

    await page.goto('/faq');
    const nav = page.locator('body > nav').first();
    await expect(nav.locator('a', { hasText: 'Servicios' })).toHaveAttribute('href', '/servicios-sueltos');
    await nav.locator('details[data-menu-mas] summary').click();
    await expect(nav.locator('a', { hasText: 'Obras sociales' })).toHaveAttribute('href', '/obras-sociales');
  });
});
