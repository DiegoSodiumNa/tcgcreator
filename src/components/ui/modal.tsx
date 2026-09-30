'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';

export function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="local-dialog panel" aria-labelledby={id} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <h2 id={id}>{title}</h2>{children}
  </dialog>;
}
