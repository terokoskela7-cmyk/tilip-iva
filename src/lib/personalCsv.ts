import { detectDelimiter, parseDecimal, parseIsoDate, splitCsvLine } from '@/lib/csv';
import { isIncomeCategory } from '@/lib/personalCategories';

/**
 * Oman talouden CSV-tuonnin luokittelu.
 *
 * Saantojen jarjestys ratkaisee: aiemmin "yli 500 euroa on palkka" ajettiin
 * ennen avainsanoja, jolloin mika tahansa iso tapahtuma luokittui palkaksi
 * riippumatta siita mita tiliotteella luki. Nyt summa on vasta viimeinen
 * arvaus, kun mikaan muu ei osunut.
 */

export interface CsvRow {
  date: string;
  description: string;
  amount: number;
  txType?: string;
  message?: string;
  raw: string[];
}

export interface Categorization {
  category: string;
  type: 'income' | 'expense';
  confidence: 'high' | 'medium' | 'low';
  skip: boolean;
}

const KNOWN_PAYEES: Record<string, string> = {
  'elisa': 'asuminen',
  'elisa oyj': 'asuminen',
  'dna': 'asuminen',
  'telia': 'asuminen',
  'telia finland': 'asuminen',
  'fortum': 'asuminen',
  'helen': 'asuminen',
  'switch nordic green': 'asuminen',
  'vaasan sähkö': 'asuminen',
  'vaasan sähköverkko': 'asuminen',
  'vaasan sahko': 'asuminen',
  'jakobstadsnejdens telefon': 'asuminen',
  'pietarsaaren seudun puhelin': 'asuminen',
  'vuokra': 'asuminen',
  'hoitovastike': 'asuminen',
  'yhtiövastike': 'asuminen',
  'asunto-oy aarnotalo': 'asuminen',
  'aarnotalo': 'asuminen',
  'retta isännöinti': 'asuminen',
  'isännöinti': 'asuminen',
  'cityvarasto': 'asuminen',
  'eero karhumäki': 'asuminen',
  'eero karhumaki': 'asuminen',
  'mehiläinen': 'terveys',
  'terveystalo': 'terveys',
  'pihlajalinna': 'terveys',
  'apteekki': 'terveys',
  'lääkäri': 'terveys',
  'fysioterapia': 'terveys',
  'if vakuutus': 'insurance',
  'lähitapiola': 'insurance',
  'lähitapiola keskinäinen': 'insurance',
  'lähivakuutus': 'insurance',
  'pohjola': 'insurance',
  'fennia': 'insurance',
  'vr ': 'liikenne',
  ' hsl': 'liikenne',
  'hsl ': 'liikenne',
  'matkahuolto': 'liikenne',
  'k-supermarket': 'ruoka',
  's-market': 'ruoka',
  'prisma': 'ruoka',
  'lidl': 'ruoka',
  'alepa': 'ruoka',
  'sale': 'ruoka',
  'k-citymarket': 'ruoka',
  'k-market': 'ruoka',
  'halpa-halli': 'ruoka',
  'minimani': 'ruoka',
  'booking.com': 'travel',
  'airbnb': 'travel',
  'viking line': 'travel',
  'vikingline': 'travel',
  'vikingline.fi': 'travel',
  'palkka': 'palkka',
  'suomen palloliitto': 'palkka',
  'nordnet': 'sivutulo',
  's-pankki varainhoito': 'sivutulo',
  'lunastus': 'sivutulo',
  'kela ': 'sivutulo',
  'eläke': 'sivutulo',
  'bafa fit': 'hobbies',
  'fit wasa': 'hobbies',
  'vaasan erotuomarikerho': 'hobbies',
  'jyväskylän kesäyliopisto': 'koulutus',
  'ao performance': 'koulutus',
  'öhgren': 'koulutus',
  'asiantuntijat ja esihenkilöt': 'koulutus',
  'suomen valmentajat': 'koulutus',
  'helsingin kaupunki': 'bills',
  'vaasan kaupunki': 'bills',
  'klarna': 'vaatteet',
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  palkka: ['palkka', 'salary', 'palkkio', 'korvaus', 'palkkaus', 'wage', 'payroll', 'tulotili', 'tilit', 'palkkatulo', 'palkkaerä'],
  sivutulo: ['sivutulo', 'freelance', 'konsultti', 'vuokratulo', 'osinko', 'hyvitys', 'tuki', 'etu', 'asumistuki', 'työmarkkinatuki', 'opintotuki', 'eläke'],
  myynti: ['myynti', 'myy', 'myydy', 'kauppa', 'myyntituotto', 'myyty', 'myyjä', 'kauppapaikka', 'toro', 'huuto', 'fb marketplace', 'tori.fi'],
  ruoka: ['ruoka', 'prisma', 'k-market', 's-market', 'alepa', 'sale', 'lidl', 'stockmann', 'citymarket', 'kärkkäinen', 'food', 'sushi', 'pizza', 'ravintola', 'kahvila', 'kahvi', 'ruokakauppa', 'supermarket', 'market', 'ruokatori', 'hok elanto', 'siwa', 'valintatalo', 'makuuni', 'k-supermarket', 'minimani', 'mestarin herkku', 'anttila', 'foodora', 'wolt', 'kebab', 'burger', 'mcdonalds', 'hesburger', 'subway', 'domino', 'pizza-online', 'kotipizza', 'koti pizza'],
  asuminen: ['asuminen', 'vuokra', 'hoitovastike', 'vastike', 'sähkö', 'sähköverkko', 'sahkonordic green', 'switch', 'vesi', 'lämmitys', 'kiinteistö', 'asunto', 'dna', 'elisa', 'tel', 'puhelin', 'telefon', 'nett', 'kiinteistöhuolto', 'isännöinti', 'remontti', 'putki', 'sähkömies', 'taloyhtiö', 'kunnossapito', 'kotivakuutus', 'asuntolaina', 'korko', 'lyhennys', 'yhtiövastike', 'vesimaksu', 'lämmitysöljy', 'eero karhumäki', 'eero karhumaki', 'masku', 'maskun kalustetalo', 'kaluste', 'huonekalu', 'sisustus', 'öhgren', 'kiinteistö', 'huoneistossa'],
  liikenne: ['liikenne', 'bussi', 'juna', 'metro', 'taksi', 'uber', 'bolt', 'polttoaine', 'bensa', 'diesel', 'auto', 'rengas', 'huolto', 'katsastus', 'a-katsastus', 'pysäköinti', 'vr', ' hsl', 'matkakortti', 'neste', 'teboil', 'shell', 'abc', 'huoltoasema', 'moottoripyörä', 'skootteri', 'autopesu'],
  viihde: ['viihde', 'elokuva', 'konsertti', 'teatteri', 'spotify', 'netflix', 'hbo', 'disney', 'youtube', 'peli', 'ravintola', 'baari', 'pub', 'olut', 'viini', 'harrastus', 'keilaus', 'casino', 'bailut', 'yökerho', 'karaoke', 'tapahtuma', 'festivaali', 'musiikki', 'elisa viihde', 'c more'],
  terveys: ['terveys', 'apteekki', 'lääkäri', 'hammas', 'sairaala', 'kela', 'vakuutus', 'terveydenhuolto', 'fysioterapia', 'psykologi', 'optikko', 'mehiläinen', 'terveystalo', 'pihlajalinna', 'lääke', 'resepti', 'työterveys', 'sairaala', 'erikoislääkäri', 'terveyskeskus'],
  vaatteet: ['vaatteet', 'vaate', 'kenkä', 'h&m', 'zalando', 'cubus', 'dressmann', 'gina', 'tokmanni', 'asko', 'sisustus', 'muoti', 'vaatekauppa', 'urheilukauppa', 'intersport', 'xxl', 'stadium', 'halonen', 'kappahl', 'lc waikiki', 'gigantti'],
  koulutus: ['koulutus', 'koulutukseen', 'kesäyliopisto', 'kirja', 'opiskelu', 'kurssi', 'koulu', 'yliopisto', 'kirjasto', 'sanoma', 'tietokirja', 'lukio', 'ammattikoulu', 'opinto', 'luent', 'oppikirja', 'suomen kielen', 'kielikoulu', 'valmennus', 'tutkinto', 'akateeminen', 'fascia mastery', 'esihenkilö', 'valmentaja', 'fascia'],
  children: ['lapsi', 'lasten', 'päiväkoti', 'koulu', 'kerho', 'vaippa', 'lelu', 'lastenvaunut', 'vauva', 'taaper', 'kummi', 'lastenhoito', 'nuoriso', 'harrastusmaksu', 'urheilukoulu', 'muskari', 'kerhomaksu', 'kerhotoiminta'],
  travel: ['matka', 'lento', 'hotelli', 'juna', 'risteily', 'vuokra-auto', 'lomamatka', 'matkavakuutus', 'bussi', 'rautatie', 'ryanair', 'finnair', 'norwegian', 'booking', 'airbnb', 'hostelli', 'turisti', 'matkalippu', 'viking line', 'vikingline', 'vikingline.fi', 'tallink', 'silja', 'eckerö', 'wasaline', 'hotels.com'],
  insurance: ['vakuutus', 'vakuutusmaksu', 'if ', 'lähivakuutus', 'pohjola', 'fennia', 'tapiola', 'turva', 'eläkevakuutus', 'henkivakuutus', 'kasko', 'liikennevakuutus', 'kotivakuutus', 'tapaturmavakuutus', 'lähitapiola', 'if vakuutus'],
  hobbies: ['harrastus', 'liikunta', 'kuntosali', 'urheilu', 'golf', 'tennis', 'jalkapallo', 'jääkiekko', 'salibandy', 'uinti', 'hiihto', 'pyöräily', 'kalastus', 'metsästys', 'käsityö', 'tanssi', 'musiikki', 'soitto', 'kuoro', 'partio', 'gym', 'fitness', 'crossfit', 'frisbeegolf', 'erotuomari', 'pelipassi', 'urheilukoulu', 'valmentaja'],
  bills: ['lasku', 'maksu', 'suoraveloitus', 'e-lasku', 'laskutus', 'perintä', 'sähkölasku', 'puhelinlasku', 'nettilasku', 'jätehuolto', 'vesilasku', 'kaupungin', 'kunnallisvero', 'jäsenmaksu', 'tilausmaksu', 'käyttömaksu', 'perintätoimisto', 'traficom'],
  muut: ['lahjoitus', 'jäsenmaksu', 'maksu', 'kulu', 'muu', 'pankkikulu', 'kulut', 'nosto', 'siirto', 'palkki', 'provisio', 'varaus'],
};

