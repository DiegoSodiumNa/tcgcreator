import { abilityText, unassignedAttributes } from '../domain/rules.ts';
import type { Card, GameFile } from '../domain/schema.ts';

export const FONT_FAMILY = 'Forja Noto';
export const FONT_URL = '/fonts/NotoSans-Regular.ttf';
export const ILLUSTRATION_URL = '/images/forja.svg';

export function displayValue(value: string | number | boolean) {
  return typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value);
}

export function templateContent(game: GameFile, card: Card) {
  const classifications = [...card.supertypeIds, ...card.typeIds, ...card.subtypeIds].map(id =>
    [...game.definitions.supertypes, ...game.definitions.types, ...game.definitions.subtypes].find(item => item.id === id)?.name ?? id);
  return {
    name: card.name,
    classification: classifications.join(' · '),
    slots: card.visual.attributeSlots.map(id => {
      const attribute = game.definitions.attributes.find(a => a.id === id);
      return attribute ? { label: attribute.name, value: displayValue(card.attributeValues[attribute.id]) } : null;
    }),
    body: [
      ...unassignedAttributes(game, card).map(a => `${a.name}: ${displayValue(card.attributeValues[a.id])}`),
      ...card.abilities.map(a => abilityText(game, a)), card.text,
    ].filter(Boolean).join('\n\n'),
  };
}

/** Word wrap with explicit newlines; refuses overlong single words instead of clipping. */
export function fitText(text: string, width: number, height: number, initialSize: number, minimumSize: number,
  measure: (text: string, size: number) => number) {
  for (let size = initialSize; size >= minimumSize; size--) {
    const lines: string[] = [];
    let tooWide = false;
    for (const paragraph of text.split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (measure(word, size) > width) tooWide = true;
        const candidate = line ? `${line} ${word}` : word;
        if (line && measure(candidate, size) > width) { lines.push(line); line = word; }
        else line = candidate;
      }
      lines.push(line);
    }
    if (!tooWide && lines.length * size * 1.25 <= height) return { text: lines.join('\n'), size };
  }
  throw new Error('El texto no cabe en la plantilla. Reduce su longitud antes de exportar.');
}
