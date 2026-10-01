'use client';
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';

export type ModalTheme = 'editorial';

export function Modal({ title, children, onClose, busy = false, theme, returnFocusRef }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean; theme?: ModalTheme; returnFocusRef?: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const opener = returnFocusRef?.current ?? document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (opener instanceof HTMLElement && opener.isConnected) opener.focus(); };
  }, [returnFocusRef]);
  return <dialog ref={ref} className={`local-dialog panel${theme === 'editorial' ? ' ds-scope' : ''}`} aria-labelledby={id} aria-busy={busy || undefined} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onKeyDown={event => {
      if (theme !== 'editorial' || event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'))
        .filter(element => element.tabIndex >= 0 && !element.matches(':disabled, [aria-disabled="true"]') && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
    <h2 id={id}>{title}</h2>{children}
  </dialog>;
}
