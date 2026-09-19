/**
 * Tilikausien muodostaminen yrityksen tilikauden alku- ja loppupaivasta.
 *
 * Tilikausi annetaan muodossa 'MM-DD'. Tavallisin on 01-01 ... 12-31, jolloin
 * tilikausi on kalenterivuosi, mutta tilikausi voi myos alkaa kesken vuoden,
 * jolloin se jatkuu seuraavan kalenterivuoden puolelle (esim. 07-01 ... 06-30).
 */

export interface FiscalPeriod {
  /** Tilikauden alkuvuosi merkkijonona; kaytetaan valinnan tunnisteena. */
  key: string;
  /** Kayttajalle naytettava nimi, esim. "2024" tai "2024–2025". */
  label: string;
  /** Ensimmainen paiva (ISO, YYYY-MM-DD), mukaan luettuna. */
  start: string;
  /** Viimeinen paiva (ISO, YYYY-MM-DD), mukaan luettuna. */
  end: string;
}

export const DEFAULT_FISCAL_START = '01-01';
export const DEFAULT_FISCAL_END = '12-31';

const MONTH_DAY = /^\d{2}-\d{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** Palauttaa kelvollisen 'MM-DD'-arvon tai oletuksen, jos syote on puutteellinen. */
export function normalizeMonthDay(value: string | undefined | null, fallback: string): string {
  return value && MONTH_DAY.test(value) ? value : fallback;
}

/** Tilikausi jatkuu seuraavalle kalenterivuodelle, jos loppupaiva on ennen alkupaivaa. */
function spansYearBoundary(fiscalStart: string, fiscalEnd: string): boolean {
  return fiscalEnd < fiscalStart;
}

/** Rakentaa tilikauden, joka alkaa annettuna kalenterivuonna. */
export function buildFiscalPeriod(
  startYear: number,
  fiscalStart: string,
  fiscalEnd: string
): FiscalPeriod {
  const start = normalizeMonthDay(fiscalStart, DEFAULT_FISCAL_START);
  const end = normalizeMonthDay(fiscalEnd, DEFAULT_FISCAL_END);
  const endYear = spansYearBoundary(start, end) ? startYear + 1 : startYear;
  return {
    key: String(startYear),
    label: endYear === startYear ? String(startYear) : `${startYear}–${endYear}`,
    start: `${startYear}-${start}`,
    end: `${endYear}-${end}`,
  };
}

/** Kertoo, mihin tilikauteen (alkuvuoden mukaan) annettu paivamaara kuuluu. */
export function fiscalYearOf(date: string, fiscalStart: string, fiscalEnd: string): number | null {
  if (!ISO_DATE.test(date)) return null;
  const start = normalizeMonthDay(fiscalStart, DEFAULT_FISCAL_START);
  const end = normalizeMonthDay(fiscalEnd, DEFAULT_FISCAL_END);
  const year = Number(date.slice(0, 4));
  if (!spansYearBoundary(start, end)) return year;
  // Vuodenvaihteen yli jatkuvassa tilikaudessa alkuvuosi ratkeaa alkupaivasta.
  return date.slice(5, 10) >= start ? year : year - 1;
}

/** Kuuluuko paivamaara tilikaudelle (paatepaivat mukaan luettuina). */
export function isWithinPeriod(date: string, period: FiscalPeriod): boolean {
  return date >= period.start && date <= period.end;
}

/**
 * Listaa tilikaudet, joilla on tapahtumia, seka kuluvan tilikauden.
 * Uusin ensin.
 */
export function listFiscalPeriods(
  dates: string[],
  fiscalStart: string,
  fiscalEnd: string,
  today: Date = new Date()
): FiscalPeriod[] {
  const years = new Set<number>();

  for (const date of dates) {
    const year = fiscalYearOf(date, fiscalStart, fiscalEnd);
    if (year !== null) years.add(year);
  }

  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const currentYear = fiscalYearOf(todayIso, fiscalStart, fiscalEnd);
  if (currentYear !== null) years.add(currentYear);

  return [...years]
    .sort((a, b) => b - a)
    .map((year) => buildFiscalPeriod(year, fiscalStart, fiscalEnd));
}
