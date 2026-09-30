'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm, type FieldPath } from 'react-hook-form';
import { catalogLabels, definitionDependencies, prepareDefinitionChange, type Catalog, type Definition, type DefinitionPlan } from '@/domain/definitions';
import { definitionFields, definitionFromFields, DefinitionFormError, type DefinitionFields } from '@/domain/definition-form';
import { prepareAbilityChange, type AbilityChange } from '@/domain/ability-changes';
import type { GameFile } from '@/domain/schema';
import { AbilityChangeReview } from './ability-change-review';
import { prepareImage, type PreparedImage } from '@/storage/images';
import { StorageError } from '@/storage/repository';
import { gameUrl, LocalImage, useGame, useLocalSave } from './local-game';
import { Modal } from './ui/modal';
import { Button } from './ui/button';

const singular: Record<Catalog, string> = { supertypes: 'supertipo', types: 'tipo', subtypes: 'subtipo', attributes: 'atributo', resources: 'recurso', abilities: 'habilidad' };
function settingsUrl(gameId: string, catalog?: Catalog, id?: string, create = false) {
  const params = new URLSearchParams({ game: gameId });
  if (catalog) params.set('catalog', catalog);
  if (id) params.set('definition', id);
  if (create) params.set('create', '1');
  return `/configuracion/?${params}`;
}

export function GameSettings() {
  const { game } = useGame();
  const params = useSearchParams();
  const selected = params.get('catalog');
  const catalog = selected && Object.hasOwn(catalogLabels, selected) ? selected as Catalog : null;
  const id = params.get('definition');
  const original = catalog ? game.definitions[catalog].find(item => item.id === id) : undefined;
  return <>
    <div className="page-heading"><div className="eyebrow">{game.game.name}</div><h1>Las bases de tu juego</h1><p>Define los conceptos que comparten tus cartas. Los cambios se guardan explícitamente.</p></div>
    <nav className="catalog-nav" aria-label="Catálogos del juego"><Link href={settingsUrl(game.game.id)} aria-current={!catalog ? 'page' : undefined}>Identidad</Link>{(Object.keys(catalogLabels) as Catalog[]).map(key => <Link key={key} href={settingsUrl(game.game.id, key)} aria-current={catalog === key ? 'page' : undefined}>{catalogLabels[key]} <span aria-hidden="true">{game.definitions[key].length}</span></Link>)}</nav>
    {selected && !catalog ? <p role="alert">Catálogo no encontrado. Selecciona una sección.</p> : !catalog ? <IdentityForm /> : id ? original || params.get('create') === '1'
      ? <DefinitionEditor key={`${catalog}-${id}`} catalog={catalog} id={id} original={original} />
      : <section className="panel"><h2>Concepto no encontrado</h2><Link href={settingsUrl(game.game.id, catalog)}>Volver al catálogo</Link></section>
      : <CatalogList key={catalog} catalog={catalog} />}
  </>;
}

function IdentityForm() {
  const { game } = useGame();
  const form = useForm({ defaultValues: { name: game.game.name, description: game.game.description } });
  useEffect(() => form.reset({ name: game.game.name, description: game.game.description }), [game, form.reset]);
  const { save, busy, feedback } = useLocalSave(form.formState.isDirty, () => ({ ...game, game: { ...game.game, ...form.getValues() } }), [], false, { validate: () => form.trigger() });
  return <section className="panel identity-form"><form onSubmit={event => { event.preventDefault(); void save(); }} noValidate><h2>Identidad del juego</h2><fieldset disabled={busy}><label>Nombre del juego<input {...form.register('name', { validate: value => !!value.trim() || 'Escribe un nombre.' })} aria-invalid={!!form.formState.errors.name} /></label>{form.formState.errors.name && <p role="alert" className="field-error">{form.formState.errors.name.message}</p>}<label>Descripción<textarea {...form.register('description')} /></label><Button disabled={!form.formState.isDirty || busy}>Guardar juego</Button></fieldset></form>{feedback}</section>;
}

function Dependencies({ plan }: { plan: DefinitionPlan }) {
  const { game } = useGame();
  return <div className="dependency-list">{plan.blockers.map((message, index) => <p key={index}>{message}</p>)}{!!plan.dependencies.length && <><h3>Dependencias ({plan.dependencies.length})</h3><ul>{plan.dependencies.map(item => <li key={`${item.kind}-${item.id}`}><strong>{item.name}</strong> — {item.reason}{item.kind === 'card' && <> <Link href={gameUrl('editor', game.game.id, item.id)}>Abrir carta</Link></>}</li>)}</ul></>}</div>;
}

