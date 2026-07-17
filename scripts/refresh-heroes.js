const fs = require('fs');
const path = require('path');
const https = require('https');
const {
  sourceFolder,
  sourceFileName,
  sourceUrl,
} = require('./hero-catalogue-utils');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 400) {
          return reject(
            new Error(`Failed to fetch ${url}: ${response.statusCode}`),
          );
        }
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (error) {
          reject(error);
        }
      });
      response.on('error', reject);
    });
  });
}

async function main() {
  const data = await fetchJson(sourceUrl);
  fs.mkdirSync(sourceFolder, { recursive: true });
  fs.writeFileSync(
    path.join(sourceFolder, sourceFileName),
    JSON.stringify(data, null, 2) + '\n',
    'utf8',
  );
  console.log(
    `Saved cached metadata to ${path.join(sourceFolder, sourceFileName)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
