import type { Account, Entry } from '@/types';
import type { FiscalPeriod } from '@/lib/fiscalYear';
import { isWithinPeriod } from '@/lib/fiscalYear';
import { accountBalanceCents, fromCents, isRevenue, sumBalanceCents, toCents } from '@/lib/ledgerMath';

/**
 * Tuloslaskelman, taseen ja ALV-erittelyn laskenta yhdelle tilikaudelle.
 *
 * Erotettu nakymasta, jotta laskenta on luettavissa ja testattavissa ilman
 * Reactia. Kaikki rahamaarat palautetaan senteissa.
 */

const VAT_PAYABLE = '29391';
const VAT_DEDUCTIBLE = '29392';

export interface ReportRow {
  id: string;
  number: string;
  name: string;
  cents: number;
}

export function buildReport(entries: Entry[], accounts: Account[], period: FiscalPeriod) {
  // Tuloslaskelma kuvaa tilikauden tapahtumia, tase tilannetta tilikauden lopussa.
  const periodEntries = entries.filter((e) => isWithinPeriod(e.date, period));
  const cumulativeEntries = entries.filter((e) => e.date <= period.end);

  const rowsFor = (source: Entry[], list: Account[]): ReportRow[] =>
    list
      .map((a) => ({ id: a.id, number: a.number, name: a.name, cents: accountBalanceCents(source, a) }))
      .filter((r) => r.cents !== 0)
      .sort((a, b) => a.number.localeCompare(b.number));

  const revenueAccounts = accounts.filter((a) => isRevenue(a.type));
  const expenseAccounts = accounts.filter((a) => a.type === 'expense');
  const assetAccounts = accounts.filter((a) => a.type === 'asset');
  const liabilityAccounts = accounts.filter((a) => a.type === 'liability');
  const equityAccounts = accounts.filter((a) => a.type === 'equity');

  // Tuloslaskelma. Negatiivisia saldoja ei piiloteta: hyvityslasku tai
  // virhekirjaus kuuluu nakya juuri silla rivilla jolla se on.
  const revenueRows = rowsFor(periodEntries, revenueAccounts);
  const expenseRows = rowsFor(periodEntries, expenseAccounts);
  const totalRevenue = sumBalanceCents(periodEntries, revenueAccounts);
  const totalExpenses = sumBalanceCents(periodEntries, expenseAccounts);
  const periodResult = totalRevenue - totalExpenses;

  // Tase.
  const assetRows = rowsFor(cumulativeEntries, assetAccounts);
  const liabilityRows = rowsFor(cumulativeEntries, liabilityAccounts);
  const equityRows = rowsFor(cumulativeEntries, equityAccounts);
  const totalAssets = sumBalanceCents(cumulativeEntries, assetAccounts);
  const totalLiabilities = sumBalanceCents(cumulativeEntries, liabilityAccounts);
  const totalEquity = sumBalanceCents(cumulativeEntries, equityAccounts);

  // Tulostileja ei suljeta omaan paaomaan kirjausten yhteydessa, joten tase
  // tasmaa vasta kun kertynyt tulos lasketaan vastattaviin mukaan.
  const cumulativeResult =
    sumBalanceCents(cumulativeEntries, revenueAccounts) -
    sumBalanceCents(cumulativeEntries, expenseAccounts);
  const earlierResult = cumulativeResult - periodResult;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity + cumulativeResult;
  const balanced = totalAssets === totalLiabilitiesAndEquity;

  // ALV kuluvalta tilikaudelta.
  const vatLines = periodEntries
    .flatMap((e) => e.lines.map((l) => ({ line: l, date: e.date })))
    .filter((x) => x.line.accountNumber === VAT_PAYABLE || x.line.accountNumber === VAT_DEDUCTIBLE)
    .map((x) => {
      const payable = x.line.accountNumber === VAT_PAYABLE;
      const cents = payable
        ? toCents(x.line.credit) - toCents(x.line.debit)
        : toCents(x.line.debit) - toCents(x.line.credit);
      return { id: x.line.id, date: x.date, payable, cents, label: x.line.description || x.line.accountName };
    });
  const vatPayable = vatLines.filter((l) => l.payable).reduce((s, l) => s + l.cents, 0);
  const vatDeductible = vatLines.filter((l) => !l.payable).reduce((s, l) => s + l.cents, 0);

  // Kuukausikehitys tilikauden sisalla.
  const months: Record<string, { revenue: number; expenses: number }> = {};
  for (const entry of periodEntries) {
    const month = entry.date.substring(0, 7);
    if (!months[month]) months[month] = { revenue: 0, expenses: 0 };
    for (const line of entry.lines) {
      const account = accounts.find((a) =>
        line.accountId ? a.id === line.accountId : a.number === line.accountNumber
      );
      if (!account) continue;
      const debit = toCents(line.debit);
      const credit = toCents(line.credit);
      if (isRevenue(account.type)) months[month].revenue += credit - debit;
      else if (account.type === 'expense') months[month].expenses += debit - credit;
    }
  }
  const monthlyData = Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: month.substring(5) + '/' + month.substring(0, 4),
      revenue: fromCents(data.revenue),
      expenses: fromCents(data.expenses),
      profit: fromCents(data.revenue - data.expenses),
    }));

  return {
    entryCount: periodEntries.length,
    revenueRows,
    expenseRows,
    totalRevenue,
    totalExpenses,
    periodResult,
    assetRows,
    liabilityRows,
    equityRows,
    totalAssets,
    totalLiabilities,
    totalEquity,
    earlierResult,
    totalLiabilitiesAndEquity,
    balanced,
    vatLines,
    vatPayable,
    vatDeductible,
    monthlyData,
  };
}
