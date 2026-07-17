const fs = require('fs');
const path = require('path');

const sourceFolder = path.resolve('data', 'source');
const generatedFolder = path.resolve('data', 'generated');
const publicFolder = path.resolve('public', 'dota2heroes');
const sourceFileName = 'opendota-heroes.json';
const generatedFileName = 'heroes.json';
const provenanceFileName = 'heroes.provenance.json';
const diagnosticsFileName = 'heroes.diagnostics.json';

const sourceUrl =
  'https://raw.githubusercontent.com/odota/dotaconstants/master/build/heroes.json';
const sourceName = 'OpenDota hero constants';
const canonicalDisplayNameOverrides = {
  obsidian_destroyer: 'Outworld Destroyer',
};
const supportedSizes = {
  small: { folder: '59x33', suffix: '_sb.png' },
  large: { folder: '205x115', suffix: '_lg.png' },
  full: { folder: '256x144', suffix: '_full.png' },
};

function normalizePrimaryAttribute(value) {
  switch (value) {
    case 'str':
      return 'strength';
    case 'agi':
      return 'agility';
    case 'int':
      return 'intelligence';
    case 'all':
      return 'universal';
    default:
      throw new Error(`Unexpected primary_attr ${value}`);
  }
}

function resolveImageUrl(assetSlug, size) {
  const { folder, suffix } = supportedSizes[size];
  const relativePath = path.join(folder, `${assetSlug}${suffix}`);
  const absolutePath = path.join(publicFolder, relativePath);
  if (fs.existsSync(absolutePath)) {
    return `/dota2heroes/${folder}/${assetSlug}${suffix}`;
  }
  return null;
}

function buildHeroCatalogue(source) {
  const heroes = Object.values(source)
    .map((hero) => {
      const assetSlug = hero.name.replace(/^npc_dota_hero_/, '');
      return {
        id: assetSlug,
        dotaId: hero.id,
        internalName: hero.name,
        displayName:
          canonicalDisplayNameOverrides[assetSlug] ?? hero.localized_name,
        primaryAttribute: normalizePrimaryAttribute(hero.primary_attr),
        assetSlug,
        isActive: true,
        imageSmallUrl: resolveImageUrl(assetSlug, 'small'),
        imageLargeUrl: resolveImageUrl(assetSlug, 'large'),
        imageFullUrl: resolveImageUrl(assetSlug, 'full'),
      };
    })
    .sort((left, right) => left.dotaId - right.dotaId);

  const duplicateBuckets = heroes.reduce((acc, hero) => {
    const key = hero.dotaId;
    acc[key] = acc[key] || [];
    acc[key].push(hero);
    return acc;
  }, {});

  const duplicateIds = Object.entries(duplicateBuckets)
    .filter(([, values]) => values.length > 1)
    .map(([id, values]) => ({
      id: Number(id),
      heroes: values.map((hero) => hero.id),
    }));

  return { heroes, duplicateIds };
}

function computeDiagnostics(heroes) {
  const matchedImageCount = heroes.filter(
    (hero) => hero.imageSmallUrl && hero.imageLargeUrl && hero.imageFullUrl,
  ).length;
  const missingImageCount = heroes.length - matchedImageCount;

  const assetSlugs = new Set(heroes.map((hero) => hero.assetSlug));
  const orphanFiles = [];

  Object.values(supportedSizes).forEach(({ folder, suffix }) => {
    const folderPath = path.join(publicFolder, folder);
    if (!fs.existsSync(folderPath)) {
      return;
    }
    const files = fs.readdirSync(folderPath);
    files.forEach((file) => {
      if (!file.endsWith(suffix)) {
        orphanFiles.push(file);
        return;
      }
      const slug = file.slice(0, -suffix.length);
      if (!assetSlugs.has(slug)) {
        orphanFiles.push(file);
      }
    });
  });

  return {
    totalHeroes: heroes.length,
    matchedImageCount,
    missingImageCount,
    orphanAssetCount: orphanFiles.length,
    orphanAssets: orphanFiles,
  };
}

function readSourceFile() {
  const filePath = path.join(sourceFolder, sourceFileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Cached source file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeGeneratedFiles(catalogue, diagnostics, provenance) {
  fs.mkdirSync(generatedFolder, { recursive: true });
  fs.writeFileSync(
    path.join(generatedFolder, generatedFileName),
    JSON.stringify({ schemaVersion: '1.0', heroes: catalogue }, null, 2) + '\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(generatedFolder, diagnosticsFileName),
    JSON.stringify(diagnostics, null, 2) + '\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(generatedFolder, provenanceFileName),
    JSON.stringify(provenance, null, 2) + '\n',
    'utf8',
  );
}

module.exports = {
  sourceFolder,
  generatedFolder,
  publicFolder,
  sourceFileName,
  generatedFileName,
  provenanceFileName,
  diagnosticsFileName,
  sourceUrl,
  sourceName,
  supportedSizes,
  normalizePrimaryAttribute,
  resolveImageUrl,
  buildHeroCatalogue,
  computeDiagnostics,
  readSourceFile,
  writeGeneratedFiles,
};
