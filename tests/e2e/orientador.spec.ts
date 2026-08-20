import { test, expect, type Page } from '@playwright/test';

/** Contesta la pregunta actual tocando la opción cuyo texto matchea. */
async function elegir(page: Page, texto: string | RegExp) {
  await page.locator('[data-opciones] button', { hasText: texto }).first().click();
}

/** Recorrido base sin banderas rojas: deja el test en la pregunta de rama. */
async function hastaRama(page: Page, zona: string, inicio: string, tiempo: string, medico: string) {
  await elegir(page, zona);
  await page.locator('[data-opciones] label', { hasText: 'No, ninguna de estas' }).click();
  await page.locator('[data-continuar]').click();
  await elegir(page, inicio);
  await elegir(page, tiempo);
  await elegir(page, medico);
}

test.describe('Orientador — ¿Por dónde empiezo?', () => {
  test('la página carga sin errores de consola y arranca en la primera pregunta', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const response = await page.goto('/orientador');
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toContainText('¿Por dónde empiezo?');
    await expect(page.locator('[data-pregunta]')).toHaveText('¿Dónde te molesta?');
    await expect(page.locator('[data-progreso]')).toContainText('Pregunta 1 de 9');
    await expect(page.locator('[data-atras]')).toBeHidden();

    expect(errors, `Errores de consola:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('es indexable y está enlazada desde los dos menús, el footer y la home', async ({ page }) => {
    await page.goto('/orientador');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    // Nav de interiores (píldora desktop) + menú mobile + footer.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/faq');
    await expect(page.locator('body > nav a[href="/orientador"]')).toBeVisible();
    await expect(page.locator('footer a[href="/orientador"]')).toBeVisible();

    // Header propio de la home, que es otro archivo.
    await page.goto('/');
    await expect(page.locator('header a[href="/orientador"]').first()).toBeVisible();
  });

  test('los chips de la home entran con la zona ya contestada', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/orientador?zona=rodilla"]').first().click();
    await page.waitForURL('**/orientador?zona=rodilla');

    // Arranca en la pregunta 2: la zona ya vino en el link.
    await expect(page.locator('[data-pregunta]')).toContainText('¿Alguna de estas cosas');
    await expect(page.locator('[data-atras]')).toBeVisible();

    // Y el atrás lleva a la pregunta de zona, no a la nada.
    await page.locator('[data-atras]').click();
    await expect(page.locator('[data-pregunta]')).toHaveText('¿Dónde te molesta?');
  });

  test('una zona inventada en el link no rompe: arranca de cero', async ({ page }) => {
    await page.goto('/orientador?zona=oreja');
    await expect(page.locator('[data-pregunta]')).toHaveText('¿Dónde te molesta?');
    await expect(page.locator('[data-progreso]')).toContainText('Pregunta 1 de 9');
  });

  test('una bandera roja corta el test y manda a consulta médica', async ({ page }) => {
    await page.goto('/orientador');
    await elegir(page, 'Espalda baja');
    await page.locator('[data-opciones] label', { hasText: 'Tengo fiebre junto con el dolor' }).click();
    await page.locator('[data-continuar]').click();

    await expect(page.locator('[data-resultado]')).toBeVisible();
    await expect(page.locator('[data-resultado-titulo]')).toContainText('médico');
    // Ante bandera roja no se ofrecen turnos.
    await expect(page.locator('[data-cta-turnos]')).toBeHidden();
  });

  test('un cuadro deportivo reciente termina en kinesiología, con CTA de WhatsApp armado', async ({ page }) => {
    await page.goto('/orientador');
    await hastaRama(page, 'Rodilla', 'Después de un esfuerzo', 'Menos de un mes', 'Sí, y me pidió estudios');
    await elegir(page, 'Sí, se hinchó');
    await elegir(page, 'Sí, alguna de esas');
    await elegir(page, 'Es la primera vez');
    await elegir(page, 'Volver a entrenar');

    await expect(page.locator('[data-resultado-titulo]')).toHaveText('Kinesiología');
    const href = await page.locator('[data-cta-wa]').getAttribute('href');
    expect(href).toContain('wa.me/5491163678308');
    expect(decodeURIComponent(href ?? '')).toContain('Me molesta la rodilla');
    await expect(page.locator('[data-cta-turnos]')).toBeVisible();
  });

  test('un cuadro crónico y recurrente termina en osteopatía', async ({ page }) => {
    await page.goto('/orientador');
    await hastaRama(page, 'Cuello', 'De a poco', 'Más de 3 meses', 'Sí, pero sin estudios');
    await elegir(page, 'No, queda en el cuello');
    await elegir(page, 'Sí, bastante');
    await elegir(page, 'Me vuelve seguido');
    await elegir(page, 'Que deje de volver');

    await expect(page.locator('[data-resultado-titulo]')).toHaveText('Osteopatía');
  });

  test('un golpe reciente con signos de lesión suma la pregunta condicional y deriva a traumatología', async ({ page }) => {
    await page.goto('/orientador');
    await hastaRama(page, 'Tobillo', 'De un golpe', 'Menos de 72 horas', 'No, nunca');

    // La pregunta condicional aparece y el total de pasos sube a 10.
    await expect(page.locator('[data-progreso]')).toContainText('de 10');
    await expect(page.locator('[data-pregunta]')).toContainText('crujido');
    await elegir(page, 'Sí, alguna de esas');

    await expect(page.locator('[data-resultado-titulo]')).toContainText('traumatológica');
  });

  test('un dolor de más de 3 meses sin médico corta sin preguntar de más', async ({ page }) => {
    await page.goto('/orientador');
    await hastaRama(page, 'Espalda baja', 'De a poco', 'Más de 3 meses', 'No, nunca');

    // No sigue preguntando: con eso ya alcanza para derivar.
    await expect(page.locator('[data-resultado]')).toBeVisible();
    await expect(page.locator('[data-resultado-titulo]')).toContainText('traumatológica');
    await expect(page.locator('[data-paso]')).toBeHidden();
  });

  test('el botón atrás vuelve a la pregunta anterior', async ({ page }) => {
    await page.goto('/orientador');
    await elegir(page, 'Hombro');
    await expect(page.locator('[data-pregunta]')).toContainText('¿Alguna de estas cosas');
    await page.locator('[data-atras]').click();
    await expect(page.locator('[data-pregunta]')).toHaveText('¿Dónde te molesta?');
    await expect(page.locator('[data-atras]')).toBeHidden();
  });

  test('volver a empezar reinicia el cuestionario', async ({ page }) => {
    await page.goto('/orientador');
    await elegir(page, 'Cadera');
    await page.locator('[data-opciones] label', { hasText: 'Tengo fiebre' }).click();
    await page.locator('[data-continuar]').click();
    await expect(page.locator('[data-resultado]')).toBeVisible();

    await page.locator('[data-reiniciar]').click();
    await expect(page.locator('[data-resultado]')).toBeHidden();
    await expect(page.locator('[data-pregunta]')).toHaveText('¿Dónde te molesta?');
  });

  test('no promete diagnóstico y deja el disclaimer visible', async ({ page }) => {
    await page.goto('/orientador');
    const texto = (await page.locator('main').innerText()).toLowerCase();
    expect(texto).toContain('orientación, no un diagnóstico');
    expect(texto).not.toContain('sabés qué tenés');
    expect(texto).not.toContain('uno a uno');
  });

  test('se ve bien en mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/orientador');
    await expect(page.locator('[data-orientador]')).toBeVisible();
    const scrollX = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(scrollX).toBeLessThanOrEqual(1);
  });
});
