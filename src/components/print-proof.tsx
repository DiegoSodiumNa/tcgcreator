'use client';
import { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { demoGame } from '@/fixtures/demo-game';
import { Button } from '@/components/ui/button';
import { CardScene, composeCard, type CardComposition } from '@/rendering/card-scene';
import { loadProofAssets, type ProofAssets } from '@/rendering/assets';
import { CARD_PX } from '@/rendering/measurements';
import { downloadBytes } from '@/export/download';

const card = demoGame.cards.find(c => c.id === 'card-05')!;
type Ready = { assets: ProofAssets; composition: CardComposition };

export default function PrintProof() {
  const [ready, setReady] = useState<Ready | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [width, setWidth] = useState(300);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    loadProofAssets(controller.signal).then(assets => {
      if (!controller.signal.aborted) setReady({ assets, composition: composeCard(demoGame, card) });
    }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudieron cargar los recursos.'); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => setWidth(Math.min(340, entries[0].contentRect.width)));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  async function exportFile(format: 'png' | 'pdf') {
    if (!ready || !stageRef.current || busy) return;
    setBusy(true); setMessage(''); setError('');
    try {
      // Capture precisely the same scene shown on screen at its full native resolution.
      const canvas = stageRef.current.toCanvas({ pixelRatio: 1 });
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('No se pudo generar el PNG.')), 'image/png'));
      const png = new Uint8Array(await blob.arrayBuffer());
      if (format === 'png') downloadBytes(png, 'image/png', 'centinela-mecanico.png');
      else {
        const { createProofPdf } = await import('@/export/proof-pdf');
        downloadBytes(await createProofPdf(png, ready.assets.fontBytes), 'application/pdf', 'prueba-impresion-forja.pdf');
      }
      setMessage(format === 'png' ? 'PNG preparado para descargar.' : 'PDF preparado. Imprime a tamaño real y registra las medidas.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo generar el archivo.'); }
    finally { setBusy(false); }
  }
  return <section className="panel proof-panel" aria-labelledby="proof-title"><div>
    <span className="eyebrow">PRIMERA PRUEBA DE IMPRESIÓN</span><h2 id="proof-title">Centinela Mecánico</h2>
    <p>Plantilla A · 63 × 88 mm · Ilustración de prueba incorporada.</p>
    <p>Descarga una carta o una hoja Carta con un cuadro de calibración de 50 × 50 mm. Imprime al 100 %, sin ajustar a la página.</p>
    <div className="proof-actions"><Button disabled={!ready || busy} onClick={() => exportFile('png')}>Descargar PNG</Button><Button variant="outline" disabled={!ready || busy} onClick={() => exportFile('pdf')}>Descargar PDF de prueba</Button></div>
    {!ready && !error && <p role="status">Cargando imagen y fuente…</p>}
    {error && <div role="alert"><p>{error}</p><Button variant="outline" onClick={() => { setError(''); setReady(null); setAttempt(attempt + 1); }}>Reintentar</Button></div>}
    {ready && !error && <p role="status">{busy ? 'Preparando archivo…' : message || 'Imagen y fuente listas. Puedes descargar la prueba.'}</p>}
    <p className="coming-note">Esta prueba usa una carta fija del ejemplo. La selección de abajo aún no genera una tanda. La medición física está pendiente.</p>
  </div><div ref={containerRef} className="proof-canvas" role="img" aria-label="Plantilla A del Centinela Mecánico con cinco atributos y Escudo 3">
    {ready && <div style={{ width, height: width * CARD_PX.height / CARD_PX.width }}><div style={{ width: CARD_PX.width, height: CARD_PX.height, transform: `scale(${width / CARD_PX.width})`, transformOrigin: 'top left' }}><Stage ref={stageRef} width={CARD_PX.width} height={CARD_PX.height}><Layer><CardScene composition={ready.composition} image={ready.assets.image} colors={card.visual.colors} /></Layer></Stage></div></div>}
  </div></section>;
}
