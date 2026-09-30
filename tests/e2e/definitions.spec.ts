import { appUrl } from './urls';
import { test, expect, type Page } from '@playwright/test';
import { createExample } from './helpers';
import type { StoredGame } from '../../src/storage/repository';

async function catalog(page: Page, name: string) { await page.getByRole('navigation', { name: 'Catálogos del juego' }).getByRole('link', { name, exact: true }).click(); }
async function start(page: Page, label: string, name: string) {
  await page.getByRole('link', { name: `Crear ${label}`, exact: true }).click();
  await page.getByLabel('Nombre del concepto', { exact: true }).fill(name);
}
async function save(page: Page) {
  await page.getByRole('button', { name: 'Guardar concepto', exact: true }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar concepto', exact: true })).toBeDisabled();
}
async function readGame(page: Page): Promise<StoredGame> {
  return page.evaluate(() => new Promise<StoredGame>((resolve, reject) => {
    const request = indexedDB.open('forja-local-v1');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction('games').objectStore('games').getAll();
      read.onsuccess = () => { resolve(read.result[0]); db.close(); };
      read.onerror = () => { reject(read.error); db.close(); };
    };
  }));
}
async function exampleSettings(page: Page) {
  await createExample(page);
  await page.getByRole('navigation', { name: 'Secciones del juego' }).getByRole('link', { name: 'Configuración', exact: true }).click();
}

