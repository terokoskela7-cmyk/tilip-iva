import type { EntryLine } from '@/types';
import { fromCents, toCents } from '@/lib/ledgerMath';

/**
 * Tositteen tarkistus ennen tallennusta.
 *
 * Tallennukseen paatyvat vain rivit joilla on tili, joten tasmaytys on tehtava
 * tasmalleen samoista riveista. Muuten tosite, jonka summat nayttavat
 * tasmaavan lomakkeella, tallentuu epatasapainoisena.
 */

export interface EntryValidation {
  /** Rivit jotka tallennetaan. */
  postedLines: EntryLine[];
  totalDebitCents: number;
  totalCreditCents: number;
  /** Tosite on tasan ja siina on summia. */
  balanced: boolean;
  errors: string[];
}

export function validateEntryDraft(
  lines: EntryLine[],
  date: string,
  number: string
): EntryValidation {
  const postedLines = lines.filter((l) => l.accountId);
  const totalDebitCents = postedLines.reduce((sum, l) => sum + toCents(l.debit), 0);
  const totalCreditCents = postedLines.reduce((sum, l) => sum + toCents(l.credit), 0);
  const balanced = totalDebitCents === totalCreditCents && totalDebitCents !== 0;

  const errors: string[] = [];

  if (!date) errors.push('Päivämäärä puuttuu');
  if (!number.trim()) errors.push('Tositenumero puuttuu');

  // Rivit joilla on summa mutta ei tiliä pudotettaisiin tallennuksessa.
  const orphanAmounts = lines.filter(
    (l) => !l.accountId && (toCents(l.debit) !== 0 || toCents(l.credit) !== 0)
  ).length;
  if (orphanAmounts > 0) {
    errors.push(
      orphanAmounts === 1
        ? 'Yhdellä rivillä on summa mutta ei tiliä. Valitse tili tai tyhjennä summa.'
        : `${orphanAmounts} rivillä on summa mutta ei tiliä. Valitse tili tai tyhjennä summa.`
    );
  }

  if (lines.some((l) => toCents(l.debit) < 0 || toCents(l.credit) < 0)) {
    errors.push('Debet ja kredit eivät voi olla negatiivisia. Kirjaa summa vastakkaiselle puolelle.');
  }

  if (postedLines.some((l) => toCents(l.debit) !== 0 && toCents(l.credit) !== 0)) {
    errors.push('Samalla rivillä ei voi olla sekä debet- että kredit-summaa.');
  }

  if (postedLines.length < 2) {
    errors.push('Tositteella on oltava vähintään kaksi riviä, joilla on tili.');
  }

  if (totalDebitCents === 0 && totalCreditCents === 0) {
    errors.push('Tositteella ei ole summia.');
  } else if (totalDebitCents !== totalCreditCents) {
    const diff = fromCents(Math.abs(totalDebitCents - totalCreditCents));
    errors.push(
      `Debet (${fromCents(totalDebitCents).toFixed(2)} €) ja kredit (${fromCents(totalCreditCents).toFixed(2)} €) ` +
        `eivät täsmää. Erotus ${diff.toFixed(2)} €.`
    );
  }

  return { postedLines, totalDebitCents, totalCreditCents, balanced, errors };
}
