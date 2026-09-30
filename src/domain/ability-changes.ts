import { gameFileSchema, type Card, type GameFile } from './schema';
import { abilityText, parseGameFile } from './rules';
import { finiteInput } from './cards';

export type AbilityDefinition = GameFile['definitions']['abilities'][number];
export type Parameter = Extract<AbilityDefinition, { kind: 'parameterized' }>['parameters'][number];
export type AbilityUseChange = {
  key: string; cardId: string; cardName: string; index: number; beforeText: string;
  retained: Card['abilities'][number]['parameters']; required: Parameter[]; removed: Parameter[]; showReminder: boolean;
};
export type AbilityChange = { source: GameFile; before: AbilityDefinition; after: AbilityDefinition; uses: AbilityUseChange[]; changed: boolean };
export type ReplacementValues = Record<string, Record<string, string>>;
export const replacementKey = (useKey: string, parameterId: string) => JSON.stringify([useKey, parameterId]);

export function prepareAbilityChange(game: GameFile, input: AbilityDefinition): AbilityChange {
  const after = gameFileSchema.shape.definitions.shape.abilities.element.parse(input);
  const before = game.definitions.abilities.find(item => item.id === after.id);
  if (!before) throw new Error('La habilidad ya no existe.');
  // Validate the definition and its placeholders before asking for migration values.
  parseGameFile({ ...game, cards: [], definitions: { ...game.definitions, abilities: game.definitions.abilities.map(item => item.id === after.id ? after : item) } });
  const oldParameters = before.kind === 'parameterized' ? before.parameters : [];
  const newParameters = after.kind === 'parameterized' ? after.parameters : [];
  const uses: AbilityUseChange[] = [];
  for (const card of game.cards) card.abilities.forEach((use, index) => {
    if (use.definitionId !== after.id) return;
    const compatible = newParameters.filter(parameter => oldParameters.some(old => old.id === parameter.id && old.kind === parameter.kind));
    uses.push({
      key: JSON.stringify([card.id, index]), cardId: card.id, cardName: card.name, index, beforeText: abilityText(game, use), showReminder: use.showReminder,
      retained: Object.fromEntries(compatible.map(parameter => [parameter.id, use.parameters[parameter.id]])),
      required: newParameters.filter(parameter => !compatible.some(item => item.id === parameter.id)),
      removed: oldParameters.filter(parameter => !newParameters.some(item => item.id === parameter.id)),
    });
  });
  return { source: structuredClone(game), before: structuredClone(before), after, uses, changed: JSON.stringify(before) !== JSON.stringify(after) };
}

export function abilityChangeText(plan: AbilityChange, use: AbilityUseChange, values: ReplacementValues): string {
  const parameters = { ...use.retained, ...Object.fromEntries(use.required.map(parameter => [parameter.id, values[use.key]?.[parameter.id] ?? '…'])) };
  return abilityText({ ...plan.source, definitions: { ...plan.source.definitions, abilities: [plan.after] } }, { definitionId: plan.after.id, parameters, showReminder: use.showReminder });
}

export function applyAbilityChange(plan: AbilityChange, values: ReplacementValues): { next: GameFile | null; errors: Record<string, string> } {
  const next = structuredClone(plan.source);
  const errors: Record<string, string> = {};
  next.definitions.abilities = next.definitions.abilities.map(item => item.id === plan.after.id ? structuredClone(plan.after) : item);
  for (const use of plan.uses) {
    const parameters = { ...use.retained };
    for (const parameter of use.required) {
      const supplied = values[use.key];
      const raw = supplied?.[parameter.id];
      const key = replacementKey(use.key, parameter.id);
      if (!supplied || !Object.hasOwn(supplied, parameter.id)) { errors[key] = 'Introduce el valor para este uso de la habilidad.'; continue; }
      if (parameter.kind === 'number') {
        const value = finiteInput(raw);
        if (value === undefined) errors[key] = 'Introduce un número finito; el campo no puede quedar vacío.';
        else Object.defineProperty(parameters, parameter.id, { value, enumerable: true, writable: true, configurable: true });
      } else Object.defineProperty(parameters, parameter.id, { value: raw, enumerable: true, writable: true, configurable: true });
    }
    next.cards.find(card => card.id === use.cardId)!.abilities[use.index].parameters = parameters;
  }
  if (Object.keys(errors).length) return { next: null, errors };
  return { next: parseGameFile(next), errors };
}