const SKIP_KEYWORDS = ['oma tilisiirto', 'tilisiirto', 'säästötili', 'säästäjä debit', 'säästäjä', 'luotolta siirto', 'luotto', 'siirto', 'panomaatti', 'käteisnosto'];



export function shouldSkip(description: string, message: string, txType: string): boolean {
  const combined = `${description} ${message} ${txType}`.toLowerCase();
  return SKIP_KEYWORDS.some((k) => combined.includes(k));
}

export function autoCategorize(
  description: string,
  txType: string,
  message: string,
  amount: number
): Categorization {
  if (shouldSkip(description, message, txType)) {
    return { category: 'muut', type: 'expense', confidence: 'high', skip: true };
  }

  const combinedText = `${description} ${message}`.toLowerCase();
  const typeLower = txType.toLowerCase();

  // txType overrides
  if (typeLower.includes('palkka')) {
    return { category: 'palkka', type: 'income', confidence: 'high', skip: false };
  }
  if (typeLower.includes('korko') || typeLower.includes('lyhennys')) {
    return { category: 'asuminen', type: 'expense', confidence: 'high', skip: false };
  }
  if (typeLower.includes('siirto rahastoon')) {
    return { category: 'muut', type: 'expense', confidence: 'high', skip: true };
  }
  if (typeLower.includes('korttioston korjaus')) {
    return { category: 'muut', type: 'income', confidence: 'medium', skip: false };
  }
  if (typeLower.includes('e-lasku') && combinedText.includes('s-pankki')) {
    return { category: 'muut', type: 'expense', confidence: 'high', skip: true };
  }
  if (typeLower.includes('tilisiirto') && combinedText.includes('paytrail')) {
    if (combinedText.includes('viking line')) return { category: 'travel', type: 'expense', confidence: 'high', skip: false };
    if (combinedText.includes('a-katsastus')) return { category: 'liikenne', type: 'expense', confidence: 'high', skip: false };
    if (combinedText.includes('pelipaikka') || combinedText.includes('pelipassi')) return { category: 'hobbies', type: 'expense', confidence: 'high', skip: false };
  }

  // 1. Known payees
  for (const [payee, cat] of Object.entries(KNOWN_PAYEES)) {
    if (combinedText.includes(payee.toLowerCase())) {
      const isIncome = isIncomeCategory(cat);
      return { category: cat, type: isIncome ? 'income' : 'expense', confidence: 'high', skip: false };
    }
  }

  // 2. Keyword matching
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!isIncomeCategory(cat)) continue;
    if (keywords.some((k) => combinedText.includes(k))) {
      return { category: cat, type: 'income', confidence: 'high', skip: false };
    }
  }

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (isIncomeCategory(cat)) continue;
    if (keywords.some((k) => combinedText.includes(k))) {
      return { category: cat, type: 'expense', confidence: 'high', skip: false };
    }
  }

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (isIncomeCategory(cat)) continue;
    for (const kw of keywords) {
      if (kw.length > 3 && combinedText.includes(kw.slice(0, kw.length - 1))) {
        return { category: cat, type: 'expense', confidence: 'medium', skip: false };
      }
    }
  }

  // 3. Ilman muita vihjeitä iso positiivinen summa on todennäköisimmin palkka.
  // Tämä sääntö ajettiin aiemmin ennen avainsanoja, jolloin mikä tahansa yli
  // 500 euron tapahtuma luokittui palkaksi avainsanoista riippumatta.
  if (amount > 500) {
    return { category: 'palkka', type: 'income', confidence: 'low', skip: false };
  }

  return { category: 'muut', type: amount >= 0 ? 'income' : 'expense', confidence: 'low', skip: false };
}

