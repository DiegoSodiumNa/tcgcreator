import { appUrl } from './urls';
import { test, expect } from '@playwright/test';
import { createExample, openCentinela } from './helpers';

test('recorrido, guardado y recarga sobre los archivos estáticos', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await createExample(page); await openCentinela(page);
  await page.getByLabel('Nombre de la carta').fill('Prueba guardada');
  await page.getByRole('button', { name: 'Guardar carta', exact: true }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Nombre de la carta')).toHaveValue('Prueba guardada');
  for (const [label, title] of [['Configuración', 'Las bases de tu juego'], ['Reglamento', 'Cómo se juega'], ['Exportar / imprimir', 'De la pantalla a la mesa']]) {
    await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.reload(); await expect(page.getByRole('heading', { name: title })).toBeVisible();
  }
  await page.getByRole('link', { name: /Mis juegos/ }).click();
  await expect(page.getByRole('heading', { name: 'Tus ideas empiezan aquí.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('acceso directo, búsqueda, filtros y cantidades', async ({ page }) => {
  const game = await createExample(page);
  await page.goto(appUrl(`/cartas/?game=${game}`));
  await page.getByLabel('Buscar cartas').fill('egida');
  await expect(page.getByRole('heading', { name: 'Égida del Río' })).toBeVisible();
  await page.getByLabel('Filtrar por tipo').selectOption({ label: 'Unidad' });
  await expect(page.getByRole('heading', { name: 'No hay cartas que coincidan' })).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page.locator('.card-tile')).toHaveCount(12);
  await page.goto(appUrl(`/exportar/?game=${game}`));
  await page.getByLabel('Guardián de la Forja', { exact: true }).check();
  await page.getByLabel('Cantidad de Guardián de la Forja').fill('3');
  await expect(page.getByRole('status').filter({ hasText: '1 diseños · 3 copias · 1 hojas' })).toBeVisible();
});

test('identificadores desconocidos tienen una salida navegable', async ({ page }) => {
  const game = await createExample(page);
  await page.goto(appUrl(`/editor/?game=${game}&card=unknown`));
  await expect(page.getByRole('heading', { name: 'Carta no encontrada' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver a Cartas' }).click();
  await expect(page.getByRole('heading', { name: 'Tu colección de cartas' })).toBeVisible();
  await page.goto(appUrl('/cartas/?game=unknown'));
  await expect(page.getByRole('heading', { name: 'Juego no encontrado' })).toBeVisible();
});

test('pantalla pequeña conserva navegación y no desborda', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createExample(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

test('captura del inicio', async ({ page }) => {
  await createExample(page); await page.getByRole('link', { name: 'Mis juegos', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Abrir juego' })).toBeVisible();
  await page.screenshot({ path: 'test-results/home.png', fullPage: true });
});
