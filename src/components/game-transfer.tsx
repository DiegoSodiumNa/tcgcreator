'use client';
import { useId, useRef, useState } from 'react';
import { ScrollText } from 'lucide-react';
import type { GameFile } from '@/domain/schema';
import { importCopy, MAX_JSON_BYTES, readGameJson, serializeGame } from '@/domain/game-transfer';
import { gameFile, getRepository, type StoredGame } from '@/storage/repository';
import { downloadBytes } from '@/export/download';
import { Button } from './ui/button';
import { Modal } from './ui/modal';
export function ExportGameButton({ record, onComplete }: { record: StoredGame; onComplete: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'success' | 'warning' | 'error'>('success');
  return <><Button variant="outline" loading={busy} onClick={async () => {
    setBusy(true); setMessage(''); setStatus('success');
    try {
      const current = await getRepository().read(record.id);
      if (!current) throw new Error('Este juego ya no existe.');
      const date = new Date().toISOString();
      const json = serializeGame(gameFile(current), date);
      downloadBytes(new TextEncoder().encode(json), 'application/json', `${current.data.game.name.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 80) || 'juego'}.json`);
      try { await getRepository().markExported(current.id, current.revision, date); setMessage('Descarga del respaldo iniciada. Conserva las imágenes por separado.'); }
      catch { setStatus('warning'); setMessage('Descarga iniciada; no se pudo registrar la fecha de exportación.'); }
      onComplete();
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'No se pudo exportar.'); }
    finally { setBusy(false); }
  }}>Exportar juego</Button>{message && <p role={status === 'error' ? 'alert' : 'status'} className={`ds-status ds-status--${status}`}>{message}</p>}</>;
}
export function ImportGame({ onComplete }: { onComplete: () => void }) {
  const [candidate, setCandidate] = useState<GameFile>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [fileName, setFileName] = useState('');
  const messageId = useId();
  const helpId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  return <section className="panel import-panel" aria-busy={busy || undefined}><h2 className="panel-heading"><ScrollText size={18} aria-hidden="true" />Recuperar un juego</h2><label className="json-picker"><span className="sr-only">Importar archivo JSON</span><span className="file-picker-control"><span aria-hidden="true">Seleccionar archivo</span><input ref={fileInput} type="file" accept=".json,application/json" disabled={busy} aria-invalid={failed} aria-describedby={`${helpId}${message ? ` ${messageId}` : ''}`} onChange={async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setFileName(file.name);
    setBusy(true); setMessage(''); setFailed(false); setCandidate(undefined);
    try { if (file.size > MAX_JSON_BYTES) throw new Error('El JSON debe ocupar como máximo 20 MB.'); setCandidate(readGameJson(await file.text())); }
    catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : 'No se pudo leer el archivo.'); }
    finally { setBusy(false); }
  }} /></span><span className="selected-file" aria-live="polite">{fileName || 'Ningún archivo seleccionado'}</span></label><p id={helpId} className="muted import-note">Se crea una copia independiente en el archivo local. Las imágenes se reasocian después en el grimorio.</p>{busy && <p role="status">Procesando importación…</p>}{message && <p id={messageId} role={failed ? 'alert' : 'status'} className={`ds-status ds-status--${failed ? 'error' : 'success'}`}>{message}</p>}
    {candidate && <Modal title="Revisar importación" theme="editorial" returnFocusRef={fileInput} busy={busy} onClose={() => setCandidate(undefined)}><p>{candidate.game.name}: {candidate.cards.length} cartas, {Object.values(candidate.definitions).flat().length} definiciones y {candidate.images.length} imágenes pendientes.</p><p>El archivo es válido. No se reemplazará ningún juego existente.</p><div className="action-row"><Button loading={busy} onClick={async () => {
      setBusy(true);
      try { const records = await getRepository().list(); await getRepository().create(importCopy(candidate, records.map(r => r.data.game.name))); setCandidate(undefined); setMessage('Copia importada y guardada en este navegador.'); onComplete(); }
      catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : 'No se pudo importar.'); setCandidate(undefined); }
      finally { setBusy(false); }
    }}>Crear copia independiente</Button><Button disabled={busy} variant="outline" onClick={() => setCandidate(undefined)}>Cancelar</Button></div></Modal>}
  </section>;
}
