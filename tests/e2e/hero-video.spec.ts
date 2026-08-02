import { test, expect } from '@playwright/test';

test.describe('Hero — video de fondo re-encodeado (loop sin salto)', () => {
  test('el video del hero carga (200), reproduce y no genera errores de consola', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    let videoResponseStatus: number | null = null;
    page.on('response', (res) => {
      if (res.url().endsWith('/hero-video.mp4')) videoResponseStatus = res.status();
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const video = page.locator('#hero-video');
    await expect(video).toHaveAttribute('src', '/hero-video.mp4');
    await expect(video).toHaveAttribute('autoplay', '');
    await expect(video).toHaveAttribute('loop', '');
    await expect(video).toHaveAttribute('muted', '');

    // El archivo se sirvió correctamente (no 404/500 tras el re-encode)
    expect([200, 206]).toContain(videoResponseStatus);

    // readyState/duration confirman que el navegador decodificó el mp4 (no corrupto)
    const videoState = await video.evaluate((el: HTMLVideoElement) => ({
      readyState: el.readyState,
      duration: el.duration,
      paused: el.paused,
      videoWidth: el.videoWidth,
      videoHeight: el.videoHeight,
    }));
    expect(videoState.readyState).toBeGreaterThanOrEqual(1); // HAVE_METADATA o superior
    expect(videoState.duration).toBeGreaterThan(0);
    expect(videoState.videoWidth).toBeGreaterThan(0);
    expect(videoState.videoHeight).toBeGreaterThan(0);
    expect(videoState.paused).toBe(false);

    await page.screenshot({
      path: 'tests/screenshots/hero-video-home.png',
      fullPage: false,
    });

    expect(pageErrors, `Errores de JS en /:\n${pageErrors.join('\n')}`).toHaveLength(0);
    expect(
      consoleErrors,
      `Errores de consola en /:\n${consoleErrors.join('\n')}`
    ).toHaveLength(0);
  });
});
