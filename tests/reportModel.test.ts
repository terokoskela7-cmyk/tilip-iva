import test from 'node:test';
import assert from 'node:assert/strict';
import type { Account, Entry, EntryLine } from '@/types';
import { buildFiscalPeriod } from '@/lib/fiscalYear';
import { buildReport } from '@/lib/reportModel';

const account = (id: string, number: string, type: Account['type'], name: string): Account => ({
  id,
  number,
  name,
  type,
  vatRate: 0,
});

const pankki = account('pankki', '1940', 'asset', 'Pankkisaamiset');
const alvSaatava = account('alvsaatava', '29392', 'asset', 'ALV-saatava');
const oma = account('oma', '2000', 'equity', 'Osakepääoma');
const laina = account('laina', '2800', 'liability', 'Lainat');
const alvVelka = account('alvvelka', '29391', 'liability', 'ALV-velka');
const myynti = account('myynti', '3000', 'revenue', 'Myyntituotot');
const vuokra = account('vuokra', '4200', 'expense', 'Vuokrakulut');
const accounts = [pankki, alvSaatava, oma, laina, alvVelka, myynti, vuokra];

let lineId = 0;
const line = (acc: Account, debit: number, credit: number): EntryLine => ({
  id: `line-${++lineId}`,
  accountId: acc.id,
  accountNumber: acc.number,
  accountName: acc.name,
  debit,
  credit,
  description: acc.name,
});

let entryId = 0;
const entry = (date: string, lines: EntryLine[]): Entry => ({
  id: `entry-${++entryId}`,
  date,
  number: String(entryId),
  description: 'tosite',
  lines,
  status: 'confirmed',
  attachments: [],
  createdAt: '',
  updatedAt: '',
});

// 2023: osakepääoma 2500, myynti 1000 + alv 255, vuokra 400
// 2024: myynti 2000 + alv 510, vuokra 900 + ostojen alv 100
// 2025: lainanosto 5000
const entries = [
  entry('2023-01-10', [line(pankki, 2500, 0), line(oma, 0, 2500)]),
  entry('2023-05-05', [line(pankki, 1255, 0), line(myynti, 0, 1000), line(alvVelka, 0, 255)]),
  entry('2023-06-01', [line(vuokra, 400, 0), line(pankki, 0, 400)]),
  entry('2024-03-01', [line(pankki, 2510, 0), line(myynti, 0, 2000), line(alvVelka, 0, 510)]),
  entry('2024-04-01', [line(vuokra, 900, 0), line(alvSaatava, 100, 0), line(pankki, 0, 1000)]),
  entry('2025-02-01', [line(pankki, 5000, 0), line(laina, 0, 5000)]),
];

const period2023 = buildFiscalPeriod(2023, '01-01', '12-31');
const period2024 = buildFiscalPeriod(2024, '01-01', '12-31');
const period2025 = buildFiscalPeriod(2025, '01-01', '12-31');

test('tuloslaskelma rajautuu valittuun tilikauteen', () => {
  const r2023 = buildReport(entries, accounts, period2023);
  const r2024 = buildReport(entries, accounts, period2024);

  assert.equal(r2023.totalRevenue, 100000);
  assert.equal(r2023.totalExpenses, 40000);
  assert.equal(r2023.periodResult, 60000);

  assert.equal(r2024.totalRevenue, 200000);
  assert.equal(r2024.totalExpenses, 90000);
  assert.equal(r2024.periodResult, 110000);
  assert.equal(r2024.entryCount, 2);
});

test('tase on kumulatiivinen tilikauden loppuun asti', () => {
  // 2024 lopussa: pankki 2500 + 1255 - 400 + 2510 - 1000 = 4865, alv-saatava 100
  assert.equal(buildReport(entries, accounts, period2024).totalAssets, 496500);
  // 2025 lopussa mukaan tulee 5000 euron lainanosto
  assert.equal(buildReport(entries, accounts, period2025).totalAssets, 996500);
});

test('myöhemmän tilikauden tositteet eivät vuoda aiemman taseeseen', () => {
  const r2023 = buildReport(entries, accounts, period2023);
  assert.equal(r2023.liabilityRows.some((row) => row.number === '2800'), false);
});

test('tase täsmää jokaisella tilikaudella kun tulos on mukana', () => {
  for (const period of [period2023, period2024, period2025]) {
    const report = buildReport(entries, accounts, period);
    assert.equal(report.balanced, true, `tilikausi ${period.label}`);
    assert.equal(
      report.totalLiabilitiesAndEquity,
      report.totalLiabilities + report.totalEquity + report.earlierResult + report.periodResult
    );
  }
});

test('pelkät pääomatilit eivät riitä tasapainoon', () => {
  const report = buildReport(entries, accounts, period2024);
  assert.notEqual(report.totalAssets, report.totalLiabilities + report.totalEquity);
});

test('edellisten tilikausien tulos erotellaan tilikauden tuloksesta', () => {
  assert.equal(buildReport(entries, accounts, period2023).earlierResult, 0);
  assert.equal(buildReport(entries, accounts, period2024).earlierResult, 60000);
  assert.equal(buildReport(entries, accounts, period2025).earlierResult, 170000);
});

test('negatiiviset saldot näkyvät raporteilla sellaisinaan', () => {
  const hyvitys = [...entries, entry('2024-12-20', [line(myynti, 500, 0), line(pankki, 0, 500)])];
  assert.equal(buildReport(hyvitys, accounts, period2024).totalRevenue, 150000);

  const tappio = [entry('2024-02-01', [line(vuokra, 300, 0), line(pankki, 0, 300)])];
  const report = buildReport(tappio, accounts, period2024);
  assert.equal(report.periodResult, -30000);
  assert.equal(report.assetRows.find((row) => row.number === '1940')?.cents, -30000);
  assert.equal(report.balanced, true);
});

test('ALV-erittely rajautuu tilikauteen', () => {
  const r2023 = buildReport(entries, accounts, period2023);
  const r2024 = buildReport(entries, accounts, period2024);

  assert.equal(r2023.vatPayable, 25500);
  assert.equal(r2023.vatDeductible, 0);
  assert.equal(r2024.vatPayable, 51000);
  assert.equal(r2024.vatDeductible, 10000);
  assert.equal(r2024.vatLines.length, 2);
});

test('kuukausigraafi kattaa vain tilikauden kuukaudet', () => {
  const report = buildReport(entries, accounts, period2024);
  assert.deepEqual(report.monthlyData.map((m) => m.month), ['03/2024', '04/2024']);
  assert.equal(report.monthlyData[0].revenue, 2000);
  assert.equal(report.monthlyData[1].profit, -900);
});

test('vuodenvaihteen yli jatkuva tilikausi poimii oikeat tositteet', () => {
  // 1.7.2023 - 30.6.2024 sisältää 3/2024 myynnin ja 4/2024 vuokran,
  // mutta ei 5/2023 myyntiä.
  const report = buildReport(entries, accounts, buildFiscalPeriod(2023, '07-01', '06-30'));
  assert.equal(report.totalRevenue, 200000);
  assert.equal(report.totalExpenses, 90000);
  assert.equal(report.vatPayable, 51000);
  assert.equal(report.balanced, true);
});
