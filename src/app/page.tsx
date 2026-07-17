import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="grid gap-6">
      <div className="grid gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Scaffold local
        </p>
        <h1 className="text-3xl font-bold text-slate-950">
          Profils joueurs et hero pools Dota 2
        </h1>
        <p className="max-w-3xl text-slate-700">
          Cette application sert a collecter les roles, preferences de jeu et
          evaluations de heros d&apos;une equipe. Les donnees restent en memoire
          pour ce premier socle, avec une architecture prete pour Supabase et un
          futur outil de draft.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          className="rounded-md border border-slate-300 bg-white p-4 hover:border-red-500"
          href="/profile"
        >
          <span className="font-semibold">Profil joueur</span>
          <span className="mt-2 block text-sm text-slate-600">
            Saisir le pseudonyme, les roles et les preferences.
          </span>
        </Link>
        <Link
          className="rounded-md border border-slate-300 bg-white p-4 hover:border-red-500"
          href="/hero-pool"
        >
          <span className="font-semibold">Hero pool</span>
          <span className="mt-2 block text-sm text-slate-600">
            Ajouter et ajuster les heros du joueur.
          </span>
        </Link>
        <Link
          className="rounded-md border border-slate-300 bg-white p-4 hover:border-red-500"
          href="/data-preview"
        >
          <span className="font-semibold">Apercu donnees</span>
          <span className="mt-2 block text-sm text-slate-600">
            Verifier la structure JSON exportable.
          </span>
        </Link>
      </div>
    </section>
  );
}
