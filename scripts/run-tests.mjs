// Ajaa tests/-kansion TypeScript-testit Noden omalla test runnerilla.
// Testit kaannetaan ensin esbuildilla, jotta '@/'-polkualias ja TypeScript
// toimivat ilman erillista testikehysta.
import { build } from 'esbuild';
import { readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testDir = path.join(root, 'tests');
const outdir = path.join(root, '.test-build');

const entryPoints = readdirSync(testDir)
  .filter((file) => file.endsWith('.test.ts'))
  .map((file) => path.join(testDir, file));

if (entryPoints.length === 0) {
  console.error('Ei testitiedostoja kansiossa tests/');
  process.exit(1);
}

rmSync(outdir, { recursive: true, force: true });

await build({
  entryPoints,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outdir,
  outExtension: { '.js': '.mjs' },
  alias: { '@': path.join(root, 'src') },
  logLevel: 'error',
});

// Tiedostot annetaan nimeltä: node --test tulkitsee hakemistopolun eri tavoin
// eri Node-versioissa.
const compiled = readdirSync(outdir)
  .filter((file) => file.endsWith('.test.mjs'))
  .map((file) => path.join(outdir, file));

const result = spawnSync(process.execPath, ['--test', ...compiled], { stdio: 'inherit', cwd: root });
process.exit(result.status ?? 1);
