import { demoGame } from '../fixtures/demo-game';
import { copyGame } from '../domain/game-transfer';
import type { PendingImage } from './repository';

export function copyExample() { return copyGame(demoGame); }

export async function prepareExample() {
  const game = copyExample();
  // Rasterize the trusted bundled SVG before entering the IndexedDB transaction.
  const response = await fetch('/images/forja.svg');
  if (!response.ok) throw new Error('No se pudo cargar la ilustración del ejemplo. Vuelve a intentarlo.');
  const url = URL.createObjectURL(await response.blob());
  const images: PendingImage[] = [];
  try {
    const illustration = new Image();
    illustration.src = url;
    await illustration.decode();
    for (const metadata of game.images) {
      const canvas = document.createElement('canvas');
      canvas.width = metadata.kind === 'symbol' ? 64 : 1200;
      canvas.height = metadata.kind === 'symbol' ? 64 : 900;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo preparar la imagen de ejemplo.');
      if (metadata.kind === 'symbol') {
        ctx.fillStyle = '#A34B24'; ctx.beginPath(); ctx.arc(32, 32, 29, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('E', 32, 46);
      } else ctx.drawImage(illustration, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('No se pudo preparar la imagen.')), 'image/png'));
      metadata.width = canvas.width; metadata.height = canvas.height;
      images.push({ imageId: metadata.id, blob });
    }
    return { game, images };
  } finally { URL.revokeObjectURL(url); }
}
