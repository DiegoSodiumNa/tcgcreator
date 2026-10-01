'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowDownToLine, BookOpen, ChevronRight, FolderOpen, Layers3, Settings2 } from 'lucide-react';


import { getRepository, storageError, type StoredGame } from '@/storage/repository';

import { GameLibrary } from './game-library';
import { CardLibrary } from './card-library';
import { CardEditor } from './card-editor';
import { GameSettings } from './game-settings';
import { ImageRecovery } from './image-recovery';
import { GameSessionProvider, gameUrl } from './local-game';
import { Button } from './ui/button';
import { RulesEditor } from './rules-editor';

type View = 'games' | 'settings' | 'cards' | 'editor' | 'rules' | 'export';
const titles: Record<View, string> = { games: 'Mis juegos', settings: 'Configuración del juego', cards: 'Cartas', editor: 'Editor de carta', rules: 'Reglamento', export: 'Exportar / imprimir' };
const PrintProof = dynamic(() => import('@/components/print-proof'), { ssr: false, loading: () => <p>Cargando prueba de impresión…</p> });
const PrintExport = dynamic(() => import('./print-export'), { ssr: false, loading: () => <p>Cargando exportador…</p> });
const navigation = [['cards', 'cartas', Layers3, 'Cartas'], ['settings', 'configuracion', Settings2, 'Configuración'], ['rules', 'reglamento', BookOpen, 'Reglamento'], ['export', 'exportar', ArrowDownToLine, 'Exportar / imprimir']] as const;

function Shell({ view, record, children }: { view: View; record?: StoredGame; children: ReactNode }) {
  return <div className={`app-shell${view === 'games' ? ' ds-scope' : ''}`}><a href="#content" className="skip-link">Saltar al contenido</a>
    <aside className="sidebar"><Link href="/" className="brand"><span className="brand-symbol"><Layers3 size={22} /></span>TCGCreator</Link><div className="sidebar-caption">TU ESPACIO CREATIVO</div>
      <Link className={`nav-item ${view === 'games' ? 'active' : ''}`} href="/" aria-current={view === 'games' ? 'page' : undefined}><FolderOpen size={19} />Mis juegos</Link><div className="sidebar-divider" />
      {record && <><div className="sidebar-caption">JUEGO ACTUAL</div><div className="current-game">{record.data.game.name}</div><nav aria-label="Secciones del juego">{navigation.map(([key, path, Icon, label]) => <Link key={key} href={gameUrl(path, record.id)} className={`nav-item ${view === key || (key === 'cards' && view === 'editor') ? 'active' : ''}`} aria-current={view === key ? 'page' : undefined}><Icon size={18} />{label}</Link>)}</nav></>}
      <Link className="nav-item" href="/guia/">Guía de uso</Link><div className="sidebar-bottom"><div className="mode-dot" /> Datos en este navegador<p>De una idea a tu próxima partida.</p></div>
    </aside><div className="main-shell"><header className="topbar"><span>Espacio de trabajo <ChevronRight size={14} /><strong>{titles[view]}</strong></span><span className="demo-tag"><span />Guardado local</span></header>
      <main id="content" tabIndex={-1}>{children}</main><footer>TCGCreator / LABORATORIO DE JUEGOS<span>Hecho para imaginar, probar y jugar.</span></footer></div></div>;
}
export function Workspace({ view }: { view: View }) {
  return view === 'games' ? <Shell view={view}><GameLibrary /></Shell> : <GameContent view={view} />;
}
function Heading({ title, subtitle, eyebrow = 'TU JUEGO' }: { title: string; subtitle: string; eyebrow?: string }) {
  return <div className="page-heading"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>;
}
function GameContent({ view }: { view: Exclude<View, 'games'> }) {
  const params = useSearchParams();
  const gameId = params.get('game');
  const cardId = params.get('card');
  const [record, setRecord] = useState<StoredGame>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generation, setGeneration] = useState(0);
  const reload = useCallback(async () => {
    const next = gameId ? await getRepository().read(gameId) : undefined;
    setRecord(next); setGeneration(value => value + 1);
  }, [gameId]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setRecord(undefined);
    void (async () => {
      try { const next = gameId ? await getRepository().read(gameId) : undefined; if (active) setRecord(next); }
      catch (failure) { if (active) setError(storageError(failure).message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [gameId]);
  if (!gameId && view === 'export') return <Shell view={view}><Heading title="Prueba de impresión" subtitle="Demostración fija del paso 03; no utiliza cartas editadas ni selecciones." /><PrintProof /></Shell>;
  if (loading) return <Shell view={view}><p role="status">Cargando juego…</p></Shell>;
  if (error) return <Shell view={view}><div role="alert" className="error-message">{error}</div><Button onClick={() => window.location.reload()}>Reintentar</Button><Link href="/" className="back-link">Volver a Mis juegos</Link></Shell>;
  if (!record || record.id !== gameId) return <Shell view={view}><Heading title="Juego no encontrado" subtitle="Selecciona un juego guardado en este navegador o crea uno nuevo." /><Button asChild><Link href="/">Volver a Mis juegos</Link></Button></Shell>;
  const card = record.data.cards.find(item => item.id === (cardId ?? record.data.cards[0]?.id));
  return <Shell view={view} record={record}><GameSessionProvider record={record} update={setRecord} reload={reload}><div key={`${record.id}-${generation}`}>
    {view === 'cards' ? <><CardLibrary /><ImageRecovery /></> : view === 'settings' ? <GameSettings /> : view === 'rules' ? <RulesEditor /> : view === 'export' ? <PrintExport /> : card ? <CardEditor key={card.id} id={card.id} original={card} /> : cardId && params.get('create') === '1' && record.data.definitions.types.length ? <CardEditor key={cardId} id={cardId} /> : <><Heading title="Carta no encontrada" subtitle="La carta no pertenece a este juego o todavía no hay cartas." /><Button asChild><Link href={gameUrl('cartas', record.id)}>Volver a Cartas</Link></Button></>}
  </div></GameSessionProvider></Shell>;
}