test('configura desde cero los seis catálogos y los cuatro formatos de atributo', async ({ page }) => {
  await page.goto(appUrl('/')); await page.getByLabel('Nombre del nuevo juego').fill('Mundo nuevo');
  await page.getByRole('button', { name: 'Crear juego', exact: true }).click();
  await page.getByRole('link', { name: 'Renombrar', exact: true }).click();
  await catalog(page, 'Supertipos'); await start(page, 'supertipo', 'Legendario'); await save(page);
  await catalog(page, 'Atributos'); await start(page, 'atributo', 'Nota'); await save(page);
  await catalog(page, 'Atributos'); await start(page, 'atributo', 'Fuerza');
  await page.getByLabel('Formato del atributo').selectOption('number');
  await page.getByLabel('Valor inicial numérico').fill('0');
  await page.getByLabel('Mínimo (opcional)').fill('0'); await page.getByLabel('Máximo (opcional)').fill('10'); await save(page);
  await catalog(page, 'Atributos'); await start(page, 'atributo', 'Disponible');
  await page.getByLabel('Formato del atributo').selectOption('boolean'); await save(page);
  await catalog(page, 'Atributos'); await start(page, 'atributo', 'Color');
  await page.getByLabel('Formato del atributo').selectOption('select');
  await page.getByLabel('Opciones (una por línea)').fill('Rojo\nAzul');
  await page.getByLabel('Opción inicial').selectOption('Azul'); await save(page);
  await catalog(page, 'Tipos'); await start(page, 'tipo', 'Unidad');
  await page.getByRole('checkbox', { name: 'Fuerza', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Disponible', exact: true }).check(); await save(page);
  await catalog(page, 'Subtipos'); await start(page, 'subtipo', 'Guardián');
  await page.getByLabel('Tipo al que pertenece').selectOption({ label: 'Unidad' }); await save(page);
  await catalog(page, 'Recursos'); await start(page, 'recurso', 'Energía'); await save(page);
  await catalog(page, 'Habilidades'); await start(page, 'habilidad', 'Volar');
  await page.getByLabel('Recordatorio').fill('Puede volar.'); await save(page);
  await page.reload();
  await expect(page.getByLabel('Nombre del concepto')).toHaveValue('Volar');
  const stored = await readGame(page);
  expect(stored.data.definitions.attributes.map(item => item.defaultValue)).toEqual(['', 0, false, 'Azul']);
  expect(stored.data.definitions.types[0].attributeIds).toHaveLength(2);
  expect(stored.data.definitions.subtypes[0].typeId).toBe(stored.data.definitions.types[0].id);
  expect(stored.data.cards).toEqual([]);
});

test('renombrar conserva referencias y eliminar conceptos usados muestra sus dependencias', async ({ page }) => {
  await exampleSettings(page);
  const initial = await readGame(page);
  await catalog(page, 'Tipos'); await page.getByRole('link', { name: 'Editar Unidad', exact: true }).click();
  await page.getByLabel('Nombre del concepto').fill('Criatura'); await save(page);
  await page.screenshot({ path: 'test-results/settings-desktop.png', fullPage: true });
  const renamed = await readGame(page);
  expect(renamed.data.definitions.types[0].id).toBe(initial.data.definitions.types[0].id);
  expect(renamed.data.cards).toEqual(initial.data.cards);
  await catalog(page, 'Tipos'); await page.getByRole('button', { name: 'Eliminar Criatura', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'No se puede eliminar' });
  await expect(dialog).toContainText('Guardián'); await expect(dialog).toContainText('Centinela Mecánico');
  await expect(dialog.getByRole('button', { name: 'Eliminar definitivamente' })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await catalog(page, 'Atributos'); await page.getByRole('button', { name: 'Eliminar Resistencia', exact: true }).click();
  await expect(dialog).toContainText('Criatura'); await expect(dialog).toContainText('Artefacto');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await catalog(page, 'Supertipos'); await start(page, 'supertipo', 'Temporal'); await save(page);
  await catalog(page, 'Supertipos'); await page.getByRole('button', { name: 'Eliminar Temporal', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Editar Temporal', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar Temporal', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(page.getByRole('link', { name: 'Editar Temporal', exact: true })).toHaveCount(0);
});

test('revisa asignaciones: cancelar no escribe, confirmar inicializa y retirar respeta atributos compartidos', async ({ page }) => {
  await exampleSettings(page);
  await catalog(page, 'Atributos'); await start(page, 'atributo', 'Velocidad');
  await page.getByLabel('Formato del atributo').selectOption('number'); await save(page);
  await catalog(page, 'Tipos'); await page.getByRole('link', { name: 'Editar Unidad', exact: true }).click();
  const before = await readGame(page);
  await page.getByRole('checkbox', { name: 'Velocidad', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar concepto' }).click();
  const review = page.getByRole('dialog', { name: 'Revisar cambios en cartas' });
  await expect(review).toContainText('Centinela Mecánico'); await expect(review).toContainText('Añadir: Velocidad = 0');
  await review.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(await readGame(page)).toEqual(before);
  await expect(page.getByRole('checkbox', { name: 'Velocidad', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Guardar concepto' }).click();
  await review.getByRole('button', { name: 'Confirmar cambios' }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  const added = await readGame(page);
  const speed = added.data.definitions.attributes.find(item => item.name === 'Velocidad')!.id;
  expect(added.data.cards.filter(card => card.typeIds.includes(added.data.definitions.types[0].id)).every(card => card.attributeValues[speed] === 0)).toBe(true);
  await page.getByRole('checkbox', { name: 'Resistencia', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Guardar concepto' }).click();
  await expect(review).toContainText('Vaciar espacios: 1');
  await expect(review).not.toContainText('Centinela Mecánico');
  await review.getByRole('button', { name: 'Confirmar cambios' }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  const removed = await readGame(page);
  const resistance = removed.data.definitions.attributes.find(item => item.name === 'Resistencia')!.id;
  expect(removed.data.cards[0].attributeValues).not.toHaveProperty(resistance);
  expect(removed.data.cards[0].visual.attributeSlots[0]).toBeNull();
  expect(removed.data.cards[4].attributeValues[resistance]).toBe(3);
});

test('valida campos y bloquea restricciones o subtipos incompatibles', async ({ page }) => {
  await exampleSettings(page); await catalog(page, 'Atributos');
  await page.getByRole('link', { name: 'Editar Resistencia', exact: true }).click();
  const original = await readGame(page);
  await page.getByLabel('Valor inicial numérico').fill(''); await page.getByRole('button', { name: 'Guardar concepto' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Introduce un número válido');
  await page.getByLabel('Valor inicial numérico').fill('1'); await page.getByLabel('Máximo (opcional)').fill('1');
  await page.getByRole('button', { name: 'Guardar concepto' }).click();
  await expect(page.getByRole('region', { name: 'Dependencias del cambio' })).toContainText('Centinela Mecánico');
  expect(await readGame(page)).toEqual(original);
  await page.getByRole('button', { name: 'Descartar cambios', exact: true }).click();
  await catalog(page, 'Subtipos'); await page.getByRole('link', { name: 'Editar Guardián', exact: true }).click();
  await page.getByLabel('Tipo al que pertenece').selectOption({ label: 'Artefacto' });
  await page.getByRole('button', { name: 'Guardar concepto' }).click();
  await expect(page.getByRole('region', { name: 'Dependencias del cambio' })).toContainText('No se puede cambiar el tipo');
  expect(await readGame(page)).toEqual(original);
});

test('crea habilidades parametrizadas válidas y permite revisar las que ya tienen usos', async ({ page }) => {
  await exampleSettings(page); await catalog(page, 'Habilidades'); await start(page, 'habilidad', 'Empuje {cantidad}');
  await page.getByLabel('Clase de habilidad').selectOption('parameterized');
  await page.getByRole('button', { name: 'Añadir parámetro' }).click();
  await page.getByLabel('Clave del parámetro 1', { exact: true }).fill('n');
  await page.getByLabel('Nombre del parámetro 1', { exact: true }).fill('Cantidad');
  await page.getByRole('button', { name: 'Guardar concepto' }).click();
  await expect(page.getByRole('main').getByText(/Define los parámetros usados/)).toBeVisible();
  await page.getByLabel('Clave del parámetro 1', { exact: true }).fill('cantidad'); await save(page);
  await page.getByLabel('Nombre del concepto').fill('Empujar {cantidad}'); await save(page);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/settings-mobile.png', fullPage: true });
  await catalog(page, 'Habilidades'); await page.getByRole('link', { name: 'Editar Volar', exact: true }).click();
  await expect(page.getByLabel('Nombre del concepto')).toBeEnabled();
  await expect(page.getByText('Ícaro, Guardián Aéreo', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar concepto' })).toBeDisabled();
});

test('guarda y reutiliza símbolos sin borrarlos al eliminar su recurso', async ({ page }) => {
  await exampleSettings(page); await catalog(page, 'Recursos'); await start(page, 'recurso', 'Maná');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV9sAAAAASUVORK5CYII=', 'base64');
  await page.getByLabel('Cargar símbolo').setInputFiles({ name: 'mana.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByAltText('Símbolo del concepto')).toBeVisible(); await save(page);
  await page.reload(); await expect(page.getByAltText('Símbolo del concepto')).toBeVisible();
  await catalog(page, 'Atributos'); await start(page, 'atributo', 'Coste adicional');
  await page.getByRole('combobox', { name: 'Símbolo', exact: true }).selectOption({ label: 'mana.png' }); await save(page);
  await catalog(page, 'Recursos'); await page.getByRole('button', { name: 'Eliminar Maná', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(page.getByRole('button', { name: 'Eliminar Maná', exact: true })).toHaveCount(0);
  await catalog(page, 'Atributos'); await page.getByRole('link', { name: 'Editar Coste adicional', exact: true }).click();
  await expect(page.getByAltText('Símbolo del concepto')).toBeVisible();
  const bytes = await page.getByAltText('Símbolo del concepto').evaluate(async image => Array.from(new Uint8Array(await (await fetch((image as HTMLImageElement).src)).arrayBuffer())));
  expect(Buffer.from(bytes)).toEqual(png);
});

test('una revisión pendiente no sobrescribe un cambio guardado desde otra pestaña', async ({ page, context }) => {
  await exampleSettings(page); await catalog(page, 'Tipos'); await page.getByRole('link', { name: 'Editar Unidad', exact: true }).click();
  const initial = await readGame(page);
  const second = await context.newPage(); await second.goto(appUrl(`/configuracion/?game=${initial.id}`));
  await expect(second.getByLabel('Nombre del juego', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Activado', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar concepto' }).click();
  await expect(page.getByRole('dialog', { name: 'Revisar cambios en cartas' })).toBeVisible();
  await second.getByLabel('Nombre del juego', { exact: true }).fill('Cambio de otra pestaña');
  await second.getByRole('button', { name: 'Guardar juego', exact: true }).click();
  await expect(second.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar cambios' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Otra pestaña cambió');
  const stored = await readGame(page);
  expect(stored.data.game.name).toBe('Cambio de otra pestaña');
  expect(stored.data.definitions).toEqual(initial.data.definitions); expect(stored.data.cards).toEqual(initial.data.cards);
  await page.getByRole('button', { name: 'Recargar versión guardada' }).click();
  await page.getByRole('button', { name: 'Descartar y recargar' }).click();
  await expect(page.getByRole('checkbox', { name: 'Activado', exact: true })).not.toBeChecked();
  await second.close();
});

test('guardar al salir de un catálogo también requiere revisar los cambios en cartas', async ({ page }) => {
  await exampleSettings(page); await catalog(page, 'Tipos'); await page.getByRole('link', { name: 'Editar Unidad', exact: true }).click();
  const before = await readGame(page);
  await page.getByRole('checkbox', { name: 'Activado', exact: true }).check();
  await catalog(page, 'Recursos');
  await page.getByRole('button', { name: 'Guardar y salir' }).click();
  const review = page.getByRole('dialog', { name: 'Revisar cambios en cartas' });
  await expect(review).toBeVisible(); await review.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Activado', exact: true })).toBeChecked();
  expect(await readGame(page)).toEqual(before);
  await catalog(page, 'Recursos'); await page.getByRole('button', { name: 'Guardar y salir' }).click();
  await review.getByRole('button', { name: 'Confirmar cambios' }).click();
  await expect(page.getByRole('link', { name: 'Crear recurso', exact: true })).toBeVisible();
  expect((await readGame(page)).revision).toBe(before.revision + 1);
});
