'use client';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import type { Card, GameFile } from '@/domain/schema';
import { CARD_PX } from './measurements';
import { FONT_FAMILY, fitText, templateContent } from './template-a';

export function composeCard(game: GameFile, card: Card) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('El navegador no pudo preparar el lienzo.');
  const measure = (text: string, size: number) => { context.font = `${size}px "${FONT_FAMILY}"`; return context.measureText(text).width; };
  const content = templateContent(game, card);
  return {
    name: fitText(content.name, 628, 70, 36, 29, measure),
    classification: fitText(content.classification, 628, 51, 20, 17, measure),
    body: fitText(content.body, 620, 235, 25, 23, measure),
    slots: content.slots.map(slot => slot && ({
      label: fitText(slot.label, 137, 28, 17, 15, measure),
      value: fitText(slot.value, 137, 48, 26, 19, measure),
    })),
  };
}
export type CardComposition = ReturnType<typeof composeCard>;

/** A single scene is used by the screen preview, PNG, and PDF. Coordinates are export pixels. */
export function CardScene({ composition: c, image, colors }: { composition: CardComposition; image: HTMLImageElement; colors: Card['visual']['colors'] }) {
  const textProps = { fontFamily: FONT_FAMILY, fill: colors.foreground, lineHeight: 1.25, wrap: 'none' as const, listening: false };
  const art = { x: 42, y: 190, width: 660, height: 371 };
  const ratio = art.width / art.height;
  const cropHeight = image.naturalWidth / ratio;
  return <Group listening={false}>
    <Rect width={CARD_PX.width} height={CARD_PX.height} fill="#233e35" />
    <Rect x={22} y={22} width={700} height={995} fill={colors.background} cornerRadius={16} />
    <Rect x={33} y={33} width={678} height={973} stroke={colors.accent} strokeWidth={2} cornerRadius={10} />
    <Text {...textProps} x={58} y={51} width={628} text={c.name.text} fontSize={c.name.size} />
    <Text {...textProps} x={58} y={130} width={628} text={c.classification.text} fontSize={c.classification.size} />
    <KonvaImage {...art} image={image} crop={{ x: 0, y: Math.max(0, (image.naturalHeight - cropHeight) / 2), width: image.naturalWidth, height: cropHeight }} />
    <Rect {...art} stroke={colors.accent} strokeWidth={2} />
    {c.slots.map((slot, i) => <Group key={i} x={42 + i * 167} y={580}>
      <Rect width={159} height={105} fill="#ffffff" opacity={.55} cornerRadius={5} />
      {slot && <><Text {...textProps} x={11} y={13} width={137} align="center" text={slot.label.text} fontSize={slot.label.size} /><Text {...textProps} x={11} y={48} width={137} align="center" text={slot.value.text} fontSize={slot.value.size} /></>}
    </Group>)}
    <Rect x={42} y={706} width={660} height={260} fill="#ffffff" opacity={.3} cornerRadius={5} />
    <Text {...textProps} x={62} y={718} width={620} text={c.body.text} fontSize={c.body.size} />
    <Text {...textProps} x={50} y={981} width={644} align="center" text="GUARDIANES DE LA FORJA · PRUEBA 01" fontSize={13} />
  </Group>;
}
