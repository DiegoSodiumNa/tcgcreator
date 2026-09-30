'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameFile } from '@/domain/schema';
import { parseGameFile } from '@/domain/rules';
import { composeCard } from '@/rendering/card-scene';
import { loadCardFont, loadCardImages } from '@/rendering/card-assets';
import type { RenderIssue } from '@/rendering/composition';
import { renderCardPng } from '@/export/card-png';
import { createCardsPdf } from '@/export/cards-pdf';
import { DEFAULT_PRINT, countSelection, cutLines, pageCards, printLayout, type PrintSettings, type Selection } from '@/export/print-layout';
import { downloadBytes } from '@/export/download';
import { gameUrl, useGame } from './local-game';
import { Button } from './ui/button';
import { getRepository } from '@/storage/repository';
import { ImageRecovery } from './image-recovery';

function SheetPreview({ game, selection, settings, page }: { game: GameFile; selection: Selection; settings: PrintSettings; page: number }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const layout = useMemo(() => printLayout(settings), [settings]);
  const cards = useMemo(() => pageCards(selection, layout, page), [selection, layout, page]);
  useEffect(() => {
    const controller = new AbortController(); const allocated: string[] = [];
    setUrls({}); setMessage('Preparando hoja…');
    void (async () => {
      try {
        await loadCardFont(controller.signal); const next: Record<string, string> = {}; let invalid = false;
        for (const id of new Set(cards.map(c => c.cardId))) {
          controller.signal.throwIfAborted();
          const card = game.cards.find(c => c.id === id)!;
          const assets = await loadCardImages(game, card, [], controller.signal);
          const composition = composeCard(game, card);
          if (composition.issues.length || assets.issues.length) { invalid = true; continue; }
          const bytes = await renderCardPng(composition, assets.images); controller.signal.throwIfAborted();
          const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'image/png' })); allocated.push(url); next[id] = url;
        }
        controller.signal.throwIfAborted(); setUrls(next); setMessage(invalid ? 'Hay cartas pendientes de corrección. La exportación mostrará sus problemas.' : 'Vista previa lista.');
      } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'No se pudo preparar la hoja.'); }
    })();
    return () => { controller.abort(); allocated.forEach(url => URL.revokeObjectURL(url)); };
  }, [game, cards]);
  return <><p role="status">{message}</p><svg className="sheet-preview" viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label={`Vista previa de hoja ${page + 1}`}>
    <rect width={layout.width} height={layout.height} fill="white" />{cards.map((c, index) => <g key={index}>{urls[c.cardId] ? <image href={urls[c.cardId]} x={c.x} y={c.y} width={63} height={88} preserveAspectRatio="none" /> : <><rect x={c.x} y={c.y} width={63} height={88} fill="#f5ead6" stroke="#777" strokeWidth={.2} /><text x={c.x + 3} y={c.y + 12} fontSize={3}>{game.cards.find(card => card.id === c.cardId)?.name.slice(0, 26)}</text><text x={c.x + 3} y={c.y + 20} fontSize={3}>Vista pendiente</text></>}</g>)}
    {cutLines(cards, layout).map((line, index) => <line key={index} {...line} stroke="#222" strokeWidth={.1} />)}
  </svg></>;
}

