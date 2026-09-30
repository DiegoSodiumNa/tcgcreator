import { describe, expect, it } from 'vitest';
import { demoGame } from '../../src/fixtures/demo-game';
import { abilityText } from '../../src/domain/rules';
import { abilityChangeText, applyAbilityChange, prepareAbilityChange, type AbilityDefinition } from '../../src/domain/ability-changes';

const shield = demoGame.definitions.abilities[1] as Extract<AbilityDefinition, { kind: 'parameterized' }>;
describe('revisión de habilidades compartidas', () => {
  it('prepara antes y después sin escribir y confirma todas las referencias conservando valores y orden', () => {
    const source = structuredClone(demoGame);
    const plan = prepareAbilityChange(source, { ...shield, name: 'Protección {amount}', reminder: 'Reduce {amount} de daño.' });
    expect(plan.uses).toHaveLength(3);
    expect(plan.uses[0].beforeText).toContain('Escudo 3');
    expect(abilityChangeText(plan, plan.uses[0], {})).toContain('Protección 3');
    expect(source).toEqual(demoGame);
    const next = applyAbilityChange(plan, {}).next!;
    expect(next.cards).toEqual(source.cards);
    expect(next.definitions.abilities[1].id).toBe(shield.id);
    expect(abilityText(next, next.cards[4].abilities[0])).toContain('Reduce 3 de daño.');
    expect(abilityText(next, next.cards[6].abilities[0])).toBe('Protección 3');
  });
  it('requiere valores separados por uso, incluso usos repetidos en una misma carta', () => {
    const source = structuredClone(demoGame);
    source.cards[4].abilities.push({ definitionId: 'shield', parameters: { amount: 8 }, showReminder: false });
    const plan = prepareAbilityChange(source, { ...shield, reminder: 'Previene {amount} contra {target}.', parameters: [...shield.parameters, { id: 'target', name: 'Objetivo', kind: 'text' }] });
    expect(plan.uses).toHaveLength(4);
    expect(new Set(plan.uses.map(use => use.key)).size).toBe(4);
    expect(applyAbilityChange(plan, {}).next).toBeNull();
    const values = Object.fromEntries(plan.uses.map((use, index) => [use.key, { target: `objetivo ${index}` }]));
    const next = applyAbilityChange(plan, values).next!;
    expect(next.cards[4].abilities.map(use => use.parameters)).toEqual([{ amount: 3, target: 'objetivo 0' }, { amount: 8, target: 'objetivo 1' }]);
    expect(next.cards[4].abilities[1].showReminder).toBe(false);
    expect(source.cards[4].abilities[0].parameters).toEqual({ amount: 3 });
  });
  it.each(['', ' ', 'Infinity', 'incorrecto'])('bloquea valores numéricos nuevos inválidos %j', raw => {
    const plan = prepareAbilityChange(demoGame, { ...shield, name: 'Escudo {n}', reminder: '', parameters: [{ id: 'n', name: 'Cantidad', kind: 'number' }] });
    const result = applyAbilityChange(plan, Object.fromEntries(plan.uses.map(use => [use.key, { n: raw }])));
    expect(result.next).toBeNull(); expect(Object.keys(result.errors)).toHaveLength(3);
  });
  it('retira parámetros obsoletos y convierte palabras clave con valores explícitos', () => {
    const keyword = prepareAbilityChange(demoGame, { id: 'shield', kind: 'keyword', name: 'Protección', reminder: '' });
    expect(keyword.uses[0].removed.map(item => item.id)).toEqual(['amount']);
    const next = applyAbilityChange(keyword, {}).next!;
    expect(next.cards[4].abilities[0].parameters).toEqual({});
    const parametrized = prepareAbilityChange(next, shield);
    expect(applyAbilityChange(parametrized, {}).next).toBeNull();
    const restored = applyAbilityChange(parametrized, Object.fromEntries(parametrized.uses.map(use => [use.key, { amount: '0' }]))).next!;
    expect(restored.cards[4].abilities[0].parameters).toEqual({ amount: 0 });
  });
  it('un cambio de formato exige reemplazo y conserva los otros datos de la carta', () => {
    const plan = prepareAbilityChange(demoGame, { ...shield, parameters: [{ id: 'amount', name: 'Cantidad', kind: 'text' }] });
    expect(plan.uses[0].retained).toEqual({});
    expect(plan.uses[0].required).toHaveLength(1);
    const next = applyAbilityChange(plan, Object.fromEntries(plan.uses.map(use => [use.key, { amount: 'muchos' }]))).next!;
    expect(next.cards[4]).toEqual({ ...demoGame.cards[4], abilities: [{ ...demoGame.cards[4].abilities[0], parameters: { amount: 'muchos' } }] });
  });
  it('rechaza marcadores inválidos antes de abrir una revisión', () => {
    expect(() => prepareAbilityChange(demoGame, { ...shield, name: 'Escudo {missing}' })).toThrow();
  });
});
