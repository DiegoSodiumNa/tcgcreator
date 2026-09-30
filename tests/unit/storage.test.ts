import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { GameDatabase, GameRepository, emptyGame, gameFile, storageError } from '../../src/storage/repository';
import { copyExample } from '../../src/storage/example';
import { demoGame } from '../../src/fixtures/demo-game';
import { parseGameFile } from '../../src/domain/rules';

const databases: GameDatabase[] = [];
function setup() {
  const db = new GameDatabase(`test-${crypto.randomUUID()}`);
  databases.push(db);
  return new GameRepository(db);
}
afterEach(async () => { await Promise.all(databases.splice(0).map(db => db.delete())); });

describe('persistencia local', () => {
  it('crea, cierra y reabre un juego sin añadir metadatos locales al contrato', async () => {
    const repo = setup();
    const first = await repo.create(emptyGame('Prueba'));
    expect(first.revision).toBe(1);
    expect(first.lastExportedAt).toBeNull();
    expect(first.data).not.toHaveProperty('exportedAt');
    repo.db.close();
    const reopened = new GameRepository(new GameDatabase(repo.db.name));
    databases.push(reopened.db);
    const stored = (await reopened.read(first.id))!;
    expect(stored).toEqual(first);
    expect(parseGameFile(gameFile(stored)).game.name).toBe('Prueba');
    const changed = gameFile(stored);
    changed.game = { ...changed.game, name: 'Renombrado', rules: 'Reglas\nCon acentos: energía.' };
    const saved = await reopened.save(changed, stored.revision);
    expect(saved.revision).toBe(2);
    expect((await reopened.list())[0].data.game.rules).toContain('energía');
  });
  it('guarda bytes y documento juntos y elimina ambos al retirar el juego', async () => {
    const repo = setup();
    const game = copyExample();
    const imageId = game.images[0].id;
    const record = await repo.create(game, [{ imageId, blob: new Blob(['image'], { type: 'image/png' }) }]);
    expect(await (await repo.image(record.id, imageId))!.blob.text()).toBe('image');
    await repo.remove(record.id, record.revision);
    expect(await repo.read(record.id)).toBeUndefined();
    expect(await repo.db.images.count()).toBe(0);
  });
  it('rechaza referencias inválidas sin cambiar la revisión ni el documento', async () => {
    const repo = setup();
    const record = await repo.create(copyExample());
    const bad = gameFile(record);
    bad.cards = structuredClone(bad.cards);
    bad.cards[0].typeIds = ['unknown'];
    await expect(repo.save(bad, 1)).rejects.toMatchObject({ code: 'validation' });
    expect(await repo.read(record.id)).toEqual(record);
  });
  it('hace rollback de la creación y del guardado si falla una imagen', async () => {
    const repo = setup();
    const game = copyExample();
    const images = [{ imageId: game.images[0].id, blob: new Blob(['ok']) }, { imageId: 'unknown', blob: new Blob(['bad']) }];
    await expect(repo.create(game, images)).rejects.toMatchObject({ code: 'validation' });
    expect(await repo.list()).toEqual([]);
    expect(await repo.db.images.count()).toBe(0);
    const original = await repo.create(game);
    const changed = gameFile(original);
    changed.game = { ...changed.game, name: 'No debe persistir' };
    await expect(repo.save(changed, 1, images)).rejects.toMatchObject({ code: 'validation' });
    expect(await repo.read(original.id)).toEqual(original);
    expect(await repo.db.images.count()).toBe(0);
  });
  it('permite solo un ganador ante escrituras concurrentes y protege el borrado', async () => {
    const repo = setup();
    const record = await repo.create(emptyGame('Primero'));
    const second = new GameRepository(new GameDatabase(repo.db.name)); databases.push(second.db);
    const a = gameFile(record); a.game = { ...a.game, name: 'A' };
    const b = gameFile(record); b.game = { ...b.game, name: 'B' };
    const writes = await Promise.allSettled([repo.save(a, 1), second.save(b, 1)]);
    expect(writes.filter(write => write.status === 'fulfilled')).toHaveLength(1);
    expect(writes.find(write => write.status === 'rejected')).toMatchObject({ reason: { code: 'conflict' } });
    await expect(repo.remove(record.id, 1)).rejects.toMatchObject({ code: 'conflict' });
    expect((await repo.read(record.id))?.revision).toBe(2);
  });
  it('una pestaña antigua no puede resucitar un juego eliminado', async () => {
    const repo = setup(); const record = await repo.create(emptyGame('Temporal'));
    await repo.remove(record.id, 1);
    await expect(repo.save(gameFile(record), 1)).rejects.toMatchObject({ code: 'missing' });
    expect(await repo.list()).toEqual([]);
  });
  it('copiar el ejemplo remapea entidades y referencias sin cambiar el fixture', () => {
    const copy = copyExample();
    const other = copyExample();
    expect(copy.cards).toHaveLength(12);
    expect(copy.game.id).not.toBe(other.game.id);
    expect(copy.cards[0].id).not.toBe(demoGame.cards[0].id);
    expect(copy.images[0].id).not.toBe(other.images[0].id);
    expect(parseGameFile(copy)).toEqual(copy);
    expect(demoGame.game.id).toBe('game-forja');
  });
  it('distingue cuota y almacenamiento no disponible', () => {
    expect(storageError(new DOMException('full', 'QuotaExceededError')).code).toBe('quota');
    expect(storageError(new DOMException('blocked', 'SecurityError')).code).toBe('unavailable');
  });
});
