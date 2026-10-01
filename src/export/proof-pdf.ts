import { PDFDocument, PrintScaling, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { mmToPoints as pt, PROOF } from '../rendering/measurements.ts';

export async function createProofPdf(png: Uint8Array, fontBytes: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const image = await pdf.embedPng(png);
  const page = pdf.addPage([pt(PROOF.page.width), pt(PROOF.page.height)]);
  pdf.setTitle('TCGCreator - Prueba de impresión y calibración');
  pdf.setAuthor('TCGCreator');
  pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
  const ink = rgb(.14, .23, .2);
  const text = (value: string, x: number, y: number, size = 10) => page.drawText(value, { x: pt(x), y: pt(y), size, font, color: ink });
  text('TCGCreator / PRUEBA DE IMPRESIÓN', 20, 257, 17);
  text('Imprimir al 100 % / Tamaño real. Desactivar «Ajustar a página».', 20, 247);
  text('Papel Carta (215,9 × 279,4 mm). Solo frente.', 20, 239);
  page.drawImage(image, { x: pt(PROOF.card.x), y: pt(PROOF.card.y), width: pt(PROOF.card.width), height: pt(PROOF.card.height) });
  // Outside crop marks, with a 1 mm gap, do not change the physical image size.
  for (const x of [PROOF.card.x, PROOF.card.x + PROOF.card.width]) {
    for (const y of [PROOF.card.y, PROOF.card.y + PROOF.card.height]) {
      const dx = x === PROOF.card.x ? -1 : 1;
      const dy = y === PROOF.card.y ? -1 : 1;
      page.drawLine({ start: { x: pt(x + dx), y: pt(y) }, end: { x: pt(x + 4 * dx), y: pt(y) }, thickness: .4, color: ink });
      page.drawLine({ start: { x: pt(x), y: pt(y + dy) }, end: { x: pt(x), y: pt(y + 4 * dy) }, thickness: .4, color: ink });
    }
  }
  const square = PROOF.calibration;
  page.drawRectangle({ x: pt(square.x), y: pt(square.y), width: pt(square.size), height: pt(square.size), borderColor: ink, borderWidth: .4 });
  text('50 × 50 mm', 132, 182, 12);
  text('Medir entre centros de línea', 118, 149, 8);
  text('Carta: 63 × 88 mm', 20, 130, 11);
  text('Cuadro de calibración', 120, 218, 11);
  text('Registro de la prueba física', 20, 110, 13);
  const lines = [
    'Fecha: __________________   Impresora: __________________________',
    'Papel: __________________   Visor / controlador: ___________________',
    'Escala seleccionada: ______ %   Ajustar a página: desactivado / otro',
    'Carta medida: ancho ______ mm   alto ______ mm',
    'Cuadro medido: ancho ______ mm   alto ______ mm',
    'Desviación: ancho ______ mm   alto ______ mm',
    'Observaciones: _______________________________________________',
  ];
  lines.forEach((line, i) => text(line, 20, 99 - i * 10));
  text('La verificación digital no sustituye la medición de esta hoja impresa.', 20, 19, 9);
  return pdf.save();
}
