'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame, useLocalSave } from './local-game';
import { Button } from './ui/button';
import { loadCardFont } from '@/rendering/card-assets';
import { createRulesPdf, type DocumentPaper } from '@/export/documents-pdf';
import { downloadBytes } from '@/export/download';

export function RulesEditor() {
  const { game } = useGame();
  const [rules, setRules] = useState(game.game.rules);
  const [paper, setPaper] = useState<DocumentPaper>('letter');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => setRules(game.game.rules), [game]);
  useEffect(() => () => controller.current?.abort(), []);
  const dirty = rules !== game.game.rules;
  const { save, busy, feedback } = useLocalSave(dirty, () => ({ ...game, game: { ...game.game, rules } }), [], exporting);
  async function download() {
    if (controller.current) return;
    const abort = new AbortController(); controller.current = abort;
    setExporting(true); setMessage('Preparando reglamento…');
    try {
      const bytes = await createRulesPdf(game.game.name, rules, paper, await loadCardFont(abort.signal), abort.signal);
      abort.signal.throwIfAborted(); downloadBytes(bytes, 'application/pdf', 'reglamento.pdf');
      setMessage('Descarga iniciada. El PDF contiene el texto visible; descargar no guarda los cambios.');
    } catch (error) { if (!abort.signal.aborted) setMessage(error instanceof Error ? error.message : 'No se pudo exportar el reglamento. Reintenta.'); }
    finally { controller.current = null; setExporting(false); }
  }
  return <><div className="page-heading"><div className="eyebrow">{game.game.name}</div><h1>Cómo se juega</h1><p>Explica tu mundo y guarda su reglamento como texto sencillo.</p></div>
    <section className="panel rules-panel"><form onSubmit={event => { event.preventDefault(); void save(); }}><h2>Reglamento del juego</h2>
      <label>Texto del reglamento<textarea disabled={busy} rows={14} value={rules} onChange={event => setRules(event.target.value)} /></label>
      <div className="action-row"><Button disabled={!dirty || busy}>Guardar reglamento</Button><Button type="button" variant="outline" disabled={!dirty || busy} onClick={() => setRules(game.game.rules)}>Descartar cambios</Button></div>
    </form>{feedback}
    <h2>Imprimir reglamento</h2><label>Papel del reglamento<select disabled={busy} value={paper} onChange={event => setPaper(event.target.value as DocumentPaper)}><option value="letter">Carta</option><option value="a4">A4</option></select></label>
    <Button variant="outline" disabled={busy || !rules.trim()} onClick={() => void download()}>Descargar reglamento PDF</Button>
    <p className="muted">Se descarga el texto visible, incluidos los cambios sin guardar. El PDF no guarda el juego.</p><p role="status">{message}</p></section></>;
}