function CatalogList({ catalog }: { catalog: Catalog }) {
  const { game } = useGame();
  const [newId] = useState(() => crypto.randomUUID());
  const [deleting, setDeleting] = useState<Definition | null>(null);
  const plan = deleting ? prepareDefinitionChange(game, { catalog, id: deleting.id, action: 'delete' }) : null;
  const { save, busy, feedback } = useLocalSave(false, () => {
    if (!plan?.next) throw new StorageError('validation', 'El concepto tiene dependencias y no se puede eliminar.');
    return plan.next;
  });
  return <section className="panel"><div className="flex-between"><h2>{catalogLabels[catalog]}</h2><Button asChild><Link href={settingsUrl(game.game.id, catalog, newId, true)}>Crear {singular[catalog]}</Link></Button></div>
    {!game.definitions[catalog].length && <p className="coming-note">Todavía no hay conceptos en este catálogo.</p>}
    <ul className="catalog-list">{game.definitions[catalog].map(item => <li key={item.id}><div><strong>{item.name}</strong><p className="muted">{catalog === 'subtypes' && 'typeId' in item ? `Tipo: ${game.definitions.types.find(type => type.id === item.typeId)?.name}` : 'defaultValue' in item ? `Valor inicial: ${String(item.defaultValue)}` : 'attributeIds' in item ? `${item.attributeIds.length} atributos asignados` : 'reminder' in item ? item.reminder : ''}</p></div><div className="action-row"><Button variant="outline" asChild><Link href={settingsUrl(game.game.id, catalog, item.id)} aria-label={`Editar ${item.name}`}>Editar</Link></Button><Button variant="ghost" disabled={busy} onClick={() => setDeleting(item)} aria-label={`Eliminar ${item.name}`}>Eliminar</Button></div></li>)}</ul>
    {feedback}
    {deleting && plan && <Modal title={plan.blockers.length ? 'No se puede eliminar' : `Eliminar ${singular[catalog]}`} busy={busy} onClose={() => setDeleting(null)}>
      <p>Concepto: <strong>{deleting.name}</strong>.</p><Dependencies plan={plan} />
      {!plan.blockers.length && <p>Se eliminará esta definición. Esta acción no se puede deshacer.</p>}
      <div className="action-row">{plan.next && <Button disabled={busy} onClick={async () => { const saved = await save(); setDeleting(null); if (!saved) return; }}>Eliminar definitivamente</Button>}<Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>{plan.blockers.length ? 'Cerrar' : 'Cancelar'}</Button></div>
    </Modal>}
  </section>;
}

