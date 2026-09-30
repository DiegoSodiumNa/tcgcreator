import type { Card, GameFile } from './schema';
import { attributesForTypes, parseGameFile, subtypesForTypes, valueFits } from './rules';

export function newCard(id: string): Card {
  return { id, name: '', typeIds: [], supertypeIds: [], subtypeIds: [], attributeValues: {}, abilities: [], text: '', visual: {
    templateId: 'illustration', templateVersion: 1, colors: { background: '#F5EAD6', foreground: '#201B18', accent: '#A34B24' },
    attributeSlots: [null, null, null, null], illustrationId: null, crop: { x: 0, y: 0, width: 1, height: 1 },
  } };
}

export function prepareCardTypes(game: GameFile, draft: Card, typeIds: string[]) {
  const next = structuredClone(draft);
  const attributes = attributesForTypes(game, typeIds);
  const compatible = new Set(subtypesForTypes(game, typeIds).map(item => item.id));
  const removedTypes = game.definitions.types.filter(item => draft.typeIds.includes(item.id) && !typeIds.includes(item.id));
  const removedSubtypes = game.definitions.subtypes.filter(item => draft.subtypeIds.includes(item.id) && !compatible.has(item.id));
  const removedAttributes = game.definitions.attributes.filter(item => Object.hasOwn(draft.attributeValues, item.id) && !attributes.some(attribute => attribute.id === item.id)).map(item => ({ id: item.id, name: item.name, value: draft.attributeValues[item.id] }));
  const clearedSlots: number[] = [];
  next.typeIds = [...typeIds];
  next.subtypeIds = next.subtypeIds.filter(id => compatible.has(id));
  next.attributeValues = Object.fromEntries(attributes.map(attribute => [attribute.id, Object.hasOwn(draft.attributeValues, attribute.id) ? draft.attributeValues[attribute.id] : attribute.defaultValue]));
  next.visual.attributeSlots = next.visual.attributeSlots.map((id, index) => {
    if (id !== null && !attributes.some(item => item.id === id)) { clearedSlots.push(index + 1); return null; }
    return id;
  });
  return { next, removedTypes, removedSubtypes, removedAttributes, clearedSlots };
}

export function finiteInput(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  if (typeof value === 'string' && !value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
export function cardFromDraft(game: GameFile, draft: Card) {
  const card = structuredClone(draft);
  const errors: Record<string, string> = {};
  card.name = card.name.trim();
  if (!card.name) errors.name = 'Escribe un nombre para la carta.';
  if (!card.typeIds.length) errors.types = 'Selecciona al menos un tipo.';
  for (const attribute of attributesForTypes(game, card.typeIds)) {
    if (attribute.kind === 'number') {
      const value = finiteInput(card.attributeValues[attribute.id]);
      if (value !== undefined) card.attributeValues[attribute.id] = value;
      else errors[`attribute:${attribute.id}`] = 'Introduce un número finito; el campo no puede quedar vacío.';
    }
    if (!valueFits(attribute, card.attributeValues[attribute.id])) errors[`attribute:${attribute.id}`] ??= 'El valor no cumple el formato, opciones o límites del atributo.';
  }
  card.abilities.forEach((use, index) => {
    const definition = game.definitions.abilities.find(item => item.id === use.definitionId);
    if (!definition) { errors[`ability:${index}`] = 'Selecciona una habilidad válida.'; return; }
    if (definition.kind === 'parameterized') for (const parameter of definition.parameters) {
      if (parameter.kind === 'number') {
        const value = finiteInput(use.parameters[parameter.id]);
        if (value === undefined) errors[`ability:${index}:${parameter.id}`] = 'Introduce un número finito; el campo no puede quedar vacío.';
        else use.parameters[parameter.id] = value;
      } else if (typeof use.parameters[parameter.id] !== 'string') errors[`ability:${index}:${parameter.id}`] = 'Introduce un valor de texto.';
    }
  });
  if (Object.keys(errors).length) return { card: null, errors };
  try {
    const candidate = { ...game, cards: [...game.cards.filter(item => item.id !== card.id), card] };
    const validated = parseGameFile(candidate).cards.find(item => item.id === card.id)!;
    return { card: validated, errors };
  } catch { errors.general = 'Revisa la clasificación, los atributos, las habilidades y sus referencias.'; return { card: null, errors }; }
}

export function putCard(game: GameFile, card: Card): GameFile {
  const index = game.cards.findIndex(item => item.id === card.id);
  const cards = [...game.cards];
  if (index < 0) cards.push(card); else cards[index] = card;
  return parseGameFile({ ...game, cards });
}
export function duplicateCard(game: GameFile, id: string, newId: string): GameFile {
  const source = game.cards.find(card => card.id === id);
  if (!source) throw new Error('La carta ya no existe.');
  let name = `${source.name} (copia)`;
  let number = 2;
  while (game.cards.some(card => card.name === name)) name = `${source.name} (copia ${number++})`;
  // Clone content, but keep image IDs: bytes can be shared without duplication.
  return parseGameFile({ ...game, cards: [...game.cards, { ...structuredClone(source), id: newId, name }] });
}
export function deleteCard(game: GameFile, id: string): GameFile {
  if (!game.cards.some(card => card.id === id)) throw new Error('La carta ya no existe.');
  return parseGameFile({ ...game, cards: game.cards.filter(card => card.id !== id) });
}
