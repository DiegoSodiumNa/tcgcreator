import { gameFileSchema, type GameFile } from './schema';
import { attributesForTypes, parseGameFile, valueFits } from './rules';

export type Catalog = keyof GameFile['definitions'];
export type Definition = GameFile['definitions'][Catalog][number];
export const catalogLabels: Record<Catalog, string> = {
  supertypes: 'Supertipos', types: 'Tipos', subtypes: 'Subtipos', attributes: 'Atributos', resources: 'Recursos', abilities: 'Habilidades',
};
export type DefinitionChange = { catalog: Catalog; id: string; action: 'delete' } | { catalog: Catalog; id: string; action: 'upsert'; value: unknown };
export type Dependency = { kind: 'card' | 'definition'; id: string; name: string; reason: string };
export type CardImpact = { id: string; name: string; added: { name: string; value: unknown }[]; removed: { name: string; value: unknown }[]; clearedSlots: number[] };
export type DefinitionPlan = { next: GameFile | null; blockers: string[]; dependencies: Dependency[]; impacts: CardImpact[] };

export function parseDefinition(catalog: Catalog, value: unknown): Definition {
  return gameFileSchema.shape.definitions.shape[catalog].element.parse(value);
}

/** Relationships are explicit IDs, never inferred from text or display names. */
export function definitionDependencies(game: GameFile, catalog: Catalog, id: string): Dependency[] {
  const dependencies: Dependency[] = [];
  if (catalog === 'types') {
    for (const subtype of game.definitions.subtypes.filter(item => item.typeId === id)) dependencies.push({ kind: 'definition', id: subtype.id, name: subtype.name, reason: 'Subtipo de este tipo' });
  }
  if (catalog === 'attributes') {
    for (const type of game.definitions.types.filter(item => item.attributeIds.includes(id))) dependencies.push({ kind: 'definition', id: type.id, name: type.name, reason: 'Tipo que asigna este atributo' });
  }
  for (const card of game.cards) {
    const used = catalog === 'supertypes' ? card.supertypeIds.includes(id)
      : catalog === 'types' ? card.typeIds.includes(id)
      : catalog === 'subtypes' ? card.subtypeIds.includes(id)
      : catalog === 'attributes' ? Object.hasOwn(card.attributeValues, id) || card.visual.attributeSlots.includes(id)
      : catalog === 'abilities' ? card.abilities.some(use => use.definitionId === id) : false;
    if (used) dependencies.push({ kind: 'card', id: card.id, name: card.name, reason: catalog === 'attributes' && card.visual.attributeSlots.includes(id) ? 'Carta con valor y espacio asignado' : 'Carta que utiliza el concepto' });
  }
  return dependencies;
}

/** Pure preview. Used abilities must go through prepare/applyAbilityChange so
 * their affected uses are reviewed before producing a validated candidate. */
export function prepareDefinitionChange(game: GameFile, change: DefinitionChange): DefinitionPlan {
  const result: DefinitionPlan = { next: null, blockers: [], dependencies: [], impacts: [] };
  const current = game.definitions[change.catalog].find(item => item.id === change.id);
  const next = structuredClone(game);
  if (change.action === 'delete') {
    if (!current) { result.blockers.push('El concepto ya no existe.'); return result; }
    result.dependencies = definitionDependencies(game, change.catalog, change.id);
    if (result.dependencies.length) {
      result.blockers.push('Retira primero las referencias indicadas. Eliminar no borra automáticamente definiciones ni cartas dependientes.');
      return result;
    }
    // The catalog and its members were checked above. Preserve all other catalogs.
    Object.assign(next.definitions, { [change.catalog]: next.definitions[change.catalog].filter(item => item.id !== change.id) });
  } else {
    let value: Definition;
    try { value = parseDefinition(change.catalog, change.value); }
    catch { result.blockers.push('Revisa los campos obligatorios y el formato del concepto.'); return result; }
    if (value.id !== change.id) { result.blockers.push('El identificador de un concepto no puede cambiar.'); return result; }
    if (change.catalog === 'abilities' && current && JSON.stringify(current) !== JSON.stringify(value)) {
      result.dependencies = definitionDependencies(game, 'abilities', change.id);
      if (result.dependencies.length) {
        result.blockers.push('Revisa y confirma el cambio compartido antes de actualizar esta habilidad utilizada.');
        return result;
      }
    }
    const items: Definition[] = [...next.definitions[change.catalog]];
    const index = items.findIndex(item => item.id === change.id);
    if (index < 0) items.push(value); else items[index] = value;
    Object.assign(next.definitions, { [change.catalog]: items });

    if (change.catalog === 'attributes' && 'kind' in value && 'defaultValue' in value) {
      for (const card of game.cards) {
        if (Object.hasOwn(card.attributeValues, value.id) && !valueFits(value, card.attributeValues[value.id])) {
          result.dependencies.push({ kind: 'card', id: card.id, name: card.name, reason: `Valor incompatible: ${String(card.attributeValues[value.id])}` });
        }
      }
      if (result.dependencies.length) result.blockers.push('El cambio de formato, límites u opciones invalida valores existentes. Corrige esos valores o retira las referencias antes de guardar.');
    }
    if (change.catalog === 'subtypes' && 'typeId' in value) {
      for (const card of game.cards.filter(card => card.subtypeIds.includes(value.id) && !card.typeIds.includes(value.typeId))) {
        result.dependencies.push({ kind: 'card', id: card.id, name: card.name, reason: 'No tiene asignado el nuevo tipo del subtipo' });
      }
      if (result.dependencies.length) result.blockers.push('No se puede cambiar el tipo de este subtipo mientras existan cartas incompatibles.');
    }
    if (result.blockers.length) return result;

    if (change.catalog === 'types') {
      for (const card of next.cards) {
        const attributes = attributesForTypes(next, card.typeIds);
        const applicable = new Set(attributes.map(item => item.id));
        const impact: CardImpact = { id: card.id, name: card.name, added: [], removed: [], clearedSlots: [] };
        for (const attribute of attributes) if (!Object.hasOwn(card.attributeValues, attribute.id)) {
          card.attributeValues[attribute.id] = attribute.defaultValue;
          impact.added.push({ name: attribute.name, value: attribute.defaultValue });
        }
        for (const id of Object.keys(card.attributeValues)) if (!applicable.has(id)) {
          impact.removed.push({ name: game.definitions.attributes.find(item => item.id === id)?.name ?? id, value: card.attributeValues[id] });
          delete card.attributeValues[id];
        }
        card.visual.attributeSlots = card.visual.attributeSlots.map((id, slot) => {
          if (id !== null && !applicable.has(id)) { impact.clearedSlots.push(slot + 1); return null; }
          return id;
        });
        if (impact.added.length || impact.removed.length || impact.clearedSlots.length) result.impacts.push(impact);
      }
    }
  }
  try { result.next = parseGameFile(next); }
  catch (error) { result.blockers.push(error instanceof Error ? error.message : 'El cambio deja referencias inválidas.'); }
  return result;
}
