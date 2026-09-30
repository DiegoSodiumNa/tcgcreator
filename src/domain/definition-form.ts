import { parseDefinition, type Catalog, type Definition } from './definitions';

export type DefinitionFields = {
  name: string;
  typeId: string;
  attributeIds: string[];
  attributeKind: 'text' | 'number' | 'boolean' | 'select';
  textDefault: string;
  numberDefault: string;
  booleanDefault: boolean;
  optionsText: string;
  selectDefault: string;
  min: string;
  max: string;
  symbolImageId: string;
  abilityKind: 'keyword' | 'parameterized';
  reminder: string;
  parameters: { key: string; name: string; kind: 'text' | 'number' }[];
};
export type FieldIssue = { path: string; message: string };
export class DefinitionFormError extends Error {
  constructor(public issues: FieldIssue[]) { super(issues.map(issue => issue.message).join('\n')); }
}

export function definitionFields(value?: Definition): DefinitionFields {
  const result: DefinitionFields = {
    name: value?.name ?? '', typeId: '', attributeIds: [], attributeKind: 'text', textDefault: '', numberDefault: '0', booleanDefault: false,
    optionsText: '', selectDefault: '', min: '', max: '', symbolImageId: '', abilityKind: 'keyword', reminder: '', parameters: [],
  };
  if (!value) return result;
  if ('typeId' in value) result.typeId = value.typeId;
  if ('attributeIds' in value) result.attributeIds = [...value.attributeIds];
  if ('symbolImageId' in value) result.symbolImageId = value.symbolImageId ?? '';
  if ('defaultValue' in value) {
    result.attributeKind = value.kind;
    if (value.kind === 'text') result.textDefault = value.defaultValue;
    if (value.kind === 'boolean') result.booleanDefault = value.defaultValue;
    if (value.kind === 'number') { result.numberDefault = String(value.defaultValue); result.min = value.min === undefined ? '' : String(value.min); result.max = value.max === undefined ? '' : String(value.max); }
    if (value.kind === 'select') { result.optionsText = value.options.join('\n'); result.selectDefault = value.defaultValue; }
  }
  if ('reminder' in value) {
    result.abilityKind = value.kind; result.reminder = value.reminder;
    if (value.kind === 'parameterized') result.parameters = value.parameters.map(parameter => ({ key: parameter.id, name: parameter.name, kind: parameter.kind }));
  }
  return result;
}

/** Convert form strings to the existing v1 union, preserving zero/false/empty
 * text and rejecting blank or partial numbers rather than coercing them to 0. */
export function definitionFromFields(catalog: Catalog, id: string, fields: DefinitionFields): Definition {
  const issues: FieldIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  const name = fields.name.trim();
  if (!name) issue('name', 'Escribe un nombre.');
  const number = (raw: string, path: string, optional = false) => {
    if (!raw.trim()) {
      if (!optional) issue(path, 'Introduce un número válido.');
      return undefined;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) { issue(path, 'Introduce un número finito.'); return undefined; }
    return value;
  };
  let value: unknown = { id, name };
  if (catalog === 'types') value = { id, name, attributeIds: fields.attributeIds };
  if (catalog === 'subtypes') {
    if (!fields.typeId) issue('typeId', 'Selecciona el tipo al que pertenece.');
    value = { id, name, typeId: fields.typeId };
  }
  const symbol = fields.symbolImageId ? { symbolImageId: fields.symbolImageId } : {};
  if (catalog === 'resources') value = { id, name, ...symbol };
  if (catalog === 'attributes') {
    const base = { id, name, ...symbol, kind: fields.attributeKind };
    if (fields.attributeKind === 'text') value = { ...base, defaultValue: fields.textDefault };
    if (fields.attributeKind === 'boolean') value = { ...base, defaultValue: fields.booleanDefault };
    if (fields.attributeKind === 'number') {
      const defaultValue = number(fields.numberDefault, 'numberDefault');
      const min = number(fields.min, 'min', true); const max = number(fields.max, 'max', true);
      if (min !== undefined && max !== undefined && min > max) issue('max', 'El máximo debe ser mayor o igual que el mínimo.');
      if (defaultValue !== undefined && ((min !== undefined && defaultValue < min) || (max !== undefined && defaultValue > max))) issue('numberDefault', 'El valor inicial debe estar dentro de los límites.');
      value = { ...base, defaultValue, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
    }
    if (fields.attributeKind === 'select') {
      const options = fields.optionsText.split(/\r?\n/).map(option => option.trim()).filter(Boolean);
      if (!options.length) issue('optionsText', 'Escribe al menos una opción.');
      if (new Set(options).size !== options.length) issue('optionsText', 'Las opciones no pueden repetirse.');
      if (!options.includes(fields.selectDefault.trim())) issue('selectDefault', 'Elige una de las opciones como valor inicial.');
      value = { ...base, options, defaultValue: fields.selectDefault.trim() };
    }
  }
  if (catalog === 'abilities') {
    const parameters = fields.abilityKind === 'keyword' ? [] : fields.parameters.map((parameter, index) => {
      const key = parameter.key.trim(); const label = parameter.name.trim();
      if (!key || /[{}]/.test(key)) issue(`parameters.${index}.key`, 'Escribe una clave sin llaves.');
      if (!label) issue(`parameters.${index}.name`, 'Escribe el nombre del parámetro.');
      return { id: key, name: label, kind: parameter.kind };
    });
    if (fields.abilityKind === 'parameterized' && !parameters.length) issue('parameters', 'Añade al menos un parámetro.');
    const keys = parameters.map(parameter => parameter.id);
    if (new Set(keys).size !== keys.length) issue('parameters', 'Las claves de parámetros no pueden repetirse.');
    const placeholders = [...`${name} ${fields.reminder}`.matchAll(/\{([^{}]+)\}/g)].map(match => match[1]);
    const missing = placeholders.filter(key => !keys.includes(key));
    const unused = keys.filter(key => !placeholders.includes(key));
    if (missing.length) issue('reminder', `Define los parámetros usados en los marcadores: ${[...new Set(missing)].join(', ')}.`);
    if (unused.length) issue('parameters', `Incluye estos marcadores en el nombre o recordatorio: ${unused.map(key => `{${key}}`).join(', ')}.`);
    value = { id, name, kind: fields.abilityKind, reminder: fields.reminder, ...(fields.abilityKind === 'parameterized' ? { parameters } : {}) };
  }
  if (issues.length) throw new DefinitionFormError(issues);
  // Structural validation is shared with persisted/imported data, not a second schema.
  return parseDefinition(catalog, value);
}
