const fs = require('fs');
const path = require('path');
const {
  readSourceFile,
  buildHeroCatalogue,
  computeDiagnostics,
  writeGeneratedFiles,
  sourceName,
  sourceUrl,
} = require('./hero-catalogue-utils');

function main() {
  const source = readSourceFile();
  const { heroes, duplicateIds } = buildHeroCatalogue(source);

  if (duplicateIds.length > 0) {
    duplicateIds.forEach((entry) => {
      console.error(
        `Duplicate dotaId found: ${entry.id} -> ${entry.heroes.join(', ')}`,
      );
    });
    throw new Error('Duplicate Dota IDs found in source metadata');
  }

  const diagnostics = computeDiagnostics(heroes);
  const provenance = {
    sourceName,
    sourceUrl,
    sourceFile: 'data/source/opendota-heroes.json',
    generator: 'scripts/generate-heroes.js',
    generatorSchemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
  };

  writeGeneratedFiles(heroes, diagnostics, provenance);
  console.log(`Generated ${diagnostics.totalHeroes} heroes.`);
  console.log(`Matched images: ${diagnostics.matchedImageCount}`);
  console.log(`Missing images: ${diagnostics.missingImageCount}`);
  console.log(`Orphan assets: ${diagnostics.orphanAssetCount}`);
}

main();
