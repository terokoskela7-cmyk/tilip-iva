import test from 'node:test';
import assert from 'node:assert/strict';
import { detectDelimiter, parseDecimal, parseIsoDate, splitCsvLine } from '@/lib/csv';

test('lainausmerkeissä oleva erotin ei riko sarakkeita', () => {
  assert.deepEqual(
    splitCsvLine('2024-01-01,"Yritys Oy, Helsinki",12.50', ','),
    ['2024-01-01', 'Yritys Oy, Helsinki', '12.50']
  );
});

test('kaksi peräkkäistä lainausmerkkiä on yksi lainausmerkki', () => {
  assert.deepEqual(splitCsvLine('a,"sanoi ""hei""",b', ','), ['a', 'sanoi "hei"', 'b']);
});

test('tyhjät kentät säilyvät paikoillaan', () => {
  assert.deepEqual(splitCsvLine('a;;c', ';'), ['a', '', 'c']);
  assert.deepEqual(splitCsvLine('', ';'), ['']);
});

test('erotin tunnistetaan ensimmäiseltä riviltä', () => {
  assert.equal(detectDelimiter('a;b;c\n1;2;3'), ';');
  assert.equal(detectDelimiter('a,b,c\n1,2,3'), ',');
  assert.equal(detectDelimiter('a\tb\tc'), '\t');
});

test('suomalainen summamuoto', () => {
  assert.equal(parseDecimal('1 234,56'), 1234.56);
  assert.equal(parseDecimal('1234,56'), 1234.56);
  assert.equal(parseDecimal('-1 234,56'), -1234.56);
  assert.equal(parseDecimal('12,50 €'), 12.5);
});

test('eurooppalainen ja amerikkalainen summamuoto', () => {
  // Aiemmin kaikki pisteet poistettiin, jolloin tästä tuli 1,23456.
  assert.equal(parseDecimal('1,234.56'), 1234.56);
  assert.equal(parseDecimal('1.234,56'), 1234.56);
  assert.equal(parseDecimal('1.234.567,89'), 1234567.89);
  assert.equal(parseDecimal('1,234,567.89'), 1234567.89);
});

test('yksinäinen piste: kolme desimaalia on tuhaterotin', () => {
  assert.equal(parseDecimal('1.234'), 1234);
  assert.equal(parseDecimal('0.50'), 0.5);
  assert.equal(parseDecimal('1.5'), 1.5);
  assert.equal(parseDecimal('250'), 250);
});

test('suluissa oleva summa on negatiivinen', () => {
  assert.equal(parseDecimal('(1 234,56)'), -1234.56);
});

test('kelvoton summa palauttaa null eikä nollaa', () => {
  assert.equal(parseDecimal(''), null);
  assert.equal(parseDecimal('   '), null);
  assert.equal(parseDecimal('abc'), null);
  assert.equal(parseDecimal(undefined), null);
  // Nolla on kelvollinen summa, ei virhe.
  assert.equal(parseDecimal('0,00'), 0);
});

test('päivämäärämuodot', () => {
  assert.equal(parseIsoDate('2024-03-05'), '2024-03-05');
  assert.equal(parseIsoDate('5.3.2024'), '2024-03-05');
  assert.equal(parseIsoDate('05.03.2024'), '2024-03-05');
  assert.equal(parseIsoDate('05.03.24'), '2024-03-05');
  assert.equal(parseIsoDate('05.03.99'), '1999-03-05');
});

test('kauttaviivamuoto: yli 12 ratkaisee päivän ja kuukauden', () => {
  assert.equal(parseIsoDate('13/04/2024'), '2024-04-13');
  assert.equal(parseIsoDate('04/13/2024'), '2024-04-13');
  // Molemmat alle 13 -> eurooppalainen tulkinta päivä/kuukausi.
  assert.equal(parseIsoDate('04/05/2024'), '2024-05-04');
});

test('mahdoton päivämäärä hylätään', () => {
  assert.equal(parseIsoDate('31.02.2024'), null);
  assert.equal(parseIsoDate('2024-13-01'), null);
  assert.equal(parseIsoDate('roska'), null);
  assert.equal(parseIsoDate(''), null);
});