export function cleanMerchantName(value: string): string {
  if (!value || value === 'Viesti puuttuu' || value === '-') return '';
  // Remove leading card/account number and date prefix like "*2832 24.06. "
  const cleaned = value
    .replace(/^(?:\*\d+(?:\s+\d+\.\d+\.)?\s+)?(.+)$/, '$1')
    .replace(/^(?:\d{2}\.\d{2}\.\s+)?(.+)$/, '$1')
    .trim();
  return cleaned.length > 2 ? cleaned : '';
}

interface ColumnMap {
  dateIndex: number;
  amountIndex: number;
  descriptionIndex: number;
  counterpartyIndex: number;
  messageIndex: number;
  typeIndex: number;
}

function detectColumns(headers: string[]): ColumnMap {
  const lower = headers.map((h) => h.toLowerCase());
  const find = (candidates: string[]) => {
    for (const candidate of candidates) {
      const idx = lower.findIndex((h) => h.includes(candidate));
      if (idx >= 0) return idx;
    }
    return -1;
  };
  const dateIndex = find(['kirjauspäivä', 'päivämäärä', 'pvm', 'date', 'arvopäivä']);
  const amountIndex = find(['määrä', 'summa', 'euro', 'amount', 'määrä eur']);
  // Prefer the actual counterparty name column (Nordea: "Saajan/Maksajan nimi")
  const counterpartyIndex = find([
    "saajan/maksajan nimi", "saajan nimi", "maksajan nimi", "vastaanottaja", "hyväksyjä",
    "saaja/maksaja", "saaja", "maksaja", "nimi", "kauppa"
  ]);
  const descriptionIndex = find(['tapahtuma', 'tapahtumalaji', 'kuvaus', 'description', 'type']);
  const messageIndex = find(['viesti', 'viestit', 'message', 'selite', 'tarkenne', 'viitenumero']);
  const typeIndex = find(['laji', 'tapahtumalaji', 'tyyppi']);
  return {
    dateIndex: dateIndex >= 0 ? dateIndex : 0,
    amountIndex: amountIndex >= 0 ? amountIndex : 2,
    descriptionIndex: descriptionIndex >= 0 ? descriptionIndex : 1,
    counterpartyIndex: counterpartyIndex >= 0 ? counterpartyIndex : -1,
    messageIndex: messageIndex >= 0 ? messageIndex : 5,
    typeIndex: typeIndex >= 0 ? typeIndex : 3,
  };
}

