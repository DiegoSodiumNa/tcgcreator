'use client';
import { useEffect, useState } from 'react';
import { imageUses, removeImageReference } from '@/domain/game-transfer';
import { getRepository } from '@/storage/repository';
import { prepareImage, type PreparedImage } from '@/storage/images';
import { useGame } from './local-game';
import { Button } from './ui/button';
import { Modal } from './ui/modal';
export function ImageRecovery() {
  const { game, record, update } = useGame();
  const [missing, setMissing] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState<{ id: string; prepared?: PreparedImage }>();
  useEffect(() => {
    let active = true;
    void (async () => {
      const ids: string[] = [];
      for (const image of game.images) {
        try {
          const stored = await getRepository().image(record.id, image.id);
          if (!stored) { ids.push(image.id); continue; }
          const url = URL.createObjectURL(stored.blob);
          try { const img = new Image(); img.src = url; await img.decode(); } finally { URL.revokeObjectURL(url); }
        } catch { ids.push(image.id); }
      }
      if (active) setMissing(ids);
    })();
    return () => { active = false; };
  }, [game, record.id]);
  const commit = async (id: string, prepared?: PreparedImage) => {
    setBusy(true); setError('');
    try {
      const metadata = game.images.find(image => image.id === id)!;
      const next = prepared ? { ...game, images: game.images.map(image => image.id === id ? { ...prepared.metadata, id, kind: metadata.kind } : image) } : removeImageReference(game, id);
      update(await getRepository().save(next, record.revision, prepared ? [{ imageId: id, blob: prepared.pending.blob }] : []));
      setReview(undefined);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'No se pudo actualizar la imagen.'); }
    finally { setBusy(false); }
  };
  return <section className="panel image-recovery"><h2>Imágenes pendientes</h2><p className="muted">{missing.length ? `${missing.length} referencias necesitan un archivo local.` : 'No hay imágenes pendientes.'}</p>{error && <p role="alert">{error}</p>}
    {game.images.filter(image => missing.includes(image.id)).map(image => <article key={image.id} className="recovery-row"><h3>{image.originalName}</h3><p>{image.kind === 'symbol' ? 'Símbolo' : 'Ilustración'} · {image.width} × {image.height} px</p><p>{[...new Set(imageUses(game, image.id))].join('; ') || 'Sin usos actuales'}</p><label>Reasociar {image.originalName}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      setBusy(true); setError('');
      try { const prepared = await prepareImage(file, image.kind); if (image.sha256 && image.sha256 !== prepared.metadata.sha256) setReview({ id: image.id, prepared }); else await commit(image.id, prepared); }
      catch (failure) { setError(failure instanceof Error ? failure.message : 'No se pudo leer la imagen.'); }
      finally { setBusy(false); }
    }} /></label><Button variant="ghost" disabled={busy} onClick={() => setReview({ id: image.id })}>Retirar referencia de {image.originalName}</Button></article>)}
    {review && <Modal title={review.prepared ? 'Confirmar imagen diferente' : 'Retirar referencia de imagen'} busy={busy} onClose={() => setReview(undefined)}><p>{review.prepared ? 'La huella del archivo es distinta. Se usará esta imagen en todas las referencias siguientes y se conservarán sus recortes.' : 'Se quitará esta imagen de todas las referencias siguientes.'}</p><ul>{[...new Set(imageUses(game, review.id))].map(use => <li key={use}>{use}</li>)}</ul><div className="action-row"><Button disabled={busy} onClick={() => void commit(review.id, review.prepared)}>Confirmar cambio de imagen</Button><Button disabled={busy} variant="outline" onClick={() => setReview(undefined)}>Cancelar</Button></div></Modal>}
  </section>;
}
