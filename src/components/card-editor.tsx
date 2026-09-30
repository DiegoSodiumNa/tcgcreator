'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { VisualControls } from './visual-controls';
import { useEffect, useMemo, useState } from 'react';
import type { Card } from '@/domain/schema';
import { attributesForTypes, subtypesForTypes } from '@/domain/rules';
import { cardFromDraft, newCard, prepareCardTypes, putCard } from '@/domain/cards';
import { prepareImage, type PreparedImage } from '@/storage/images';
import { StorageError } from '@/storage/repository';
import { gameUrl, useGame, useLocalSave } from './local-game';
import { Modal } from './ui/modal';
import { Button } from './ui/button';

const CardPreview = dynamic(() => import('./card-preview'), { ssr: false });
const toggle = (ids: string[], id: string) => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
const displayValue = (value: unknown) => typeof value === 'boolean' ? value ? 'Sí' : 'No' : String(value ?? '');
export function CardEditor({ id, original }: { id: string; original?: Card }) {
  const { game } = useGame();
  const baseline = useMemo(() => original ?? newCard(id), [original, id]);
  const [draft, setDraft] = useState<Card>(() => structuredClone(baseline));
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [imageError, setImageError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [typeChange, setTypeChange] = useState<ReturnType<typeof prepareCardTypes> | null>(null);
  const [selectedAbility, setSelectedAbility] = useState('');
  useEffect(() => { setDraft(structuredClone(baseline)); setImage(null); setErrors({}); setImageError(''); }, [baseline]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline) || !!image;
  const withImage = useMemo(() => image ? { ...game, images: [...game.images, image.metadata] } : game, [game, image]);
  const pending = useMemo(() => image ? [image.pending] : [], [image]);
  const { save, busy, feedback } = useLocalSave(dirty, () => {
    const result = cardFromDraft(withImage, draft);
    if (!result.card) throw new StorageError('validation', 'Revisa los campos señalados antes de guardar.');
    return putCard(withImage, result.card);
  }, image ? [image.pending] : [], preparing, { validate: async () => {
    const result = cardFromDraft(withImage, draft); setErrors(result.errors); return !!result.card;
  } });
  const update = (next: Card) => { setDraft(next); setErrors({}); };
  const fieldError = (key: string) => errors[key] && <span role="alert" className="field-error">{errors[key]}</span>;
  const attributes = attributesForTypes(game, draft.typeIds);
  const compatibleSubtypes = subtypesForTypes(game, draft.typeIds);
  const changeTypes = (typeId: string) => {
    const change = prepareCardTypes(game, draft, toggle(draft.typeIds, typeId));
    if (change.removedTypes.length) setTypeChange(change); else update(change.next);
  };
  const setUse = (index: number, use: Card['abilities'][number]) => update({ ...draft, abilities: draft.abilities.map((current, position) => position === index ? use : current) });
  const moveUse = (index: number, delta: number) => {
    const abilities = [...draft.abilities];
    [abilities[index], abilities[index + delta]] = [abilities[index + delta], abilities[index]];
    update({ ...draft, abilities });
  };
  const addAbility = () => {
    const definition = game.definitions.abilities.find(item => item.id === selectedAbility);
    if (!definition) return;
    const parameters = definition.kind === 'parameterized' ? Object.fromEntries(definition.parameters.map(parameter => [parameter.id, ''])) : {};
    update({ ...draft, abilities: [...draft.abilities, { definitionId: definition.id, parameters, showReminder: true }] });
    setSelectedAbility('');
  };
  return <><Link className="back-link" href={gameUrl('cartas', game.game.id)}>← Volver a Cartas</Link><div className="page-heading"><div className="eyebrow">{game.game.name}</div><h1>Editor de carta</h1><p>{original ? 'Edita el contenido y guarda tus cambios en este navegador.' : 'Combina tipos, completa sus atributos y crea una carta.'}</p></div>
    <div className="editor-grid"><section className="panel"><form noValidate onSubmit={event => { event.preventDefault(); void save(); }}><fieldset disabled={busy}>
      <h2>Contenido</h2><label>Nombre de la carta<input value={draft.name} aria-invalid={!!errors.name} onChange={event => update({ ...draft, name: event.target.value })} />{fieldError('name')}</label>
      <fieldset className="choice-group"><legend>Tipos de la carta</legend>{game.definitions.types.map(type => <label className="check-label" key={type.id}><input type="checkbox" checked={draft.typeIds.includes(type.id)} onChange={() => changeTypes(type.id)} />{type.name}</label>)}{fieldError('types')}</fieldset>
      <fieldset className="choice-group"><legend>Supertipos</legend>{game.definitions.supertypes.map(item => <label className="check-label" key={item.id}><input type="checkbox" checked={draft.supertypeIds.includes(item.id)} onChange={() => update({ ...draft, supertypeIds: toggle(draft.supertypeIds, item.id) })} />{item.name}</label>)}{!game.definitions.supertypes.length && <p className="muted">Sin supertipos definidos.</p>}</fieldset>
      <fieldset className="choice-group"><legend>Subtipos compatibles</legend>{compatibleSubtypes.map(item => <label className="check-label" key={item.id}><input type="checkbox" checked={draft.subtypeIds.includes(item.id)} onChange={() => update({ ...draft, subtypeIds: toggle(draft.subtypeIds, item.id) })} />{item.name}</label>)}{!compatibleSubtypes.length && <p className="muted">No hay subtipos para los tipos seleccionados.</p>}</fieldset>
      <section className="card-attribute-fields"><h3>Atributos</h3>{attributes.map(attribute => <label key={attribute.id} className={attribute.kind === 'boolean' ? 'check-label' : ''}>{attribute.kind === 'boolean' ? <><input type="checkbox" checked={draft.attributeValues[attribute.id] === true} onChange={event => update({ ...draft, attributeValues: { ...draft.attributeValues, [attribute.id]: event.target.checked } })} />{attribute.name}</> : <>{attribute.name}{attribute.kind === 'select' ? <select value={String(draft.attributeValues[attribute.id] ?? '')} onChange={event => update({ ...draft, attributeValues: { ...draft.attributeValues, [attribute.id]: event.target.value } })}>{attribute.options.map(option => <option key={option} value={option}>{option}</option>)}</select> : <input value={String(draft.attributeValues[attribute.id] ?? '')} inputMode={attribute.kind === 'number' ? 'decimal' : 'text'} onChange={event => update({ ...draft, attributeValues: { ...draft.attributeValues, [attribute.id]: event.target.value } })} />}</>}{attribute.kind === 'number' && <span className="muted">{attribute.min !== undefined ? `Mínimo: ${attribute.min}. ` : ''}{attribute.max !== undefined ? `Máximo: ${attribute.max}.` : ''}</span>}{fieldError(`attribute:${attribute.id}`)}</label>)}</section>
      <label>Texto de la carta<textarea rows={5} value={draft.text} onChange={event => update({ ...draft, text: event.target.value })} /></label>
      <section className="card-abilities"><h3>Habilidades</h3><label>Añadir habilidad<select value={selectedAbility} onChange={event => setSelectedAbility(event.target.value)}><option value="">Selecciona una habilidad</option>{game.definitions.abilities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><Button type="button" variant="outline" disabled={!selectedAbility} onClick={addAbility}>Añadir habilidad a la carta</Button>
        {draft.abilities.map((use, index) => {
          const definition = game.definitions.abilities.find(item => item.id === use.definitionId);
          return <fieldset className="parameter-row" key={index}><legend>Habilidad {index + 1}: {definition?.name}</legend>{fieldError(`ability:${index}`)}{definition?.kind === 'parameterized' && definition.parameters.map(parameter => <label key={parameter.id}>{parameter.name} — habilidad {index + 1}<input value={String(use.parameters[parameter.id] ?? '')} inputMode={parameter.kind === 'number' ? 'decimal' : 'text'} onChange={event => setUse(index, { ...use, parameters: { ...use.parameters, [parameter.id]: event.target.value } })} />{fieldError(`ability:${index}:${parameter.id}`)}</label>)}<label className="check-label"><input type="checkbox" checked={use.showReminder} onChange={event => setUse(index, { ...use, showReminder: event.target.checked })} />Mostrar recordatorio — habilidad {index + 1}</label><div className="action-row"><Button type="button" variant="outline" disabled={index === 0} aria-label={`Subir habilidad ${index + 1}`} onClick={() => moveUse(index, -1)}>Subir</Button><Button type="button" variant="outline" disabled={index === draft.abilities.length - 1} aria-label={`Bajar habilidad ${index + 1}`} onClick={() => moveUse(index, 1)}>Bajar</Button><Button type="button" variant="ghost" aria-label={`Quitar habilidad ${index + 1}`} onClick={() => update({ ...draft, abilities: draft.abilities.filter((_, position) => position !== index) })}>Quitar</Button></div></fieldset>;
        })}
      </section>
      <VisualControls game={withImage} card={draft} onChange={update} />
      <label>Elegir ilustración existente<select value={draft.visual.illustrationId ?? ''} onChange={event => { if (event.target.value !== image?.metadata.id) setImage(null); update({ ...draft, visual: { ...draft.visual, illustrationId: event.target.value || null, crop: { x: 0, y: 0, width: 1, height: 1 } } }); }}><option value="">Sin ilustración</option>{withImage.images.filter(item => item.kind === 'illustration').map(item => <option key={item.id} value={item.id}>{item.originalName}</option>)}</select></label>
      <label>Ilustración de la carta<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async event => {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        setPreparing(true); setImageError('');
        try { const prepared = await prepareImage(file); setImage(prepared); update({ ...draft, visual: { ...draft.visual, illustrationId: prepared.metadata.id, crop: { x: 0, y: 0, width: 1, height: 1 } } }); }
        catch (failure) { setImageError(failure instanceof Error ? failure.message : 'No se pudo leer la imagen.'); }
        finally { setPreparing(false); }
      }} /></label><p className="muted">PNG, JPEG o WebP; hasta 20 MB y 25 millones de píxeles. Se guarda junto con la carta.</p>{imageError && <p role="alert" className="field-error">{imageError}</p>}<Button type="button" variant="outline" disabled={!draft.visual.illustrationId} onClick={() => { setImage(null); setImageError(''); update({ ...draft, visual: { ...draft.visual, illustrationId: null } }); }}>Retirar ilustración</Button>
      {fieldError('general')}<div className="action-row definition-actions"><Button disabled={!dirty || busy}>Guardar carta</Button><Button type="button" variant="outline" disabled={!dirty || busy} onClick={() => { update(structuredClone(baseline)); setImage(null); setImageError(''); }}>Descartar cambios</Button></div>
    </fieldset></form>{feedback}</section>
    <section className="preview-panel card-content-preview" aria-label="Vista de contenido"><span className="eyebrow">VISTA PREVIA</span><CardPreview game={withImage} card={draft} pending={pending} /><p className="muted">El PNG y el PDF utilizan esta misma composición.</p></section></div>
    {typeChange && <Modal title="Revisar retirada de tipos" onClose={() => setTypeChange(null)}><p>Se retirarán: {typeChange.removedTypes.map(item => item.name).join(', ')}.</p>{!!typeChange.removedSubtypes.length && <p>Subtipos que dejarán de aplicar: {typeChange.removedSubtypes.map(item => item.name).join(', ')}.</p>}{!!typeChange.removedAttributes.length && <ul>{typeChange.removedAttributes.map(item => <li key={item.id}>Retirar {item.name}: {displayValue(item.value)}</li>)}</ul>}{!!typeChange.clearedSlots.length && <p>Vaciar espacios: {typeChange.clearedSlots.join(', ')}.</p>}<p>Los atributos que siga aportando otro tipo conservarán sus valores. El cambio quedará en el borrador hasta guardar la carta.</p><div className="action-row"><Button onClick={() => { update(typeChange.next); setTypeChange(null); }}>Confirmar retirada</Button><Button variant="outline" onClick={() => setTypeChange(null)}>Cancelar</Button></div></Modal>}
  </>;
}
