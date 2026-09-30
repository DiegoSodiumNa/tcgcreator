import { PDFDocument, PrintScaling, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { mmToPoints as pt } from '../rendering/measurements';
import { countSelection, cutLines, pageCards, printLayout, type PrintSettings, type Selection } from './print-layout';
export async function createCardsPdf(selection: Selection, settings: PrintSettings, fontBytes: Uint8Array, render: (id: string) => Promise<Uint8Array>, progress: (message: string) => void, signal: AbortSignal) {
  const total = countSelection(selection);
  if (!total) throw new Error('Selecciona al menos una carta.');
  const layout = printLayout(settings);
  const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
  pdf.setTitle('Forja - Tanda de cartas'); pdf.setSubject('Imprimir al 100 %, sin ajustar a página. Cartas de 63 x 88 mm.');
  const images = new Map<string, Awaited<ReturnType<typeof pdf.embedPng>>>();
  for (const [index, entry] of selection.entries()) {
    signal.throwIfAborted(); progress(`Renderizando diseño ${index + 1} de ${selection.length}…`);
    images.set(entry.cardId, await pdf.embedPng(await render(entry.cardId)));
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  const pages = Math.ceil(total / layout.capacity);
  const ink = rgb(.12, .12, .12);
  for (let index = 0; index < pages; index++) {
    signal.throwIfAborted(); progress(`Preparando hoja ${index + 1} de ${pages}…`);
    const page = pdf.addPage([pt(layout.width), pt(layout.height)]);
    const cards = pageCards(selection, layout, index);
    for (const card of cards) page.drawImage(images.get(card.cardId)!, { x: pt(card.x), y: pt(layout.height - card.y - 88), width: pt(63), height: pt(88) });
    for (const line of cutLines(cards, layout)) page.drawLine({ start: { x: pt(line.x1), y: pt(layout.height - line.y1) }, end: { x: pt(line.x2), y: pt(layout.height - line.y2) }, thickness: .3, color: ink });
    if (layout.top >= 4) page.drawText('Imprimir al 100 % / Tamaño real / Sin ajustar a página', { x: pt(layout.left), y: pt(1), font, size: 5, color: ink });
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  // Tiny margins need a separate instruction sheet, included in the UI count.
  if (settings.calibration || layout.top < 4) {
    const page = pdf.addPage([pt(layout.width), pt(layout.height)]);
    page.drawText('Imprimir al 100 % / Tamaño real', { x: pt(20), y: pt(layout.height - 30), font, size: 16 });
    page.drawText('Desactivar Ajustar a página. Cartas de 63 x 88 mm.', { x: pt(20), y: pt(layout.height - 42), font, size: 10 });
    if (settings.calibration) {
      page.drawRectangle({ x: pt(30), y: pt(layout.height - 120), width: pt(50), height: pt(50), borderWidth: .4, borderColor: ink });
      page.drawText('50 x 50 mm - Medir entre centros de línea', { x: pt(20), y: pt(layout.height - 132), font, size: 10 });
    }
  }
  signal.throwIfAborted(); progress('Preparando descarga…');
  const bytes = await pdf.save(); signal.throwIfAborted(); return bytes;
}
