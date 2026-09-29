import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Forja · Editor de cartas', description: 'Un espacio para dar forma a tus juegos de cartas.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
