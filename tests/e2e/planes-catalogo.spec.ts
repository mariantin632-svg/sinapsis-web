import { test, expect } from '@playwright/test';

const VISIBLES = [
  { slug: 'kine-inicio', nombre: 'KINE INICIO', precio: '$149.000', pdf: '/planes/pdf/plan-kine-inicio-5.pdf' },
  { slug: 'kine-10', nombre: 'KINE 10', precio: '$269.000', pdf: '/planes/pdf/plan-kine-10.pdf' },
  { slug: 'osteo-4', nombre: 'OSTEO 4', precio: '$179.000', pdf: '/planes/pdf/plan-osteo-4.pdf' },
  { slug: 'evaluacion-postural', nombre: 'EVALUACIÓN POSTURAL', precio: '$55.000', pdf: '/planes/pdf/evaluacion-postural.pdf' },
  { slug: 'evaluacion-deportiva', nombre: 'EVALUACIÓN DEPORTIVA', precio: '$55.000', pdf: '/planes/pdf/evaluacion-deportiva.pdf' },
  { slug: 'evaluacion-nutricional', nombre: 'EVALUACIÓN NUTRICIONAL', precio: '$55.000', pdf: '/planes/pdf/evaluacion-nutricional.pdf' },
];

const OCULTOS = [
  'premier-kine',
  'premier-kine-plus',
  'performance',
  'conecta',
  'osteo-mantenimiento',
  'reinicio',
  'premier-osteo',
];

test.describe('Catálogo de planes reducido', () => {
  test('/planes lista exactamente los 6 planes visibles, sin quiz ni comparativa', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/planes');
    await page.waitForLoadState('networkidle');

    const items = page.locator('[data-plan-item]');
    await expect(items).toHaveCount(VISIBLES.length);

    for (const p of VISIBLES) {
      await expect(items.locator(`a[href="/planes/${p.slug}"]`)).toBeVisible();
    }
    for (const slug of OCULTOS) {
      await expect(items.locator(`a[href="/planes/${slug}"]`)).toHaveCount(0);
    }

    await expect(page.locator('[data-quiz]')).toHaveCount(0);
    await expect(page.getByText('Armamos planes a tu medida')).toBeVisible();
    await expect(page.locator('a[href*="wa.me"]', { hasText: /Consultar por WhatsApp/i })).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/planes-catalogo-1440.png', fullPage: true });

    expect(errors, `Errores de consola en /planes:\n${errors.join('\n')}`).toHaveLength(0);
  });

  for (const p of VISIBLES) {
    test(`/planes/${p.slug} renderiza precio, PDF (200) y sin errores de consola`, async ({ page, request }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      const response = await page.goto(`/planes/${p.slug}`);
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.getByText(p.precio, { exact: false }).first()).toBeVisible();

      const pdfLink = page.locator(`a[href="${p.pdf}"]`);
      await expect(pdfLink).toBeVisible();
      await expect(pdfLink).toHaveAttribute('download', '');

      const pdfResponse = await request.get(p.pdf);
      expect(pdfResponse.status()).toBe(200);

      expect(errors, `Errores de consola en /planes/${p.slug}:\n${errors.join('\n')}`).toHaveLength(0);
    });
  }

  for (const slug of OCULTOS) {
    test(`/planes/${slug} (oculto) responde 404`, async ({ page }) => {
      const response = await page.goto(`/planes/${slug}`);
      expect(response?.status()).toBe(404);
    });
  }

  test('Home: sección de planes muestra solo los 6 visibles', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const items = page.locator('[data-plan-item]');
    await expect(items).toHaveCount(VISIBLES.length);

    for (const slug of OCULTOS) {
      await expect(items.locator(`a[href="/planes/${slug}"]`)).toHaveCount(0);
    }

    expect(errors, `Errores de consola en / (home):\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('/tests: el quiz de planes solo recomienda links a los 5 visibles', async ({ page }) => {
    await page.goto('/tests');
    await page.waitForLoadState('networkidle');

    const quiz = page.locator('[data-quiz]').first();
    await expect(quiz).toBeVisible();

    // Recorremos el quiz eligiendo siempre la primera opción, hasta llegar al resultado.
    for (let i = 0; i < 5; i++) {
      const resultVisible = await quiz.locator('[data-quiz-result]').isVisible();
      if (resultVisible) break;
      const firstOption = quiz.locator('[data-quiz-options] button').first();
      if (await firstOption.count() === 0) break;
      await firstOption.click();
    }

    const resultLink = quiz.locator('[data-result-link]');
    if (await resultLink.isVisible()) {
      const href = await resultLink.getAttribute('href');
      const slug = href?.replace('/planes/', '');
      expect(VISIBLES.map((p) => p.slug)).toContain(slug);
      for (const oculto of OCULTOS) {
        expect(href).not.toBe(`/planes/${oculto}`);
      }
    }
  });

  test('/planes/kine-10 — screenshots responsive 375/768/1440', async ({ page }) => {
    await page.goto('/planes/kine-10');
    await page.waitForLoadState('networkidle');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: 'tests/screenshots/planes-kine-10-375.png', fullPage: true });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'tests/screenshots/planes-kine-10-768.png', fullPage: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'tests/screenshots/planes-kine-10-1440.png', fullPage: true });
  });
});
