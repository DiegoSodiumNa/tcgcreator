'use client';
import { useState } from 'react';
import { abilityChangeText, applyAbilityChange, replacementKey, type AbilityChange, type ReplacementValues } from '@/domain/ability-changes';
import type { GameFile } from '@/domain/schema';
import { Button } from './ui/button';
import { Modal } from './ui/modal';

export function AbilityChangeReview({ plan, onResolve }: { plan: AbilityChange; onResolve: (result: GameFile | false) => void }) {
  const [values, setValues] = useState<ReplacementValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = () => {
    try {
      const result = applyAbilityChange(plan, values); setErrors(result.errors);
      if (result.next) onResolve(result.next);
    } catch { setErrors({ general: 'Revisa los parámetros y la definición antes de confirmar.' }); }
  };
  return <Modal title="Revisar habilidad compartida" onClose={() => onResolve(false)}>
    <p>{new Set(plan.uses.map(use => use.cardId)).size} cartas afectadas, {plan.uses.length} usos. Nada cambia hasta confirmar.</p>
    <div className="ability-comparison"><section><h3>Definición anterior</h3><strong>{plan.before.name}</strong><p>{plan.before.reminder}</p></section><section><h3>Nueva definición</h3><strong>{plan.after.name}</strong><p>{plan.after.reminder}</p></section></div>
    <form noValidate onSubmit={event => { event.preventDefault(); confirm(); }}><div className="shared-uses">{plan.uses.map(use => <fieldset className="parameter-row" key={use.key}><legend>{use.cardName} — habilidad {use.index + 1}</legend><p><strong>Antes:</strong> {use.beforeText}</p><p><strong>Después:</strong> {abilityChangeText(plan, use, values)}</p>{!!use.removed.length && <p>Parámetros que se retirarán: {use.removed.map(parameter => parameter.name).join(', ')}.</p>}{use.required.map(parameter => <label key={parameter.id}>{parameter.name} — {use.cardName} — uso {use.index + 1}<input value={values[use.key]?.[parameter.id] ?? ''} inputMode={parameter.kind === 'number' ? 'decimal' : 'text'} onChange={event => { setValues({ ...values, [use.key]: { ...values[use.key], [parameter.id]: event.target.value } }); setErrors({}); }} /><span className="muted">{parameter.kind === 'number' ? 'Número' : 'Texto'}: valor para un parámetro nuevo o con formato cambiado.</span>{errors[replacementKey(use.key, parameter.id)] && <span role="alert" className="field-error">{errors[replacementKey(use.key, parameter.id)]}</span>}</label>)}</fieldset>)}</div>{errors.general && <p role="alert" className="field-error">{errors.general}</p>}<div className="action-row definition-actions"><Button>Confirmar actualización</Button><Button type="button" variant="outline" onClick={() => onResolve(false)}>Cancelar</Button></div></form>
  </Modal>;
}
