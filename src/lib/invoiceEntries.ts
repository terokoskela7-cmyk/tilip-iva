import type { Account, EntryLine, Invoice } from '@/types';
import { toCents, fromCents, isRevenue } from '@/lib/ledgerMath';

/**
 * Myyntilaskun kirjaukset kahdenkertaisen kirjanpidon mukaisesti.
 *
 * Myynti kirjataan laskun paivamaaralla:
 *   Myyntisaamiset (debet)  /  Myyntituotot + ALV-velka (kredit)
 * ja suoritus vasta maksupaivalla:
 *   Pankkisaamiset (debet)  /  Myyntisaamiset (kredit)
 *
 * Aiemmin molemmat puolet puuttuivat: myynti kirjattiin vasta maksettaessa
 * maksupaivan paivamaaralla eika pankkitilille kirjattu mitaan, jolloin
 * myyntisaamiset jaivat auki ja myynti kohdistui vaaralle kaudelle.
 */

export const RECEIVABLE_ACCOUNT = '1910';
export const BANK_ACCOUNT = '1940';
export const VAT_PAYABLE_ACCOUNT = '29391';

export interface EntryDraft {
  date: string;
  description: string;
  lines: EntryLine[];
}

export type DraftResult = { ok: true; draft: EntryDraft } | { ok: false; error: string };

function findByNumber(accounts: Account[], number: string): Account | undefined {
  return accounts.find((a) => a.number === number);
}

/** Laskulle valittu myyntitili, tai oletuksena 3000 / ensimmainen tuottotili. */
export function resolveRevenueAccount(invoice: Invoice, accounts: Account[]): Account | undefined {
  if (invoice.revenueAccountId) {
    const chosen = accounts.find((a) => a.id === invoice.revenueAccountId);
    if (chosen) return chosen;
  }
  return findByNumber(accounts, '3000') ?? accounts.find((a) => isRevenue(a.type));
}

function makeLine(
  newId: () => string,
  account: Account,
  debitCents: number,
  creditCents: number,
  description: string
): EntryLine {
  return {
    id: newId(),
    accountId: account.id,
    accountNumber: account.number,
    accountName: account.name,
    debit: fromCents(debitCents),
    credit: fromCents(creditCents),
    description,
  };
}

function formatRate(rate: number): string {
  return String(rate).replace('.', ',');
}

/** Laskun kokonaissumma sentteina, johdettuna niin etta tosite menee aina tasan. */
function invoiceTotals(invoice: Invoice) {
  const exclCents = toCents(invoice.totalExclVat);
  const vatCents = toCents(invoice.totalVat);
  return { exclCents, vatCents, inclCents: exclCents + vatCents };
}

/**
 * ALV jaetaan verokannoittain omille riveilleen. Pyoristyksen erotus
 * kohdistetaan suurimpaan eraan, jotta rivien summa on tasan laskun ALV.
 */
function vatRows(invoice: Invoice): { rate: number | null; cents: number }[] {
  const { vatCents } = invoiceTotals(invoice);
  const byRate = new Map<number, number>();
  for (const line of invoice.lines) {
    if (!line.vatRate) continue;
    byRate.set(line.vatRate, (byRate.get(line.vatRate) ?? 0) + toCents(line.total));
  }

  const rows = [...byRate.entries()]
    .map(([rate, exclCents]) => ({ rate: rate as number | null, cents: Math.round((exclCents * rate) / 100) }))
    .filter((row) => row.cents !== 0)
    .sort((a, b) => b.cents - a.cents);

  if (rows.length === 0) {
    return vatCents === 0 ? [] : [{ rate: null, cents: vatCents }];
  }

  const sum = rows.reduce((total, row) => total + row.cents, 0);
  if (sum !== vatCents) rows[0].cents += vatCents - sum;
  return rows.filter((row) => row.cents !== 0);
}

/** Myyntikirjaus laskun paivamaaralla. */
export function buildSalesEntryDraft(
  invoice: Invoice,
  accounts: Account[],
  newId: () => string
): DraftResult {
  const receivable = findByNumber(accounts, RECEIVABLE_ACCOUNT);
  if (!receivable) {
    return { ok: false, error: `Tilikartasta puuttuu myyntisaamisten tili ${RECEIVABLE_ACCOUNT}.` };
  }
  const revenue = resolveRevenueAccount(invoice, accounts);
  if (!revenue) {
    return { ok: false, error: 'Tilikartasta puuttuu myyntitili.' };
  }

  const { exclCents, inclCents } = invoiceTotals(invoice);
  const vat = vatRows(invoice);
  const vatAccount = findByNumber(accounts, VAT_PAYABLE_ACCOUNT);
  if (vat.length > 0 && !vatAccount) {
    return { ok: false, error: `Tilikartasta puuttuu ALV-velan tili ${VAT_PAYABLE_ACCOUNT}.` };
  }

  const lines: EntryLine[] = [
    makeLine(newId, receivable, inclCents, 0, `Lasku ${invoice.number}`),
    makeLine(newId, revenue, 0, exclCents, `Myynti ${invoice.customerName}`),
  ];
  for (const row of vat) {
    lines.push(
      makeLine(newId, vatAccount as Account, 0, row.cents, row.rate === null ? 'ALV' : `ALV ${formatRate(row.rate)} %`)
    );
  }

  return {
    ok: true,
    draft: {
      date: invoice.date,
      description: `Lasku ${invoice.number} – ${invoice.customerName}`,
      lines,
    },
  };
}

/** Suorituskirjaus maksupaivalla. */
export function buildPaymentEntryDraft(
  invoice: Invoice,
  accounts: Account[],
  paymentDate: string,
  newId: () => string
): DraftResult {
  const receivable = findByNumber(accounts, RECEIVABLE_ACCOUNT);
  if (!receivable) {
    return { ok: false, error: `Tilikartasta puuttuu myyntisaamisten tili ${RECEIVABLE_ACCOUNT}.` };
  }
  const bank = findByNumber(accounts, BANK_ACCOUNT);
  if (!bank) {
    return { ok: false, error: `Tilikartasta puuttuu pankkitili ${BANK_ACCOUNT}.` };
  }

  const { inclCents } = invoiceTotals(invoice);
  return {
    ok: true,
    draft: {
      date: paymentDate,
      description: `Laskun ${invoice.number} suoritus – ${invoice.customerName}`,
      lines: [
        makeLine(newId, bank, inclCents, 0, `Lasku ${invoice.number} maksu`),
        makeLine(newId, receivable, 0, inclCents, `Lasku ${invoice.number} suoritus`),
      ],
    },
  };
}
