import type { BankCSVFormat } from '@/types';
import { detectDelimiter, parseDecimal, parseIsoDate, splitCsvLine } from '@/lib/csv';

/**
 * Tiliotteiden CSV-tuonti.
 *
 * Otsikkorivia ei enaa pudoteta sokeasti, vaan ensimmainen rivi ohitetaan
 * ainoastaan jos sen paivamaarasarake ei jasenny paivamaaraksi. Nain
 * otsikoton tiedosto ei mene hukkaan eika otsikkorivi paady tapahtumaksi.
 */

export interface ParsedBankRow {
  date: string;
  amount: number;
  description: string;
  counterparty: string;
  reference: string;
}

interface FormatSpec {
  /** Kiintea erotin, tai undefined jos se paatellaan sisallosta. */
  delimiter?: string;
  date: number;
  amount: number;
  /** Sarakkeet jotka yhdistetaan kuvaukseksi. */
  description: number[];
  counterparty: number;
  reference: number;
}

const FORMATS: Record<BankCSVFormat, FormatSpec> = {
  // Kirjauspäivä;Määrä;Laji;Selitys;Saaja/Maksaja;Viite;Viesti
  nordea: { delimiter: ';', date: 0, amount: 1, description: [3, 6], counterparty: 4, reference: 5 },
  // Kirjauspäivä,Arvopäivä,Määrä,Tapahtumalaji,Selitys,Saaja/Maksaja,Viite
  op: { delimiter: ',', date: 0, amount: 2, description: [3, 4], counterparty: 5, reference: 6 },
  // Date,Amount,Currency,Description,Counterparty,Reference
  danske: { delimiter: ',', date: 0, amount: 1, description: [3], counterparty: 4, reference: 5 },
  // Transaktionsdatum;Belopp;Valuta;Text;Mottagare;Referens
  handelsbanken: { delimiter: ';', date: 0, amount: 1, description: [3], counterparty: 4, reference: 5 },
  // Date,Amount,Description,Reference,Counterparty
  generic: { date: 0, amount: 1, description: [2], reference: 3, counterparty: 4 },
};

const at = (cols: string[], index: number): string => (index >= 0 ? cols[index] ?? '' : '');

export function parseBankCsv(text: string, format: BankCSVFormat): ParsedBankRow[] {
  const spec = FORMATS[format] ?? FORMATS.generic;
  const delimiter = spec.delimiter ?? detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const rows: ParsedBankRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delimiter);
    const date = parseIsoDate(at(cols, spec.date));
    // Ensimmainen rivi on otsikko vain jos se ei jasenny tapahtumaksi.
    if (!date) continue;

    const amount = parseDecimal(at(cols, spec.amount));
    if (amount === null) continue;

    const description = spec.description
      .map((index) => at(cols, index))
      .filter((value) => value.length > 0)
      .join(' ')
      .trim();

    rows.push({
      date,
      amount,
      description,
      counterparty: at(cols, spec.counterparty),
      reference: at(cols, spec.reference),
    });
  }
  return rows;
}

export interface DuplicateKeyed {
  date: string;
  amount: number;
  description: string;
  reference: string;
  counterparty: string;
}

/** Tapahtuman tunniste kaksoiskappaleiden tunnistamiseen. */
export function transactionKey(tx: DuplicateKeyed): string {
  return [
    tx.date,
    Math.round(tx.amount * 100),
    tx.description.trim().toLowerCase(),
    tx.reference.trim().toLowerCase(),
    tx.counterparty.trim().toLowerCase(),
  ].join('|');
}

/**
 * Erottaa uudet tapahtumat jo tuoduista.
 *
 * Tarkoituksella monijoukko: jos samana paivana on aidosti kaksi samanlaista
 * tapahtumaa ja niista on tuotu vasta yksi, toinen tuodaan. Nain paallekkaiset
 * tiliotejaksot voi tuoda ilman etta tapahtumat kahdentuvat tai katoavat.
 */
export function splitNewTransactions<T extends DuplicateKeyed>(
  incoming: T[],
  existing: DuplicateKeyed[]
): { fresh: T[]; duplicates: number } {
  const remaining = new Map<string, number>();
  for (const tx of existing) {
    const key = transactionKey(tx);
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }

  const fresh: T[] = [];
  let duplicates = 0;
  for (const tx of incoming) {
    const key = transactionKey(tx);
    const count = remaining.get(key) ?? 0;
    if (count > 0) {
      remaining.set(key, count - 1);
      duplicates++;
    } else {
      fresh.push(tx);
    }
  }
  return { fresh, duplicates };
}
