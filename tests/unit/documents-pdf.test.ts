import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFName } from 'pdf-lib';
import { createRulesPdf, createSelectionListPdf, wrapDocumentText } from '../../src/export/documents-pdf';

const font = new Uint8Array(readFileSync('public/fonts/NotoSans-Regular.ttf'));
const cards = [{ id: 'a', name: 'Energía ágil' }, { id: 'b', name: 'Protección' }, { id: 'c', name: 'Acción' }];
describe('documentos imprimibles', () => {
  it('conserva saltos explícitos y divide palabras largas sin perder caracteres', () => {
    expect(wrapDocumentText('áé\r\n\r\nñü', 8, text => text.length)).toEqual(['áé', '', 'ñü']);
    const token = 'abcdefghijklmnopqrstuv';
    const lines = wrapDocumentText(token, 5, text => text.length);
    expect(lines.join('')).toBe(token);
    expect(lines.every(line => line.length <= 5)).toBe(true);
    expect(wrapDocumentText('uno dos tres', 7, text => text.length)).toEqual(['uno dos', 'tres']);
    expect(() => wrapDocumentText('a', 0, text => text.length)).toThrow();
  });
  it.each(['letter', 'a4'] as const)('pagina el reglamento largo e incorpora fuente en %s', async paper => {
    const bytes = await createRulesPdf('Juego español', ('Párrafo: energía, protección, acción y pingüino.\nSegunda línea.\n\n').repeat(70), paper, font);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(3);
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(paper === 'letter' ? 612 : 210 * 72 / 25.4);
    for (const page of pdf.getPages()) expect(page.node.Resources()?.get(PDFName.of('Font'))).toBeDefined();
    expect(pdf.getTitle()).toBe('Juego español - Reglamento');
  });
  it('rechaza texto vacío y caracteres sin glifo en vez de sustituirlos', async () => {
    await expect(createRulesPdf('Juego', ' \n ', 'letter', font)).rejects.toThrow('Escribe');
    await expect(createRulesPdf('Juego', 'Texto 🦄', 'letter', font)).rejects.toThrow('U+1F984');
  });
  it('rechaza listados vacíos, cantidades inválidas y referencias inexistentes', async () => {
    await expect(createSelectionListPdf('Juego', cards, [], 'letter', font)).rejects.toThrow('Selecciona');
    for (const quantity of [0, -1, 1.5, NaN]) await expect(createSelectionListPdf('Juego', cards, [{ cardId: 'a', quantity }], 'letter', font)).rejects.toThrow('enteros');
    await expect(createSelectionListPdf('Juego', cards, [{ cardId: 'x', quantity: 1 }], 'letter', font)).rejects.toThrow('ya no existe');
  });
  it('genera 2/3/1 y pagina nombres extensos con encabezados repetidos', async () => {
    const selection = cards.map((card, i) => ({ cardId: card.id, quantity: [2, 3, 1][i] }));
    const short = await PDFDocument.load(await createSelectionListPdf('Juego', cards, selection, 'letter', font));
    expect(short.getPageCount()).toBe(1);
    const many = Array.from({ length: 200 }, (_, i) => ({ id: String(i), name: `Carta ${i} - ${'Nombre extenso con acentos. '.repeat(5)}` }));
    const long = await PDFDocument.load(await createSelectionListPdf('Juego', many, many.map(card => ({ cardId: card.id, quantity: 1 })), 'a4', font));
    expect(long.getPageCount()).toBeGreaterThan(10);
  });
  it('respeta cancelación antes de crear el archivo', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(createRulesPdf('Juego', 'Texto', 'letter', font, controller.signal)).rejects.toThrow();
  });
});
