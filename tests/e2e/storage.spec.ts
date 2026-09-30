import { appUrl } from './urls';
import { test, expect } from '@playwright/test';
import { createExample, openCentinela, readGame } from './helpers';
import type { Page } from '@playwright/test';
async function storedIllustration(page: Page) {
  const record = await readGame(page);
  const id = record.data.cards[4].visual.illustrationId!;
  return page.evaluate(async ([gameId, imageId]) => {
    const db = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('forja-local-v1'); request.onsuccess = () => resolve(request.result); });
    const blob = await new Promise<Blob>(resolve => { const request = db.transaction('images').objectStore('images').get([gameId, imageId]); request.onsuccess = () => resolve(request.result.blob); });
    db.close(); return Array.from(new Uint8Array(await blob.arrayBuffer()));
  }, [record.id, id]);
}
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV9sAAAAASUVORK5CYII=', 'base64');

test('biblioteca vacía, creación, renombrado, reglamento y eliminación confirmada', async ({ page }) => {
  await page.goto(appUrl('/'));
  await expect(page.getByRole('heading', { name: 'Aún no tienes juegos' })).toBeVisible();
  await page.getByLabel('Nombre del nuevo juego').fill('Mi juego');
  await page.getByRole('button', { name: 'Crear juego', exact: true }).click();
  await page.getByRole('link', { name: 'Renombrar', exact: true }).click();
  await page.getByLabel('Nombre del juego', { exact: true }).fill('Mi juego nuevo');
  await page.getByLabel('Descripción', { exact: true }).fill('Descripción con acentos.');
  await page.getByRole('button', { name: 'Guardar juego', exact: true }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Reglamento' }).click();
  await page.getByLabel('Texto del reglamento').fill('Primera línea\nSegunda: energía.');
  await page.getByRole('button', { name: 'Guardar reglamento' }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Texto del reglamento')).toHaveValue('Primera línea\nSegunda: energía.');
  await page.getByRole('link', { name: 'Mis juegos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mi juego nuevo' })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar juego', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Abrir juego' })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar juego', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Aún no tienes juegos' })).toBeVisible();
});

test('recupera carta e imagen al cerrar y abrir una pestaña', async ({ page, context }) => {
  await createExample(page); await openCentinela(page);
  await page.getByLabel('Ilustración de la carta', { exact: true }).setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('.card-canvas canvas')).toBeVisible();
  await page.getByLabel('Texto de la carta').fill('Texto guardado con imagen.');
  await page.getByRole('button', { name: 'Guardar carta', exact: true }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  const url = page.url(); await page.close();
  const reopened = await context.newPage(); await reopened.goto(url);
  await expect(reopened.getByLabel('Texto de la carta')).toHaveValue('Texto guardado con imagen.');
  await expect(reopened.locator('.card-canvas canvas')).toBeVisible();
  const bytes = await storedIllustration(reopened);
  expect(Buffer.from(bytes)).toEqual(png);
});

test('navegación con borrador permite permanecer, guardar o descartar', async ({ page }) => {
  await createExample(page); await openCentinela(page);
  await page.getByLabel('Nombre de la carta').fill('Borrador');
  await page.getByRole('link', { name: '← Volver a Cartas' }).click();
  await page.getByRole('button', { name: 'Permanecer' }).click();
  await expect(page.getByLabel('Nombre de la carta')).toHaveValue('Borrador');
  await page.getByRole('link', { name: '← Volver a Cartas' }).click();
  await page.getByRole('button', { name: 'Guardar y salir' }).click();
  await page.getByRole('link', { name: /Borrador/ }).click();
  await page.getByLabel('Nombre de la carta').fill('Descartar esto');
  await page.getByRole('link', { name: '← Volver a Cartas' }).click();
  await page.getByRole('button', { name: 'Descartar y salir' }).click();
  await page.getByRole('link', { name: /Borrador/ }).click();
  await expect(page.getByLabel('Nombre de la carta')).toHaveValue('Borrador');
});

