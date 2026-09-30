import { test, expect } from '@playwright/test';
import { createExample, openCentinela, readGame } from './helpers';

test('referencias visuales A/B con fuente e imágenes locales cargadas', async ({ page }) => {
  await createExample(page); await openCentinela(page);
  const canvas = page.locator('.card-canvas canvas');
  await expect(canvas).toBeVisible();
  await expect(page.locator('.visual-preview [role=alert]')).toHaveCount(0);
  await expect(canvas).toHaveScreenshot('template-a.png', { maxDiffPixelRatio: .02 });
  await page.getByRole('combobox', { name: 'Plantilla', exact: true }).selectOption('text');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveScreenshot('template-b.png', { maxDiffPixelRatio: .02 });
});

test('los doce ejemplos se pueden abrir y conservan los diagnósticos de texto largo', async ({ page }) => {
  await createExample(page);
  const { data } = await readGame(page);
  let overflow = 0;
  for (const card of data.cards) {
    await page.getByRole('link', { name: new RegExp(card.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
    await expect(page.locator('.card-canvas canvas')).toBeVisible();
    await expect(page.getByLabel('Nombre de la carta')).toHaveValue(card.name);
    if ((await page.locator('.visual-preview').innerText()).includes('el texto no cabe')) overflow++;
    await page.getByRole('navigation').getByRole('link', { name: 'Cartas', exact: true }).click();
  }
  expect(overflow).toBeGreaterThan(0);
});
