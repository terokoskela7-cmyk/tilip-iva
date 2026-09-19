import test from 'node:test';
import assert from 'node:assert/strict';
import type { EntryLine } from '@/types';
import { validateEntryDraft } from '@/lib/entryValidation';

let lineId = 0;
const line = (accountId: string, debit: number, credit: number): EntryLine => ({
  id: `line-${++lineId}`,
  accountId,
  accountNumber: accountId ? '1940' : '',
  accountName: accountId ? 'Tili' : '',
  debit,
  credit,
  description: '',
});

const validate = (lines: EntryLine[]) => validateEntryDraft(lines, '2024-01-01', '1');

test('tasan menevä tosite hyväksytään', () => {
  const result = validate([line('a', 100, 0), line('b', 0, 100)]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.balanced, true);
  assert.equal(result.postedLines.length, 2);
});

test('summa ilman tiliä estää tallennuksen', () => {
  // Rivi ilman tiliä pudotettaisiin tallennuksessa, jolloin tosite
  // tallentuisi 100 euroa epätasapainossa.
  const result = validate([line('a', 100, 0), line('', 0, 100)]);
  assert.equal(result.balanced, false);
  assert.equal(
    result.errors.includes('Yhdellä rivillä on summa mutta ei tiliä. Valitse tili tai tyhjennä summa.'),
    true
  );
});

test('useampi tilitön rivi taivutetaan monikkoon', () => {
  const result = validate([line('a', 100, 0), line('', 0, 60), line('', 0, 40)]);
  assert.equal(
    result.errors.includes('2 rivillä on summa mutta ei tiliä. Valitse tili tai tyhjennä summa.'),
    true
  );
});

test('tyhjä ylimääräinen rivi on sallittu', () => {
  const result = validate([line('a', 100, 0), line('b', 0, 100), line('', 0, 0)]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.postedLines.length, 2);
});

test('sentin heitto ei enää mene läpi', () => {
  const result = validate([line('a', 100, 0), line('b', 0, 100.01)]);
  assert.equal(result.balanced, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /Erotus 0\.01 €/);
});

test('liukulukujen epätarkkuus ei riko täsmäytystä', () => {
  const result = validate([line('a', 0.1, 0), line('b', 0.2, 0), line('c', 0, 0.3)]);
  assert.equal(result.totalDebitCents, 30);
  assert.equal(result.totalCreditCents, 30);
  assert.deepEqual(result.errors, []);
});

test('negatiivinen summa hylätään', () => {
  const result = validate([line('a', -100, 0), line('b', 0, -100)]);
  assert.equal(
    result.errors.includes('Debet ja kredit eivät voi olla negatiivisia. Kirjaa summa vastakkaiselle puolelle.'),
    true
  );
});

test('sama rivi ei voi olla molemmilla puolilla', () => {
  const result = validate([line('a', 100, 40), line('b', 0, 60)]);
  assert.equal(
    result.errors.includes('Samalla rivillä ei voi olla sekä debet- että kredit-summaa.'),
    true
  );
});

test('kahdenkertaisuus vaatii kaksi tilillistä riviä', () => {
  const result = validate([line('a', 100, 0), line('', 0, 0)]);
  assert.equal(
    result.errors.includes('Tositteella on oltava vähintään kaksi riviä, joilla on tili.'),
    true
  );
});

test('summaton tosite hylätään', () => {
  const result = validate([line('a', 0, 0), line('b', 0, 0)]);
  assert.equal(result.errors.includes('Tositteella ei ole summia.'), true);
  assert.equal(result.balanced, false);
});

test('päivämäärä ja tositenumero vaaditaan', () => {
  const lines = [line('a', 100, 0), line('b', 0, 100)];
  assert.equal(validateEntryDraft(lines, '', '1').errors.includes('Päivämäärä puuttuu'), true);
  assert.equal(validateEntryDraft(lines, '2024-01-01', '   ').errors.includes('Tositenumero puuttuu'), true);
});
