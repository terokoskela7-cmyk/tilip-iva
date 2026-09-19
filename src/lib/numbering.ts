/**
 * Juoksevat tosite- ja laskunumerot.
 *
 * Kirjanpitolaki edellyttaa tositteilta juoksevaa numerointia ja arvonlisa-
 * verolain 209 e § laskulta juoksevaa tunnistetta. Numero varataan tallennuksen
 * yhteydessa Firestoren laskurista (ks. lib/firestore), ja nama apurit
 * paattelevat laskurin lahtoarvon jo olemassa olevasta aineistosta.
 */

const DIGITS = /^\d+$/;

/** Suurin kaytossa oleva juokseva numero. Muut kuin numeeriset tunnisteet ohitetaan. */
export function highestNumber(values: (string | undefined)[]): number {
  let max = 0;
  for (const value of values) {
    const trimmed = (value ?? '').trim();
    if (!DIGITS.test(trimmed)) continue;
    const parsed = Number(trimmed);
    if (Number.isSafeInteger(parsed) && parsed > max) max = parsed;
  }
  return max;
}

/** Seuraava vapaa numero naytettavaksi lomakkeella ennen tallennusta. */
export function nextNumberPreview(values: (string | undefined)[]): string {
  return String(highestNumber(values) + 1);
}

/**
 * Jarjestaa tunnisteet numerojarjestykseen. Merkkijonovertailussa "10" tulisi
 * ennen arvoa "9", joten numeeriset tunnisteet vertaillaan lukuina ja muut
 * jaavat loppuun aakkosjarjestykseen.
 */
export function compareNumbers(a: string | undefined, b: string | undefined): number {
  const left = (a ?? '').trim();
  const right = (b ?? '').trim();
  const leftNumeric = DIGITS.test(left);
  const rightNumeric = DIGITS.test(right);
  if (leftNumeric && rightNumeric) return Number(left) - Number(right);
  if (leftNumeric) return -1;
  if (rightNumeric) return 1;
  return left.localeCompare(right);
}