function DefinitionEditor({ catalog, id, original }: { catalog: Catalog; id: string; original?: Definition }) {
  const { game } = useGame();
  const form = useForm<DefinitionFields>({ defaultValues: definitionFields(original) });
  const { fields: parameters, append, remove } = useFieldArray({ control: form.control, name: 'parameters' });
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [imageError, setImageError] = useState('');
  const [blocked, setBlocked] = useState<DefinitionPlan | null>(null);
  const [review, setReview] = useState<DefinitionPlan | null>(null);
  const reviewResult = useRef<((confirm: boolean) => void) | null>(null);
  const candidatePlan = useRef<DefinitionPlan | null>(null);
  const candidateAbility = useRef<AbilityChange | null>(null);
  const [abilityReview, setAbilityReview] = useState<AbilityChange | null>(null);
  const abilityResult = useRef<((result: GameFile | false) => void) | null>(null);
  useEffect(() => {
    form.reset(definitionFields(original)); setImage(null); setImageError(''); setBlocked(null);
  }, [original, form.reset]);
  useEffect(() => () => { reviewResult.current?.(false); abilityResult.current?.(false); }, []);

  const abilityUses = catalog === 'abilities' && original ? definitionDependencies(game, catalog, id) : [];
  const validate = async () => {
    form.clearErrors(); setBlocked(null);
    try { definitionFromFields(catalog, id, form.getValues()); return true; }
    catch (error) {
      if (error instanceof DefinitionFormError) for (const issue of error.issues) form.setError(issue.path as FieldPath<DefinitionFields>, { type: 'validate', message: issue.message });
      else form.setError('root', { message: 'Revisa el formato de los campos.' });
      return false;
    }
  };
  const dirty = form.formState.isDirty || !!image;
  const { save, busy, feedback } = useLocalSave(dirty, () => {
    const value = definitionFromFields(catalog, id, form.getValues());
    const withImage = image ? { ...game, images: [...game.images, image.metadata] } : game;
    candidateAbility.current = null;
    if (catalog === 'abilities' && original && 'reminder' in value) {
      const shared = prepareAbilityChange(game, value);
      if (shared.changed && shared.uses.length) {
        candidateAbility.current = shared;
        // Parameter replacements are collected in the review before a validated
        // candidate replaces this untouched snapshot in useLocalSave.
        return game;
      }
    }
    const plan = prepareDefinitionChange(withImage, { catalog, id, action: 'upsert', value });
    candidatePlan.current = plan;
    if (!plan.next) { setBlocked(plan); throw new StorageError('validation', 'No se guardó el cambio. Revisa las dependencias indicadas.'); }
    return plan.next;
  }, image ? [image.pending] : [], preparing, {
    validate,
    beforeSave: async () => {
      if (candidateAbility.current) {
        const shared = candidateAbility.current;
        return new Promise<GameFile | false>(resolve => { abilityResult.current = resolve; setAbilityReview(shared); });
      }
      const plan = candidatePlan.current;
      if (!plan?.impacts.length) return true;
      return new Promise<boolean>(resolve => { reviewResult.current = resolve; setReview(plan); });
    },
  });
  const values = form.watch();
  const error = (path: FieldPath<DefinitionFields>) => {
    const state = form.getFieldState(path, form.formState);
    return state.error?.message ? <span role="alert" className="field-error">{state.error.message}</span> : null;
  };
  const finishReview = (confirmed: boolean) => { setReview(null); reviewResult.current?.(confirmed); reviewResult.current = null; };
  const reset = () => { form.reset(definitionFields(original)); setImage(null); setImageError(''); setBlocked(null); };
  const symbolField = <section className="symbol-field"><h3>Símbolo opcional</h3><label>Símbolo<select {...form.register('symbolImageId')} onChange={event => { form.setValue('symbolImageId', event.target.value, { shouldDirty: true }); if (event.target.value !== image?.metadata.id) setImage(null); }}><option value="">Sin símbolo</option>{game.images.filter(item => item.kind === 'symbol').map(item => <option key={item.id} value={item.id}>{item.originalName}</option>)}{image && <option value={image.metadata.id}>{image.metadata.originalName} (pendiente de guardar)</option>}</select></label><label>Cargar símbolo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setPreparing(true); setImageError('');
    try { const next = await prepareImage(file, 'symbol'); setImage(next); form.setValue('symbolImageId', next.metadata.id, { shouldDirty: true }); }
    catch (failure) { setImageError(failure instanceof Error ? failure.message : 'No se pudo leer el símbolo.'); }
    finally { setPreparing(false); }
  }} /></label><p className="muted">PNG, JPEG o WebP; hasta 20 MB y 25 millones de píxeles. Se guardará junto con la definición.</p>{imageError && <p role="alert" className="field-error">{imageError}</p>}{values.symbolImageId && <LocalImage className="symbol-preview" gameId={game.game.id} imageId={values.symbolImageId} blob={image?.pending.blob} alt="Símbolo del concepto" />}</section>;

  return <><Link className="back-link" href={settingsUrl(game.game.id, catalog)}>← Volver a {catalogLabels[catalog]}</Link>
    <section className="panel definition-form"><h2>{original ? 'Editar' : 'Crear'} {singular[catalog]}</h2>
      {!!abilityUses.length && <div className="coming-note"><Dependencies plan={{ next: null, impacts: [], dependencies: abilityUses, blockers: ['Al guardar revisarás el texto anterior y el nuevo y confirmarás la actualización de estas cartas.'] }} /></div>}
      <form noValidate onSubmit={event => { event.preventDefault(); void save(); }}><fieldset disabled={busy}>
        <label>Nombre del concepto<input {...form.register('name')} aria-invalid={!!form.formState.errors.name} />{error('name')}</label>
        {catalog === 'types' && <fieldset className="choice-group"><legend>Atributos del tipo</legend>{!game.definitions.attributes.length && <p>Crea atributos en su catálogo antes de asignarlos.</p>}{game.definitions.attributes.map(attribute => <label className="check-label" key={attribute.id}><input type="checkbox" value={attribute.id} {...form.register('attributeIds')} />{attribute.name}</label>)}<p className="muted">Un atributo compartido por varios tipos conserva un solo valor en cada carta.</p></fieldset>}
        {catalog === 'subtypes' && <label>Tipo al que pertenece<select {...form.register('typeId')}><option value="">Selecciona un tipo</option>{game.definitions.types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select>{error('typeId')}</label>}
        {catalog === 'attributes' && <><label>Formato del atributo<select {...form.register('attributeKind')}><option value="text">Texto</option><option value="number">Número</option><option value="boolean">Sí / no</option><option value="select">Selección</option></select></label>
          {values.attributeKind === 'text' && <label>Valor inicial de texto<input {...form.register('textDefault')} /></label>}
          {values.attributeKind === 'number' && <div className="number-fields"><label>Valor inicial numérico<input inputMode="decimal" {...form.register('numberDefault')} />{error('numberDefault')}</label><label>Mínimo (opcional)<input inputMode="decimal" {...form.register('min')} />{error('min')}</label><label>Máximo (opcional)<input inputMode="decimal" {...form.register('max')} />{error('max')}</label></div>}
          {values.attributeKind === 'boolean' && <label className="check-label"><input type="checkbox" {...form.register('booleanDefault')} />Valor inicial: sí</label>}
          {values.attributeKind === 'select' && <><label>Opciones (una por línea)<textarea {...form.register('optionsText')} />{error('optionsText')}</label><label>Opción inicial<select {...form.register('selectDefault')}><option value="">Selecciona una opción</option>{[...new Set(values.optionsText.split(/\r?\n/).map(option => option.trim()).filter(Boolean))].map(option => <option key={option} value={option}>{option}</option>)}</select>{error('selectDefault')}</label></>}
          <p className="muted">El valor inicial se usa al asignar este atributo a nuevas cartas; cambiarlo no sustituye los valores existentes.</p>{symbolField}</>}
        {catalog === 'resources' && symbolField}
        {catalog === 'abilities' && <><label>Clase de habilidad<select {...form.register('abilityKind')}><option value="keyword">Palabra clave</option><option value="parameterized">Parametrizada</option></select></label><label>Recordatorio<textarea {...form.register('reminder')} />{error('reminder')}</label>
          {values.abilityKind === 'parameterized' && <section><h3>Parámetros</h3><p className="muted">Usa la clave entre llaves en el nombre o recordatorio, por ejemplo Escudo {'{cantidad}'}. Los parámetros son texto o números, sin fórmulas.</p>{parameters.map((parameter, index) => <fieldset className="parameter-row" key={parameter.id}><legend>Parámetro {index + 1}</legend><label>Clave del parámetro {index + 1}<input {...form.register(`parameters.${index}.key`)} />{error(`parameters.${index}.key`)}</label><label>Nombre del parámetro {index + 1}<input {...form.register(`parameters.${index}.name`)} />{error(`parameters.${index}.name`)}</label><label>Formato del parámetro {index + 1}<select {...form.register(`parameters.${index}.kind`)}><option value="number">Número</option><option value="text">Texto</option></select></label><Button type="button" variant="ghost" onClick={() => remove(index)}>Quitar parámetro {index + 1}</Button></fieldset>)}{error('parameters')}<Button type="button" variant="outline" onClick={() => append({ key: '', name: '', kind: 'number' })}>Añadir parámetro</Button></section>}</>}
        {form.formState.errors.root && <p role="alert" className="field-error">{form.formState.errors.root.message}</p>}
        <div className="action-row definition-actions"><Button disabled={!dirty || busy}>Guardar concepto</Button><Button type="button" variant="outline" disabled={!dirty || busy} onClick={reset}>Descartar cambios</Button></div>
      </fieldset></form>
      {blocked && <section className="error-message" aria-label="Dependencias del cambio"><Dependencies plan={blocked} /></section>}{feedback}
    </section>
    {review && <Modal title="Revisar cambios en cartas" onClose={() => finishReview(false)}><p>Se actualizarán {review.impacts.length} cartas al guardar la definición. Cancelar conserva el borrador y los datos guardados.</p><ul className="impact-list">{review.impacts.map(impact => <li key={impact.id}><strong>{impact.name}</strong>{impact.added.map((item, index) => <p key={`a${index}`}>Añadir: {item.name} = {String(item.value)}</p>)}{impact.removed.map((item, index) => <p key={`r${index}`}>Retirar: {item.name} = {String(item.value)}</p>)}{!!impact.clearedSlots.length && <p>Vaciar espacios: {impact.clearedSlots.join(', ')}</p>}</li>)}</ul><div className="action-row"><Button onClick={() => finishReview(true)}>Confirmar cambios</Button><Button variant="outline" onClick={() => finishReview(false)}>Cancelar</Button></div></Modal>}
    {abilityReview && <AbilityChangeReview plan={abilityReview} onResolve={result => { setAbilityReview(null); abilityResult.current?.(result); abilityResult.current = null; }} />}
  </>;
}
