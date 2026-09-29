import { Suspense } from 'react';
import { Workspace } from '@/components/workspace';
export default function Page() { return <Suspense fallback={<p>Cargando cartas…</p>}><Workspace view="cards" /></Suspense>; }
