import { describe, expect, it } from 'vitest';
import { demoGame } from '../../src/fixtures/demo-game';
import { parseGameFile } from '../../src/domain/rules';
import { definitionDependencies, prepareDefinitionChange, type Catalog, type Definition } from '../../src/domain/definitions';
import { definitionFields, definitionFromFields, DefinitionFormError } from '../../src/domain/definition-form';

function game() { return structuredClone(demoGame); }
function edit(catalog: Catalog, value: Definition) { return prepareDefinitionChange(game(), { catalog, id: value.id, action: 'upsert', value }); }

describe('cambios de definiciones', () => {
  it('renombra sin cambiar identificadores, referencias ni valores de cartas', () => {
    const original = game(); const snapshot = structuredClone(original);
    const plan = prepareDefinitionChange(original, { catalog: 'types', id: 'unit', action: 'upsert', value: { ...original.definitions.types[0], name: 'Criatura' } });
    expect(plan.blockers).toEqual([]); expect(plan.impacts).toEqual([]);
    expect(plan.next?.definitions.types[0]).toMatchObject({ id: 'unit', name: 'Criatura' });
    expect(plan.next?.cards).toEqual(original.cards);
    expect(original).toEqual(snapshot);
  });
  it('identifica cartas y definiciones dependientes de un tipo o atributo', () => {
    const types = definitionDependencies(game(), 'types', 'unit');
    expect(types).toContainEqual(expect.objectContaining({ id: 'guardian', kind: 'definition' }));
    expect(types).toContainEqual(expect.objectContaining({ id: 'card-05', kind: 'card' }));
    const attributes = definitionDependencies(game(), 'attributes', 'resistance');
    expect(attributes.filter(item => item.kind === 'definition').map(item => item.id)).toEqual(['unit', 'artifact']);
    expect(attributes.filter(item => item.id === 'card-05')).toHaveLength(1);
  });
  it.each([['types', 'unit'], ['attributes', 'resistance'], ['supertypes', 'legendary'], ['subtypes', 'guardian'], ['abilities', 'shield']] as const)('bloquea eliminar %s utilizado', (catalog, id) => {
    const plan = prepareDefinitionChange(game(), { catalog, id, action: 'delete' });
    expect(plan.next).toBeNull(); expect(plan.dependencies.length).toBeGreaterThan(0);
  });
  it('elimina un concepto sin referencias sin retirar su imagen compartida', () => {
    const plan = prepareDefinitionChange(game(), { catalog: 'resources', id: 'energy', action: 'delete' });
    expect(plan.next?.definitions.resources).toHaveLength(0);
    expect(plan.next?.images).toEqual(demoGame.images);
    expect(plan.next?.definitions.attributes.find(item => item.id === 'cost')).toHaveProperty('symbolImageId', 'energy-symbol');
  });
  it('prepara valores iniciales para cartas afectadas sin escribir en el original', () => {
    const original = game();
    original.definitions.attributes.push({ id: 'speed', name: 'Velocidad', kind: 'number', defaultValue: 0 });
    const plan = prepareDefinitionChange(original, { catalog: 'types', id: 'unit', action: 'upsert', value: { ...original.definitions.types[0], attributeIds: [...original.definitions.types[0].attributeIds, 'speed'] } });
    expect(plan.next?.cards.find(card => card.id === 'card-05')?.attributeValues.speed).toBe(0);
    expect(plan.next?.cards.find(card => card.id === 'card-03')?.attributeValues).not.toHaveProperty('speed');
    expect(plan.impacts.map(item => item.id)).toEqual(original.cards.filter(card => card.typeIds.includes('unit')).map(card => card.id));
    expect(original.cards[0].attributeValues).not.toHaveProperty('speed');
    expect(plan.next && parseGameFile(plan.next)).toBeTruthy();
  });
  it('retira valores y espacios solo cuando ningún tipo mantiene el atributo', () => {
    const original = game(); original.cards[4].attributeValues.resistance = 7;
    const plan = prepareDefinitionChange(original, { catalog: 'types', id: 'unit', action: 'upsert', value: { ...original.definitions.types[0], attributeIds: original.definitions.types[0].attributeIds.filter(id => id !== 'resistance') } });
    expect(plan.next?.cards[0].attributeValues).not.toHaveProperty('resistance');
    expect(plan.next?.cards[0].visual.attributeSlots[0]).toBeNull();
    expect(plan.impacts.find(item => item.id === 'card-01')).toMatchObject({ removed: [{ name: 'Resistencia', value: 3 }], clearedSlots: [1] });
    expect(plan.next?.cards[4].attributeValues.resistance).toBe(7);
    expect(plan.next?.cards[4].visual.attributeSlots[0]).toBe('resistance');
    expect(plan.impacts.find(item => item.id === 'card-05')).toBeUndefined();
  });
  it('cambiar el valor inicial no reemplaza los valores existentes', () => {
    const attribute = game().definitions.attributes[0];
    const plan = edit('attributes', { ...attribute, defaultValue: 9 });
    expect(plan.next?.cards).toEqual(demoGame.cards);
  });
  it.each([
    { id: 'resistance', name: 'Resistencia', kind: 'text', defaultValue: '' },
    { id: 'resistance', name: 'Resistencia', kind: 'number', defaultValue: 1, max: 1 },
    { id: 'affinity', name: 'Afinidad', kind: 'select', defaultValue: 'Fuego', options: ['Fuego'] },
  ])('bloquea cambios de atributos que invalidan valores: $kind', value => {
    const plan = prepareDefinitionChange(game(), { catalog: 'attributes', id: value.id, action: 'upsert', value });
    expect(plan.next).toBeNull(); expect(plan.dependencies.length).toBeGreaterThan(0);
  });
  it('permite ampliar restricciones cuando todas las cartas siguen siendo válidas', () => {
    expect(edit('attributes', { id: 'resistance', name: 'Resistencia', kind: 'number', defaultValue: 3, min: -1, max: 200 }).next).not.toBeNull();
  });
  it('bloquea mover un subtipo si las cartas no tienen el nuevo tipo', () => {
    const plan = edit('subtypes', { id: 'guardian', name: 'Guardián', typeId: 'artifact' });
    expect(plan.next).toBeNull(); expect(plan.dependencies.some(item => item.id === 'card-01')).toBe(true);
    expect(plan.dependencies.some(item => item.id === 'card-05')).toBe(false);
  });
  it('rechaza referencias inexistentes y cambios de identificador', () => {
    expect(edit('subtypes', { id: 'guardian', name: 'Guardián', typeId: 'missing' }).next).toBeNull();
    expect(prepareDefinitionChange(game(), { catalog: 'types', id: 'unit', action: 'upsert', value: { id: 'different', name: 'Tipo', attributeIds: [] } }).next).toBeNull();
  });
  it('bloquea modificar habilidades usadas y permite crear o editar las no usadas', () => {
    expect(edit('abilities', { id: 'flying', name: 'Vuelo', kind: 'keyword', reminder: '' }).next).toBeNull();
    const first = edit('abilities', { id: 'new-ability', name: 'Escudo {n}', kind: 'parameterized', reminder: 'Previene {n}.', parameters: [{ id: 'n', name: 'Cantidad', kind: 'number' }] });
    expect(first.next).not.toBeNull();
    const second = prepareDefinitionChange(first.next!, { catalog: 'abilities', id: 'new-ability', action: 'upsert', value: { id: 'new-ability', name: 'Protección', kind: 'keyword', reminder: '' } });
    expect(second.next).not.toBeNull();
  });
});

