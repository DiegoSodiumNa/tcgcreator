'use client';
import { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type { Card, GameFile } from '@/domain/schema';
import type { PendingImage } from '@/storage/repository';
import { CardScene, composeCard } from '@/rendering/card-scene';
import { loadCardFont, loadCardImages } from '@/rendering/card-assets';
import type { CardComposition, RenderIssue } from '@/rendering/composition';
import { templateContent } from '@/rendering/template-a';
const EMPTY: PendingImage[] = [];
export default function CardPreview({ game, card, pending = EMPTY }: { game: GameFile; card: Card; pending?: PendingImage[] }) {
  let accessible = '';
  try { const content = templateContent(game, card); accessible = [content.name, content.classification, ...content.slots.map(slot => slot ? `${slot.label}: ${slot.value}` : ''), content.body].join('\n'); } catch { accessible = 'Completa los datos de la carta.'; }
  const [ready, setReady] = useState<{ composition: CardComposition; images: Map<string, HTMLImageElement>; issues: RenderIssue[] }>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(298);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(Math.min(298, entries[0].contentRect.width)));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const controller = new AbortController(); setReady(undefined); setError('');
    void (async () => {
      try {
        await loadCardFont(controller.signal);
        const assets = await loadCardImages(game, card, pending, controller.signal);
        controller.signal.throwIfAborted();
        const composition = composeCard(game, card);
        setReady({ composition, images: assets.images, issues: [...composition.issues, ...assets.issues] });
      } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'No se pudo preparar la vista previa.'); }
    })();
    return () => controller.abort();
  }, [game, card, pending, attempt]);
  return <div className="visual-preview" ref={container}><div className="sr-only">{accessible}</div>{error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar vista previa</button></div>}{!ready && !error && <p role="status">Preparando vista previa…</p>}{ready && <>
    <div className="card-canvas" style={{ width }} role="img" aria-label={`Vista previa de ${card.name || 'carta sin nombre'}`}><Stage width={width} height={width * 1039 / 744} scaleX={width / 744} scaleY={width / 744}><Layer><CardScene composition={ready.composition} images={ready.images} /></Layer></Stage></div>
    {!!ready.issues.length && <div role="alert"><strong>No se puede exportar esta carta:</strong><ul>{ready.issues.map((issue, index) => <li key={index}>{issue.message}</li>)}</ul></div>}
  </>}</div>;
}
