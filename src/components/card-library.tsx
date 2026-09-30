'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { deleteCard, duplicateCard } from '@/domain/cards';
import type { Card } from '@/domain/schema';
import { StorageError } from '@/storage/repository';
import { gameUrl, LocalImage, useGame, useLocalSave } from './local-game';
import { Button } from './ui/button';
import { Modal } from './ui/modal';

export function CardLibrary() {
  const { game } = useGame();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [newId] = useState(() => crypto.randomUUID());
  const [deleting, setDeleting] = useState<Card | null>(null);
  const operation = useRef<{ kind: 'duplicate' | 'delete'; id: string; newId?: string } | null>(null);
  const { save, busy, feedback } = useLocalSave(false, () => {
    const command = operation.current;
    if (!command) throw new StorageError('validation', 'Selecciona una carta.');
    return command.kind === 'duplicate' ? duplicateCard(game, command.id, command.newId!) : deleteCard(game, command.id);
  });
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cards = game.cards.filter(card => normalize(card.name).includes(normalize(query)) && (!type || card.typeIds.includes(type)));
  return <>
    <div className="page-heading"><div className="eyebrow">{game.game.name}</div><h1>Tu colección de cartas</h1><p>Crea cartas, combina tipos y prepara su contenido para tus próximas pruebas.</p></div>
    <div className="toolbar"><label className="search-field"><Search size={18} /><input aria-label="Buscar cartas" placeholder="Buscar por nombre…" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Filtrar por tipo" value={type} onChange={event => setType(event.target.value)}><option value="">Todos los tipos</option>{game.definitions.types.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><span className="muted" role="status">{cards.length} cartas</span>{game.definitions.types.length ? <Button asChild><Link href={`${gameUrl('editor', game.game.id, newId)}&create=1`}>Crear carta</Link></Button> : <Button disabled>Crear carta</Button>}</div>
    {!game.definitions.types.length && <p className="coming-note">Define al menos un tipo antes de crear cartas. <Link className="back-link" href={`${gameUrl('configuracion', game.game.id)}&catalog=types`}>Configurar tipos</Link></p>}
    <div className="cards-grid">{cards.map(card => <article className="card-tile" key={card.id}><Link href={gameUrl('editor', game.game.id, card.id)}><LocalImage className="card-art" gameId={game.game.id} imageId={card.visual.illustrationId} /><div className="card-info"><span className="eyebrow">{card.typeIds.map(id => game.definitions.types.find(item => item.id === id)?.name).join(' · ')}</span><h2>{card.name}</h2><span className="open-card">Abrir carta <ArrowRight size={14} /></span></div></Link><div className="card-actions"><Button variant="outline" disabled={busy} aria-label={`Duplicar ${card.name}`} onClick={async () => { operation.current = { kind: 'duplicate', id: card.id, newId: crypto.randomUUID() }; await save(); }}>Duplicar</Button><Button variant="ghost" disabled={busy} aria-label={`Eliminar ${card.name}`} onClick={() => setDeleting(card)}>Eliminar</Button></div></article>)}</div>
    {!cards.length && <div className="empty-state"><Search size={30} /><h2>{game.cards.length ? 'No hay cartas que coincidan' : 'Este juego todavía no tiene cartas'}</h2><p>{game.cards.length ? 'Prueba otro nombre o cambia el filtro.' : 'Crea tu primera carta a partir de los conceptos del juego.'}</p>{!!game.cards.length && <Button variant="outline" onClick={() => { setQuery(''); setType(''); }}>Limpiar filtros</Button>}</div>}
    {feedback}
    {deleting && <Modal title="Eliminar carta" busy={busy} onClose={() => setDeleting(null)}><p>Se eliminará «{deleting.name}». Sus imágenes seguirán disponibles para otras cartas. Esta acción no se puede deshacer.</p><div className="action-row"><Button disabled={busy} onClick={async () => { operation.current = { kind: 'delete', id: deleting.id }; await save(); setDeleting(null); }}>Eliminar definitivamente</Button><Button disabled={busy} variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button></div></Modal>}
  </>;
}
