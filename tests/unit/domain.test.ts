import { describe, expect, it } from 'vitest';
import { demoGame } from '../../src/fixtures/demo-game.ts';
import { abilityText, attributesForTypes, parseGameFile, subtypesForTypes, unassignedAttributes } from '../../src/domain/rules.ts';
import type { GameFile } from '../../src/domain/schema.ts';

describe('Contrato v1', () => {
  it('valida doce cartas y conserva los datos al serializar', () => {
    expect(demoGame.cards).toHaveLength(12);
    expect(parseGameFile(JSON.parse(JSON.stringify(demoGame)))).toEqual(demoGame);
  });
  it('combina atributos por identificador en el orden del catálogo', () => {
    expect(attributesForTypes(demoGame, ['unit', 'artifact']).map(a => a.id)).toEqual(['resistance', 'attack', 'cost', 'active', 'affinity']);
    expect(unassignedAttributes(demoGame, demoGame.cards[4]).map(a => a.id)).toEqual(['affinity']);
  });
  it('filtra subtipos según los tipos seleccionados', () => {
    expect(subtypesForTypes(demoGame, ['unit']).map(s => s.id)).toEqual(['guardian', 'scout']);
  });
  it('resuelve Escudo 3 y conserva orden y recordatorio', () => {
    expect(abilityText(demoGame, demoGame.cards[6].abilities[0])).toBe('Escudo 3');
    expect(abilityText(demoGame, demoGame.cards[4].abilities[0])).toBe('Escudo 3: Previene 3 puntos de daño.');
    expect(demoGame.cards[9].abilities.map(a => abilityText(demoGame, a))).toEqual(['Volar', 'Escudo 2: Previene 2 puntos de daño.']);
  });
  it('incluye casos límite válidos', () => {
    expect(demoGame.cards[6].attributeValues.resistance).toBe(0);
    expect(demoGame.cards[11].attributeValues.active).toBe(true);
    expect(demoGame.cards[7].text.length).toBeGreaterThan(1000);
    expect(demoGame.cards[8].visual.illustrationId).toBeNull();
  });
  it('renombrar no rompe referencias ni modifica el objeto de entrada', () => {
    const data = structuredClone(demoGame);
    data.definitions.types[0].name = 'Criatura';
    const before = JSON.stringify(data);
    expect(parseGameFile(data).cards[0].typeIds).toEqual(['unit']);
    expect(JSON.stringify(data)).toBe(before);
  });
  const invalid: [string, (g: GameFile) => void][] = [
    ['subtipo incompatible', g => { g.cards[0].subtypeIds = ['relic']; }],
    ['tipo inexistente', g => { g.cards[0].typeIds = ['missing']; }],
    ['supertipo inexistente', g => { g.cards[0].supertypeIds = ['missing']; }],
    ['identificador duplicado', g => { g.cards[1].id = g.cards[0].id; }],
    ['tipo repetido', g => { g.cards[0].typeIds.push('unit'); }],
    ['atributo inexistente en tipo', g => { g.definitions.types[0].attributeIds.push('missing'); }],
    ['subtipo huérfano', g => { g.definitions.subtypes[0].typeId = 'missing'; }],
    ['valor ausente', g => { delete g.cards[0].attributeValues.resistance; }],
    ['valor de tipo incorrecto', g => { g.cards[0].attributeValues.resistance = '3'; }],
    ['valor fuera de límites', g => { g.cards[0].attributeValues.resistance = -1; }],
    ['opción inexistente', g => { g.cards[0].attributeValues.affinity = 'Aire'; }],
    ['atributo no aplicable', g => { g.cards[0].attributeValues.active = false; }],
    ['valor inicial incorrecto', g => { g.definitions.attributes[4].defaultValue = 'Aire'; }],
    ['espacio repetido', g => { g.cards[0].visual.attributeSlots[1] = 'resistance'; }],
    ['espacio no aplicable', g => { g.cards[0].visual.attributeSlots[1] = 'active'; }],
    ['ilustración inexistente', g => { g.cards[0].visual.illustrationId = 'missing'; }],
    ['símbolo usado como ilustración', g => { g.cards[0].visual.illustrationId = 'energy-symbol'; }],
    ['referencia de símbolo incorrecta', g => { g.definitions.resources[0].symbolImageId = 'forge-image'; }],
    ['habilidad inexistente', g => { g.cards[4].abilities[0].definitionId = 'missing'; }],
    ['parámetro ausente', g => { g.cards[4].abilities[0].parameters = {}; }],
    ['parámetro de tipo incorrecto', g => { g.cards[4].abilities[0].parameters.amount = 'tres'; }],
    ['parámetro adicional', g => { g.cards[4].abilities[0].parameters.extra = 1; }],
    ['marcador no declarado', g => { g.definitions.abilities[1].name = 'Escudo {other}'; }],
    ['recorte fuera de la imagen', g => { g.cards[0].visual.crop.x = 0.5; }],
  ];
  it.each(invalid)('rechaza %s', (_, mutate) => {
    const data = structuredClone(demoGame);
    mutate(data);
    expect(() => parseGameFile(data)).toThrow();
  });
  it('rechaza versiones desconocidas y bytes o rutas de imágenes', () => {
    expect(() => parseGameFile({ ...demoGame, formatVersion: 2 })).toThrow();
    for (const key of ['blob', 'dataUrl', 'url']) {
      const data = structuredClone(demoGame);
      Object.assign(data.images[0], { [key]: 'data:image/png;base64,AA==' });
      expect(() => parseGameFile(data)).toThrow();
    }
  });
});
