export type PrintSettings = { paper: 'letter' | 'a4'; margin: number; gap: number; calibration: boolean };
export type Selection = { cardId: string; quantity: number }[];
export const DEFAULT_PRINT: PrintSettings = { paper: 'letter', margin: 5, gap: 2, calibration: false };
export const PAPERS = { letter: { width: 215.9, height: 279.4 }, a4: { width: 210, height: 297 } };
export function printLayout(settings: PrintSettings) {
  const paper = PAPERS[settings.paper];
  if (!paper || !Number.isFinite(settings.margin) || settings.margin < 1 || !Number.isFinite(settings.gap) || settings.gap < 0) throw new Error('Usa un margen de al menos 1 mm y una separación de 0 mm o más.');
  const columns = Math.floor((paper.width - settings.margin * 2 + settings.gap) / (63 + settings.gap));
  const rows = Math.floor((paper.height - settings.margin * 2 + settings.gap) / (88 + settings.gap));
  if (columns < 1 || rows < 1) throw new Error('No cabe una carta con estos márgenes.');
  const left = (paper.width - columns * 63 - (columns - 1) * settings.gap) / 2;
  const top = (paper.height - rows * 88 - (rows - 1) * settings.gap) / 2;
  return { ...paper, columns, rows, capacity: columns * rows, left, top, gap: settings.gap };
}
export function countSelection(selection: Selection) {
  let total = 0;
  const seen = new Set<string>();
  for (const entry of selection) {
    if (!Number.isSafeInteger(entry.quantity) || entry.quantity < 1 || seen.has(entry.cardId)) throw new Error('Las cantidades deben ser enteros positivos y cada carta debe aparecer una vez.');
    seen.add(entry.cardId); total += entry.quantity;
    if (!Number.isSafeInteger(total)) throw new Error('La cantidad total es demasiado grande.');
  }
  return total;
}
export function pageCards(selection: Selection, layout: ReturnType<typeof printLayout>, page: number) {
  const total = countSelection(selection);
  const first = page * layout.capacity;
  if (!Number.isInteger(page) || page < 0 || first >= total) return [];
  const result: { cardId: string; x: number; y: number; width: number; height: number }[] = [];
  let offset = 0;
  for (const entry of selection) {
    const start = Math.max(first, offset), end = Math.min(first + layout.capacity, offset + entry.quantity);
    for (let n = start; n < end; n++) {
      const slot = n - first;
      result.push({ cardId: entry.cardId, x: layout.left + slot % layout.columns * (63 + layout.gap), y: layout.top + Math.floor(slot / layout.columns) * (88 + layout.gap), width: 63, height: 88 });
    }
    offset += entry.quantity;
  }
  return result;
}
export type CutLine = { x1: number; y1: number; x2: number; y2: number };
export function cutLines(cards: ReturnType<typeof pageCards>, layout: ReturnType<typeof printLayout>) {
  const lines = new Map<string, CutLine>();
  const add = (line: CutLine) => { const key = [line.x1, line.y1, line.x2, line.y2].map(n => n.toFixed(6)).join(','); lines.set(key, line); };
  for (const c of cards) for (const x of [c.x, c.x + 63]) for (const y of [c.y, c.y + 88]) {
    const dx = x === c.x ? -1 : 1, dy = y === c.y ? -1 : 1;
    const horizontalNeighbor = cards.some(other => other !== c && Math.abs(other.y - c.y) < .001 && (dx < 0 ? other.x < c.x : other.x > c.x));
    const verticalNeighbor = cards.some(other => other !== c && Math.abs(other.x - c.x) < .001 && (dy < 0 ? other.y < c.y : other.y > c.y));
    const availableX = horizontalNeighbor ? layout.gap / 2 : dx < 0 ? x : layout.width - x;
    const availableY = verticalNeighbor ? layout.gap / 2 : dy < 0 ? y : layout.height - y;
    const lengthX = Math.min(3, availableX - .2), lengthY = Math.min(3, availableY - .2);
    if (lengthX > .25) { const ends = [x + dx * .25, x + dx * lengthX].sort((a, b) => a - b); add({ x1: ends[0], y1: y, x2: ends[1], y2: y }); }
    if (lengthY > .25) { const ends = [y + dy * .25, y + dy * lengthY].sort((a, b) => a - b); add({ x1: x, y1: ends[0], x2: x, y2: ends[1] }); }
  }
  return [...lines.values()];
}
