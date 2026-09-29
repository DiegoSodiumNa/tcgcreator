import { FONT_FAMILY, FONT_URL, ILLUSTRATION_URL } from './template-a';

export type ProofAssets = { image: HTMLImageElement; fontBytes: Uint8Array };
export async function loadProofAssets(signal: AbortSignal): Promise<ProofAssets> {
  const fetchBytes = async (url: string) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`No se pudo cargar ${url}. Recarga para volver a intentarlo.`);
    return new Uint8Array(await response.arrayBuffer());
  };
  const [fontBytes, imageBytes] = await Promise.all([fetchBytes(FONT_URL), fetchBytes(ILLUSTRATION_URL)]);
  const font = new FontFace(FONT_FAMILY, fontBytes.slice().buffer);
  await font.load();
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  document.fonts.add(font);
  await document.fonts.load(`24px "${FONT_FAMILY}"`, 'ÁÉÍÓÚüñ ¿Escudo?');
  const image = new Image();
  const objectUrl = URL.createObjectURL(new Blob([imageBytes.slice().buffer], { type: 'image/svg+xml' }));
  try {
    image.src = objectUrl;
    await image.decode();
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    return { image, fontBytes };
  } finally { URL.revokeObjectURL(objectUrl); }
}
