'use client';
import type { Card, GameFile } from '@/domain/schema';
import { attributesForTypes } from '@/domain/rules';
import { Button } from './ui/button';
export function VisualControls({ game, card, onChange }: { game: GameFile; card: Card; onChange: (card: Card) => void }) {
  const visual = card.visual;
  const update = (patch: Partial<Card['visual']>) => onChange({ ...card, visual: { ...visual, ...patch } });
  return <section className="visual-controls"><h2>Diseño de la carta</h2>
    <label>Plantilla<select value={visual.templateId} onChange={e => update({ templateId: e.target.value as Card['visual']['templateId'] })}><option value="illustration">A — Ilustración</option><option value="text">B — Texto</option></select></label>
    <div className="color-controls">{([['background', 'Fondo'], ['foreground', 'Texto'], ['accent', 'Acento']] as const).map(([key, label]) => <label key={key}>Color de {label.toLowerCase()}<input type="color" value={visual.colors[key]} onChange={e => update({ colors: { ...visual.colors, [key]: e.target.value } })} /></label>)}</div>
    {visual.attributeSlots.map((id, index) => <label key={index}>Espacio {index + 1}<select value={id ?? ''} onChange={e => update({ attributeSlots: visual.attributeSlots.map((value, i) => i === index ? e.target.value || null : value) })}><option value="">Vacío</option>{attributesForTypes(game, card.typeIds).map(attribute => <option key={attribute.id} value={attribute.id} disabled={attribute.id !== id && visual.attributeSlots.includes(attribute.id)}>{attribute.name}</option>)}</select></label>)}
    <p className="muted">Los atributos restantes aparecen en el texto. Los símbolos se editan en Configuración y son compartidos.</p>
    {visual.illustrationId && <fieldset><legend>Recorte de ilustración (%)</legend>{([['x', 'Posición horizontal'], ['y', 'Posición vertical'], ['width', 'Ancho del recorte'], ['height', 'Alto del recorte']] as const).map(([key, label]) => <label key={key}>{label}<input type="range" min={key === 'width' || key === 'height' ? 1 : 0} max={100} step={1} value={Math.round(visual.crop[key] * 100)} onChange={event => {
      const crop = { ...visual.crop, [key]: Number(event.target.value) / 100 };
      if (key === 'x') crop.x = Math.min(crop.x, 1 - crop.width);
      if (key === 'y') crop.y = Math.min(crop.y, 1 - crop.height);
      if (key === 'width') crop.x = Math.min(crop.x, 1 - crop.width);
      if (key === 'height') crop.y = Math.min(crop.y, 1 - crop.height);
      update({ crop });
    }} /><span>{Math.round(visual.crop[key] * 100)} %</span></label>)}<Button type="button" variant="outline" onClick={() => update({ crop: { x: 0, y: 0, width: 1, height: 1 } })}>Restablecer recorte</Button></fieldset>}
  </section>;
}
