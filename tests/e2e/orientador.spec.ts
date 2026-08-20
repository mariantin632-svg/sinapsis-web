import { test, expect, type Page } from '@playwright/test';

/** Contesta la pregunta actual tocando la opción cuyo texto matchea. */
async function elegir(page: Page, texto: string | RegExp) {
  await page.locator('[data-opciones] button', { hasText: texto }).first().click();
}

/** Marca "ninguna" en las banderas rojas (último paso) y cierra el test. */
async function sinBanderas(page: Page) {
  await page.locator('[data-opciones] label', { hasText: 'No, ninguna de estas' }).click();
  await page.locator('[data-continuar]').click();
}

/** Las 4 primeras preguntas fijas: deja el test en la rama de la zona. */
async function hastaRama(page: Page, zona: string, inicio: string, tiempo: string, medico: string) {
  await elegir(page, zona);
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

  test('no abre con la lista de señales de alarma: van al final y encuadradas', async ({ page }) => {
    await page.goto('/orientador');
    // La segunda pregunta es sobre el cuadro, no sobre banderas rojas.
    await elegir(page, 'Espalda baja');
    await expect(page.locator('[data-pregunta]')).toContainText('¿Cómo empezó?');

    await elegir(page, 'Después de un esfuerzo');
    await elegir(page, 'Menos de un mes');
    await elegir(page, 'Sí, y me pidió estudios');
    await elegir(page, 'No, queda en la espalda');
    await elegir(page, 'Empeora');
    await elegir(page, 'Es la primera vez');
    await elegir(page, 'Que se me vaya el dolor');

    // Recién acá, y presentadas como rutina.
    await expect(page.locator('[data-pregunta]')).toContainText('¿Alguna de estas cosas');
    await expect(page.locator('[data-progreso]')).toContainText('rutina');
    await expect(page.locator('[data-ayuda]')).toContainText('a la mayoría no le pasa ninguna');
  });

  test('es indexable y está enlazada desde los dos menús, el footer y la home', async ({ page }) => {
    await page.goto('/orientador');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/faq');
    await expect(page.locator('body > nav a[href="/orientador"]')).toBeVisible();
    await expect(page.locator('footer a[href="/orientador"]')).toBeVisible();

    await page.goto('/');
    await expect(page.locator('header a[href="/orientador"]').first()).toBeVisible();
  });

  test('los chips de la home entran con la zona ya contestada', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/orientador?zona=rodilla"]').first().click();
    await page.waitForURL('**/orientador?zona=rodilla');

    await expect(page.locator('[data-pregunta]')).toContainText('¿Cómo empezó?');
    await expect(page.locator('[data-atras]')).toBeVisible();

    await page.locator('[data-atras]').click();
    await expect(page.locator('[data-pregunta]')).toHaveText('¿Dónde te molesta?');
  });

  test('una zona inventada en el link no rompe: arranca de cero', async ({ page }) => {
    await page.goto('/orientador?zona=oreja');
    await expect(page.locator('[data-pregunta]')).toHaveText('¿Dónde te molesta?');
    await expect(page.locator('[data-progreso]')).toContainText('Pregunta 1 de 9');
  });

  test('una bandera roja manda a consulta médica y pisa cualquier otro resultado', async ({ page }) => {
    await page.goto('/orientador');
    // Cuadro que sin banderas daría kinesiología.
    await hastaRama(page, 'Rodilla', 'Después de un esfuerzo', 'Menos de un mes', 'Sí, y me pidió estudios');
    await elegir(page, 'Sí, se hinchó');
    await elegir(page, 'Sí, alguna de esas');
    await elegir(page, 'Es la primera vez');
    await elegir(page, 'Volver a entrenar');

    await page.locator('[data-opciones] label', { hasText: 'Tengo fiebre junto con el dolor' }).click();
    await page.locator('[data-continuar]').click();

    await expect(page.locator('[data-resultado-titulo]')).toContainText('médico');
    await expect(page.locator('[data-cta-turnos]')).toBeHidden();
  });

  test('un cuadro deportivo reciente termina en kinesiología, con CTA de WhatsApp armado', async ({ page }) => {
    await page.goto('/orientador');
    await hastaRama(page, 'Rodilla', 'Después de un esfuerzo', 'Menos de un mes', 'Sí, y me pidió estudios');
    await elegir(page, 'Sí, se hinchó');
    await elegir(page, 'Sí, alguna de esas');
    await elegir(page, 'Es la primera vez');
    await elegir(page, 'Volver a entrenar');
    await sinBanderas(page);

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
    await sinBanderas(page);

    await expect(page.locator('[data-resultado-titulo]')).toHaveText('Osteopatía');
  });

  test('un golpe reciente con signos de lesión suma la pregunta condicional y deriva a traumatología', async ({ page }) => {
    await page.goto('/orientador');
    await hastaRama(page, 'Tobillo', 'De un golpe', 'Menos de 72 horas', 'No, nunca');

    await expect(page.locator('[data-progreso]')).toContainText('de 10');
    await expect(page.locator('[data-pregunta]')).toContainText('crujido');
    await elegir(page, 'Sí, alguna de esas');

    // Corta acá, pero pasando por las banderas: son lo único que puede pisar la derivación.
    await expect(page.locator('[data-pregunta]')).toContainText('¿Alguna de estas cosas');
    await sinBanderas(page);
    await expect(page.locator('[data-resultado-titulo]')).toContainText('traumatológica');
  });

  test('un dolor de más de 3 meses sin médico salta a las banderas y después deriva', async ({ page }) => {
    await page.goto('/orientador');
    await hastaRama(page, 'Espalda baja', 'De a poco', 'Más de 3 meses', 'No, nunca');

    // No sigue preguntando por la rama: con eso ya alcanza para derivar.
    await expect(page.locator('[data-pregunta]')).toContainText('¿Alguna de estas cosas');
    await sinBanderas(page);
    await expect(page.locator('[data-resultado-titulo]')).toContainText('traumatológica');
  });

  test('ningún camino llega al resultado sin preguntar las banderas', async ({ page }) => {
    await page.goto('/orientador');
    // Peor caso: derivación temprana a traumatología + bandera roja.
    await hastaRama(page, 'Espalda baja', 'De a poco', 'Más de 3 meses', 'No, nunca');
    await page.locator('[data-opciones] label', { hasText: 'Perdí fuerza' }).click();
    await page.locator('[data-continuar]').click();

    await expect(page.locator('[data-resultado-titulo]')).toContainText('médico');
  });

  test('el botón atrás vuelve a la pregunta anterior', async ({ page }) => {
    await page.goto('/orientador');
    await elegir(page, 'Hombro');
    await expect(page.locator('[data-pregunta]')).toContainText('¿Cómo empezó?');
    await page.locator('[data-atras]').click();
    await expect(page.locator('[data-pregunta]')).toHaveText('¿Dónde te molesta?');
    await expect(page.locator('[data-atras]')).toBeHidden();
  });

  test('desde las banderas se puede volver y cambiar la respuesta que derivó', async ({ page }) => {
    await page.goto('/orientador');
    await hastaRama(page, 'Espalda baja', 'De a poco', 'Más de 3 meses', 'No, nunca');
    await expect(page.locator('[data-pregunta]')).toContainText('¿Alguna de estas cosas');

    await page.locator('[data-atras]').click();
    await expect(page.locator('[data-pregunta]')).toContainText('¿Te vio un médico');
    await elegir(page, 'Sí, y me pidió estudios');

    // Ya no deriva: sigue el cuestionario normal por la rama de lumbar.
    await expect(page.locator('[data-pregunta]')).toContainText('baja a la pierna');
  });

  test('volver a empezar reinicia el cuestionario', async ({ page }) => {
    await page.goto('/orientador');
    await hastaRama(page, 'Cadera', 'De a poco', 'Más de 3 meses', 'No, nunca');
    await sinBanderas(page);
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
