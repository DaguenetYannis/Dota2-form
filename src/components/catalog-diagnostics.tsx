import diagnostics from '@/../data/generated/heroes.diagnostics.json';

export function CatalogDiagnostics() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <div className="mb-2 text-slate-900 font-semibold">
        Catalogue diagnostics
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>Total heroes: {diagnostics.totalHeroes}</div>
        <div>Matched images: {diagnostics.matchedImageCount}</div>
        <div>Missing images: {diagnostics.missingImageCount}</div>
        <div>Orphan assets: {diagnostics.orphanAssetCount}</div>
      </div>
      {diagnostics.orphanAssetCount > 0 ? (
        <div className="mt-3">
          <div className="font-medium text-slate-900">Orphan assets</div>
          <ul className="list-disc pl-5">
            {diagnostics.orphanAssets.map((asset: string) => (
              <li key={asset}>{asset}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
