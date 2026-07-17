import type { Metadata } from 'next';
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
            <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </AppStateProvider>
      </body>
    </html>
  );
}
