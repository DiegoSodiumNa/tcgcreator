'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowDownToLine, ArrowRight, BookOpen, Check, ChevronRight, Diamond, Flame, FolderOpen, Layers3, LayoutGrid, PencilLine, Search, Settings2, Sparkles } from 'lucide-react';
import { demoGame } from '@/fixtures/demo-game';
import { abilityText, attributesForTypes } from '@/domain/rules';
import type { Card } from '@/domain/schema';
import { Button } from '@/components/ui/button';

type View = 'games' | 'settings' | 'cards' | 'editor' | 'rules' | 'export';
const titles: Record<View, string> = { games: 'Mis juegos', settings: 'Configuración del juego', cards: 'Cartas', editor: 'Editor de carta', rules: 'Reglamento', export: 'Exportar / imprimir' };
const game = demoGame;
const PrintProof = dynamic(() => import('@/components/print-proof'), { ssr: false, loading: () => <p>Cargando prueba de impresión…</p> });
function url(path: string, card?: string) { return `/${path}/?game=${game.game.id}${card ? `&card=${card}` : ''}`; }
const navigation = [ ['cards', 'cartas', Layers3, 'Cartas'], ['settings', 'configuracion', Settings2, 'Configuración'], ['rules', 'reglamento', BookOpen, 'Reglamento'], ['export', 'exportar', ArrowDownToLine, 'Exportar / imprimir'] ] as const;

