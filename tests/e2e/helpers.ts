import { expect, type Page } from '@playwright/test';
import type { StoredGame } from '../../src/storage/repository';
export async function readGame(page: Page): Promise<StoredGame> {
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
export async function createExample(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Crear juego de ejemplo', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Abrir juego' })).toBeVisible();
  await page.getByRole('link', { name: 'Abrir juego' }).click();
  await expect(page.locator('.card-tile')).toHaveCount(12);
  return new URL(page.url()).searchParams.get('game')!;
}
export async function openCentinela(page: Page) {
  await page.getByRole('link', { name: /Centinela Mecánico/ }).click();
  await expect(page.getByLabel('Nombre de la carta')).toHaveValue('Centinela Mecánico');
}
