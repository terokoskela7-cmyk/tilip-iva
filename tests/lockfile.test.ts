import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Lockfile-tarkistus.
 *
 * Paketit oli aiemmin lukittu osittain kolmannen osapuolen peilipalvelimeen
 * (registry.npmmirror.com), joka on sekä toimitusketjuriski että CI:n hauraus:
 * asennus haki paketteja taholta jota projekti ei hallitse. Tämä testi kaatuu,
 * jos peiliosoitteita päätyy lockfileen uudelleen.
 */

const ALLOWED_REGISTRY = 'https://registry.npmjs.org/';

test('lockfile viittaa vain viralliseen npm-rekisteriin', () => {
  const lockfilePath = path.join(process.cwd(), 'package-lock.json');
  const lockfile = readFileSync(lockfilePath, 'utf8');

  const resolved = [...lockfile.matchAll(/"resolved":\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.ok(resolved.length > 0, 'lockfilestä pitäisi löytyä resolved-kenttiä');

  const foreign = resolved.filter(
    (url) => url.startsWith('http') && !url.startsWith(ALLOWED_REGISTRY)
  );
  assert.deepEqual(
    [...new Set(foreign.map((url) => new URL(url).host))],
    [],
    'lockfilessä on paketteja muualta kuin registry.npmjs.org:sta'
  );
});

test('projektin .npmrc lukitsee rekisterin', () => {
  const npmrc = readFileSync(path.join(process.cwd(), '.npmrc'), 'utf8');
  assert.match(npmrc, /^registry=https:\/\/registry\.npmjs\.org\/?$/m);
});
