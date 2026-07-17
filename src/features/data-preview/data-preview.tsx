'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/lib/app-state';

export function DataPreview() {
  const { snapshot } = useAppState();
  const [json, setJson] = useState('');

  useEffect(() => {
    void snapshot().then((data) => setJson(JSON.stringify(data, null, 2)));
  }, [snapshot]);

  return (
    <section className="grid gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Apercu donnees</h1>
        <p className="text-slate-700">
          JSON local pour verifier le format attendu par le futur outil de
          draft.
        </p>
      </div>
      <pre className="overflow-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-sm text-slate-50">
        <code>{json || 'Chargement...'}</code>
      </pre>
    </section>
  );
}
