import type { Card, GameFile } from '../domain/schema';
import { getRepository, type PendingImage } from '../storage/repository';
import { FONT_FAMILY, FONT_URL } from './template-a';
import type { RenderIssue } from './composition';
let fontPromise: Promise<Uint8Array> | undefined;
export function loadCardFont(signal?: AbortSignal): Promise<Uint8Array> {
  const promise = fontPromise ??= (async () => {
    try {
      const response = await fetch(FONT_URL);
      if (!response.ok) throw new Error('No se pudo cargar la fuente. Reintenta.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      const font = await new FontFace(FONT_FAMILY, bytes.slice().buffer).load();
      document.fonts.add(font); await document.fonts.load(`24px "${FONT_FAMILY}"`);
      return bytes;
    } catch (error) { fontPromise = undefined; throw error; }
  })();
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const abort = () => { reject(signal.reason); };
    signal.addEventListener('abort', abort, { once: true });
    promise.then(bytes => { signal.removeEventListener('abort', abort); if (!signal.aborted) resolve(bytes); }, error => { signal.removeEventListener('abort', abort); reject(error); });
  });
}
export function requiredImages(game: GameFile, card: Card) {
  return [...new Set([card.visual.illustrationId, ...card.visual.attributeSlots.map(id => game.definitions.attributes.find(a => a.id === id)?.symbolImageId)].filter((id): id is string => !!id))];
}
export async function loadCardImages(game: GameFile, card: Card, pending: PendingImage[] = [], signal?: AbortSignal) {
  const images = new Map<string, HTMLImageElement>();
  const issues: RenderIssue[] = [];
  for (const id of requiredImages(game, card)) {
    signal?.throwIfAborted();
    const metadata = game.images.find(item => item.id === id);
    try {
      const blob = pending.find(item => item.imageId === id)?.blob ?? (await getRepository().image(game.game.id, id))?.blob;
      if (!blob) throw new Error('Imagen pendiente');
      const url = URL.createObjectURL(blob);
      try { const image = new Image(); image.src = url; await image.decode(); signal?.throwIfAborted(); images.set(id, image); }
      finally { URL.revokeObjectURL(url); }
    } catch {
      signal?.throwIfAborted();
      issues.push({ cardId: card.id, zone: 'Imagen', message: `Imagen pendiente o ilegible: ${metadata?.originalName ?? id}. Reasóciala o retira la referencia.` });
    }
  }
  return { images, issues };
}
