import test from 'node:test';
import assert from 'node:assert/strict';
import type { Account, Entry, EntryLine } from '@/types';
import { accountBalanceCents, isDebitNormal, resultCents, sumBalanceCents, toCents } from '@/lib/ledgerMath';

const account = (id: string, number: string, type: Account['type']): Account => ({
  id,
  number,
  name: number,
  type,
  vatRate: 0,
});

const pankki = account('pankki', '1940', 'asset');
const oma = account('oma', '2000', 'equity');
const velka = account('velka', '2800', 'liability');
const myynti = account('myynti', '3000', 'revenue');
const vuokra = account('vuokra', '4200', 'expense');
const kaikki = [pankki, oma, velka, myynti, vuokra];

let lineId = 0;
const line = (acc: Account, debit: number, credit: number): EntryLine => ({
  id: `line-${++lineId}`,
  accountId: acc.id,
  accountNumber: acc.number,
  accountName: acc.name,
  debit,
  credit,
  description: '',
});

const entry = (date: string, lines: EntryLine[]): Entry => ({
  id: `entry-${date}-${lines[0]?.id ?? ''}`,
  date,
  number: '1',
  description: '',
  lines,
  status: 'confirmed',
  attachments: [],
  createdAt: '',
  updatedAt: '',
});

test('summat lasketaan sentteinä, joten liukulukuvirhe ei kerry', () => {
  assert.notEqual(0.1 + 0.2, 0.3);
  const entries = [
    entry('2024-01-01', [line(pankki, 0.1, 0)]),
    entry('2024-01-02', [line(pankki, 0.2, 0)]),
  ];
  assert.equal(accountBalanceCents(entries, pankki), 30);
});

test('toCents pyöristää sentteihin ja sietää puuttuvan arvon', () => {
  assert.equal(toCents(12.345), 1235);
  assert.equal(toCents(12.344), 1234);
  assert.equal(toCents(undefined), 0);
  assert.equal(toCents(-5.5), -550);
});

test('vastaavaa ja kulut ovat debet-normaaleja, muut kredit-normaaleja', () => {
  assert.equal(isDebitNormal('asset'), true);
  assert.equal(isDebitNormal('expense'), true);
  assert.equal(isDebitNormal('liability'), false);
  assert.equal(isDebitNormal('equity'), false);
  assert.equal(isDebitNormal('revenue'), false);
});

test('tilien saldot lasketaan normaalin puolen mukaisesti', () => {
  const entries = [
    entry('2024-01-01', [line(pankki, 2500, 0), line(oma, 0, 2500)]),
    entry('2024-02-01', [line(pankki, 1000, 0), line(myynti, 0, 1000)]),
    entry('2024-03-01', [line(vuokra, 400, 0), line(pankki, 0, 400)]),
  ];
  assert.equal(accountBalanceCents(entries, pankki), 310000);
  assert.equal(accountBalanceCents(entries, myynti), 100000);
  assert.equal(accountBalanceCents(entries, vuokra), 40000);
  assert.equal(accountBalanceCents(entries, velka), 0);
  assert.equal(resultCents(entries, kaikki), 60000);
});

test('tase täsmää vasta kun tilikauden tulos lasketaan mukaan', () => {
  const entries = [
    entry('2024-01-01', [line(pankki, 2500, 0), line(oma, 0, 2500)]),
    entry('2024-02-01', [line(pankki, 1000, 0), line(myynti, 0, 1000)]),
    entry('2024-03-01', [line(vuokra, 400, 0), line(pankki, 0, 400)]),
  ];
  const vastaavaa = sumBalanceCents(entries, [pankki]);
  const vastattavaa = sumBalanceCents(entries, [oma, velka]);
  const tulos = resultCents(entries, kaikki);
  assert.notEqual(vastaavaa, vastattavaa);
  assert.equal(vastaavaa, vastattavaa + tulos);
});

test('negatiiviset saldot säilyvät', () => {
  const yliveto = [entry('2024-01-01', [line(vuokra, 500, 0), line(pankki, 0, 500)])];
  assert.equal(accountBalanceCents(yliveto, pankki), -50000);

  const hyvitys = [entry('2024-01-01', [line(myynti, 200, 0), line(pankki, 0, 200)])];
  assert.equal(accountBalanceCents(hyvitys, myynti), -20000);
});

test('vanha rivi ilman tilitunnistetta kohdistuu tilinumeron perusteella', () => {
  const vanha = [
    entry('2024-01-01', [
      {
        id: 'vanha',
        accountId: '',
        accountNumber: '1940',
        accountName: '',
        debit: 100,
        credit: 0,
        description: '',
      },
    ]),
  ];
  assert.equal(accountBalanceCents(vanha, pankki), 10000);
});
