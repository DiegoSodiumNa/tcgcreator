import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import { demoGame } from '../../src/fixtures/demo-game';
import type { GameFile } from '../../src/domain/schema';
import { createExample, openCentinela, readGame } from './helpers';

async function importGame(page: Page, game: GameFile) {
  await page.goto('/');
  await page.getByLabel('Importar archivo JSON').setInputFiles({ name: 'juego.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(game)) });
  await page.getByRole('button', { name: 'Crear copia independiente' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Copia importada' })).toBeVisible();
}
function simpleGame(count = 3) {
  const game = structuredClone(demoGame);
  game.images = [];
  for (const item of [...game.definitions.attributes, ...game.definitions.resources]) delete item.symbolImageId;
  game.cards = Array.from({ length: count }, (_, i) => ({ ...structuredClone(game.cards[0]), id: `test-card-${i}`, name: `Carta ${i + 1}`, text: 'Acentos: energía, protección y acción.', abilities: [], visual: { ...structuredClone(game.cards[0].visual), illustrationId: null, templateId: i % 2 ? 'text' as const : 'illustration' as const } }));
  return game;
}
async function readPdfDownload(page: Page, name: string) {
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar PDF de la selección' }).click();
  const download = await event; await mkdir('output/pdf', { recursive: true });
  const path = `output/pdf/${name}.pdf`; await download.saveAs(path);
  return PDFDocument.load(await readFile(path));
}
function drawingText(pdf: PDFDocument, index: number) {
  const contents = pdf.getPage(index).node.Contents();
  const refs = contents && 'asArray' in contents ? contents.asArray() : [contents];
  return refs.map(ref => { const stream = pdf.context.lookup(ref!); return stream instanceof PDFRawStream ? Buffer.from(decodePDFRawStream(stream).decode()).toString() : ''; }).join('\n');
}

test('A/B, colores, espacios y recorte persisten y el desbordamiento bloquea la exportación', async ({ page }) => {
  await createExample(page); await openCentinela(page);
  const before = (await readGame(page)).data.cards[4];
  await page.getByRole('combobox', { name: 'Plantilla', exact: true }).selectOption('text');
  await page.getByLabel('Color de acento').fill('#125599');
  await page.getByRole('combobox', { name: 'Espacio 4', exact: true }).selectOption('');
  await page.getByLabel('Ancho del recorte').fill('60');
  await page.getByLabel('Posición horizontal').fill('20');
  await expect(page.locator('.card-canvas canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Guardar carta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardar carta', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Plantilla', exact: true })).toHaveValue('text');
  const after = (await readGame(page)).data.cards[4];
  expect(after.attributeValues).toEqual(before.attributeValues); expect(after.abilities).toEqual(before.abilities);
  expect(after.visual).toMatchObject({ colors: { accent: '#125599' }, crop: { x: .2, width: .6 } });
  await expect(page.locator('.card-canvas canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/template-b.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 844 });
  const canvas = await page.locator('.card-canvas canvas').boundingBox();
  const container = await page.locator('.visual-preview').boundingBox();
  expect(canvas!.width).toBeLessThanOrEqual(container!.width + 1);
  await page.screenshot({ path: 'test-results/template-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByLabel('Texto de la carta').fill('Reglas extensas. '.repeat(300));
  await expect(page.locator('.visual-preview [role=alert]')).toContainText('el texto no cabe');
  await page.getByRole('button', { name: 'Guardar carta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardar carta', exact: true })).toBeDisabled();
  await page.getByRole('navigation').getByRole('link', { name: 'Exportar / imprimir' }).click();
  await page.getByLabel('Carta para PNG').selectOption({ label: 'Centinela Mecánico' });
  await page.getByRole('button', { name: 'Descargar PNG individual' }).click();
  await expect(page.locator('.export-feedback')).toContainText('el texto no cabe');
});

test('respaldo JSON real, copias independientes e imágenes recuperadas', async ({ page }) => {
  test.setTimeout(60_000);
  await createExample(page); const original = await readGame(page);
  const originalImages = await page.evaluate(async (gameId) => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('forja-local-v1'); r.onsuccess = () => resolve(r.result); });
    const rows = await new Promise<{ gameId: string; imageId: string; blob: Blob }[]>(resolve => { const r = db.transaction('images').objectStore('images').getAll(); r.onsuccess = () => resolve(r.result); }); db.close();
    return Promise.all(rows.filter(row => row.gameId === gameId).map(async row => ({ id: row.imageId, bytes: Array.from(new Uint8Array(await row.blob.arrayBuffer())) })));
  }, original.id);
  await page.getByRole('link', { name: 'Mis juegos', exact: true }).click();
  const event = page.waitForEvent('download'); await page.getByRole('button', { name: 'Exportar juego' }).click();
  const download = await event; const path = await download.path(); const json = await readFile(path!, 'utf8');
  const backup = JSON.parse(json) as GameFile;
  expect(backup.cards).toEqual(original.data.cards); expect(json).not.toContain('blob:'); expect(backup).not.toHaveProperty('revision');
  await page.getByLabel('Importar archivo JSON').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(json) });
  await page.getByRole('button', { name: 'Crear copia independiente' }).click();
  await expect(page.locator('.game-tile')).toHaveCount(2);
  await page.locator('.game-tile').filter({ hasText: '(copia)' }).getByRole('link', { name: 'Abrir juego' }).click();
  await expect(page.locator('.image-recovery')).toContainText('2 referencias');
  const art = original.data.images.find(image => image.kind === 'illustration')!;
  await page.getByLabel(`Reasociar ${art.originalName}`, { exact: true }).setInputFiles({ name: art.originalName, mimeType: 'image/png', buffer: Buffer.from(originalImages.find(image => image.id === art.id)!.bytes) });
  await expect(page.locator('.image-recovery')).toContainText('1 referencias');
  await page.locator('.recovery-row').getByRole('button', { name: /^Retirar referencia/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('.recovery-row')).toHaveCount(1);
  await page.locator('.recovery-row').getByRole('button', { name: /^Retirar referencia/ }).click();
  await page.getByRole('button', { name: 'Confirmar cambio de imagen' }).click();
  await expect(page.locator('.image-recovery')).toContainText('No hay imágenes pendientes');
  await page.getByRole('link', { name: 'Mis juegos', exact: true }).click();
  await page.getByLabel('Importar archivo JSON').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.locator('.import-panel')).toContainText('JSON válido'); await expect(page.locator('.game-tile')).toHaveCount(2);
});

test('PNG, seis frentes, Carta/A4, última hoja incompleta y recursos reutilizados', async ({ page }) => {
  test.setTimeout(90_000);
  await importGame(page, simpleGame());
  await page.getByRole('link', { name: 'Abrir juego' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Exportar / imprimir' }).click();
  for (const [i, count] of [2, 3, 1].entries()) { await page.getByRole('checkbox', { name: `Carta ${i + 1}`, exact: true }).check(); await page.getByLabel(`Cantidad de Carta ${i + 1}`).fill(String(count)); }
  const pdf = await readPdfDownload(page, 'tanda-carta');
  expect(pdf.getPageCount()).toBe(1); expect(pdf.getPage(0).getWidth()).toBeCloseTo(612);
  const operators = drawingText(pdf, 0);
  const draws = [...operators.matchAll(/\/(Image-[\w-]+) Do/g)].map(m => m[1]);
  expect(draws).toHaveLength(6);
  const matrices = [...operators.matchAll(/([\d.]+) 0 0 ([\d.]+) 0 0 cm/g)];
  expect(matrices.filter(m => Math.abs(Number(m[1]) - 63 * 72 / 25.4) < .001 && Math.abs(Number(m[2]) - 88 * 72 / 25.4) < .001)).toHaveLength(6);
  const imageStreams = pdf.context.enumerateIndirectObjects().filter(([, object]) => object instanceof PDFRawStream && object.dict.get(PDFName.of('Subtype'))?.toString() === '/Image');
  expect(imageStreams).toHaveLength(3);
  await page.getByRole('combobox', { name: 'Papel', exact: true }).selectOption('a4');
  await page.getByLabel('Cantidad de Carta 1').fill('6');
  await page.getByLabel('Añadir hoja de calibración de 50 mm').check();
  const a4 = await readPdfDownload(page, 'tanda-a4');
  expect(a4.getPageCount()).toBe(3); expect(a4.getPage(0).getWidth()).toBeCloseTo(210 * 72 / 25.4);
  expect([...drawingText(a4, 1).matchAll(/\/Image-[\w-]+ Do/g)]).toHaveLength(1);
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Vista previa de hoja 2' })).toBeVisible();
  await page.screenshot({ path: 'test-results/print-selection.png', fullPage: true });
  const pngEvent = page.waitForEvent('download'); await page.getByRole('button', { name: 'Descargar PNG individual' }).click();
  const png = await pngEvent; await png.saveAs('output/pdf/carta-personalizada.png');
  const bytes = await readFile('output/pdf/carta-personalizada.png'); expect(bytes.readUInt32BE(16)).toBe(744); expect(bytes.readUInt32BE(20)).toBe(1039);
  await page.getByLabel('Margen de hoja (mm)').fill('100'); await expect(page.getByRole('button', { name: 'Descargar PDF de la selección' })).toBeDisabled();
});

test('200 cartas: abre, selecciona y exporta sin montar todas las hojas', async ({ page }) => {
  test.setTimeout(120_000);
  const start = Date.now(); await importGame(page, simpleGame(200));
  await page.getByRole('link', { name: 'Abrir juego' }).click(); await expect(page.locator('.card-tile')).toHaveCount(200);
  const opened = Date.now();
  await page.getByRole('navigation').getByRole('link', { name: 'Exportar / imprimir' }).click();
  await expect(page.locator('.selection-list input[type=checkbox]')).toHaveCount(200);
  // Real checkbox interaction; no direct mutation of application state.
  for (const checkbox of await page.locator('.selection-list input[type=checkbox]').all()) await checkbox.check();
  await expect(page.locator('.sheet-preview')).toHaveCount(1);
  const exportStart = Date.now();
  const pdf = await readPdfDownload(page, 'tanda-200'); expect(pdf.getPageCount()).toBe(23);
  const timings = { importedAndOpenedMs: opened - start, export200DesignsMs: Date.now() - exportStart, pages: pdf.getPageCount(), browser: 'Chromium', measuredAt: new Date().toISOString() };
  await writeFile('output/pdf/performance-200.json', JSON.stringify(timings, null, 2));
  test.info().annotations.push({ type: 'performance', description: JSON.stringify(timings) });
});

test('imagen pendiente bloquea PNG, huella distinta requiere confirmar y cancelar conserva el estado', async ({ page }) => {
  const game = structuredClone(demoGame); game.images[0].sha256 = '0'.repeat(64);
  await importGame(page, game); await page.getByRole('link', { name: 'Abrir juego' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Exportar / imprimir' }).click();
  await page.getByRole('button', { name: 'Descargar PNG individual' }).click();
  await expect(page.locator('.export-feedback')).toContainText('Imagen pendiente');
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV9sAAAAASUVORK5CYII=', 'base64');
  await page.getByLabel('Reasociar forja.png', { exact: true }).setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: image });
  await expect(page.getByRole('dialog', { name: 'Confirmar imagen diferente' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('.image-recovery')).toContainText('2 referencias');
  await page.getByLabel('Reasociar forja.png', { exact: true }).setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: image });
  await page.getByRole('button', { name: 'Confirmar cambio de imagen' }).click();
  await expect(page.locator('.image-recovery')).toContainText('1 referencias');
});

test('cancelar mientras carga la fuente conserva la tanda y permite reintentar', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/fonts/NotoSans-Regular.ttf', async route => { await gate; await route.continue(); });
  await importGame(page, simpleGame()); await page.getByRole('link', { name: 'Abrir juego' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Exportar / imprimir' }).click();
  await page.getByRole('checkbox', { name: 'Carta 1', exact: true }).check();
  await page.getByLabel('Cantidad de Carta 1').fill('2');
  await page.getByRole('button', { name: 'Descargar PDF de la selección' }).click();
  await page.getByRole('button', { name: 'Cancelar exportación' }).click();
  await expect(page.locator('.export-feedback')).toContainText('Exportación cancelada');
  await expect(page.getByLabel('Cantidad de Carta 1')).toHaveValue('2');
  release();
  const event = page.waitForEvent('download'); await page.getByRole('button', { name: 'Descargar PDF de la selección' }).click();
  await event;
});
