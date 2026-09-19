import type { Account, Entry } from '@/types';

/**
 * Kirjanpidon perussummat.
 *
 * Kaikki yhteenlasku tehdaan senteissa kokonaislukuina, koska liukuluvuilla
 * laskettaessa esimerkiksi 0,1 + 0,2 ei ole tasmalleen 0,3 ja tasmaytys
 * epaonnistuisi sattumanvaraisesti.
 */

export function toCents(value: number | undefined): number {
  return Math.round((Number(value) || 0) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** Vastaavaa- ja kulutilien saldo kasvaa debet-puolelta, muiden kredit-puolelta. */
export function isDebitNormal(type: Account['type']): boolean {
  return type === 'asset' || type === 'expense';
}

/** Tuloslaskelman tuottotilit. Oman talouden tilikartta kayttaa tyyppia 'income'. */
export function isRevenue(type: Account['type']): boolean {
  return type === 'revenue' || type === 'income';
}

/**
 * Tositerivi kohdistuu tilille ensisijaisesti tilitunnisteen perusteella.
 * Vanhoissa tositteissa accountId voi puuttua, jolloin kaytetaan tilinumeroa.
 */
function lineMatchesAccount(
  line: { accountId: string; accountNumber: string },
  account: Account
): boolean {
  return line.accountId ? line.accountId === account.id : line.accountNumber === account.number;
}

/** Tilin saldo senteissa tilin normaalin puolen mukaisesti. Voi olla negatiivinen. */
export function accountBalanceCents(entries: Entry[], account: Account): number {
  const debitNormal = isDebitNormal(account.type);
  let cents = 0;
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (!lineMatchesAccount(line, account)) continue;
      const debit = toCents(line.debit);
      const credit = toCents(line.credit);
      cents += debitNormal ? debit - credit : credit - debit;
    }
  }
  return cents;
}

/** Tilijoukon yhteenlaskettu saldo senteissa. */
export function sumBalanceCents(entries: Entry[], accounts: Account[]): number {
  return accounts.reduce((sum, account) => sum + accountBalanceCents(entries, account), 0);
}

/** Tilikauden tulos senteissa: tuotot miinus kulut. */
export function resultCents(entries: Entry[], accounts: Account[]): number {
  const revenue = sumBalanceCents(entries, accounts.filter((a) => isRevenue(a.type)));
  const expenses = sumBalanceCents(entries, accounts.filter((a) => a.type === 'expense'));
  return revenue - expenses;
}
