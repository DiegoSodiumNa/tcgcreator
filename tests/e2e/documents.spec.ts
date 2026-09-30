import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { createExample, readGame } from './helpers';
import { demoGame } from '../../src/fixtures/demo-game';
import { appUrl } from './urls';

async function downloadPdf(page: Page, button: string, name: string) {
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: button, exact: true }).click();
  const download = await event;
  await mkdir('output/pdf', { recursive: true });
  const path = `output/pdf/${name}.pdf`; await download.saveAs(path);
  return PDFDocument.load(await readFile(path));
}

test('reglamento exporta borrador, conserva saltos y persiste al guardar', async ({ page }) => {
  await createExample(page);
  const original = await readGame(page);
  await page.getByRole('navigation').getByRole('link', { name: 'Reglamento', exact: true }).click();
  const text = Array.from({ length: 70 }, (_, i) => `Párrafo ${i + 1}: energía, protección, acción y pingüino.\nUna segunda línea.\n`).join('\n');
  await page.getByLabel('Texto del reglamento').fill(text);
  const letter = await downloadPdf(page, 'Descargar reglamento PDF', 'reglamento-carta');
  expect(letter.getPageCount()).toBeGreaterThan(3);
  expect(letter.getPage(0).getWidth()).toBeCloseTo(612);
  expect((await readGame(page)).data.game.rules).toBe(original.data.game.rules);
  await expect(page.getByRole('status').filter({ hasText: 'Cambios sin guardar' })).toBeVisible();
  await page.getByLabel('Papel del reglamento').selectOption('a4');
  const a4 = await downloadPdf(page, 'Descargar reglamento PDF', 'reglamento-a4');
  expect(a4.getPage(0).getWidth()).toBeCloseTo(210 * 72 / 25.4);
  await page.getByRole('button', { name: 'Guardar reglamento', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardar reglamento', exact: true })).toBeDisabled();
  await page.reload(); await expect(page.getByLabel('Texto del reglamento')).toHaveValue(text);
  await page.getByLabel('Texto del reglamento').fill('');
  await expect(page.getByRole('button', { name: 'Descargar reglamento PDF' })).toBeDisabled();
});

test('fallo de fuente conserva borrador y permite reintentar; caracteres no admitidos se explican', async ({ page }) => {
  await createExample(page);
  await page.getByRole('navigation').getByRole('link', { name: 'Reglamento', exact: true }).click();
  await page.route('**/fonts/NotoSans-Regular.ttf', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.getByLabel('Texto del reglamento').fill('Texto visible: acción.');
  await page.getByRole('button', { name: 'Descargar reglamento PDF' }).click();
  await expect(page.getByText('No se pudo cargar la fuente. Reintenta.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Texto del reglamento')).toHaveValue('Texto visible: acción.');
  await page.unroute('**/fonts/NotoSans-Regular.ttf');
  await downloadPdf(page, 'Descargar reglamento PDF', 'reglamento-reintento');
  await page.getByLabel('Texto del reglamento').fill('Texto 🦄');
  await page.getByRole('button', { name: 'Descargar reglamento PDF' }).click();
  await expect(page.getByText(/U\+1F984/)).toBeVisible();
});

test('listado usa la tanda 2/3/1, valida cantidades y revisión entre pestañas', async ({ page, context }) => {
  await createExample(page);
  const game = await readGame(page);
  await page.getByRole('navigation').getByRole('link', { name: 'Exportar / imprimir', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Descargar listado PDF' })).toBeDisabled();
  for (const [index, card] of game.data.cards.slice(0, 3).entries()) {
    await page.getByRole('checkbox', { name: card.name, exact: true }).check();
    await page.getByLabel(`Cantidad de ${card.name}`, { exact: true }).fill(String([2, 3, 1][index]));
  }
  const letter = await downloadPdf(page, 'Descargar listado PDF', 'listado-carta');
  expect(letter.getPageCount()).toBe(1);
  await expect(page.getByText(/3 diseños · 6 copias/)).toBeVisible();
  await page.getByRole('combobox', { name: 'Papel', exact: true }).selectOption('a4');
  const a4 = await downloadPdf(page, 'Descargar listado PDF', 'listado-a4');
  expect(a4.getPage(0).getWidth()).toBeCloseTo(210 * 72 / 25.4);
  const quantity = page.getByLabel(`Cantidad de ${game.data.cards[0].name}`, { exact: true });
  await quantity.fill('1.5'); await expect(page.getByRole('button', { name: 'Descargar listado PDF' })).toBeDisabled();
  await quantity.fill('2');
  const second = await context.newPage(); await second.goto(page.url());
  await second.getByRole('navigation').getByRole('link', { name: 'Reglamento', exact: true }).click();
  await second.getByLabel('Texto del reglamento').fill('Nueva revisión');
  await second.getByRole('button', { name: 'Guardar reglamento', exact: true }).click();
  await expect(second.getByRole('button', { name: 'Guardar reglamento', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Descargar listado PDF' }).click();
  await expect(page.locator('.export-feedback')).toContainText('Otra pestaña cambió el juego');
  await expect(quantity).toHaveValue('2');
});

test('guía y protección de borradores conservan la ruta de publicación', async ({ page }) => {
  await createExample(page);
  await page.getByRole('navigation').getByRole('link', { name: 'Reglamento', exact: true }).click();
  await page.getByLabel('Texto del reglamento').fill('Cambios nuevos');
  await page.getByRole('link', { name: 'Guía de uso', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar y salir', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Guía de uso', exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/guia/`);
  await page.reload(); await expect(page.getByText('Validación física pendiente:', { exact: true })).toBeVisible();
});

test('listado largo permite imágenes pendientes y repite encabezados al paginar', async ({ page }) => {
  const game = structuredClone(demoGame);
  game.cards = Array.from({ length: 60 }, (_, i) => ({ ...structuredClone(game.cards[0]), id: `list-${i}`, name: `Carta ${i + 1}: energía y protección en las tierras de la Forja` }));
  await page.goto(appUrl('/'));
  await page.getByLabel('Importar archivo JSON').setInputFiles({ name: 'juego.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(game)) });
  await page.getByRole('button', { name: 'Crear copia independiente' }).click();
  await page.getByRole('link', { name: 'Abrir juego' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Exportar / imprimir', exact: true }).click();
  await expect(page.locator('.image-recovery')).toContainText('pendientes');
  for (const checkbox of await page.locator('.selection-list input[type=checkbox]').all()) await checkbox.check();
  const pdf = await downloadPdf(page, 'Descargar listado PDF', 'listado-largo');
  expect(pdf.getPageCount()).toBeGreaterThan(2);
  await page.getByRole('button', { name: 'Descargar PDF de la selección', exact: true }).click();
  await expect(page.locator('.export-feedback')).toContainText('Imagen pendiente');
});
