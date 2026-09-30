import type { GameFile } from '../domain/schema';
import type { PendingImage } from './repository';

export type PreparedImage = { metadata: GameFile['images'][number]; pending: PendingImage };
export async function prepareImage(file: File, kind: 'illustration' | 'symbol' = 'illustration'): Promise<PreparedImage> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Elige una imagen PNG, JPEG o WebP.');
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error('La imagen debe contener datos y ocupar como máximo 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 25_000_000) throw new Error('La imagen debe tener como máximo 25 millones de píxeles.');
    const id = crypto.randomUUID();
    const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return {
      metadata: { id, kind, originalName: file.name, width: image.naturalWidth, height: image.naturalHeight, sha256: Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('') },
      pending: { imageId: id, blob: file },
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('millones')) throw error;
    throw new Error('No se pudo leer la imagen. Comprueba que el archivo no esté dañado.');
  } finally { URL.revokeObjectURL(url); }
}
