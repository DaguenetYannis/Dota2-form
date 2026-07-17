import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const publicAssetDirectory = path.resolve('public', 'dota2heroes');
const generatedDataDirectory = path.resolve('data', 'generated');
const outputFile = path.join(generatedDataDirectory, 'heroes.json');
const heroSourceUrl =
  'https://raw.githubusercontent.com/odota/dotaconstants/master/build/heroes.json';

interface SourceHero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: 'str' | 'agi' | 'int' | 'all';
}

interface GeneratedHero {
  id: string;
  dotaId: number;
  internalName: string;
  displayName: string;
  primaryAttribute: 'strength' | 'agility' | 'intelligence' | 'universal';
  assetSlug: string;
  isActive: boolean;
  imageSmallUrl: string | null;
  imageLargeUrl: string | null;
  imageFullUrl: string | null;
}

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 400) {
          return reject(
            new Error(`Failed to fetch ${url}: ${response.statusCode}`),
          );
        }
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve(JSON.parse(body) as T);
        } catch (error) {
          reject(error);
        }
      });
      response.on('error', reject);
    });
  });
}

function normalizePrimaryAttribute(attr: SourceHero['primary_attr']) {
  switch (attr) {
    case 'str':
      return 'strength' as const;
    case 'agi':
      return 'agility' as const;
    case 'int':
      return 'intelligence' as const;
    case 'all':
      return 'universal' as const;
    default:
      throw new Error(`Unsupported primary_attr: ${attr}`);
  }
}

function buildAssetSlug(internalName: string): string {
  return internalName.replace(/^npc_dota_hero_/, '');
}

function buildImageUrl(sizeFolder: string, assetSlug: string, suffix: string) {
  return `/dota2heroes/${sizeFolder}/${assetSlug}${suffix}`;
}

function resolveImageFilename(
  assetSlug: string,
  sizeFolder: string,
): string | null {
  const suffix =
    sizeFolder === '59x33'
      ? '_sb.png'
      : sizeFolder === '205x115'
        ? '_lg.png'
        : '_full.png';
  const filename = `${assetSlug}${suffix}`;
  const resolvedPath = path.join(publicAssetDirectory, sizeFolder, filename);
  return fs.existsSync(resolvedPath) ? filename : null;
}

async function main() {
  const raw = await fetchJson<Record<string, SourceHero>>(heroSourceUrl);
  const heroes = Object.values(raw).map((hero) => {
    const assetSlug = buildAssetSlug(hero.name);
    const smallFile = resolveImageFilename(assetSlug, '59x33');
    const largeFile = resolveImageFilename(assetSlug, '205x115');
    const fullFile = resolveImageFilename(assetSlug, '256x144');

    return {
      id: assetSlug,
      dotaId: hero.id,
      internalName: hero.name,
      displayName: hero.localized_name,
      primaryAttribute: normalizePrimaryAttribute(hero.primary_attr),
      assetSlug,
      isActive: true,
      imageSmallUrl: smallFile
        ? buildImageUrl('59x33', assetSlug, '_sb.png')
        : null,
      imageLargeUrl: largeFile
        ? buildImageUrl('205x115', assetSlug, '_lg.png')
        : null,
      imageFullUrl: fullFile
        ? buildImageUrl('256x144', assetSlug, '_full.png')
        : null,
    };
  });

  const duplicates = heroes.reduce<Record<number, GeneratedHero[]>>(
    (acc, hero) => {
      acc[hero.dotaId] = [...(acc[hero.dotaId] ?? []), hero];
      return acc;
    },
    {},
  );

  const duplicateIds = Object.entries(duplicates).filter(
    ([, values]) => values.length > 1,
  );
  if (duplicateIds.length > 0) {
    duplicateIds.forEach(([id, values]) => {
      console.error(
        `Duplicate dotaId ${id}: ${values.map((hero) => hero.id).join(', ')}`,
      );
    });
    throw new Error('Duplicate Dota IDs detected.');
  }

  const missingImages = heroes.filter(
    (hero) => !hero.imageSmallUrl || !hero.imageLargeUrl || !hero.imageFullUrl,
  );
  const orphanFiles = [] as string[];

  const assetSlugs = new Set(heroes.map((hero) => hero.assetSlug));
  for (const size of ['59x33', '205x115', '256x144'] as const) {
    const suffix =
      size === '59x33'
        ? '_sb.png'
        : size === '205x115'
          ? '_lg.png'
          : '_full.png';
    const files = fs.readdirSync(path.join(publicAssetDirectory, size));
    for (const file of files) {
      if (!file.endsWith(suffix)) {
        orphanFiles.push(path.join(size, file));
        continue;
      }
      const slug = file.slice(0, -suffix.length);
      if (!assetSlugs.has(slug)) {
        orphanFiles.push(path.join(size, file));
      }
    }
  }

  heroes.sort((a, b) => a.dotaId - b.dotaId);

  fs.mkdirSync(generatedDataDirectory, { recursive: true });
  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      { schemaVersion: '1.0', generatedAt: new Date().toISOString(), heroes },
      null,
      2,
    ),
  );

  console.log(`Generated ${heroes.length} heroes.`);
  console.log(`Heroes missing images: ${missingImages.length}`);
  if (missingImages.length > 0) {
    missingImages.forEach((hero) => {
      console.log(
        `Missing images for ${hero.id}: small=${hero.imageSmallUrl === null}, large=${hero.imageLargeUrl === null}, full=${hero.imageFullUrl === null}`,
      );
    });
  }
  if (orphanFiles.length > 0) {
    console.log('Orphan image files:');
    orphanFiles.forEach((file) => console.log(file));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
