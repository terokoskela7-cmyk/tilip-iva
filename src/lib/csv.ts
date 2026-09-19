/**
 * CSV-jasennyksen perusosat tiliotteiden lukemiseen.
 *
 * Aiemmin rivit pilkottiin suoraan split(',')-kutsulla, jolloin lainausmerkkien
 * sisalla oleva pilkku (tavallista saajan nimessa: "Yritys Oy, Helsinki")
 * siirsi kaikki sarakkeet. Summien jasennys puolestaan poisti kaikki pisteet,
 * jolloin muoto "1,234.56" muuttui arvoksi 1,23456.
 */

/** Pilkkoo yhden CSV-rivin kentiksi. Lainausmerkeissa kaksi peraikkaista "" on yksi ". */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      fields.push(field.trim());
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field.trim());
  return fields;
}

/** Paattelee erottimen sen mukaan, mika tuottaa eniten sarakkeita ensimmaisella rivilla. */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';
  const candidates = [';', ',', '\t'];
  let best = ';';
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = splitCsvLine(firstLine, candidate).length;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

// \s kattaa ECMAScriptissa myos sitomattoman valilyonnin (U+00A0).
const CLEANUP = new RegExp('[\\s\\u20ac]|EUR', 'gi');

/**
 * Jasentaa rahamaaran. Tukee suomalaista muotoa "1 234,56", eurooppalaista
 * "1.234,56" ja amerikkalaista "1,234.56".
 *
 * Kun kumpikin erotin esiintyy, viimeisin on desimaalierotin. Yksinaisen
 * pisteen kohdalla kolme desimaalia tulkitaan tuhaterottimeksi ("1.234" = 1234),
 * koska kolmen desimaalin rahamaara ei ole tavallinen.
 */
export function parseDecimal(value: string | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  let text = String(value).replace(CLEANUP, '');
  if (!text) return null;

  // Suluissa oleva luku on negatiivinen: (1 234,56)
  let negative = false;
  if (text.startsWith('(') && text.endsWith(')')) {
    negative = true;
    text = text.slice(1, -1);
  }
  if (text.startsWith('+')) text = text.slice(1);
  if (text.startsWith('-')) {
    negative = !negative;
    text = text.slice(1);
  }
  if (!/^[\d.,]*\d[\d.,]*$/.test(text)) return null;

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  let normalized: string;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = text.split(thousandsSeparator).join('').replace(decimalSeparator, '.');
  } else if (lastComma >= 0) {
    // Suomalaisissa tiliotteissa pilkku on desimaalierotin. Useampi pilkku
    // voi olla vain tuhaterotin.
    normalized = text.split(',').length > 2 ? text.split(',').join('') : text.replace(',', '.');
  } else if (lastDot >= 0) {
    const dots = text.split('.').length - 1;
    const looksLikeThousands = dots > 1 || /\.\d{3}$/.test(text);
    normalized = looksLikeThousands ? text.split('.').join('') : text;
  } else {
    normalized = text;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Kaksinumeroinen vuosiluku: 00-49 on 2000-luku, 50-99 on 1900-luku. */
function expandYear(year: number): number {
  if (year >= 100) return year;
  return year >= 50 ? 1900 + year : 2000 + year;
}

/**
 * Jasentaa paivamaaran ISO-muotoon. Tukee muotoja YYYY-MM-DD, DD.MM.YYYY,
 * DD.MM.YY ja DD/MM/YYYY. Kauttaviivamuodossa oletus on eurooppalainen
 * paiva/kuukausi, mutta jos toinen osa on yli 12, luetaan se kuukaudeksi.
 */
export function parseIsoDate(value: string | undefined | null): string | null {
  if (!value) return null;
  const text = String(value).trim().replace(/^"|"$/g, '');
  if (!text) return null;

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return toIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const dotted = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
  if (dotted) return toIso(expandYear(Number(dotted[3])), Number(dotted[2]), Number(dotted[1]));

  const slashed = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (slashed) {
    const first = Number(slashed[1]);
    const second = Number(slashed[2]);
    const year = expandYear(Number(slashed[3]));
    // Vain toinen osa voi olla yli 12, jolloin se on paiva ja ensimmainen kuukausi.
    if (second > 12 && first <= 12) return toIso(year, first, second);
    return toIso(year, second, first);
  }

  return null;
}
