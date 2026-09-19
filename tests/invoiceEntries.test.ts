import test from 'node:test';
import assert from 'node:assert/strict';
import type { Account, Invoice, InvoiceLine } from '@/types';
import { buildPaymentEntryDraft, buildSalesEntryDraft } from '@/lib/invoiceEntries';
import { validateEntryDraft } from '@/lib/entryValidation';
import { accountBalanceCents } from '@/lib/ledgerMath';
import type { Entry } from '@/types';

const account = (id: string, number: string, type: Account['type'], name: string): Account => ({
  id,
  number,
  name,
  type,
  vatRate: 0,
});

const myyntisaamiset = account('ar', '1910', 'asset', 'Myyntisaamiset');
const pankki = account('bank', '1940', 'asset', 'Pankkisaamiset');
const alvVelka = account('vat', '29391', 'liability', 'ALV-velka');
const myynti = account('rev', '3000', 'revenue', 'Myyntituotot');
const palvelut = account('rev2', '3200', 'revenue', 'Palvelumyynti');
const accounts = [myyntisaamiset, pankki, alvVelka, myynti, palvelut];

let counter = 0;
const newId = () => `id-${++counter}`;

const invoiceLine = (total: number, vatRate: number): InvoiceLine => ({
  id: `il-${++counter}`,
  description: 'Työ',
  quantity: 1,
  unit: 'kpl',
  unitPrice: total,
  vatRate,
  total,
});

function invoice(lines: InvoiceLine[], overrides: Partial<Invoice> = {}): Invoice {
  const totalExclVat = lines.reduce((sum, l) => sum + l.total, 0);
  const totalVat = lines.reduce((sum, l) => sum + (l.total * l.vatRate) / 100, 0);
  return {
    id: 'inv',
    number: '1',
    date: '2024-03-01',
    dueDate: '2024-03-15',
    customerId: 'c',
    customerName: 'Asiakas Oy',
    customerAddress: '',
    customerPostalCode: '',
    customerCity: '',
    lines,
    totalExclVat,
    totalVat,
    totalInclVat: totalExclVat + totalVat,
    status: 'draft',
    createdAt: '',
    ...overrides,
  };
}

const asEntry = (date: string, lines: Entry['lines']): Entry => ({
  id: 'e',
  date,
  number: '1',
  description: '',
  lines,
  status: 'confirmed',
  attachments: [],
  createdAt: '',
  updatedAt: '',
});

test('myyntikirjaus tehdään laskun päivämäärällä, ei maksupäivällä', () => {
  const inv = invoice([invoiceLine(1000, 25.5)]);
  const result = buildSalesEntryDraft(inv, accounts, newId);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.draft.date, '2024-03-01');
});

test('myyntikirjaus menee tasan ja oikeille tileille', () => {
  const inv = invoice([invoiceLine(1000, 25.5)]);
  const result = buildSalesEntryDraft(inv, accounts, newId);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const check = validateEntryDraft(result.draft.lines, result.draft.date, '1');
  assert.deepEqual(check.errors, []);
  assert.equal(check.balanced, true);
  assert.equal(check.totalDebitCents, 125500);

  const debit = result.draft.lines.filter((l) => l.debit > 0);
  assert.equal(debit.length, 1);
  assert.equal(debit[0].accountNumber, '1910');
  assert.equal(result.draft.lines.find((l) => l.accountNumber === '3000')?.credit, 1000);
  assert.equal(result.draft.lines.find((l) => l.accountNumber === '29391')?.credit, 255);
});

test('ALV eritellään verokannoittain', () => {
  const inv = invoice([invoiceLine(1000, 25.5), invoiceLine(500, 14), invoiceLine(200, 0)]);
  const result = buildSalesEntryDraft(inv, accounts, newId);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const vatLines = result.draft.lines.filter((l) => l.accountNumber === '29391');
  assert.equal(vatLines.length, 2);
  assert.deepEqual(
    vatLines.map((l) => l.description).sort(),
    ['ALV 14 %', 'ALV 25,5 %']
  );
  assert.equal(validateEntryDraft(result.draft.lines, result.draft.date, '1').balanced, true);
});

