import test from 'node:test';
import assert from 'node:assert/strict';
import { compareNumbers, highestNumber, nextNumberPreview } from '@/lib/numbering';

test('suurin juokseva numero löytyy merkkijonoista', () => {
  assert.equal(highestNumber(['1', '2', '10']), 10);
  assert.equal(highestNumber([]), 0);
  assert.equal(highestNumber(['007']), 7);
  assert.equal(highestNumber([' 42 ']), 42);
});

test('muut kuin numeeriset tunnisteet ohitetaan', () => {
  // Vanhat laskunumerot olivat muotoa L123456; ne eivät saa hypäyttää sarjaa.
  assert.equal(highestNumber(['L123456', '3', 'abc', '', undefined]), 3);
  assert.equal(highestNumber(['12.5', '-4', '1e3']), 0);
});

test('seuraava numero on suurin plus yksi', () => {
  assert.equal(nextNumberPreview([]), '1');
  assert.equal(nextNumberPreview(['1', '2', '9']), '10');
  assert.equal(nextNumberPreview(['L999999', '4']), '5');
});

test('numerot järjestyvät lukuarvon mukaan, ei merkkijonona', () => {
  const sorted = ['9', '10', '2'].sort(compareNumbers);
  assert.deepEqual(sorted, ['2', '9', '10']);
});

test('ei-numeeriset tunnisteet jäävät loppuun', () => {
  const sorted = ['L20', '3', 'A1', '1'].sort(compareNumbers);
  assert.deepEqual(sorted, ['1', '3', 'A1', 'L20']);
});
