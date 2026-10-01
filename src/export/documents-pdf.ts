import { PDFDocument, type PDFFont, type PDFPage, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { mmToPoints } from '../rendering/measurements';
import { PAPERS, countSelection, type PrintSettings, type Selection } from './print-layout';

export type DocumentPaper = PrintSettings['paper'];
const MARGIN = mmToPoints(20);
const SIZE = 11;
const LEADING = 15;
const ink = rgb(.12, .16, .15);
const normalize = (text: string) => text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').normalize('NFC');

/** Preserve explicit line breaks; long tokens are split by Unicode code point. */
export function wrapDocumentText(text: string, width: number, measure: (text: string) => number): string[] {
  if (!(width > 0)) throw new Error('El ancho del documento debe ser positivo.');
  return normalize(text).split('\n').flatMap(line => {
    if (!line) return [''];
    const result: string[] = [];
    let rest = Array.from(line);
    while (rest.length) {
      let low = 1, high = rest.length, fits = 0;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (measure(rest.slice(0, mid).join('')) <= width) { fits = mid; low = mid + 1; }
        else high = mid - 1;
      }
      if (!fits) throw new Error('Un carácter supera el ancho disponible.');
      if (fits < rest.length) {
        const space = rest.slice(0, fits + 1).lastIndexOf(' ');
        if (space > 0) fits = space;
      }
      result.push(rest.slice(0, fits).join(''));
      rest = rest.slice(fits);
      // The separating space is represented by the automatic line break.
      if (rest[0] === ' ') rest.shift();
    }
    return result;
  });
}

function checkCharacters(font: PDFFont, texts: string[]) {
  const supported = new Set(font.getCharacterSet());
  for (const text of texts) for (const character of normalize(text)) {
    if (character !== '\n' && !supported.has(character.codePointAt(0)!)) {
      throw new Error(`La fuente no admite el carácter «${character}» (U+${character.codePointAt(0)!.toString(16).toUpperCase()}). Sustitúyelo antes de exportar.`);
    }
  }
}

async function document(paper: DocumentPaper, bytes: Uint8Array, title: string, texts: string[], signal?: AbortSignal) {
  const dimensions = PAPERS[paper];
  if (!dimensions) throw new Error('Selecciona papel Carta o A4.');
  signal?.throwIfAborted();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(bytes, { subset: true });
  checkCharacters(font, [title, ...texts]);
  pdf.setTitle(title); pdf.setCreator('TCGCreator');
  const width = mmToPoints(dimensions.width), height = mmToPoints(dimensions.height);
  const usable = width - 2 * MARGIN;
  let page: PDFPage;
  let y = 0;
  let heading: (() => void) | undefined;
  const newPage = () => {
    signal?.throwIfAborted();
    page = pdf.addPage([width, height]); y = height - MARGIN - SIZE;
    heading?.();
  };
  const line = (text: string, x = MARGIN, size = SIZE) => {
    page.drawText(text, { x, y, font, size, color: ink });
  };
  const ensure = (lines: number) => { if (y - (lines - 1) * LEADING < MARGIN) newPage(); };
  const block = (lines: string[]) => {
    const capacity = Math.floor((height - 2 * MARGIN - SIZE) / LEADING) + 1;
    if (lines.length <= capacity) ensure(lines.length);
    for (const text of lines) { ensure(1); line(text); y -= LEADING; }
  };
  newPage();
  block(wrapDocumentText(title, usable, text => font.widthOfTextAtSize(text, SIZE)));
  y -= LEADING;
  return {
    font, usable, block, ensure, line,
    step: () => { y -= LEADING; },
    setHeading: (callback: () => void) => { heading = callback; callback(); },
    async finish() {
      const pages = pdf.getPages();
      pages.forEach((item, index) => {
        const label = `${index + 1} / ${pages.length}`;
        item.drawText(label, { x: width - MARGIN - font.widthOfTextAtSize(label, 9), y: MARGIN / 2, font, size: 9, color: ink });
      });
      signal?.throwIfAborted();
      const result = await pdf.save(); signal?.throwIfAborted(); return result;
    },
  };
}

export async function createRulesPdf(name: string, rules: string, paper: DocumentPaper, fontBytes: Uint8Array, signal?: AbortSignal): Promise<Uint8Array> {
  if (!rules.trim()) throw new Error('Escribe el reglamento antes de descargarlo.');
  const doc = await document(paper, fontBytes, `${normalize(name)} - Reglamento`, [rules], signal);
  // Group nonempty lines into paragraphs without collapsing consecutive blank lines.
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) doc.block(wrapDocumentText(paragraph.join('\n'), doc.usable, text => doc.font.widthOfTextAtSize(text, SIZE)));
    paragraph = [];
  };
  for (const text of normalize(rules).split('\n')) {
    if (text === '') { flush(); doc.block(['']); } else paragraph.push(text);
  }
  flush();
  return doc.finish();
}

export async function createSelectionListPdf(name: string, cards: readonly { id: string; name: string }[], selection: Selection, paper: DocumentPaper, fontBytes: Uint8Array, signal?: AbortSignal): Promise<Uint8Array> {
  const total = countSelection(selection);
  if (!total) throw new Error('Selecciona al menos una carta.');
  const rows = selection.map(entry => {
    const card = cards.find(card => card.id === entry.cardId);
    if (!card) throw new Error('La carta seleccionada ya no existe.');
    return { name: normalize(card.name), quantity: String(entry.quantity) };
  });
  const doc = await document(paper, fontBytes, `${normalize(name)} - Listado de la tanda`, rows.map(row => row.name), signal);
  const quantityWidth = Math.max(doc.font.widthOfTextAtSize('Cantidad', SIZE), ...rows.map(row => doc.font.widthOfTextAtSize(row.quantity, SIZE)));
  const nameWidth = doc.usable - quantityWidth - 18;
  doc.ensure(3);
  doc.setHeading(() => { doc.line('Nombre'); doc.line('Cantidad', MARGIN + doc.usable - quantityWidth); doc.step(); doc.step(); });
  for (const row of rows) {
    signal?.throwIfAborted();
    const lines = wrapDocumentText(row.name, nameWidth, text => doc.font.widthOfTextAtSize(text, SIZE));
    doc.ensure(lines.length + 1);
    lines.forEach((text, index) => {
      doc.ensure(1); doc.line(text);
      if (index === 0) doc.line(row.quantity, MARGIN + doc.usable - doc.font.widthOfTextAtSize(row.quantity, SIZE));
      doc.step();
    });
    doc.ensure(1); doc.step();
  }
  doc.block([`Diseños: ${rows.length}    Total de copias: ${total}`]);
  return doc.finish();
}
