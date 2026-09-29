import { describe, expect, it } from 'vitest';
import { demoGame } from '../../src/fixtures/demo-game.ts';
import { CARD_PX, mmToPoints } from '../../src/rendering/measurements.ts';
import { fitText, templateContent } from '../../src/rendering/template-a.ts';

describe('Plantilla A y unidades de impresión', () => {
  it('convierte a píxeles de 300 ppp y puntos físicos sin redondear el PDF', () => {
    expect(CARD_PX).toEqual({ width: 744, height: 1039 });
    expect(mmToPoints(63)).toBeCloseTo(178.58267716535434, 10);
    expect(mmToPoints(88)).toBeCloseTo(249.4488188976378, 10);
    expect(mmToPoints(50)).toBeCloseTo(141.73228346456693, 10);
  });
  it('conserva el quinto atributo, acentos y habilidades sin repetir espacios', () => {
    const content = templateContent(demoGame, demoGame.cards[4]);
    expect(content.name).toBe('Centinela Mecánico');
    expect(content.body).toContain('Afinidad: Fuego');
    expect(content.body).toContain('Escudo 3: Previene 3 puntos de daño.');
    expect(content.body).not.toContain('Resistencia:');
    expect(content.slots[3]?.value).toBe('No');
  });
  const measure = (text: string, size: number) => text.length * size / 2;
  it('ajusta líneas conservando saltos explícitos', () => {
    const result = fitText('Uno dos tres\n\nCuatro', 45, 120, 12, 10, measure);
    expect(result.text).toBe('Uno dos\ntres\n\nCuatro');
  });
  it('rechaza textos que desbordan en vez de recortarlos', () => {
    expect(() => fitText('texto '.repeat(200), 100, 50, 14, 10, measure)).toThrow('no cabe');
    expect(() => fitText('x'.repeat(100), 100, 100, 14, 10, measure)).toThrow('no cabe');
  });
});