test('Atrás conserva el borrador hasta decidir y recargar dispara aviso nativo', async ({ page }) => {
  await createExample(page); await openCentinela(page);
  await page.getByLabel('Nombre de la carta').fill('Antes de salir');
  await page.evaluate(() => history.back());
  await expect(page.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeVisible();
  await page.getByRole('button', { name: 'Permanecer' }).click();
  await expect(page.getByLabel('Nombre de la carta')).toHaveValue('Antes de salir');
  const dialog = page.waitForEvent('dialog');
  void page.reload().catch(() => {});
  const native = await dialog; expect(native.type()).toBe('beforeunload'); await native.dismiss();
  await expect(page.getByLabel('Nombre de la carta')).toHaveValue('Antes de salir');
  await page.evaluate(() => history.back());
  await page.getByRole('button', { name: 'Descartar y salir' }).click();
  await expect(page.getByRole('heading', { name: 'Tu colección de cartas' })).toBeVisible();
});

test('un error de cuota conserva el borrador y permite reintentar', async ({ page }) => {
  await createExample(page); await openCentinela(page);
  await page.getByLabel('Nombre de la carta').fill('No perder');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(...args) {
      if (this.name === 'games') { IDBObjectStore.prototype.put = put; throw new DOMException('Disk full', 'QuotaExceededError'); }
      return put.apply(this, args);
    };
  });
  await page.getByRole('link', { name: '← Volver a Cartas' }).click();
  await page.getByRole('button', { name: 'Guardar y salir' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('No hay espacio suficiente');
  await expect(page.getByLabel('Nombre de la carta')).toHaveValue('No perder');
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Guardar carta', exact: true }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  await page.reload(); await expect(page.getByLabel('Nombre de la carta')).toHaveValue('No perder');
});

test('dos pestañas no sobrescriben cambios y recargar exige descartar', async ({ page, context }) => {
  await createExample(page); await openCentinela(page);
  const second = await context.newPage(); await second.goto(page.url());
  await expect(second.getByLabel('Nombre de la carta')).toHaveValue('Centinela Mecánico');
  await page.getByLabel('Nombre de la carta').fill('Ganador');
  await page.getByRole('button', { name: 'Guardar carta', exact: true }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  await second.getByLabel('Nombre de la carta').fill('Borrador antiguo');
  await second.getByRole('button', { name: 'Guardar carta', exact: true }).click();
  await expect(second.getByRole('main').getByRole('alert')).toContainText('Otra pestaña cambió');
  await expect(second.getByLabel('Nombre de la carta')).toHaveValue('Borrador antiguo');
  await second.getByRole('button', { name: 'Recargar versión guardada' }).click();
  await second.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(second.getByLabel('Nombre de la carta')).toHaveValue('Borrador antiguo');
  await second.getByRole('button', { name: 'Recargar versión guardada' }).click();
  await second.getByRole('button', { name: 'Descartar y recargar' }).click();
  await expect(second.getByLabel('Nombre de la carta')).toHaveValue('Ganador');
  await second.close();
});

test('almacenamiento bloqueado muestra un error en vez de una biblioteca vacía', async ({ page }) => {
  await page.addInitScript(() => { IDBFactory.prototype.open = () => { throw new DOMException('Denied', 'SecurityError'); }; });
  await page.goto(appUrl('/'));
  await expect(page.getByRole('main').getByRole('alert')).toContainText('No se puede abrir el almacenamiento');
  await expect(page.getByRole('heading', { name: 'Aún no tienes juegos' })).toHaveCount(0);
});

test('un archivo de imagen dañado no sustituye la ilustración compartida', async ({ page }) => {
  await createExample(page); await openCentinela(page);
  const original = await storedIllustration(page);
  await page.getByLabel('Ilustración de la carta', { exact: true }).setInputFiles({ name: 'roto.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.getByRole('main').getByRole('alert')).toContainText('No se pudo leer la imagen');
  expect(await storedIllustration(page)).toEqual(original);
  await expect(page.getByRole('button', { name: 'Guardar carta', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Retirar ilustración' }).click();
  await page.getByRole('button', { name: 'Guardar carta', exact: true }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: '← Volver a Cartas' }).click();
  await page.getByRole('link', { name: /Guardián de la Forja/ }).click();
  await expect(page.locator('.card-canvas canvas')).toBeVisible();
});

test('conserva juego e imágenes tras reiniciar el navegador con el mismo perfil', async ({ playwright }, testInfo) => {
  const profile = testInfo.outputPath('browser-profile');
  const browser = await playwright.chromium.launchPersistentContext(profile);
  let editorUrl = '';
  try {
    const page = await browser.newPage();
    await page.goto((process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173') + appUrl('/'));
    await page.getByRole('button', { name: 'Crear juego de ejemplo', exact: true }).click();
    await page.getByRole('link', { name: 'Abrir juego' }).click();
    await openCentinela(page);
    await page.getByLabel('Nombre de la carta').fill('Después de reiniciar');
    await page.getByRole('button', { name: 'Guardar carta', exact: true }).click();
    await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
    editorUrl = page.url();
  } finally { await browser.close(); }
  const reopened = await playwright.chromium.launchPersistentContext(profile);
  try {
    const page = await reopened.newPage(); await page.goto(editorUrl);
    await expect(page.getByLabel('Nombre de la carta')).toHaveValue('Después de reiniciar');
    await expect(page.locator('.card-canvas canvas')).toBeVisible();
    expect(Buffer.from(await storedIllustration(page)).readUInt32BE(16)).toBe(1200);
  } finally { await reopened.close(); }
});
