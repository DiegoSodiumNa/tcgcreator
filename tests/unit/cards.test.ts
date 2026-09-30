import { describe, expect, it } from 'vitest';
import { demoGame } from '../../src/fixtures/demo-game';
import { cardFromDraft, deleteCard, duplicateCard, newCard, prepareCardTypes, putCard } from '../../src/domain/cards';

describe('contenido de cartas', () => {
  it('combina tipos, inicializa formatos y conserva valores compartidos sin mutar el borrador', () => {
    const draft = newCard('new');
    const unit = prepareCardTypes(demoGame, draft, ['unit']).next;
    unit.attributeValues.resistance = 9;
    const both = prepareCardTypes(demoGame, unit, ['unit', 'artifact']).next;
    expect(both.attributeValues).toEqual({ resistance: 9, attack: 2, cost: '1 energía', active: false, affinity: 'Fuego' });
    expect(draft.typeIds).toEqual([]);
    expect(unit.attributeValues).not.toHaveProperty('active');
    expect(both.visual).toEqual(draft.visual);
  });
  it('revisa subtipos, valores y espacios retirados; mantiene lo aportado por otro tipo', () => {
    const draft = structuredClone(demoGame.cards[4]);
    const before = structuredClone(draft);
    const plan = prepareCardTypes(demoGame, draft, ['artifact']);
    expect(plan.removedSubtypes.map(item => item.id)).toEqual(['guardian']);
    expect(plan.removedAttributes.map(item => item.id)).toEqual(['attack', 'affinity']);
    expect(plan.clearedSlots).toEqual([2]);
    expect(plan.next.subtypeIds).toEqual(['machine']);
    expect(plan.next.attributeValues.resistance).toBe(3);
    expect(plan.next.visual.attributeSlots).toEqual(['resistance', null, 'cost', 'active']);
    expect(draft).toEqual(before);
    expect(cardFromDraft(demoGame, plan.next).card).not.toBeNull();
  });
  it('guarda los cuatro formatos, números cero y parámetros sin cambiar el diseño', () => {
    const draft = structuredClone(demoGame.cards[4]);
    draft.name = '  Nueva carta  ';
    draft.attributeValues = { resistance: '0', attack: '4.5', cost: '', active: true, affinity: 'Agua' };
    draft.abilities[0].parameters.amount = '0';
    const result = cardFromDraft(demoGame, draft);
    expect(result.errors).toEqual({});
    expect(result.card).toMatchObject({ name: 'Nueva carta', attributeValues: { resistance: 0, attack: 4.5, cost: '', active: true, affinity: 'Agua' } });
    expect(result.card!.abilities[0].parameters.amount).toBe(0);
    expect(result.card!.visual).toEqual(demoGame.cards[4].visual);
    expect(putCard(demoGame, result.card!).cards).toHaveLength(12);
  });
  it.each(['', ' ', 'Infinity', 'NaN', '3x', '-1', '100'])('rechaza resistencia inválida %j sin mutar la carta', value => {
    const draft = structuredClone(demoGame.cards[4]); draft.attributeValues.resistance = value;
    const result = cardFromDraft(demoGame, draft);
    expect(result.card).toBeNull(); expect(result.errors['attribute:resistance']).toBeTruthy();
    expect(draft.attributeValues.resistance).toBe(value);
  });
  it('exige nombre y tipos y rechaza subtipos, opciones y parámetros incompatibles', () => {
    expect(cardFromDraft(demoGame, newCard('new')).errors).toMatchObject({ name: expect.any(String), types: expect.any(String) });
    const draft = structuredClone(demoGame.cards[0]); draft.subtypeIds = ['machine'];
    expect(cardFromDraft(demoGame, draft).card).toBeNull();
    draft.subtypeIds = []; draft.attributeValues.affinity = 'Inexistente';
    expect(cardFromDraft(demoGame, draft).errors['attribute:affinity']).toBeTruthy();
    const shield = structuredClone(demoGame.cards[4]); shield.abilities[0].parameters.amount = '';
    expect(cardFromDraft(demoGame, shield).errors['ability:0:amount']).toBeTruthy();
  });
  it('duplica y elimina conservando imágenes, diseño y origen', () => {
    const source = structuredClone(demoGame);
    const first = duplicateCard(source, 'card-05', 'copy-1');
    const second = duplicateCard(first, 'card-05', 'copy-2');
    expect(second.cards.at(-1)).toEqual({ ...source.cards[4], id: 'copy-2', name: 'Centinela Mecánico (copia 2)' });
    expect(second.images).toEqual(source.images);
    expect(deleteCard(second, 'copy-1').cards).toHaveLength(13);
    expect(deleteCard(second, 'copy-1').images).toEqual(source.images);
    expect(source).toEqual(demoGame);
  });
});