export default function PrintExport() {
  const { game, record } = useGame();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT);
  const [page, setPage] = useState(0);
  const [pngId, setPngId] = useState(game.cards[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [issues, setIssues] = useState<RenderIssue[]>([]);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const selection = useMemo<Selection>(() => game.cards.filter(c => Number(quantities[c.id]) > 0 || Object.hasOwn(quantities, c.id)).map(c => ({ cardId: c.id, quantity: Number(quantities[c.id]) })), [game.cards, quantities]);
  let validation = '', total = 0, pages = 0, extraPage = false;
  try { total = countSelection(selection); const layout = printLayout(settings); pages = Math.ceil(total / layout.capacity); extraPage = settings.calibration || layout.top < 4; }
  catch (error) { validation = error instanceof Error ? error.message : 'Revisa la selección.'; }
  const currentPage = Math.min(page, Math.max(0, pages - 1));
  async function generate(format: 'png' | 'pdf') {
    if (busy) return;
    const abort = new AbortController(); controller.current = abort;
    setBusy(true); setIssues([]); setMessage('Comprobando cartas…');
    try {
      const snapshot = parseGameFile(structuredClone(game));
      const chosen = format === 'png' ? [{ cardId: pngId, quantity: 1 }] : structuredClone(selection);
      if (!chosen.length) throw new Error('Selecciona al menos una carta.');
      const font = await loadCardFont(abort.signal); const problems: RenderIssue[] = [];
      for (const [index, entry] of chosen.entries()) {
        abort.signal.throwIfAborted(); setMessage(`Comprobando carta ${index + 1} de ${chosen.length}…`);
        const card = snapshot.cards.find(c => c.id === entry.cardId);
        if (!card) throw new Error('La carta seleccionada ya no existe.');
        const assets = await loadCardImages(snapshot, card, [], abort.signal);
        problems.push(...composeCard(snapshot, card).issues, ...assets.issues);
      }
      if (problems.length) { setIssues(problems); setMessage('Corrige las cartas indicadas antes de exportar.'); return; }
      const render = async (id: string) => {
        abort.signal.throwIfAborted();
        const card = snapshot.cards.find(c => c.id === id)!;
        const assets = await loadCardImages(snapshot, card, [], abort.signal);
        if (assets.issues.length) throw new Error(assets.issues.map(issue => issue.message).join('\n'));
        return renderCardPng(composeCard(snapshot, card), assets.images);
      };
      const bytes = format === 'png' ? await render(pngId) : await createCardsPdf(chosen, { ...settings }, font, render, setMessage, abort.signal);
      abort.signal.throwIfAborted();
      const current = await getRepository().read(record.id);
      if (!current || current.revision !== record.revision) throw new Error('Otra pestaña cambió el juego. Recarga la versión guardada antes de exportar.');
      downloadBytes(bytes, format === 'png' ? 'image/png' : 'application/pdf', format === 'png' ? 'carta.png' : 'tanda-cartas.pdf');
      setMessage('Descarga iniciada. Para el PDF, imprime al 100 % sin ajustar a página.');
    } catch (error) { setMessage(abort.signal.aborted ? 'Exportación cancelada. La selección se conserva.' : error instanceof Error ? error.message : 'No se pudo exportar.'); }
    finally { controller.current = null; setBusy(false); }
  }
  return <><div className="page-heading"><div className="eyebrow">{game.game.name}</div><h1>De la pantalla a la mesa</h1><p>Selecciona las cartas guardadas y sus cantidades. Solo frentes de 63 × 88 mm.</p></div>
    <div className="export-grid"><section className="panel"><fieldset disabled={busy}><h2>Selecciona tus cartas</h2><div className="selection-list">{game.cards.map(card => <div className="selection-row" key={card.id}><label><input type="checkbox" checked={Object.hasOwn(quantities, card.id)} onChange={event => { const next = { ...quantities }; if (event.target.checked) next[card.id] = '1'; else delete next[card.id]; setQuantities(next); setPage(0); }} />{card.name}</label>{Object.hasOwn(quantities, card.id) && <input aria-label={`Cantidad de ${card.name}`} type="number" min={0} step={1} value={quantities[card.id]} onChange={event => { const next = { ...quantities, [card.id]: event.target.value }; if (event.target.value === '0') delete next[card.id]; setQuantities(next); setPage(0); }} />}</div>)}</div>{!game.cards.length && <p>Este juego todavía no tiene cartas.</p>}
    <h2>Hoja y distribución</h2><label>Papel<select value={settings.paper} onChange={event => { setSettings({ ...settings, paper: event.target.value as PrintSettings['paper'] }); setPage(0); }}><option value="letter">Carta</option><option value="a4">A4</option></select></label>
    <label>Margen de hoja (mm)<input type="number" min={1} step={.5} value={Number.isNaN(settings.margin) ? '' : settings.margin} onChange={event => setSettings({ ...settings, margin: event.target.value === '' ? NaN : Number(event.target.value) })} /></label><label>Separación (mm)<input type="number" min={0} step={.5} value={Number.isNaN(settings.gap) ? '' : settings.gap} onChange={event => setSettings({ ...settings, gap: event.target.value === '' ? NaN : Number(event.target.value) })} /></label>
    <label className="check-label"><input type="checkbox" checked={settings.calibration} onChange={event => setSettings({ ...settings, calibration: event.target.checked })} />Añadir hoja de calibración de 50 mm</label></fieldset>
    <p role="status">{selection.length} diseños · {total} copias · {pages + (total && extraPage ? 1 : 0)} hojas</p>{validation && <p role="alert">{validation}</p>}
    <Button disabled={busy || !total || !!validation} onClick={() => void generate('pdf')}>Descargar PDF de la selección</Button>
    <fieldset disabled={busy}><h2>PNG individual</h2><label>Carta para PNG<select value={pngId} onChange={event => setPngId(event.target.value)}>{game.cards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label><Button variant="outline" disabled={!pngId || busy} onClick={() => void generate('png')}>Descargar PNG individual</Button></fieldset>
    <p className="muted">La selección es temporal. El PDF usa las medidas físicas exactas; el PNG mide 744 × 1039 px.</p></section>
    <section className="panel"><h2>Revisar hojas</h2>{total > 0 && !validation ? <><div className="action-row"><Button variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Anterior</Button><span>Hoja {currentPage + 1} de {pages}</span><Button variant="outline" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Siguiente</Button></div><SheetPreview game={game} selection={selection} settings={settings} page={currentPage} />{extraPage && <p>Se añadirá una hoja de {settings.calibration ? 'calibración e instrucciones' : 'instrucciones'}.</p>}</> : <p>Selecciona cartas y revisa los ajustes para ver la distribución.</p>}</section></div>
    <section className="export-feedback" aria-live="polite"><p role="status">{message}</p>{busy && <Button variant="outline" onClick={() => controller.current?.abort()}>Cancelar exportación</Button>}{!!issues.length && <ul>{issues.map((issue, index) => <li key={index}><Link href={gameUrl('editor', game.game.id, issue.cardId)}>{game.cards.find(c => c.id === issue.cardId)?.name}</Link>: {issue.message}</li>)}</ul>}</section>
    <ImageRecovery />
  </>;
}
