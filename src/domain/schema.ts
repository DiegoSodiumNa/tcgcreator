import { z } from 'zod';

const id = z.string().trim().min(1);
const name = z.string().trim().min(1);
const ids = z.array(id).refine(v => new Set(v).size === v.length, 'Identificadores repetidos');
const named = z.strictObject({ id, name });
const scalar = z.union([z.string(), z.number().finite(), z.boolean()]);
const attributeBase = { id, name, symbolImageId: id.optional() };
export const attributeSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...attributeBase, kind: z.literal('text'), defaultValue: z.string() }),
  z.strictObject({ ...attributeBase, kind: z.literal('number'), defaultValue: z.number().finite(), min: z.number().optional(), max: z.number().optional() }),
  z.strictObject({ ...attributeBase, kind: z.literal('boolean'), defaultValue: z.boolean() }),
  z.strictObject({ ...attributeBase, kind: z.literal('select'), options: ids.refine(v => v.length > 0, 'Se requieren opciones'), defaultValue: id }),
]);
const parameterSchema = z.discriminatedUnion('kind', [
  z.strictObject({ id, name, kind: z.literal('number') }),
  z.strictObject({ id, name, kind: z.literal('text') }),
]);
const abilitySchema = z.discriminatedUnion('kind', [
  z.strictObject({ id, name, kind: z.literal('keyword'), reminder: z.string() }),
  z.strictObject({ id, name, kind: z.literal('parameterized'), reminder: z.string(), parameters: z.array(parameterSchema).min(1) }),
]);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const cardSchema = z.strictObject({
  id, name, supertypeIds: ids, typeIds: ids.min(1), subtypeIds: ids,
  attributeValues: z.record(id, scalar),
  text: z.string(),
  abilities: z.array(z.strictObject({ definitionId: id, parameters: z.record(id, z.union([z.string(), z.number().finite()])), showReminder: z.boolean() })),
  visual: z.strictObject({
    templateId: z.enum(['illustration', 'text']), templateVersion: z.literal(1),
    colors: z.strictObject({ background: color, foreground: color, accent: color }),
    attributeSlots: z.array(id.nullable()).length(4),
    illustrationId: id.nullable(),
    crop: z.strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().positive().max(1), height: z.number().positive().max(1) })
      .refine(v => v.x + v.width <= 1 && v.y + v.height <= 1, 'Recorte fuera de la imagen'),
  }),
});

export const gameFileSchema = z.strictObject({
  formatVersion: z.literal(1), exportedAt: z.iso.datetime(),
  game: z.strictObject({ id, name, description: z.string(), rules: z.string(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() }),
  definitions: z.strictObject({
    supertypes: z.array(named),
    types: z.array(named.extend({ attributeIds: ids })),
    subtypes: z.array(named.extend({ typeId: id })),
    attributes: z.array(attributeSchema),
    resources: z.array(named.extend({ symbolImageId: id.optional() })),
    abilities: z.array(abilitySchema),
  }),
  cards: z.array(cardSchema),
  images: z.array(z.strictObject({ id, kind: z.enum(['illustration', 'symbol']), originalName: name, width: z.number().int().positive(), height: z.number().int().positive(), sha256: z.string().regex(/^[a-f0-9]{64}$/).optional() })),
});

export type GameFile = z.infer<typeof gameFileSchema>;
export type Card = z.infer<typeof cardSchema>;
export type Attribute = z.infer<typeof attributeSchema>;
