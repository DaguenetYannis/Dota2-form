import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { AppStateProvider } from '@/lib/app-state';

export const metadata: Metadata = {
  title: 'Dota 2 Profils et Hero Pools',
  description: 'Collecte structuree de profils joueurs Dota 2.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <AppStateProvider>
          <div className="min-h-screen">
            <header className="border-b border-slate-200 bg-white">
              <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
                <Link className="font-semibold text-slate-950" href="/">
                  Dota Profiles
                </Link>
                <Link
                  className="text-sm text-slate-700 hover:text-slate-950"
                  href="/profile"
                >
                  Profil joueur
                </Link>
                <Link
                  className="text-sm text-slate-700 hover:text-slate-950"
                  href="/hero-pool"
                >
                  Hero pool
                </Link>
                <Link
                  className="text-sm text-slate-700 hover:text-slate-950"
                  href="/data-preview"
                >
                  Apercu donnees
                </Link>
              </nav>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </div>
        </AppStateProvider>
      </body>
    </html>
  );
}
