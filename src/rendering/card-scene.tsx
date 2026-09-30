'use client';
import { useLayoutEffect, useRef } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import type { Card, GameFile } from '@/domain/schema';
import { FONT_FAMILY } from './template-a';
import { composeWithMeasure, imageCrop, type CardComposition, type FittedText } from './composition';
export type { CardComposition } from './composition';
export function composeCard(game: GameFile, card: Card): CardComposition {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) throw new Error('El navegador no pudo preparar el lienzo.');
  return composeWithMeasure(game, card, (text, size) => { context.font = `${size}px "${FONT_FAMILY}"`; return context.measureText(text).width; });
}
/** Identical nodes for the preview and exports. */
export function createCardGroup(c: CardComposition, images: Map<string, HTMLImageElement>, illustration?: HTMLImageElement) {
  const group = new Konva.Group({ listening: false });
  const colors = c.card.visual.colors;
  const rect = (config: Konva.RectConfig) => group.add(new Konva.Rect(config));
  const text = ({ size, ...value }: FittedText) => group.add(new Konva.Text({ ...value, fontSize: size, fontFamily: FONT_FAMILY, fill: colors.foreground, lineHeight: 1.25, wrap: 'none', listening: false }));
  rect({ width: 744, height: 1039, fill: colors.accent });
  rect({ x: 22, y: 22, width: 700, height: 995, fill: colors.background, cornerRadius: 16 });
  rect({ x: 33, y: 33, width: 678, height: 973, stroke: colors.accent, strokeWidth: 2, cornerRadius: 10 });
  text(c.name); text(c.classification);
  const image = illustration ?? images.get(c.card.visual.illustrationId ?? '');
  if (c.layout.art) {
    rect({ ...c.layout.art, fill: '#ffffff', opacity: .25 });
    if (image) group.add(new Konva.Image({ ...c.layout.art, image, crop: imageCrop(image.naturalWidth, image.naturalHeight, c.card.visual.crop, c.layout.art) }));
    else text({ ...c.layout.art, y: c.layout.art.y + 30, text: c.card.visual.illustrationId ? 'Ilustración pendiente' : 'Sin ilustración', size: 20, align: 'center' });
    rect({ ...c.layout.art, stroke: colors.accent, strokeWidth: 2 });
  }
  c.slots.forEach((slot, i) => {
    rect({ x: 42 + i * 167, y: c.layout.slotsY, width: 159, height: 105, fill: '#ffffff', opacity: .55, cornerRadius: 5 });
    if (!slot) return;
    text(slot.label); text(slot.value);
    const symbol = images.get(slot.symbolId ?? '');
    if (symbol) {
      const scale = Math.min(32 / symbol.naturalWidth, 32 / symbol.naturalHeight);
      group.add(new Konva.Image({ x: 53 + i * 167 + (32 - symbol.naturalWidth * scale) / 2, y: c.layout.slotsY + 49, width: symbol.naturalWidth * scale, height: symbol.naturalHeight * scale, image: symbol }));
    }
  });
  rect({ ...c.layout.body, fill: '#ffffff', opacity: .3, cornerRadius: 5 }); text(c.body);
  return group;
}
export function CardScene({ composition, image, images = new Map() }: { composition: CardComposition; image?: HTMLImageElement; images?: Map<string, HTMLImageElement>; colors?: Card['visual']['colors'] }) {
  const ref = useRef<Konva.Group>(null);
  useLayoutEffect(() => {
    const node = createCardGroup(composition, images, image);
    ref.current?.add(node); ref.current?.getLayer()?.draw();
    return () => { node.destroy(); };
  }, [composition, image, images]);
  return <Group ref={ref} listening={false} />;
}
