import type { GameFile } from './schema';
import { parseGameFile } from './rules';

/** IDs are local to a game, but copies still receive new entity IDs. Parameter
 * keys remain unchanged because they are scoped to their ability definition. */
export function copyGame(input: GameFile) {
  const game = structuredClone(parseGameFile(input));
  const ids = new Map([game.game, ...Object.values(game.definitions).flat(), ...game.cards, ...game.images].map(item => [item.id, crypto.randomUUID()]));
  const id = (old: string) => ids.get(old)!;
  game.game.id = id(game.game.id);
  for (const item of Object.values(game.definitions).flat()) item.id = id(item.id);
  for (const type of game.definitions.types) type.attributeIds = type.attributeIds.map(id);
  for (const subtype of game.definitions.subtypes) subtype.typeId = id(subtype.typeId);
  for (const item of [...game.definitions.attributes, ...game.definitions.resources]) if (item.symbolImageId) item.symbolImageId = id(item.symbolImageId);
  for (const card of game.cards) {
    card.id = id(card.id);
    card.typeIds = card.typeIds.map(id);
    card.supertypeIds = card.supertypeIds.map(id);
    card.subtypeIds = card.subtypeIds.map(id);
    card.attributeValues = Object.fromEntries(Object.entries(card.attributeValues).map(([key, value]) => [id(key), value]));
    card.abilities.forEach(use => { use.definitionId = id(use.definitionId); });
    card.visual.attributeSlots = card.visual.attributeSlots.map(slot => slot === null ? null : id(slot));
    if (card.visual.illustrationId) card.visual.illustrationId = id(card.visual.illustrationId);
  }
  game.images.forEach(image => { image.id = id(image.id); });
  return parseGameFile(game);
}


export const MAX_JSON_BYTES = 20 * 1024 * 1024;
export function readGameJson(text: string): GameFile {
  if (new TextEncoder().encode(text).length > MAX_JSON_BYTES) throw new Error('El JSON debe ocupar como máximo 20 MB.');
  let input: unknown;
  try { input = JSON.parse(text); } catch { throw new Error('El archivo no contiene JSON válido.'); }
  if (!input || typeof input !== 'object' || !('formatVersion' in input) || input.formatVersion !== 1) throw new Error('Versión de archivo no compatible. Se admite la versión 1.');
  return parseGameFile(input);
}
export function serializeGame(game: GameFile, exportedAt = new Date().toISOString()) {
  return JSON.stringify(parseGameFile({ ...game, exportedAt }), null, 2);
}
export function importCopy(game: GameFile, existingNames: string[]) {
  const copy = copyGame(game);
  let name = `${game.game.name} (copia)`;
  let n = 2;
  while (existingNames.includes(name)) name = `${game.game.name} (copia ${n++})`;
  copy.game.name = name;
  return copy;
}
export function imageUses(game: GameFile, id: string) {
  return [...game.cards.filter(c => c.visual.illustrationId === id).map(c => `Carta: ${c.name}`),
    ...game.definitions.attributes.filter(a => a.symbolImageId === id).map(a => `Atributo: ${a.name}`),
    ...game.definitions.resources.filter(r => r.symbolImageId === id).map(r => `Recurso: ${r.name}`),
    ...game.cards.filter(c => c.visual.attributeSlots.some(slot => game.definitions.attributes.some(a => a.id === slot && a.symbolImageId === id))).map(c => `Carta: ${c.name}`)];
}
export function removeImageReference(game: GameFile, id: string) {
  const next = structuredClone(game);
  next.images = next.images.filter(image => image.id !== id);
  for (const card of next.cards) if (card.visual.illustrationId === id) card.visual.illustrationId = null;
  for (const item of [...next.definitions.attributes, ...next.definitions.resources]) if (item.symbolImageId === id) delete item.symbolImageId;
  return parseGameFile(next);
}
