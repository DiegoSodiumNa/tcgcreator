'use client';
import Link from 'next/link';
import { ExportGameButton, ImportGame } from './game-transfer';
import { useCallback, useEffect, useId, useState } from 'react';
import { Layers3, ArrowRight, Plus } from 'lucide-react';
import { emptyGame, getRepository, storageError, type StoredGame } from '@/storage/repository';
import { prepareExample } from '@/storage/example';
import { Button } from './ui/button';
import { Modal } from './ui/modal';
import { gameUrl } from './local-game';
import { useDraftGuard } from './draft-guard';

export function GameLibrary() {
  const [games, setGames] = useState<StoredGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState<StoredGame | null>(null);
  const [notice, setNotice] = useState('');
  const [nameError, setNameError] = useState('');
  const [creating, setCreating] = useState<'empty' | 'example' | null>(null);
  const nameHelpId = useId();
  const nameErrorId = useId();
  const load = useCallback(async () => {
    setLoading(true);
    try { setGames(await getRepository().list()); setError(''); }
    catch (failure) { setError(storageError(failure).message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); window.addEventListener('focus', load); return () => window.removeEventListener('focus', load); }, [load]);
  const create = async (example = false) => {
    if (busy) return false;
    if (!example && !name.trim()) { setNameError('Escribe un nombre para el juego.'); return false; }
    setBusy(true); setCreating(example ? 'example' : 'empty'); setNameError(''); setError(''); setNotice('');
    try {
      if (example) { const prepared = await prepareExample(); await getRepository().create(prepared.game, prepared.images); }
      else { await getRepository().create(emptyGame(name.trim())); setName(''); }
      await load(); setNotice('Juego creado y guardado en este navegador.');
      return true;
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'No se pudo crear el juego.'); return false; }
    finally { setBusy(false); setCreating(null); }
  };
  useDraftGuard(!!name, busy, () => create(), 'editorial');
  return <>
    <div className="page-heading"><div className="eyebrow">MIS JUEGOS</div><h1>Tus ideas empiezan aquí.</h1><p>Crea un juego o empieza con doce cartas de ejemplo.</p></div>
    <div className="ds-pixel-rule heading-pixel-rule" aria-hidden="true" />
    <section className="panel ds-pixel-frame library-create" aria-label="Crear juego"><form noValidate onSubmit={event => { event.preventDefault(); void create(); }}><label>Nombre del nuevo juego<input value={name} onChange={event => { setName(event.target.value); setNameError(''); }} disabled={busy} required aria-invalid={!!nameError} aria-describedby={`${nameHelpId}${nameError ? ` ${nameErrorId}` : ''}`} /></label>{nameError && <p id={nameErrorId} role="alert" className="field-error">{nameError}</p>}<div className="action-row"><Button disabled={busy || loading} loading={creating === 'empty'}><Plus size={16} />Crear juego</Button><Button type="button" variant="outline" disabled={busy || loading} loading={creating === 'example'} onClick={() => void create(true)}>Crear juego de ejemplo</Button></div></form><p id={nameHelpId} className="muted">Los datos pertenecen a este navegador y dirección del sitio. Borrar sus datos elimina los juegos locales. Conserva tus imágenes originales.</p></section>
    <ImportGame onComplete={() => void load()} />
    {notice && <p role="status" className="save-notice">{notice}</p>}
    {error && <div role="alert" className="error-message"><p>{error}</p><Button variant="outline" disabled={busy} onClick={() => void load()}>Volver a cargar biblioteca</Button></div>}
    <div className="ds-pixel-rule library-pixel-rule" aria-hidden="true" />
    <div className="section-line"><h2>Tu biblioteca <span>{games.length}</span></h2><Link href="/exportar/" className="back-link">Ver prueba de impresión</Link></div>
    {loading && <p role="status">Cargando juegos…</p>}
    {!loading && !error && !games.length && <div className="empty-state"><Layers3 size={30} /><h2>Aún no tienes juegos</h2><p>Crea uno vacío o utiliza el ejemplo para probar el guardado.</p></div>}
    <div className="library-grid">{games.map(record => <article className="game-tile ds-pixel-frame" key={record.id}>
      <div className="game-art" aria-hidden="true"><span className="art-label">ARCHIVO DE JUEGO</span><div className="editorial-pixels" /><div className="art-title library-title">{record.data.game.name}</div></div>
      <div className="game-details"><h2>{record.data.game.name}</h2><p>{record.data.game.description || 'Tu próximo juego empieza aquí.'}</p><div className="game-meta"><span>{record.data.cards.length} cartas</span><span>{record.data.definitions.types.length} tipos</span></div><p className="muted">Último guardado: {new Date(record.savedAt).toLocaleString('es-MX')}<br />Última exportación: {record.lastExportedAt ? new Date(record.lastExportedAt).toLocaleString('es-MX') : 'Sin exportaciones'}</p><div className="action-row"><Button asChild><Link href={gameUrl('cartas', record.id)}>Abrir juego <ArrowRight size={16} /></Link></Button><Button variant="outline" asChild><Link href={gameUrl('configuracion', record.id)}>Renombrar</Link></Button><ExportGameButton record={record} onComplete={() => void load()} /><Button variant="destructive" disabled={busy} onClick={() => { setError(''); setDeleting(record); }}>Eliminar juego</Button></div></div>
    </article>)}</div>
    {deleting && <Modal title="Eliminar juego" theme="editorial" busy={busy} onClose={() => setDeleting(null)}><p className="ds-status ds-status--warning">Se eliminarán «{deleting.data.game.name}», sus {deleting.data.cards.length} cartas y sus imágenes de este navegador. Esta acción no se puede deshacer.</p><div className="action-row"><Button variant="destructive" loading={busy} onClick={async () => { setBusy(true); try { await getRepository().remove(deleting.id, deleting.revision); setDeleting(null); setNotice('Juego eliminado.'); await load(); } catch (failure) { setError(storageError(failure).message); setDeleting(null); } finally { setBusy(false); } }}>Eliminar definitivamente</Button><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Cancelar</Button></div></Modal>}
  </>;
}
