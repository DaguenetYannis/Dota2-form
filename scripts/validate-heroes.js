const {
  readSourceFile,
  buildHeroCatalogue,
  computeDiagnostics,
} = require('./hero-catalogue-utils');

function main() {
  const source = readSourceFile();
  const { heroes, duplicateIds } = buildHeroCatalogue(source);
  const diagnostics = computeDiagnostics(heroes);

  if (duplicateIds.length > 0) {
    duplicateIds.forEach((entry) => {
      console.error(
        `Duplicate dotaId found: ${entry.id} -> ${entry.heroes.join(', ')}`,
      );
    });
    throw new Error('Duplicate Dota IDs found in source metadata');
  }

  if (diagnostics.orphanAssetCount > 0) {
    console.error('Orphan assets detected:');
    diagnostics.orphanAssets.forEach((asset) => console.error(asset));
    throw new Error('Orphan assets detected');
  }

  console.log('Hero catalogue validation passed.');
  console.log(`Total heroes: ${diagnostics.totalHeroes}`);
  console.log(`Matched images: ${diagnostics.matchedImageCount}`);
  console.log(`Missing images: ${diagnostics.missingImageCount}`);
}

main();
