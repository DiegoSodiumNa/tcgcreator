import { appUrl } from './urls';
import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib';

test('descarga PNG y PDF con geometría física verificable', async ({ page }) => {
  // Two binary downloads and disk writes can exceed 30s under concurrent CI load.
  test.setTimeout(60_000);
  await page.goto(appUrl('/exportar/'));
  await expect(page.getByRole('button', { name: 'Descargar PNG', exact: true })).toBeEnabled();
  await mkdir('output/pdf', { recursive: true });
  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar PNG', exact: true }).click();
  await (await pngDownload).saveAs('output/pdf/centinela-mecanico.png');
  const png = await readFile('output/pdf/centinela-mecanico.png');
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(744);
  expect(png.readUInt32BE(20)).toBe(1039);
  const pdfDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar PDF de prueba' }).click();
  await (await pdfDownload).saveAs('output/pdf/prueba-impresion-forja.pdf');
  const pdf = await PDFDocument.load(await readFile('output/pdf/prueba-impresion-forja.pdf'));
  expect(pdf.getPageCount()).toBe(1);
  const sheet = pdf.getPage(0);
  expect(sheet.getWidth()).toBeCloseTo(612, 5);
  expect(sheet.getHeight()).toBeCloseTo(792, 5);
  const contents = sheet.node.Contents();
  const streams = contents && 'asArray' in contents ? contents.asArray() : [contents];
  const decoded = streams.map(ref => {
    const stream = pdf.context.lookup(ref!);
    return stream instanceof PDFRawStream ? Buffer.from(decodePDFRawStream(stream).decode()).toString() : '';
  }).join('\n');
  // Inspect actual drawing operators, not values imported from the implementation.
  const matrices = [...decoded.matchAll(/([\d.]+) 0 0 ([\d.]+) 0 0 cm/g)].map(m => [Number(m[1]), Number(m[2])]);
  expect(matrices.some(([w, h]) => Math.abs(w - 63 * 72 / 25.4) < .001 && Math.abs(h - 88 * 72 / 25.4) < .001)).toBe(true);
  expect(decoded).toContain(String(50 * 72 / 25.4));
  const resources = sheet.node.Resources();
  expect(resources?.has(PDFName.of('Font'))).toBe(true);
  await page.screenshot({ path: 'test-results/proof-desktop.png', fullPage: true });
});

test('espera la fuente y bloquea la exportación ante error de imagen', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/fonts/NotoSans-Regular.ttf', async route => { await gate; await route.continue(); });
  await page.goto(appUrl('/exportar/'));
  await expect(page.getByRole('button', { name: 'Descargar PNG', exact: true })).toBeDisabled();
  release();
  await expect(page.getByRole('button', { name: 'Descargar PNG', exact: true })).toBeEnabled();
  await page.unroute('**/fonts/NotoSans-Regular.ttf');
  await page.route('**/images/forja.svg', route => route.fulfill({ status: 404, body: 'Missing' }));
  await page.reload();
  await expect(page.getByRole('region', { name: 'Centinela Mecánico' }).getByRole('alert')).toContainText('No se pudo cargar');
  await expect(page.getByRole('button', { name: 'Descargar PDF de prueba' })).toBeDisabled();
  await page.unroute('**/images/forja.svg');
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('button', { name: 'Descargar PNG', exact: true })).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/proof-mobile.png', fullPage: true });
});
