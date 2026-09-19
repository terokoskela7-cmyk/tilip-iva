import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFiscalPeriod,
  fiscalYearOf,
  isWithinPeriod,
  listFiscalPeriods,
  normalizeMonthDay,
} from '@/lib/fiscalYear';

test('kalenterivuosi on oletustilikausi', () => {
  assert.deepEqual(buildFiscalPeriod(2024, '01-01', '12-31'), {
    key: '2024',
    label: '2024',
    start: '2024-01-01',
    end: '2024-12-31',
  });
});

test('tilikausi voi jatkua seuraavalle kalenterivuodelle', () => {
  assert.deepEqual(buildFiscalPeriod(2024, '07-01', '06-30'), {
    key: '2024',
    label: '2024–2025',
    start: '2024-07-01',
    end: '2025-06-30',
  });
});

test('vajaa tilikausi pysyy saman vuoden sisällä', () => {
  const period = buildFiscalPeriod(2024, '02-01', '11-30');
  assert.equal(period.start, '2024-02-01');
  assert.equal(period.end, '2024-11-30');
  assert.equal(period.label, '2024');
});

test('viallinen tilikauden määritys putoaa takaisin kalenterivuoteen', () => {
  assert.equal(normalizeMonthDay(undefined, '01-01'), '01-01');
  assert.equal(normalizeMonthDay('7-1', '01-01'), '01-01');
  assert.equal(normalizeMonthDay('07-01', '01-01'), '07-01');
  assert.equal(buildFiscalPeriod(2024, 'roska', '').end, '2024-12-31');
});

test('päivämäärä osuu oikealle tilikaudelle', () => {
  assert.equal(fiscalYearOf('2024-03-05', '01-01', '12-31'), 2024);
  assert.equal(fiscalYearOf('2024-06-30', '07-01', '06-30'), 2023);
  assert.equal(fiscalYearOf('2024-07-01', '07-01', '06-30'), 2024);
  assert.equal(fiscalYearOf('2025-01-15', '07-01', '06-30'), 2024);
});

test('kelvoton päivämäärä ei kuulu millekään tilikaudelle', () => {
  assert.equal(fiscalYearOf('', '01-01', '12-31'), null);
  assert.equal(fiscalYearOf('2024-3-5', '01-01', '12-31'), null);
});

test('tilikauden päätepäivät kuuluvat kaudelle', () => {
  const period = buildFiscalPeriod(2024, '01-01', '12-31');
  assert.equal(isWithinPeriod('2024-01-01', period), true);
  assert.equal(isWithinPeriod('2024-12-31', period), true);
  assert.equal(isWithinPeriod('2023-12-31', period), false);
  assert.equal(isWithinPeriod('2025-01-01', period), false);
});

test('tilikaudet listataan uusin ensin ja kuluva kausi on aina mukana', () => {
  const today = new Date(2026, 8, 19);
  assert.deepEqual(
    listFiscalPeriods(['2024-05-01', '2023-11-02', '2024-01-01'], '01-01', '12-31', today).map((p) => p.key),
    ['2026', '2024', '2023']
  );
  assert.deepEqual(
    listFiscalPeriods([], '01-01', '12-31', today).map((p) => p.key),
    ['2026']
  );
  assert.deepEqual(
    listFiscalPeriods(['2024-06-30', '2024-07-01'], '07-01', '06-30', today).map((p) => p.label),
    ['2026–2027', '2024–2025', '2023–2024']
  );
});
