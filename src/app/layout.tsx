import type { Metadata } from 'next';
import './globals.css';
import '../../design/sistema-diseno.css';
import './library-design.css';
import { DraftGuard } from '@/components/draft-guard';
export const metadata: Metadata = { title: 'Forja · Editor de cartas', description: 'Un espacio para dar forma a tus juegos de cartas.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><DraftGuard>{children}</DraftGuard></body></html>;
}
