import Dexie, { type Table } from 'dexie';
import { parseGameFile } from '../domain/rules';
import type { GameFile } from '../domain/schema';

export type GameData = Omit<GameFile, 'exportedAt'>;
export interface StoredGame {
  id: string;
  data: GameData;
  revision: number;
  savedAt: string;
  lastExportedAt: string | null;
}
export interface ImageBlob { gameId: string; imageId: string; blob: Blob }
export type PendingImage = Omit<ImageBlob, 'gameId'>;
export class StorageError extends Error {
  constructor(public code: 'conflict' | 'missing' | 'validation' | 'quota' | 'unavailable' | 'write', message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StorageError';
  }
}
export function storageError(error: unknown): StorageError {
  if (error instanceof StorageError) return error;
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
  if (name === 'QuotaExceededError') return new StorageError('quota', 'No hay espacio suficiente. Conservamos tus cambios abiertos; libera espacio y vuelve a guardar.', { cause: error });
  if (['SecurityError', 'InvalidStateError', 'MissingAPIError', 'OpenFailedError', 'VersionError', 'DatabaseClosedError'].includes(name)) return new StorageError('unavailable', 'No se puede abrir el almacenamiento de este navegador. Comprueba sus permisos y vuelve a intentarlo.', { cause: error });
  return new StorageError('write', 'No se pudo completar la operación local. Tus cambios no se han descartado. Vuelve a intentarlo.', { cause: error });
}

export class GameDatabase extends Dexie {
  games!: Table<StoredGame, string>;
  images!: Table<ImageBlob, [string, string]>;
  constructor(name = 'forja-local-v1') {
    super(name);
    this.version(1).stores({ games: 'id, savedAt', images: '[gameId+imageId], gameId' });
  }
}

export function gameFile(record: StoredGame): GameFile {
  return { ...record.data, exportedAt: record.lastExportedAt ?? record.savedAt };
}
function validate(input: GameFile): GameData {
  try {
    const { exportedAt: _exportedAt, ...data } = parseGameFile(input);
    return data;
  } catch (error) {
    throw new StorageError('validation', `Datos inválidos: ${error instanceof Error ? error.message : 'revisa el formulario'}`, { cause: error });
  }
}
function checkRevision(record: StoredGame | undefined, revision: number): asserts record is StoredGame {
  if (!record) throw new StorageError('missing', 'Este juego ya no existe. Conservamos tu borrador; vuelve a Mis juegos para continuar.');
  if (record.revision !== revision) throw new StorageError('conflict', 'Otra pestaña cambió este juego. Tu borrador sigue abierto. Recarga la versión guardada antes de volver a editar.');
}

export class GameRepository {
  constructor(public db = new GameDatabase()) {}
  private async run<T>(action: () => Promise<T>): Promise<T> {
    try { return await action(); } catch (error) { throw storageError(error); }
  }
  list() { return this.run(() => this.db.games.orderBy('savedAt').reverse().toArray()); }
  read(id: string) {
    return this.run(async () => {
      const record = await this.db.games.get(id);
      if (record) validate(gameFile(record));
      return record;
    });
  }
  image(gameId: string, imageId: string) { return this.run(() => this.db.images.get([gameId, imageId])); }
  markExported(id: string, expectedRevision: number, exportedAt: string) {
    return this.run(() => this.db.transaction('rw', this.db.games, async () => {
      const current = await this.db.games.get(id);
      checkRevision(current, expectedRevision);
      // Operational metadata does not invalidate an open content draft.
      const next = { ...current, lastExportedAt: exportedAt };
      await this.db.games.put(next);
      return next;
    }));
  }

  private async writeImages(id: string, data: GameData, images: PendingImage[]) {
    const imageIds = new Set(data.images.map(image => image.id));
    for (const image of images) {
      if (!imageIds.has(image.imageId) || !(image.blob instanceof Blob) || !image.blob.size) throw new StorageError('validation', 'La imagen no tiene metadatos válidos o está vacía.');
      await this.db.images.put({ ...image, gameId: id });
    }
    // Remove bytes only when their metadata was explicitly removed, never merely
    // because one card stopped using a shared illustration.
    await this.db.images.where('gameId').equals(id).filter(image => !imageIds.has(image.imageId)).delete();
  }
  create(input: GameFile, images: PendingImage[] = []) {
    return this.run(async () => {
      const data = validate(input);
      const now = new Date().toISOString();
      data.game.createdAt = now;
      data.game.updatedAt = now;
      const record: StoredGame = { id: data.game.id, data, revision: 1, savedAt: now, lastExportedAt: null };
      await this.db.transaction('rw', this.db.games, this.db.images, async () => {
        await this.db.games.add(record);
        await this.writeImages(record.id, data, images);
      });
      return record;
    });
  }
  save(input: GameFile, expectedRevision: number, images: PendingImage[] = []) {
    return this.run(async () => {
      const data = validate(input);
      return this.db.transaction('rw', this.db.games, this.db.images, async () => {
        const current = await this.db.games.get(data.game.id);
        checkRevision(current, expectedRevision);
        const now = new Date().toISOString();
        data.game.createdAt = current.data.game.createdAt;
        data.game.updatedAt = now;
        const next: StoredGame = { ...current, data, revision: current.revision + 1, savedAt: now };
        await this.db.games.put(next);
        await this.writeImages(next.id, data, images);
        return next;
      });
    });
  }
  remove(id: string, expectedRevision: number) {
    return this.run(() => this.db.transaction('rw', this.db.games, this.db.images, async () => {
      checkRevision(await this.db.games.get(id), expectedRevision);
      await this.db.images.where('gameId').equals(id).delete();
      await this.db.games.delete(id);
    }));
  }
}

// Construct lazily: static rendering must never try to open IndexedDB.
let repository: GameRepository | undefined;
export function getRepository() { return repository ??= new GameRepository(); }

export function emptyGame(name: string): GameFile {
  const now = new Date().toISOString();
  return { formatVersion: 1, exportedAt: now, game: { id: crypto.randomUUID(), name, description: '', rules: '', createdAt: now, updatedAt: now }, definitions: { supertypes: [], types: [], subtypes: [], attributes: [], resources: [], abilities: [] }, cards: [], images: [] };
}