export function Workspace({ view }: { view: View }) {
  // The home page does not read search parameters and can render without Suspense.
  return <div className="app-shell">
    <a href="#content" className="skip-link">Saltar al contenido</a>
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-symbol"><Layers3 size={22} /></span>forja<span className="brand-dot">.</span></Link>
      <div className="sidebar-caption">TU ESPACIO CREATIVO</div>
      <Link className={`nav-item ${view === 'games' ? 'active' : ''}`} href="/" aria-current={view === 'games' ? 'page' : undefined}><FolderOpen size={19} />Mis juegos<span className="nav-count">1</span></Link>
      <div className="sidebar-divider" />
      <div className="sidebar-caption">JUEGO DE EJEMPLO</div>
      <div className="current-game"><span className="tiny-flame"><Flame size={18} /></span><span>Guardianes<br /><strong>de la Forja</strong></span></div>
      <nav aria-label="Secciones del juego">{navigation.map(([key, path, Icon, label]) => <Link key={key} href={url(path)} className={`nav-item ${view === key || (key === 'cards' && view === 'editor') ? 'active' : ''}`} aria-current={view === key ? 'page' : undefined}><Icon size={18} />{label}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="mode-dot" /> Prototipo · Prueba de impresión<p>De una idea a tu próxima partida.</p></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><span>Espacio de trabajo <ChevronRight size={14} /> <strong>{titles[view]}</strong></span><span className="demo-tag"><span /> Modo de ejemplo</span></header>
      <main id="content" tabIndex={-1}>
        <div className="demo-notice"><Sparkles size={16} /><span>Explora el juego de ejemplo. Los cambios son temporales y se restablecen al recargar.</span></div>
        {view === 'games' ? <Games /> : <GameContent view={view} />}
      </main>
      <footer>FORJA / LABORATORIO DE JUEGOS<span>Hecho para imaginar, probar y jugar.</span></footer>
    </div>
  </div>;
}

function Heading({ title, subtitle, eyebrow = 'GUARDIANES DE LA FORJA' }: { title: string; subtitle: string; eyebrow?: string }) {
  return <div className="page-heading"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>;
}

function Games() {
  return <><Heading title="Tus ideas empiezan aquí." subtitle="Un espacio para crear mundos, dar forma a tus cartas y llevarlas a la mesa." eyebrow="MIS JUEGOS" />
    <div className="section-line"><h2>Tu biblioteca <span>01</span></h2><span className="muted">Un juego, muchas posibilidades</span></div>
    <div className="library-grid"><article className="game-tile"><div className="game-art"><span className="art-label">JUEGO DE EJEMPLO</span><div className="orb orb-one" /><div className="orb orb-two" /><div className="emblem"><Flame size={65} strokeWidth={1} /></div><div className="art-title">GUARDIANES<span>DE LA FORJA</span></div><span className="art-bottom">UNIDADES · ARTEFACTOS · LEYENDAS</span></div>
      <div className="game-details"><div className="flex-between"><h3>Guardianes de la Forja</h3><span className="small-badge">Demo</span></div><p>Un universo de guardianes y reliquias. El punto de partida para explorar tu editor.</p><div className="game-meta"><span><Layers3 size={15} />12 cartas</span><span>2 tipos</span><span>5 atributos</span></div><Button asChild><Link href={url('cartas')}>Abrir juego <ArrowRight size={16} /></Link></Button></div>
    </article><div className="welcome-panel"><div className="line-icon"><PencilLine size={25} /></div><h2>De la primera idea<br />a la primera carta.</h2><p>Conoce el espacio de trabajo con un juego preparado para experimentar.</p><ol><li><span>01</span><div><strong>Explora las cartas</strong><p>Doce ejemplos, distintos tipos y habilidades.</p></div></li><li><span>02</span><div><strong>Descubre sus reglas</strong><p>Conceptos compartidos que dan vida al juego.</p></div></li><li><span>03</span><div><strong>Imagina tu versión</strong><p>Prueba cambios en el editor de ejemplo.</p></div></li></ol><div className="coming-note">Crear y guardar tus propios juegos estará disponible en una próxima etapa.</div></div></div>
    <div className="bottom-note"><Diamond size={18} /><p><strong>Todo gran juego empieza con una prueba.</strong> Este es tu espacio para construir la siguiente.</p></div>
  </>;
}

function GameContent({ view }: { view: Exclude<View, 'games'> }) {
  const params = useSearchParams();
  const gameId = params.get('game');
  if (gameId && gameId !== game.game.id) return <><Heading title="Juego no encontrado" subtitle="Este prototipo contiene únicamente el juego de ejemplo." /><Button asChild><Link href="/">Volver a Mis juegos</Link></Button></>;
  if (view === 'cards') return <Cards />;
  if (view === 'settings') return <Settings />;
  if (view === 'rules') return <Rules />;
  if (view === 'export') return <Export />;
  const cardId = params.get('card') ?? game.cards[0].id;
  const card = game.cards.find(c => c.id === cardId);
  if (!card) return <><Heading title="Carta no encontrada" subtitle="El identificador no corresponde a una carta del ejemplo." /><Button asChild><Link href={url('cartas')}>Volver a Cartas</Link></Button></>;
  return <Editor key={card.id} card={card} />;
}

function Cards() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cards = game.cards.filter(c => normalize(c.name).includes(normalize(query)) && (!type || c.typeIds.includes(type)));
  return <><Heading title="Tu colección de cartas" subtitle="Explora personajes, artefactos y las pequeñas reglas que los hacen únicos." />
    <div className="toolbar"><label className="search-field"><Search size={18} /><input aria-label="Buscar cartas" placeholder="Buscar por nombre…" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="Filtrar por tipo" value={type} onChange={e => setType(e.target.value)}><option value="">Todos los tipos</option>{game.definitions.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><span className="muted" role="status">{cards.length} cartas</span></div>
    <div className="cards-grid">{cards.map((card, i) => <Link className="card-tile" key={card.id} href={url('editor', card.id)}><div className={`card-art tone-${i % 3}`}><Diamond size={40} strokeWidth={1} /><span>{card.visual.illustrationId ? 'Ilustración pendiente' : 'Sin ilustración'}</span></div><div className="card-info"><span className="eyebrow">{card.typeIds.map(id => game.definitions.types.find(t => t.id === id)?.name).join(' · ')}</span><h2>{card.name}</h2><span className="open-card">Abrir carta <ArrowRight size={14} /></span></div></Link>)}</div>
    {!cards.length && <div className="empty-state"><Search size={30} /><h2>No hay cartas que coincidan</h2><p>Prueba otro nombre o cambia el filtro.</p><Button variant="outline" onClick={() => { setQuery(''); setType(''); }}>Limpiar filtros</Button></div>}
  </>;
}

function Settings() {
  return <><Heading title="Las bases de tu juego" subtitle="Los conceptos compartidos que conectan todas tus cartas. Catálogo de ejemplo en modo lectura." /><div className="settings-grid"><section className="panel"><h2>Identidad del juego</h2><label>Nombre<input readOnly value={game.game.name} /></label><label>Descripción<textarea readOnly value={game.game.description} /></label><span className="muted">La edición de definiciones llegará en el paso 05.</span></section><section className="panel"><h2>Tipos y subtipos</h2>{game.definitions.types.map(t => <div className="definition-row" key={t.id}><strong>{t.name}</strong><p>{game.definitions.subtypes.filter(s => s.typeId === t.id).map(s => s.name).join(' · ')}</p><span className="muted">{attributesForTypes(game, [t.id]).map(a => a.name).join(', ')}</span></div>)}</section><section className="panel"><h2>Atributos compartidos</h2>{game.definitions.attributes.map(a => <div className="flex-between definition-row" key={a.id}><strong>{a.name}</strong><span className="small-badge">{{ number: 'Número', text: 'Texto', boolean: 'Sí / no', select: 'Selección' }[a.kind]}</span></div>)}</section><section className="panel"><h2>Habilidades</h2>{game.definitions.abilities.map(a => <div className="definition-row" key={a.id}><strong>{a.name}</strong><p>{a.reminder}</p></div>)}<h2 className="subheading">Supertipos y recursos</h2><p>{game.definitions.supertypes.map(s => s.name).join(' · ')}</p><p>Recurso: {game.definitions.resources.map(r => r.name).join(', ')}</p></section></div></>;
}

function Editor({ card }: { card: Card }) {
  const [name, setName] = useState(card.name);
  const [text, setText] = useState(card.text);
  const dirty = name !== card.name || text !== card.text;
  return <><Link className="back-link" href={url('cartas')}>← Volver a Cartas</Link><Heading title="Editor de carta" subtitle="Prueba el nombre y el texto en un borrador temporal." /><div className="editor-grid"><section className="panel"><div className="flex-between"><h2>Contenido</h2><span role="status" className="small-badge">{dirty ? 'Borrador temporal' : 'Carta de ejemplo'}</span></div><label>Nombre de la carta<input value={name} onChange={e => setName(e.target.value)} /></label><label>Texto de la carta<textarea rows={8} value={text} onChange={e => setText(e.target.value)} /></label><h3>Clasificación</h3><p>{card.typeIds.map(id => game.definitions.types.find(t => t.id === id)?.name).join(' · ')}</p><div className="attribute-grid">{attributesForTypes(game, card.typeIds).map(a => <div key={a.id}><span>{a.name}</span><strong>{String(card.attributeValues[a.id])}</strong></div>)}</div><Button variant="outline" disabled={!dirty} onClick={() => { setName(card.name); setText(card.text); }}>Restablecer ejemplo</Button><p className="muted">Este borrador se descarta al salir. El guardado llegará en el paso 04.</p></section><section className="preview-panel"><span className="eyebrow">VISTA DE CONTENIDO</span><article className="content-card"><h2>{name || 'Carta sin nombre'}</h2><div className="preview-art"><Flame size={52} strokeWidth={1} /><span>{card.visual.illustrationId ? 'Ilustración pendiente' : 'Sin ilustración'}</span></div><div className="card-body"><p>{text}</p>{card.abilities.map((a, i) => <p key={i}><strong>{abilityText(game, a)}</strong></p>)}</div></article><p className="muted">Prueba la plantilla A y sus descargas en Exportar / imprimir.</p></section></div></>;
}

function Rules() {
  const [rules, setRules] = useState(game.game.rules);
  return <><Heading title="Cómo se juega" subtitle="Un lugar para explicar tu mundo, un turno a la vez." /><section className="panel rules-panel"><div className="flex-between"><h2>Reglamento del juego</h2><span className="small-badge">Borrador temporal</span></div><label>Texto del reglamento<textarea rows={14} value={rules} onChange={e => setRules(e.target.value)} /></label><div className="flex-between"><p className="muted">Los cambios se descartan al salir o recargar.</p><Button variant="outline" onClick={() => setRules(game.game.rules)} disabled={rules === game.game.rules}>Restablecer ejemplo</Button></div><p className="coming-note">La descarga del reglamento en PDF estará disponible en el paso 10.</p></section></>;
}

function Export() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const total = Object.values(quantities).reduce((a, b) => a + b, 0);
  return <><Heading title="De la pantalla a la mesa" subtitle="Explora la selección de cartas y cantidades para una futura tanda de impresión." /><PrintProof /><div className="export-grid"><section className="panel"><h2>Selecciona tus cartas</h2><div className="selection-list">{game.cards.map(c => <div className="selection-row" key={c.id}><label><input type="checkbox" checked={!!quantities[c.id]} onChange={e => setQuantities({ ...quantities, [c.id]: e.target.checked ? 1 : 0 })} />{c.name}</label>{!!quantities[c.id] && <input aria-label={`Cantidad de ${c.name}`} type="number" min={1} step={1} value={quantities[c.id]} onChange={e => { const n = Number(e.target.value); if (Number.isSafeInteger(n) && n > 0) setQuantities({ ...quantities, [c.id]: n }); }} />}</div>)}</div></section><section className="panel print-summary"><div className="line-icon"><LayoutGrid size={24} /></div><h2>Tu próxima prueba</h2><div className="total" role="status">{total}<span>copias seleccionadas</span></div><p><Check size={16} /> Formato de carta: 63 × 88 mm</p><p><Check size={16} /> Solo frentes</p><div className="coming-note">Selección de demostración. La descarga de tandas estará disponible más adelante. Usa la prueba de una carta que aparece arriba.</div></section></div></>;
}