test('pyöristys ei riko täsmäystä useammalla verokannalla', () => {
  // 33,33 * 25,5 % = 8,49915 ja 16,67 * 14 % = 2,3338 -> molemmat pyöristyvät.
  const inv = invoice([invoiceLine(33.33, 25.5), invoiceLine(16.67, 14)]);
  const result = buildSalesEntryDraft(inv, accounts, newId);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const check = validateEntryDraft(result.draft.lines, result.draft.date, '1');
  assert.equal(check.balanced, true);
  assert.equal(check.totalDebitCents, check.totalCreditCents);
});

test('veroton lasku ei tarvitse ALV-tiliä', () => {
  const inv = invoice([invoiceLine(500, 0)]);
  const ilmanAlvTilia = accounts.filter((a) => a.number !== '29391');
  const result = buildSalesEntryDraft(inv, ilmanAlvTilia, newId);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.draft.lines.length, 2);
});

test('puuttuva tili kerrotaan käyttäjälle eikä kirjausta tehdä', () => {
  const inv = invoice([invoiceLine(1000, 25.5)]);

  const ilmanAlv = buildSalesEntryDraft(inv, accounts.filter((a) => a.number !== '29391'), newId);
  assert.equal(ilmanAlv.ok, false);
  if (!ilmanAlv.ok) assert.match(ilmanAlv.error, /29391/);

  const ilmanSaamisia = buildSalesEntryDraft(inv, accounts.filter((a) => a.number !== '1910'), newId);
  assert.equal(ilmanSaamisia.ok, false);

  const ilmanPankkia = buildPaymentEntryDraft(inv, accounts.filter((a) => a.number !== '1940'), '2024-04-01', newId);
  assert.equal(ilmanPankkia.ok, false);
  if (!ilmanPankkia.ok) assert.match(ilmanPankkia.error, /1940/);
});

test('laskulle valittu myyntitili voittaa oletuksen', () => {
  const inv = invoice([invoiceLine(100, 0)], { revenueAccountId: 'rev2' });
  const result = buildSalesEntryDraft(inv, accounts, newId);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.draft.lines.find((l) => l.credit > 0)?.accountNumber, '3200');
});

test('suorituskirjaus tehdään maksupäivällä pankkitilille', () => {
  const inv = invoice([invoiceLine(1000, 25.5)]);
  const result = buildPaymentEntryDraft(inv, accounts, '2024-04-15', newId);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.draft.date, '2024-04-15');
  assert.equal(result.draft.lines.find((l) => l.debit > 0)?.accountNumber, '1940');
  assert.equal(result.draft.lines.find((l) => l.credit > 0)?.accountNumber, '1910');
  assert.equal(validateEntryDraft(result.draft.lines, result.draft.date, '1').balanced, true);
});

test('myynti ja suoritus yhdessä nollaavat myyntisaamiset', () => {
  const inv = invoice([invoiceLine(1000, 25.5)]);
  const sales = buildSalesEntryDraft(inv, accounts, newId);
  const payment = buildPaymentEntryDraft(inv, accounts, '2024-04-15', newId);
  assert.equal(sales.ok && payment.ok, true);
  if (!sales.ok || !payment.ok) return;

  const entries = [
    asEntry(sales.draft.date, sales.draft.lines),
    asEntry(payment.draft.date, payment.draft.lines),
  ];
  assert.equal(accountBalanceCents(entries, myyntisaamiset), 0);
  assert.equal(accountBalanceCents(entries, pankki), 125500);
  assert.equal(accountBalanceCents(entries, myynti), 100000);
  assert.equal(accountBalanceCents(entries, alvVelka), 25500);
});
