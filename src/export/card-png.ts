import Konva from 'konva';
import { createCardGroup } from '../rendering/card-scene';
import type { CardComposition } from '../rendering/composition';
export async function renderCardPng(composition: CardComposition, images: Map<string, HTMLImageElement>): Promise<Uint8Array> {
  if (composition.issues.length) throw new Error('Corrige los problemas de la carta antes de exportarla.');
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none';
  document.body.appendChild(container);
  const stage = new Konva.Stage({ container, width: 744, height: 1039 });
  try {
    const layer = new Konva.Layer(); stage.add(layer); layer.add(createCardGroup(composition, images)); stage.draw();
    const canvas = stage.toCanvas({ pixelRatio: 1 });
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('No se pudo generar el PNG.')), 'image/png'));
      return new Uint8Array(await blob.arrayBuffer());
    } finally { canvas.width = 0; canvas.height = 0; }
  } finally { stage.destroy(); container.remove(); }
}
