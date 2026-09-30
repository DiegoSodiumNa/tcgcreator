'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Modal } from './ui/modal';

type Draft = { dirty: boolean; busy: boolean; save: () => Promise<boolean> };
type Destination = { kind: 'link'; href: string } | { kind: 'back' };
const DraftContext = createContext<(draft: Draft | null) => void>(() => {});

/** A same-URL entry keeps the editor mounted during a normal Back gesture.
 * Approved links replace that entry; approved Back skips it and the base entry.
 * Keeping the entry until navigation avoids racing Next's popstate restoration
 * against router.push after an asynchronous save. */
export function DraftGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const draft = useRef<Draft | null>(null);
  const sentinel = useRef(false);
  const restoring = useRef(false);
  const pending = useRef<Destination | null>(null);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  const register = useCallback((next: Draft | null) => {
    draft.current = next;
    if ((next?.dirty || next?.busy) && !sentinel.current) {
      window.history.pushState({ ...window.history.state, forjaDraft: true }, '', window.location.href);
      sentinel.current = true;
    }
  }, []);
  const navigate = useCallback((destination: Destination) => {
    const hadEntry = sentinel.current;
    sentinel.current = false;
    if (destination.kind === 'back') {
      window.history.go(hadEntry ? -2 : -1);
    } else if (hadEntry) {
      const { forjaDraft: _marker, ...state } = window.history.state;
      window.history.replaceState(state, '', window.location.href);
      router.replace(destination.href);
    } else router.push(destination.href);
  }, [router]);

  useEffect(() => {
    // A full reload can leave the guard entry in browser history.
    if (window.history.state?.forjaDraft) sentinel.current = true;
    const unload = (event: BeforeUnloadEvent) => {
      if (draft.current?.dirty || draft.current?.busy) { event.preventDefault(); event.returnValue = ''; }
    };
    const click = (event: MouseEvent) => {
      if (!sentinel.current && !draft.current?.dirty && !draft.current?.busy) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) return;
      const target = new URL(link.href);
      if (target.href === window.location.href || target.origin !== window.location.origin) return;
      // An in-page anchor does not leave the form.
      if (target.pathname === location.pathname && target.search === location.search) return;
      event.preventDefault(); event.stopPropagation();
      if (draft.current?.busy || restoring.current) return;
      const destination: Destination = { kind: 'link', href: target.pathname + target.search + target.hash };
      if (!draft.current?.dirty) { navigate(destination); return; }
      pending.current = destination;
      setAsking(true);
    };
    const pop = () => {
      if (restoring.current) {
        restoring.current = false;
        if (draft.current?.dirty && !draft.current.busy) { pending.current = { kind: 'back' }; setAsking(true); }
        return;
      }
      if (!sentinel.current) {
        if (window.history.state?.forjaDraft) sentinel.current = true;
        return;
      }
      if (!draft.current?.dirty && !draft.current?.busy) {
        sentinel.current = false;
        window.history.back();
        return;
      }
      restoring.current = true;
      window.history.forward();
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', click, true);
    window.addEventListener('popstate', pop);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', click, true); window.removeEventListener('popstate', pop); };
  }, [navigate]);

  const leave = async (save: boolean) => {
    setBusy(true);
    try {
      if (save && !(await draft.current?.save())) { setAsking(false); return; }
      draft.current = null;
      const destination = pending.current;
      pending.current = null;
      setAsking(false);
      if (destination) navigate(destination);
    } finally { setBusy(false); }
  };
  return <DraftContext.Provider value={register}>{children}{asking && <Modal title="Cambios sin guardar" busy={busy} onClose={() => setAsking(false)}>
    <p>Guarda tus cambios antes de salir o descártalos para continuar.</p>
    <div className="action-row"><Button disabled={busy} onClick={() => void leave(true)}>Guardar y salir</Button><Button variant="outline" disabled={busy} onClick={() => void leave(false)}>Descartar y salir</Button><Button variant="ghost" disabled={busy} onClick={() => setAsking(false)}>Permanecer</Button></div>
  </Modal>}</DraftContext.Provider>;
}

export function useDraftGuard(dirty: boolean, busy: boolean, save: () => Promise<boolean>) {
  const register = useContext(DraftContext);
  useEffect(() => { register({ dirty, busy, save }); }, [register, dirty, busy, save]);
  useEffect(() => () => register(null), [register]);
}