export function inferDirection(amount: number, txType: string, description: string): number {
  const text = `${txType} ${description}`.toLowerCase();
  const incomeMarkers = ['saapuva', 'talletus', 'hyvitys', 'palautus', 'palkka', 'tulo', 'credit', 'saatu', 'maksettu meille'];
  const expenseMarkers = ['lähtevä', 'maksu', 'osto', 'debit', 'veloitus', 'maksettu', 'tilisiirto'];
  const isIncome = incomeMarkers.some((m) => text.includes(m));
  const isExpense = expenseMarkers.some((m) => text.includes(m));
  if (amount > 0 && isExpense) return -amount;
  if (amount < 0 && isIncome) return -amount;
  return amount;
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const delimiter = detectDelimiter(text);
  const firstLine = splitCsvLine(lines[0], delimiter).map((c) => c.toLowerCase());
  const hasHeader = firstLine.some((cell) =>
    ['päivämäärä', 'kirjauspäivä', 'määrä', 'summa', 'tapahtuma', 'saaja', 'maksaja', 'viesti', 'kuvaus', 'pvm', 'date', 'amount', 'saajan nimi'].some((kw) =>
      cell.includes(kw)
    )
  );
  const columns = hasHeader
    ? detectColumns(firstLine)
    : { dateIndex: 0, amountIndex: 2, descriptionIndex: 1, counterpartyIndex: -1, messageIndex: 5, typeIndex: 3 };
  const dataStart = hasHeader ? 1 : 0;
  const rows: CsvRow[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i], delimiter);
    const requiredIdx = Math.max(
      columns.dateIndex,
      columns.amountIndex,
      columns.descriptionIndex,
      columns.counterpartyIndex,
      columns.messageIndex
    );
    if (parts.length < requiredIdx + 1) continue;
    const date = parseIsoDate(parts[columns.dateIndex]);
    const rawAmount = parseDecimal(parts[columns.amountIndex]);
    const txType = parts[columns.typeIndex] || '';
    const eventName = cleanMerchantName(parts[columns.descriptionIndex] || '');
    const counterparty = columns.counterpartyIndex >= 0 ? cleanMerchantName(parts[columns.counterpartyIndex] || '') : '';
    const messageText = cleanMerchantName(parts[columns.messageIndex] || '');
    const description = counterparty || eventName || messageText || cleanMerchantName(parts[1] || '') || '';
    const message = counterparty && messageText ? messageText : eventName || '';
    if (!date || rawAmount === null || !description) continue;
    const amount = inferDirection(rawAmount, txType, description);
    rows.push({ date, description, amount, txType, message, raw: parts });
  }
  return rows;
}