describe('formularios y conversión de valores', () => {
  it('convierte ida y vuelta los catálogos del fixture sin cambiar el contrato', () => {
    for (const catalog of Object.keys(demoGame.definitions) as Catalog[]) for (const entry of demoGame.definitions[catalog]) {
      expect(definitionFromFields(catalog, entry.id, definitionFields(entry))).toEqual(entry);
    }
  });
  it('conserva texto vacío, cero y falso como valores iniciales válidos', () => {
    for (const attribute of [{ id: 'a', name: 'A', kind: 'text', defaultValue: '' }, { id: 'a', name: 'A', kind: 'number', defaultValue: 0 }, { id: 'a', name: 'A', kind: 'boolean', defaultValue: false }] as const) {
      expect(definitionFromFields('attributes', 'a', definitionFields(attribute))).toEqual(attribute);
    }
  });
  it.each(['', ' ', '3x', 'Infinity', 'NaN'])('no interpreta %j como un número válido', raw => {
    const fields = { ...definitionFields(), name: 'A', attributeKind: 'number' as const, numberDefault: raw };
    expect(() => definitionFromFields('attributes', 'a', fields)).toThrow(DefinitionFormError);
  });
  it('rechaza límites invertidos, valor inicial fuera de rango y opciones duplicadas', () => {
    const fields = { ...definitionFields(), name: 'A', attributeKind: 'number' as const, min: '5', max: '1', numberDefault: '3' };
    expect(() => definitionFromFields('attributes', 'a', fields)).toThrow('máximo');
    expect(() => definitionFromFields('attributes', 'a', { ...fields, min: '0', max: '1' })).toThrow('límites');
    expect(() => definitionFromFields('attributes', 'a', { ...definitionFields(), name: 'A', attributeKind: 'select', optionsText: 'A\n A', selectDefault: 'A' })).toThrow('repetirse');
  });
  it('exige marcadores definidos, parámetros usados y claves únicas', () => {
    const fields = { ...definitionFields(), name: 'Escudo {n}', abilityKind: 'parameterized' as const, parameters: [{ key: 'x', name: 'Cantidad', kind: 'number' as const }] };
    expect(() => definitionFromFields('abilities', 'a', fields)).toThrow('Define los parámetros');
    expect(() => definitionFromFields('abilities', 'a', { ...fields, name: 'Sin marcador' })).toThrow('Incluye estos marcadores');
    expect(() => definitionFromFields('abilities', 'a', { ...fields, name: 'Escudo {x}', parameters: [...fields.parameters, ...fields.parameters] })).toThrow('repetirse');
  });
  it('recorta nombres y rechaza los vacíos', () => {
    expect(definitionFromFields('supertypes', 'a', { ...definitionFields(), name: '  Legendario  ' })).toEqual({ id: 'a', name: 'Legendario' });
    expect(() => definitionFromFields('types', 'a', { ...definitionFields(), name: ' ' })).toThrow('nombre');
  });
});
