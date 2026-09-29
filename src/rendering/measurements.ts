export const CARD_MM = { width: 63, height: 88 } as const;
export const DPI = 300;
export const mmToPoints = (mm: number) => mm * 72 / 25.4;
export const mmToPixels = (mm: number) => Math.round(mm * DPI / 25.4);
export const CARD_PX = { width: mmToPixels(CARD_MM.width), height: mmToPixels(CARD_MM.height) } as const;
export const PROOF = {
  page: { width: 215.9, height: 279.4 }, // Carta vertical
  card: { x: 20, y: 140, ...CARD_MM }, // PDF coordinates: bottom-left
  calibration: { x: 120, y: 159, size: 50 },
} as const;
