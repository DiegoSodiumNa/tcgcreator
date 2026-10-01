import { test, expect } from '@playwright/test';
import { appUrl } from './urls';
import { demoGame } from '../../src/fixtures/demo-game';

test('piloto editorial: estados, teclado, adaptación y aislamiento', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-30T18:00:00Z'));
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto(appUrl('/'));
  const shell = page.locator('.app-shell');
  await expect(shell).toHaveCSS('background-color', 'rgb(245, 242, 222)');
  await expect(shell).toHaveCSS('color-scheme', 'light');
  await expect(page.getByRole('button', { name: 'Crear juego', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Crear juego', exact: true })).toHaveCSS('box-shadow', 'rgb(120, 146, 103) 4px 4px 0px 0px');
  await expect(page.getByRole('button', { name: 'Crear juego de ejemplo' })).toHaveCSS('box-shadow', 'none');
  for (const control of await page.locator('.library-create, .import-panel, .library-create input, .ds-scope .button').all()) {
    await expect(control).toHaveCSS('border-radius', '0px');
  }
  await expect(page.locator('.ds-pixel-rule')).toHaveCount(2);
  for (const rule of await page.locator('.ds-pixel-rule').all()) {
    await expect(rule).toHaveCSS('height', '8px');
    await expect(rule).toHaveAttribute('aria-hidden', 'true');
  }
  await expect(page.getByRole('heading', { name: 'Aún no tienes juegos' })).toBeVisible();
  await page.screenshot({ path: 'test-results/design-empty.png', fullPage: true });
  const input = page.getByLabel('Nombre del nuevo juego');
  await page.getByRole('button', { name: 'Crear juego', exact: true }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAccessibleDescription(/Escribe un nombre/);
  await input.fill('Archivo de exploración: un juego con un nombre muy largo para comprobar la biblioteca');
  await page.getByRole('button', { name: 'Crear juego', exact: true }).click();
  await expect(page.locator('.game-tile')).toHaveCount(1);
  await expect(page.locator('.game-tile')).toHaveCSS('overflow', 'visible');
  const corner = await page.locator('.game-tile').evaluate(element => {
    const style = getComputedStyle(element, '::before');
    return { top: style.top, width: style.width, border: style.borderTopWidth, pointerEvents: style.pointerEvents };
  });
  expect(corner).toEqual({ top: '-4px', width: '16px', border: '4px', pointerEvents: 'none' });
  await expect(page.getByRole('status').filter({ hasText: 'Juego creado' })).toBeVisible();

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const home = await page.getByRole('link', { name: 'Mis juegos', exact: true }).boundingBox();
    const guide = await page.getByRole('link', { name: 'Guía de uso' }).boundingBox();
    expect(home!.x + home!.width <= guide!.x || guide!.x + guide!.width <= home!.x || home!.y + home!.height <= guide!.y || guide!.y + guide!.height <= home!.y).toBe(true);
    await page.screenshot({ path: `test-results/design-library-${width}.png`, fullPage: true });
  }

  const remove = page.getByRole('button', { name: 'Eliminar juego', exact: true });
  await remove.click();
  const dialog = page.getByRole('dialog', { name: 'Eliminar juego', exact: true });
  await expect(dialog).toHaveCSS('background-color', 'rgb(255, 253, 242)');
  await expect(dialog).toHaveCSS('border-radius', '0px');
  expect(await dialog.evaluate(element => getComputedStyle(element, '::before').top)).toBe('0px');
  await expect(dialog.getByRole('button', { name: 'Eliminar definitivamente' })).toHaveCSS('box-shadow', 'none');
  const dialogBox = await dialog.boundingBox();
  expect(Math.abs(dialogBox!.y + dialogBox!.height / 2 - 500)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', { name: 'Eliminar definitivamente' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Eliminar definitivamente' })).toBeFocused();
  await page.screenshot({ path: 'test-results/design-delete-dialog.png' });
  await page.keyboard.press('Escape');
  await expect(remove).toBeFocused();

  await input.fill('Borrador');
  await page.getByRole('link', { name: 'Guía de uso' }).click();
  const guard = page.getByRole('dialog', { name: 'Cambios sin guardar' });
  await expect(guard).toHaveClass(/ds-scope/);
  await expect(guard).toHaveCSS('background-color', 'rgb(255, 253, 242)');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: 'Guía de uso' })).toBeFocused();
  await input.fill('');

  await page.getByLabel('Importar archivo JSON').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(page.getByLabel('Importar archivo JSON')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('.import-panel [role=alert]')).toBeVisible();
  await page.getByLabel('Importar archivo JSON').focus();
  await page.getByLabel('Importar archivo JSON').setInputFiles({ name: 'example.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(demoGame)) });
  const review = page.getByRole('dialog', { name: 'Revisar importación' });
  await expect(review).toHaveCSS('background-color', 'rgb(255, 253, 242)');
  await page.setViewportSize({ width: 390, height: 844 });
  const reviewBox = await review.boundingBox();
  expect(Math.abs(reviewBox!.y + reviewBox!.height / 2 - 422)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: 'test-results/design-import-dialog.png' });
  await page.keyboard.press('Escape');
  await expect(page.locator('.game-tile')).toHaveCount(1);
  await expect(page.getByLabel('Importar archivo JSON')).toBeFocused();

  // Twice the text size stresses wrapping independently of browser/device scale.
  await page.setViewportSize({ width: 390, height: 844 });
  await shell.evaluate(element => {
    for (const [token, value] of Object.entries({ body: 32, control: 28, caption: 24, meta: 26, section: 48, title: 72, display: 80 })) {
      (element as HTMLElement).style.setProperty(`--ds-type-${token}`, `${value}px`);
    }
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/design-large-text.png', fullPage: true });

  await page.getByRole('link', { name: 'Abrir juego' }).click();
  await expect(page.locator('.app-shell')).not.toHaveClass(/ds-scope/);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(247, 248, 250)');
  await page.getByRole('link', { name: 'Guía de uso' }).click();
  await expect(page.locator('.ds-scope')).toHaveCount(0);
  expect(await page.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--ds-pixel'))).toBe('');
});

test('la pulsación pixelada respeta movimiento reducido y conserva el foco', async ({ page }) => {
  await page.goto(appUrl('/'));
  const primary = page.getByRole('button', { name: 'Crear juego', exact: true });
  await expect(primary).toBeEnabled();
  await primary.focus();
  await expect(primary).toHaveCSS('outline-width', '3px');
  await expect(primary).toHaveCSS('outline-offset', '3px');
  await expect(primary).toHaveCSS('clip-path', 'none');
  await page.keyboard.down('Space');
  await expect(primary).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 2, 2)');
  await page.keyboard.up('Space');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await primary.focus();
  await page.keyboard.down('Space');
  await expect(primary).toHaveCSS('transform', 'none');
  await page.keyboard.up('Space');
  await expect(primary).toBeFocused();
});

test('objetivos táctiles y carga estable con movimiento reducido', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto(appUrl('/'));
    const button = page.getByRole('button', { name: 'Crear juego de ejemplo' });
    await expect(button).toBeEnabled();
    const before = await button.boundingBox();
    expect(before!.height).toBeGreaterThanOrEqual(44);
    for (const control of await page.locator('.ds-scope .nav-item, .ds-scope input, .ds-scope .button').all()) {
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    let release!: () => void;
    const blocked = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/images/forja.svg', async route => { await blocked; await route.continue(); });
    await button.click();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toBeDisabled();
    const during = await button.boundingBox();
    expect(during!.width).toBe(before!.width);
    expect(during!.height).toBe(before!.height);
    expect(await button.evaluate(element => getComputedStyle(element, '::before').animationName)).toBe('none');
    release();
    await expect(page.getByRole('link', { name: 'Abrir juego' })).toBeVisible();
  } finally { await context.close(); }
});
