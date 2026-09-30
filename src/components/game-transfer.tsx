'use client';
import { useState } from 'react';
import type { GameFile } from '@/domain/schema';
import { importCopy, MAX_JSON_BYTES, readGameJson, serializeGame } from '@/domain/game-transfer';
import { gameFile, getRepository, type StoredGame } from '@/storage/repository';
import { downloadBytes } from '@/export/download';
import { Button } from './ui/button';
import { Modal } from './ui/modal';
export function ExportGameButton({ record, onComplete }: { record: StoredGame; onComplete: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <><Button variant="outline" disabled={busy} onClick={async () => {
    setBusy(true); setMessage('');
    try {
      const current = await getRepository().read(record.id);
      if (!current) throw new Error('Este juego ya no existe.');
      const date = new Date().toISOString();
      const json = serializeGame(gameFile(current), date);
      downloadBytes(new TextEncoder().encode(json), 'application/json', `${current.data.game.name.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 80) || 'juego'}.json`);
      try { await getRepository().markExported(current.id, current.revision, date); setMessage('Descarga del respaldo iniciada. Conserva las imágenes por separado.'); }
      catch { setMessage('Descarga iniciada; no se pudo registrar la fecha de exportación.'); }
      onComplete();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo exportar.'); }
    finally { setBusy(false); }
  }}>Exportar juego</Button>{message && <p role="status">{message}</p>}</>;
}
export function ImportGame({ onComplete }: { onComplete: () => void }) {
  const [candidate, setCandidate] = useState<GameFile>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <section className="panel import-panel"><h2>Recuperar un juego</h2><label>Importar archivo JSON<input type="file" accept=".json,application/json" disabled={busy} onChange={async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setBusy(true); setMessage(''); setCandidate(undefined);
    try { if (file.size > MAX_JSON_BYTES) throw new Error('El JSON debe ocupar como máximo 20 MB.'); setCandidate(readGameJson(await file.text())); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo leer el archivo.'); }
    finally { setBusy(false); }
  }} /></label><p className="muted">Se crea una copia independiente. Las imágenes se reasocian después.</p>{message && <p role="status">{message}</p>}
    {candidate && <Modal title="Revisar importación" busy={busy} onClose={() => setCandidate(undefined)}><p>{candidate.game.name}: {candidate.cards.length} cartas, {Object.values(candidate.definitions).flat().length} definiciones y {candidate.images.length} imágenes pendientes.</p><p>El archivo es válido. No se reemplazará ningún juego existente.</p><div className="action-row"><Button disabled={busy} onClick={async () => {
      setBusy(true);
      try { const records = await getRepository().list(); await getRepository().create(importCopy(candidate, records.map(r => r.data.game.name))); setCandidate(undefined); setMessage('Copia importada y guardada en este navegador.'); onComplete(); }
      catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo importar.'); setCandidate(undefined); }
      finally { setBusy(false); }
    }}>Crear copia independiente</Button><Button disabled={busy} variant="outline" onClick={() => setCandidate(undefined)}>Cancelar</Button></div></Modal>}
  </section>;
}
