import { test, expect, type Page } from '@playwright/test';
import { createExample, openCentinela, readGame } from './helpers';

async function save(page: Page) {
  await page.getByRole('button', { name: 'Guardar carta', exact: true }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar carta', exact: true })).toBeDisabled();
}
async function addAbility(page: Page, name: string) {
  await page.getByRole('combobox', { name: 'Añadir habilidad', exact: true }).selectOption({ label: name });
  await page.getByRole('button', { name: 'Añadir habilidad a la carta' }).click();
}

test('crea una carta con atributos combinados, clasificación, habilidades ordenadas y persistencia', async ({ page }) => {
  await createExample(page);
  await page.getByRole('link', { name: 'Crear carta', exact: true }).click();
  await page.getByLabel('Nombre de la carta').fill('Prototipo nuevo');
  await page.getByRole('checkbox', { name: 'Unidad', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Artefacto', exact: true }).check();
  await expect(page.getByRole('textbox', { name: /^Resistencia/ })).toHaveCount(1);
  for (const name of ['Legendario', 'Guardián', 'Máquina', 'Activado']) await page.getByRole('checkbox', { name, exact: true }).check();
  await page.getByRole('textbox', { name: /^Resistencia/ }).fill('0');
  await page.getByRole('textbox', { name: /^Ataque/ }).fill('5');
  await page.getByLabel('Coste', { exact: true }).fill('2 energía');
  await page.getByRole('combobox', { name: 'Afinidad', exact: true }).selectOption('Agua');
  await page.getByLabel('Texto de la carta').fill('Texto libre con acentos.');
  await addAbility(page, 'Volar'); await addAbility(page, 'Escudo {amount}');
  await page.getByLabel('Cantidad — habilidad 2').fill('3');
  await page.getByRole('button', { name: 'Subir habilidad 2', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Mostrar recordatorio — habilidad 2', exact: true }).uncheck();
  const preview = page.getByRole('region', { name: 'Vista de contenido' });
  await expect(preview).toContainText('Escudo 3'); await expect(preview).toContainText('Previene 3 puntos de daño.');
  await expect(preview).not.toContainText('Solo puede ser bloqueada');
  await save(page); await page.reload();
  await expect(page.getByLabel('Cantidad — habilidad 1')).toHaveValue('3');
  await expect(page.getByRole('checkbox', { name: 'Activado', exact: true })).toBeChecked();
  const stored = await readGame(page); const card = stored.data.cards.at(-1)!;
  expect(stored.data.cards).toHaveLength(13);
  expect(card.attributeValues[stored.data.definitions.attributes[0].id]).toBe(0);
  expect(card.visual).toMatchObject({ templateId: 'illustration', attributeSlots: [null, null, null, null], illustrationId: null });
  await page.getByRole('heading', { name: 'Editor de carta', exact: true }).click(); await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/card-content-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/card-content-mobile.png', fullPage: true });
});

test('retirar un tipo revisa las pérdidas, cancelar conserva el borrador y confirmar mantiene valores compartidos', async ({ page }) => {
  await createExample(page); await openCentinela(page); const before = await readGame(page);
  await page.getByRole('checkbox', { name: 'Unidad', exact: true }).click();
  const review = page.getByRole('dialog', { name: 'Revisar retirada de tipos' });
  await expect(review).toContainText('Guardián'); await expect(review).toContainText('Retirar Ataque: 2');
  await expect(review).toContainText('Vaciar espacios: 2'); await expect(review).not.toContainText('Retirar Resistencia');
  await review.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Unidad', exact: true })).toBeChecked(); expect(await readGame(page)).toEqual(before);
  await page.getByRole('checkbox', { name: 'Unidad', exact: true }).click();
  await review.getByRole('button', { name: 'Confirmar retirada' }).click();
  await expect(page.getByRole('checkbox', { name: 'Guardián', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: /^Resistencia/ })).toHaveValue('3'); expect(await readGame(page)).toEqual(before);
  await save(page);
  const after = await readGame(page); const card = after.data.cards[4];
  expect(card.typeIds).toEqual([before.data.definitions.types[1].id]);
  expect(card.visual.attributeSlots[1]).toBeNull(); expect(card.visual.illustrationId).toBe(before.data.cards[4].visual.illustrationId);
});

test('validación de nombre, tipos y números no escribe hasta corregir los campos', async ({ page }) => {
  await createExample(page); const before = await readGame(page);
  await page.getByRole('link', { name: 'Crear carta', exact: true }).click(); await page.getByLabel('Nombre de la carta').fill(' ');
  await page.getByRole('button', { name: 'Guardar carta' }).click();
  await expect(page.getByText('Escribe un nombre para la carta.', { exact: true })).toBeVisible();
  await expect(page.getByText('Selecciona al menos un tipo.', { exact: true })).toBeVisible();
  await page.getByLabel('Nombre de la carta').fill('Corregida'); await page.getByRole('checkbox', { name: 'Unidad', exact: true }).check();
  await page.getByRole('textbox', { name: /^Resistencia/ }).fill(''); await page.getByRole('button', { name: 'Guardar carta' }).click();
  await expect(page.getByText('Introduce un número finito; el campo no puede quedar vacío.', { exact: true })).toBeVisible();
  expect(await readGame(page)).toEqual(before);
  await page.getByRole('textbox', { name: /^Resistencia/ }).fill('0'); await save(page);
});

test('duplica imágenes por referencia y elimina solo la carta tras confirmar', async ({ page }) => {
  await createExample(page); const before = await readGame(page);
  async function imageCount() { return page.evaluate(() => new Promise<number>(resolve => { const request = indexedDB.open('forja-local-v1'); request.onsuccess = () => { const db = request.result; const count = db.transaction('images').objectStore('images').count(); count.onsuccess = () => { resolve(count.result); db.close(); }; }; })); }
  const count = await imageCount();
  await page.getByRole('button', { name: 'Duplicar Centinela Mecánico', exact: true }).click(); await expect(page.locator('.card-tile')).toHaveCount(13);
  const duplicate = (await readGame(page)).data.cards.at(-1)!;
  expect(duplicate.id).not.toBe(before.data.cards[4].id); expect(duplicate.visual).toEqual(before.data.cards[4].visual); expect(await imageCount()).toBe(count);
  await page.getByRole('button', { name: 'Eliminar Centinela Mecánico (copia)', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click(); await expect(page.locator('.card-tile')).toHaveCount(13);
  await page.getByRole('button', { name: 'Eliminar Centinela Mecánico (copia)', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click(); await expect(page.locator('.card-tile')).toHaveCount(12);
  expect((await readGame(page)).data.cards).toEqual(before.data.cards); expect(await imageCount()).toBe(count);
});

test('un juego sin tipos orienta a configurarlos antes de crear cartas', async ({ page }) => {
  await page.goto('/'); await page.getByLabel('Nombre del nuevo juego').fill('Vacío');
  await page.getByRole('button', { name: 'Crear juego', exact: true }).click(); await page.getByRole('link', { name: 'Abrir juego', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Crear carta', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Configurar tipos', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Crear tipo', exact: true })).toBeVisible();
});
