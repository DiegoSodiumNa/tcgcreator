import { gameFileSchema } from './schema.ts';
import type { Attribute, Card, GameFile } from './schema.ts';

export function attributesForTypes(game: GameFile, typeIds: string[]): Attribute[] {
  const selected = new Set(game.definitions.types.filter(t => typeIds.includes(t.id)).flatMap(t => t.attributeIds));
  return game.definitions.attributes.filter(a => selected.has(a.id));
}

export function subtypesForTypes(game: GameFile, typeIds: string[]) {
  return game.definitions.subtypes.filter(s => typeIds.includes(s.typeId));
}

export function valueFits(attribute: Attribute, value: unknown): boolean {
  switch (attribute.kind) {
    case 'text': return typeof value === 'string';
    case 'boolean': return typeof value === 'boolean';
    case 'select': return typeof value === 'string' && attribute.options.includes(value);
    case 'number': return typeof value === 'number' && Number.isFinite(value)
      && (attribute.min === undefined || value >= attribute.min)
      && (attribute.max === undefined || value <= attribute.max);
  }
}

/** Validates structure first, then all cross-references without mutating input. */
export function parseGameFile(input: unknown): GameFile {
  const game = gameFileSchema.parse(input);
  const errors: string[] = [];
  const check = (ok: boolean, message: string) => { if (!ok) errors.push(message); };
  const exists = (items: { id: string }[], target: string) => items.some(x => x.id === target);
  const seen = new Set<string>();
  for (const entity of [game.game, ...Object.values(game.definitions).flat(), ...game.cards, ...game.images]) {
    check(!seen.has(entity.id), `Identificador duplicado: ${entity.id}`);
    seen.add(entity.id);
  }
  const d = game.definitions;
  for (const type of d.types) for (const attr of type.attributeIds) check(exists(d.attributes, attr), `${type.id}: atributo inexistente ${attr}`);
  for (const subtype of d.subtypes) check(exists(d.types, subtype.typeId), `${subtype.id}: tipo inexistente`);
  for (const attr of d.attributes) {
    check(valueFits(attr, attr.defaultValue), `${attr.id}: valor inicial inválido`);
    if (attr.kind === 'number' && attr.min !== undefined && attr.max !== undefined) check(attr.min <= attr.max, `${attr.id}: límites invertidos`);
  }
  for (const item of [...d.attributes, ...d.resources]) if (item.symbolImageId) {
    check(game.images.some(i => i.id === item.symbolImageId && i.kind === 'symbol'), `${item.id}: símbolo inexistente o incompatible`);
  }
  for (const ability of d.abilities) {
    const parameters = ability.kind === 'parameterized' ? ability.parameters : [];
    const keys = parameters.map(p => p.id);
    check(new Set(keys).size === keys.length, `${ability.id}: parámetros duplicados`);
    const placeholders = [...`${ability.name} ${ability.reminder}`.matchAll(/\{([^{}]+)\}/g)].map(m => m[1]);
    check(placeholders.every(p => keys.includes(p)) && keys.every(p => placeholders.includes(p)), `${ability.id}: marcadores y parámetros incompatibles`);
  }
  for (const card of game.cards) {
    const prefix = `Carta ${card.id}`;
    for (const t of card.typeIds) check(exists(d.types, t), `${prefix}: tipo inexistente ${t}`);
    for (const s of card.supertypeIds) check(exists(d.supertypes, s), `${prefix}: supertipo inexistente ${s}`);
    const compatible = subtypesForTypes(game, card.typeIds);
    for (const s of card.subtypeIds) check(exists(compatible, s), `${prefix}: subtipo incompatible ${s}`);
    const attributes = attributesForTypes(game, card.typeIds);
    for (const attr of attributes) check(valueFits(attr, card.attributeValues[attr.id]), `${prefix}: valor inválido o ausente para ${attr.id}`);
    for (const key of Object.keys(card.attributeValues)) check(exists(attributes, key), `${prefix}: atributo no aplicable ${key}`);
    const slots = card.visual.attributeSlots.filter((s): s is string => s !== null);
    check(new Set(slots).size === slots.length, `${prefix}: espacios duplicados`);
    for (const slot of slots) check(exists(attributes, slot), `${prefix}: espacio con atributo no aplicable ${slot}`);
    if (card.visual.illustrationId !== null) check(game.images.some(i => i.id === card.visual.illustrationId && i.kind === 'illustration'), `${prefix}: ilustración inexistente o incompatible`);
    for (const use of card.abilities) {
      const definition = d.abilities.find(a => a.id === use.definitionId);
      check(!!definition, `${prefix}: habilidad inexistente ${use.definitionId}`);
      if (!definition) continue;
      const parameters = definition.kind === 'parameterized' ? definition.parameters : [];
      check(Object.keys(use.parameters).every(k => parameters.some(p => p.id === k)), `${prefix}: parámetros adicionales`);
      for (const parameter of parameters) check(typeof use.parameters[parameter.id] === (parameter.kind === 'number' ? 'number' : 'string'), `${prefix}: parámetro inválido o ausente ${parameter.id}`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return game;
}

export function unassignedAttributes(game: GameFile, card: Card) {
  return attributesForTypes(game, card.typeIds).filter(a => !card.visual.attributeSlots.includes(a.id));
}

export function abilityText(game: GameFile, use: Card['abilities'][number]): string {
  const definition = game.definitions.abilities.find(a => a.id === use.definitionId);
  if (!definition) throw new Error(`Habilidad inexistente: ${use.definitionId}`);
  const text = use.showReminder ? `${definition.name}: ${definition.reminder}` : definition.name;
  return text.replace(/\{([^{}]+)\}/g, (_, key: string) => {
    if (!(key in use.parameters)) throw new Error(`Parámetro ausente: ${key}`);
    return String(use.parameters[key]);
  });
}
