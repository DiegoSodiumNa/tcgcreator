import { appUrl } from './urls';
import { test, expect, type Page } from '@playwright/test';
import { createExample, readGame } from './helpers';

async function editShield(page: Page) {
  await createExample(page);
  await page.getByRole('navigation', { name: 'Secciones del juego' }).getByRole('link', { name: 'Configuración', exact: true }).click();
  await page.getByRole('navigation', { name: 'Catálogos del juego' }).getByRole('link', { name: 'Habilidades', exact: true }).click();
  await page.getByRole('link', { name: 'Editar Escudo {amount}', exact: true }).click();
}
test('cancelar una habilidad compartida no escribe y confirmar actualiza todas las referencias', async ({ page }) => {
  await editShield(page); const before = await readGame(page);
  await page.getByLabel('Nombre del concepto').fill('Protección {amount}');
  await page.getByLabel('Recordatorio').fill('Reduce {amount} puntos de daño.');
  await page.getByRole('button', { name: 'Guardar concepto' }).click();
  const review = page.getByRole('dialog', { name: 'Revisar habilidad compartida' });
  await expect(review).toContainText('3 cartas afectadas, 3 usos');
  await expect(review).toContainText('Escudo 3'); await expect(review).toContainText('Protección 3'); await expect(review).toContainText('Protección 2');
  await review.getByRole('button', { name: 'Cancelar', exact: true }).click(); expect(await readGame(page)).toEqual(before);
  await page.getByRole('button', { name: 'Guardar concepto' }).click(); await review.getByRole('button', { name: 'Confirmar actualización' }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  const after = await readGame(page);
  expect(after.revision).toBe(before.revision + 1); expect(after.data.cards).toEqual(before.data.cards);
  expect(after.data.definitions.abilities[1].name).toBe('Protección {amount}');
  await page.getByRole('navigation', { name: 'Secciones del juego' }).getByRole('link', { name: 'Cartas', exact: true }).click();
  await page.getByRole('link', { name: /Centinela Mecánico/ }).click();
  await expect(page.getByRole('region', { name: 'Vista de contenido' })).toContainText('Protección 3: Reduce 3 puntos de daño.');
});

test('migra parámetros por uso, bloquea vacíos y permite retirar los obsoletos', async ({ page }) => {
  await editShield(page); const before = await readGame(page);
  await page.getByLabel('Nombre del concepto').fill('Escudo {cantidad}');
  await page.getByLabel('Recordatorio').fill('Reduce {cantidad} contra {objetivo}.');
  await page.getByLabel('Clave del parámetro 1', { exact: true }).fill('cantidad');
  await page.getByRole('button', { name: 'Añadir parámetro', exact: true }).click();
  await page.getByLabel('Clave del parámetro 2', { exact: true }).fill('objetivo');
  await page.getByLabel('Nombre del parámetro 2', { exact: true }).fill('Objetivo');
  await page.getByRole('combobox', { name: 'Formato del parámetro 2', exact: true }).selectOption('text');
  await page.getByRole('button', { name: 'Guardar concepto' }).click();
  const review = page.getByRole('dialog', { name: 'Revisar habilidad compartida' });
  await expect(review).toContainText('Parámetros que se retirarán: Cantidad');
  await review.getByRole('button', { name: 'Confirmar actualización' }).click();
  await expect(review.getByRole('alert')).toHaveCount(6); expect(await readGame(page)).toEqual(before);
  const names = ['Centinela Mecánico', 'Égida del Río', 'Autómata del Crepúsculo'];
  for (let index = 0; index < names.length; index++) {
    await review.getByRole('textbox', { name: new RegExp(`^Cantidad — ${names[index]}`) }).fill(String(index));
    await review.getByRole('textbox', { name: new RegExp(`^Objetivo — ${names[index]}`) }).fill(`unidad ${index}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await review.evaluate(element => { element.scrollTop = 0; });
  await page.screenshot({ path: 'test-results/shared-ability-mobile.png' });
  await review.getByRole('button', { name: 'Confirmar actualización' }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  const after = await readGame(page);
  const uses = after.data.cards.flatMap(card => card.abilities.filter(use => use.definitionId === before.data.definitions.abilities[1].id));
  expect(uses.map(use => use.parameters)).toEqual([{ cantidad: 0, objetivo: 'unidad 0' }, { cantidad: 1, objetivo: 'unidad 1' }, { cantidad: 2, objetivo: 'unidad 2' }]);
  expect(uses.map(use => use.showReminder)).toEqual([true, false, true]);
  await page.getByLabel('Clase de habilidad').selectOption('keyword');
  await page.getByLabel('Nombre del concepto').fill('Protección'); await page.getByLabel('Recordatorio').fill('');
  await page.getByRole('button', { name: 'Guardar concepto' }).click();
  await expect(review).toContainText('Parámetros que se retirarán: Cantidad, Objetivo');
  await review.getByRole('button', { name: 'Confirmar actualización' }).click();
  await expect(page.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  expect((await readGame(page)).data.cards[4].abilities[0].parameters).toEqual({});
});

test('una revisión de habilidad no sobrescribe el juego cambiado desde otra pestaña', async ({ page, context }) => {
  await editShield(page); const before = await readGame(page);
  const second = await context.newPage(); await second.goto(appUrl(`/configuracion/?game=${before.id}`));
  await expect(second.getByLabel('Nombre del juego', { exact: true })).toBeVisible();
  await page.getByLabel('Nombre del concepto').fill('Protección {amount}'); await page.getByRole('button', { name: 'Guardar concepto' }).click();
  await expect(page.getByRole('dialog', { name: 'Revisar habilidad compartida' })).toBeVisible();
  await second.getByLabel('Nombre del juego', { exact: true }).fill('Cambio externo');
  await second.getByRole('button', { name: 'Guardar juego', exact: true }).click();
  await expect(second.getByText('Guardado en este navegador', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar actualización' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Otra pestaña cambió');
  const after = await readGame(page);
  expect(after.data.game.name).toBe('Cambio externo'); expect(after.data.cards).toEqual(before.data.cards); expect(after.data.definitions).toEqual(before.data.definitions);
  await expect(page.getByLabel('Nombre del concepto')).toHaveValue('Protección {amount}'); await second.close();
});
