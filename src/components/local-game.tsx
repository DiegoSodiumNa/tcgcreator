'use client';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { gameFile, getRepository, storageError, type PendingImage, type StoredGame, type StorageError } from '@/storage/repository';
import type { GameFile } from '@/domain/schema';
import { useDraftGuard } from './draft-guard';
import { Modal } from './ui/modal';
import { Button } from './ui/button';

export type GameSession = { record: StoredGame; game: GameFile; update: (record: StoredGame) => void; reload: () => Promise<void> };
export const GameContext = createContext<GameSession | null>(null);
export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('Falta el juego local.');
  return context;
}
export function gameUrl(path: string, gameId: string, cardId?: string) {
  const params = new URLSearchParams({ game: gameId });
  if (cardId) params.set('card', cardId);
  return `/${path}/?${params}`;
}
export function GameSessionProvider({ record, update, reload, children }: { record: StoredGame; update: (value: StoredGame) => void; reload: () => Promise<void>; children: ReactNode }) {
  const game = useMemo(() => gameFile(record), [record]);
  return <GameContext.Provider value={{ record, game, update, reload }}>{children}</GameContext.Provider>;
}

export function useLocalSave(dirty: boolean, makeData: () => GameFile, images: PendingImage[] = [], preparing = false, options: { validate?: () => Promise<boolean>; beforeSave?: (candidate: GameFile) => Promise<boolean | GameFile> } = {}) {
  const { record, update, reload } = useGame();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StorageError | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const saving = useRef(false);
  const save = async () => {
    if (saving.current || preparing) return false;
    saving.current = true;
    setBusy(true); setError(null); setSaved(false);
    try {
      if (options.validate && !(await options.validate())) return false;
      let candidate = makeData();
      if (options.beforeSave) {
        const reviewed = await options.beforeSave(candidate);
        if (!reviewed) return false;
        if (typeof reviewed === 'object') candidate = reviewed;
      }
      const next = await getRepository().save(candidate, record.revision, images);
      update(next); setSaved(true);
      return true;
    } catch (failure) { setError(storageError(failure)); return false; }
    finally { saving.current = false; setBusy(false); }
  };
  useDraftGuard(dirty, busy || preparing, save);
  const feedback = <>
    <p role="status" className="muted">{busy ? 'Guardando…' : dirty ? 'Cambios sin guardar' : saved ? 'Guardado en este navegador' : 'Sin cambios pendientes'}<br />Último guardado: {new Date(record.savedAt).toLocaleString('es-MX')}<br />Última exportación: {record.lastExportedAt ? new Date(record.lastExportedAt).toLocaleString('es-MX') : 'Sin exportaciones'}</p>
    {error && <div role="alert" className="error-message"><p>{error.message}</p>{error.code === 'conflict' && <Button variant="outline" onClick={() => setConfirmReload(true)}>Recargar versión guardada</Button>}</div>}
    {confirmReload && <Modal title="Recargar el juego" busy={busy} onClose={() => setConfirmReload(false)}><p>Se descartarán los cambios de este formulario y se abrirá la versión guardada en el navegador.</p><div className="action-row"><Button disabled={busy} onClick={async () => { setBusy(true); try { await reload(); setConfirmReload(false); setError(null); } catch (failure) { setError(storageError(failure)); setConfirmReload(false); } finally { setBusy(false); } }}>Descartar y recargar</Button><Button disabled={busy} variant="outline" onClick={() => setConfirmReload(false)}>Cancelar</Button></div></Modal>}
  </>;
  return { save, busy: busy || preparing, feedback };
}

export function LocalImage({ gameId, imageId, blob, className = '', alt = 'Ilustración de la carta' }: { gameId: string; imageId: string | null; blob?: Blob; className?: string; alt?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setUrl(null); setError('');
    if (!imageId) return;
    void (async () => {
      try {
        const bytes = blob ?? (await getRepository().image(gameId, imageId))?.blob;
        if (!active) return;
        if (!bytes) { setError('Ilustración pendiente'); return; }
        objectUrl = URL.createObjectURL(bytes);
        setUrl(objectUrl);
      } catch { if (active) setError('No se pudo leer la ilustración'); }
    })();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [gameId, imageId, blob]);
  return <div className={`local-image ${className}`}>{url ? <img src={url} alt={alt} onError={() => { setUrl(null); setError('No se pudo mostrar la ilustración'); }} /> : <span>{error || (imageId ? 'Cargando ilustración…' : 'Sin ilustración')}</span>}</div>;
}
