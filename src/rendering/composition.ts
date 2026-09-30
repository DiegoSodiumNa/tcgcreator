import type { Card, GameFile } from '../domain/schema';
import { fitText, templateContent } from './template-a';
export type Box = { x: number; y: number; width: number; height: number };
export type RenderIssue = { cardId: string; zone: string; message: string };
export type FittedText = Box & { text: string; size: number; align?: 'center' };
export function layoutFor(card: Card) {
  const compact = card.visual.templateId === 'text';
  const art = compact ? (card.visual.illustrationId ? { x: 42, y: 190, width: 660, height: 170 } : null) : { x: 42, y: 190, width: 660, height: 371 };
  const slotsY = compact ? (art ? 379 : 190) : 580;
  const bodyY = slotsY + 126;
  return { art, slotsY, body: { x: 42, y: bodyY, width: 660, height: 966 - bodyY } };
}
/** Cover within the persisted normalized rectangle, never stretch the source. */
export function imageCrop(width: number, height: number, crop: Card['visual']['crop'], target: Box) {
  const region = { x: crop.x * width, y: crop.y * height, width: crop.width * width, height: crop.height * height };
  const w = Math.min(region.width, region.height * target.width / target.height);
  const h = w * target.height / target.width;
  return { x: region.x + (region.width - w) / 2, y: region.y + (region.height - h) / 2, width: w, height: h };
}
export function composeWithMeasure(game: GameFile, card: Card, measure: (text: string, size: number) => number) {
  const issues: RenderIssue[] = [];
  const layout = layoutFor(card);
  let content: ReturnType<typeof templateContent>;
  try { content = templateContent(game, card); }
  catch { content = { name: card.name, classification: '', body: '', slots: [] }; issues.push({ cardId: card.id, zone: 'Contenido', message: 'Completa los parámetros de las habilidades.' }); }
  const fit = (zone: string, text: string, box: Box, initial: number, minimum: number): FittedText => {
    try { return { ...box, ...fitText(text, box.width, box.height, initial, minimum, measure) }; }
    catch { issues.push({ cardId: card.id, zone, message: `${zone}: el texto no cabe. Reduce su longitud o cambia de plantilla.` }); return { ...box, text: 'Texto fuera del área', size: minimum }; }
  };
  const name = fit('Nombre', content.name, { x: 58, y: 51, width: 628, height: 70 }, 36, 29);
  const classification = fit('Clasificación', content.classification, { x: 58, y: 130, width: 628, height: 51 }, 20, 17);
  const body = fit('Texto', content.body, { x: 62, y: layout.body.y + 12, width: 620, height: layout.body.height - 25 }, 25, 23);
  const slots = content.slots.map((slot, index) => {
    if (!slot) return null;
    const symbolId = game.definitions.attributes.find(a => a.id === card.visual.attributeSlots[index])?.symbolImageId;
    const x = 42 + index * 167;
    return { symbolId, label: { ...fit(`Nombre del espacio ${index + 1}`, slot.label, { x: x + 11, y: layout.slotsY + 13, width: 137, height: 28 }, 17, 15), align: 'center' as const },
      value: { ...fit(`Valor del espacio ${index + 1}`, slot.value, { x: x + (symbolId ? 49 : 11), y: layout.slotsY + 48, width: symbolId ? 99 : 137, height: 48 }, 26, 19), align: 'center' as const } };
  });
  return { card, layout, name, classification, body, slots, issues };
}
export type CardComposition = ReturnType<typeof composeWithMeasure>;
