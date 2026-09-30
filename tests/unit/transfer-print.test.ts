import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoGame } from '../../src/fixtures/demo-game';
import { copyGame, importCopy, imageUses, readGameJson, removeImageReference, serializeGame } from '../../src/domain/game-transfer';
import { parseGameFile } from '../../src/domain/rules';
import { GameDatabase, GameRepository, gameFile } from '../../src/storage/repository';
import { composeWithMeasure, imageCrop, layoutFor } from '../../src/rendering/composition';
import { countSelection, cutLines, DEFAULT_PRINT, pageCards, printLayout } from '../../src/export/print-layout';

const databases: GameDatabase[] = [];
const repo = () => { const db = new GameDatabase(`transfer-${crypto.randomUUID()}`); databases.push(db); return new GameRepository(db); };
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(databases.splice(0).map(db => db.delete())); });
describe('respaldo y recuperación', () => {
  it('conserva datos visuales y parámetros, sin bytes ni estado local', () => {
    const json = serializeGame(demoGame, '2026-09-30T00:00:00.000Z');
    expect(readGameJson(json)).toEqual({ ...demoGame, exportedAt: '2026-09-30T00:00:00.000Z' });
    expect(json).not.toMatch(/blob:|data:image|lastExportedAt|revision/);
    const one = importCopy(readGameJson(json), [demoGame.game.name + ' (copia)']);
    const two = copyGame(demoGame);
    expect(one.game.name).toBe(demoGame.game.name + ' (copia 2)');
    expect(one.game.id).not.toBe(two.game.id);
    expect(one.cards.map(c => c.visual.colors)).toEqual(demoGame.cards.map(c => c.visual.colors));
    expect(one.cards.map(c => c.abilities.map(a => a.parameters))).toEqual(demoGame.cards.map(c => c.abilities.map(a => a.parameters)));
    expect(parseGameFile(one)).toEqual(one);
    const ids = new Set([one.game.id, ...Object.values(one.definitions).flat().map(x => x.id), ...one.cards.map(c => c.id), ...one.images.map(i => i.id)]);
    for (const entity of [two.game, ...Object.values(two.definitions).flat(), ...two.cards, ...two.images]) expect(ids.has(entity.id)).toBe(false);
  });
  it('rechaza JSON malformado, versión futura, referencias rotas y datos incrustados', () => {
    expect(() => readGameJson('{')).toThrow('JSON');
    expect(() => readGameJson(JSON.stringify({ ...demoGame, formatVersion: 2 }))).toThrow('Versión');
    const bad = structuredClone(demoGame); bad.cards[0].typeIds = ['unknown'];
    expect(() => readGameJson(JSON.stringify(bad))).toThrow('tipo inexistente');
    expect(() => readGameJson(JSON.stringify({ ...demoGame, blob: 'abc' }))).toThrow();
  });
  it('importa sin blobs y registra exportación sin perder cambios concurrentes', async () => {
    const r = repo(); const original = await r.create(copyGame(demoGame));
    expect(await r.db.images.count()).toBe(0);
    await r.markExported(original.id, 1, '2026-09-30T00:00:00.000Z');
    const saved = await r.save(gameFile(original), 1);
    expect(saved.lastExportedAt).toBe('2026-09-30T00:00:00.000Z');
    await expect(r.markExported(original.id, 1, '2026-10-01T00:00:00.000Z')).rejects.toMatchObject({ code: 'conflict' });
    expect((await r.read(original.id))?.revision).toBe(2);
  });
  it('un fallo al crear la copia revierte la operación completa', async () => {
    const r = repo(); const input = copyGame(demoGame);
    vi.spyOn(r.db.images, 'put').mockRejectedValueOnce(new DOMException('full', 'QuotaExceededError'));
    await expect(r.create(input, [{ imageId: input.images[0].id, blob: new Blob(['x']) }])).rejects.toMatchObject({ code: 'quota' });
    expect(await r.list()).toEqual([]);
  });
  it('reasocia bytes conservando referencias y limpia todos los usos al retirar', async () => {
    const r = repo(); const input = copyGame(demoGame); const id = input.images[0].id;
    const original = await r.create(input);
    const saved = await r.save(gameFile(original), 1, [{ imageId: id, blob: new Blob(['new']) }]);
    expect(saved.data.cards).toEqual(original.data.cards);
    expect(await (await r.image(saved.id, id))?.blob.text()).toBe('new');
    expect(imageUses(gameFile(saved), id).length).toBeGreaterThan(0);
    const cleared = removeImageReference(gameFile(saved), id);
    expect(imageUses(cleared, id)).toEqual([]);
    await expect(r.save(cleared, 1)).rejects.toMatchObject({ code: 'conflict' });
    await r.save(cleared, 2); expect(await r.image(saved.id, id)).toBeUndefined();
  });
});
describe('plantillas y distribución', () => {
  it('B amplía texto sin modificar el contenido y detecta cada zona desbordada', () => {
    const a = structuredClone(demoGame.cards[4]); const before = structuredClone(a);
    const b = { ...a, visual: { ...a.visual, templateId: 'text' as const } };
    expect(layoutFor(b).body.height).toBeGreaterThan(layoutFor(a).body.height);
    const noArt = { ...b, visual: { ...b.visual, illustrationId: null } };
    expect(layoutFor(noArt).body.height).toBeGreaterThan(layoutFor(b).body.height);
    const measure = (text: string, size: number) => text.length * size / 2;
    a.name = 'x'.repeat(300); a.text = 'word '.repeat(1000);
    const composition = composeWithMeasure(demoGame, a, measure);
    expect(composition.issues.map(i => i.zone)).toEqual(expect.arrayContaining(['Nombre', 'Texto']));
    expect(b.attributeValues).toEqual(before.attributeValues);
  });
  it('recorta dentro de los límites en imágenes verticales y horizontales', () => {
    for (const [w, h] of [[200, 900], [1200, 400]]) {
      const crop = { x: .1, y: .2, width: .8, height: .5 };
      const result = imageCrop(w, h, crop, { x: 0, y: 0, width: 660, height: 371 });
      expect(result.x).toBeGreaterThanOrEqual(w * .1); expect(result.y).toBeGreaterThanOrEqual(h * .2);
      expect(result.x + result.width).toBeLessThanOrEqual(w * .9 + .00001);
      expect(result.y + result.height).toBeLessThanOrEqual(h * .7 + .00001);
      expect(result.width / result.height).toBeCloseTo(660 / 371);
    }
  });
  it.each(['letter', 'a4'] as const)('coloca 2/3/1 copias exactas en %s y pagina la última hoja', paper => {
    const layout = printLayout({ ...DEFAULT_PRINT, paper }); expect(layout.capacity).toBe(9);
    const selected = [{ cardId: 'a', quantity: 2 }, { cardId: 'b', quantity: 3 }, { cardId: 'c', quantity: 1 }];
    const cards = pageCards(selected, layout, 0);
    expect(cards.map(c => c.cardId)).toEqual(['a', 'a', 'b', 'b', 'b', 'c']);
    expect(cards.every(c => c.width === 63 && c.height === 88)).toBe(true);
    expect(pageCards([{ cardId: 'a', quantity: 10 }], layout, 1)).toHaveLength(1);
    for (const mark of cutLines(cards, layout)) {
      expect(mark.x1).toBeGreaterThanOrEqual(0); expect(mark.y1).toBeGreaterThanOrEqual(0);
      expect(mark.x2).toBeLessThanOrEqual(layout.width); expect(mark.y2).toBeLessThanOrEqual(layout.height);
      for (const c of cards) { const x = (mark.x1 + mark.x2) / 2, y = (mark.y1 + mark.y2) / 2; expect(x > c.x + .0001 && x < c.x + 63 - .0001 && y > c.y + .0001 && y < c.y + 88 - .0001).toBe(false); }
    }
  });
  it('valida márgenes, espacios y cantidades antes de distribuir', () => {
    expect(() => printLayout({ ...DEFAULT_PRINT, margin: 100 })).toThrow('No cabe');
    expect(() => printLayout({ ...DEFAULT_PRINT, margin: NaN })).toThrow();
    expect(() => printLayout({ ...DEFAULT_PRINT, gap: -1 })).toThrow();
    expect(printLayout({ ...DEFAULT_PRINT, gap: 0 }).capacity).toBe(9);
    for (const quantity of [0, -1, NaN, Infinity, 1.5]) expect(() => countSelection([{ cardId: 'a', quantity }])).toThrow();
    expect(countSelection([])).toBe(0);
    expect(pageCards([], printLayout(DEFAULT_PRINT), 0)).toEqual([]);
  });
});
