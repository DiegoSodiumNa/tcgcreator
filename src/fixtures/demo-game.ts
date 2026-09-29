import type { Card, GameFile } from '../domain/schema.ts';
import { attributesForTypes, parseGameFile } from '../domain/rules.ts';

const date = '2026-09-29T12:00:00.000Z';
const game: GameFile = {
  formatVersion: 1, exportedAt: date,
  game: { id: 'game-forja', name: 'Guardianes de la Forja', description: 'Juego ficticio para validar el editor.', rules: 'Cada jugador comienza con tres cartas.\nEn tu turno, juega una Unidad o un Artefacto.\nEste reglamento es un ejemplo de prueba.', createdAt: date, updatedAt: date },
  definitions: {
    supertypes: [{ id: 'legendary', name: 'Legendario' }, { id: 'ancient', name: 'Ancestral' }],
    types: [
      { id: 'unit', name: 'Unidad', attributeIds: ['resistance', 'attack', 'cost', 'affinity'] },
      { id: 'artifact', name: 'Artefacto', attributeIds: ['resistance', 'cost', 'active'] },
    ],
    subtypes: [
      { id: 'guardian', name: 'Guardián', typeId: 'unit' }, { id: 'scout', name: 'Explorador', typeId: 'unit' },
      { id: 'relic', name: 'Reliquia', typeId: 'artifact' }, { id: 'machine', name: 'Máquina', typeId: 'artifact' },
    ],
    attributes: [
      { id: 'resistance', name: 'Resistencia', kind: 'number', defaultValue: 3, min: 0, max: 99 },
      { id: 'attack', name: 'Ataque', kind: 'number', defaultValue: 2, min: 0 },
      { id: 'cost', name: 'Coste', kind: 'text', defaultValue: '1 energía', symbolImageId: 'energy-symbol' },
      { id: 'active', name: 'Activado', kind: 'boolean', defaultValue: false },
      { id: 'affinity', name: 'Afinidad', kind: 'select', options: ['Fuego', 'Agua', 'Tierra'], defaultValue: 'Fuego' },
    ],
    resources: [{ id: 'energy', name: 'Energía', symbolImageId: 'energy-symbol' }],
    abilities: [
      { id: 'flying', name: 'Volar', kind: 'keyword', reminder: 'Solo puede ser bloqueada por unidades con Volar.' },
      { id: 'shield', name: 'Escudo {amount}', kind: 'parameterized', reminder: 'Previene {amount} puntos de daño.', parameters: [{ id: 'amount', name: 'Cantidad', kind: 'number' }] },
    ],
  },
  cards: [],
  images: [
    { id: 'forge-image', kind: 'illustration', originalName: 'forja.png', width: 1200, height: 900 },
    { id: 'energy-symbol', kind: 'symbol', originalName: 'energia.png', width: 64, height: 64 },
  ],
};

const examples = [
  ['Guardián de la Forja', ['unit'], ['guardian']],
  ['Exploradora del Alba', ['unit'], ['scout']],
  ['Núcleo Ancestral', ['artifact'], ['relic']],
  ['Máquina de Bronce', ['artifact'], ['machine']],
  ['Centinela Mecánico', ['unit', 'artifact'], ['guardian', 'machine']],
  ['Ícaro, Guardián Aéreo', ['unit'], ['guardian']],
  ['Égida del Río', ['artifact'], ['relic']],
  ['Cronista de las Mil Batallas', ['unit'], ['scout']],
  ['Piedra sin Rostro', ['artifact'], ['relic']],
  ['Autómata del Crepúsculo', ['unit', 'artifact'], ['scout', 'machine']],
  ['Vigía Silencioso', ['unit'], []],
  ['Reliquia Despierta', ['artifact'], ['relic']],
] satisfies [string, string[], string[]][];

game.cards = examples.map(([name, typeIds, subtypeIds], index): Card => {
  const attributes = attributesForTypes(game, typeIds);
  const slots: (string | null)[] = attributes.slice(0, 4).map(a => a.id);
  while (slots.length < 4) slots.push(null);
  return {
    id: `card-${String(index + 1).padStart(2, '0')}`, name, typeIds, subtypeIds,
    supertypeIds: index === 5 ? ['legendary', 'ancient'] : index === 2 ? ['ancient'] : [],
    attributeValues: Object.fromEntries(attributes.map(a => [a.id, a.defaultValue])),
    text: index === 7
      ? 'Al entrar, recuerda una batalla y elige una unidad aliada.\n' + 'Hasta el final del turno, esa unidad obtiene protección contra el primer daño recibido. Si controlas un Artefacto, puedes devolver una carta de tu descarte a tu mano; después descarta otra carta. '.repeat(7)
      : index === 10 ? '' : 'Al entrar, roba una carta. Después, puedes gastar 1 energía.',
    abilities: index === 5 ? [{ definitionId: 'flying', parameters: {}, showReminder: true }]
      : index === 4 || index === 6 ? [{ definitionId: 'shield', parameters: { amount: 3 }, showReminder: index === 4 }]
      : index === 9 ? [{ definitionId: 'flying', parameters: {}, showReminder: false }, { definitionId: 'shield', parameters: { amount: 2 }, showReminder: true }] : [],
    visual: {
      templateId: index === 7 ? 'text' : 'illustration', templateVersion: 1,
      colors: { background: '#F5EAD6', foreground: '#201B18', accent: '#A34B24' },
      attributeSlots: slots, illustrationId: index === 8 || index === 10 ? null : 'forge-image',
      crop: { x: 0, y: 0, width: 1, height: 1 },
    },
  };
});
game.cards[11].attributeValues.active = true;
game.cards[6].attributeValues.resistance = 0;
game.cards[1].attributeValues.affinity = 'Agua';

export const demoGame = parseGameFile(game);
