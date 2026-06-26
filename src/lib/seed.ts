import { saveAccount, saveEntry, saveCompany, saveCashRegisterEntry, getAllAccounts } from './db';
import type { Account, Entry, Company, CashRegisterEntry } from '@/types';

const defaultAccounts: Omit<Account, 'id'>[] = [
  // VASTAAVAA (Assets)
  { number: '1000', name: 'Kehitysmenot', type: 'asset', vatRate: 0 },
  { number: '1100', name: 'Aineettomat oikeudet', type: 'asset', vatRate: 0 },
  { number: '1200', name: 'Maa- ja vesialueet', type: 'asset', vatRate: 0 },
  { number: '1210', name: 'Rakennukset ja rakennelmat', type: 'asset', vatRate: 0 },
  { number: '1220', name: 'Koneet ja kalusto', type: 'asset', vatRate: 0 },
  { number: '1300', name: 'Sijoitukset', type: 'asset', vatRate: 0 },
  { number: '1700', name: 'Aineet ja tarvikkeet', type: 'asset', vatRate: 0 },
  { number: '1800', name: 'Valmiit tuotteet', type: 'asset', vatRate: 0 },
  { number: '1900', name: 'Siirtosaamiset', type: 'asset', vatRate: 0 },
  { number: '1910', name: 'Myyntisaamiset', type: 'asset', vatRate: 0 },
  { number: '1920', name: 'Muut saamiset', type: 'asset', vatRate: 0 },
  { number: '1930', name: 'Maksuvalmius', type: 'asset', vatRate: 0 },
  { number: '1940', name: 'Pankkisaamiset', type: 'asset', vatRate: 0 },
  { number: '1950', name: 'Käteiskassa', type: 'asset', vatRate: 0 },
  // VASTATTAVAA (Liabilities & Equity)
  { number: '2000', name: 'Osakepääoma', type: 'equity', vatRate: 0 },
  { number: '2010', name: 'Ylikurssirahasto', type: 'equity', vatRate: 0 },
  { number: '2020', name: 'Arvonkorotusrahasto', type: 'equity', vatRate: 0 },
  { number: '2030', name: 'Käyttörahasto', type: 'equity', vatRate: 0 },
  { number: '2050', name: 'Edellisten tilikausien voitto/tappio', type: 'equity', vatRate: 0 },
  { number: '2060', name: 'Tilikauden voitto/tappio', type: 'equity', vatRate: 0 },
  { number: '2100', name: 'Pakolliset varaukset', type: 'liability', vatRate: 0 },
  { number: '2300', name: 'Laskennallinen verovelka', type: 'liability', vatRate: 0 },
  { number: '2400', name: 'Verovelat', type: 'liability', vatRate: 0 },
  { number: '2500', name: 'Eläkevelat', type: 'liability', vatRate: 0 },
  { number: '2600', name: 'Tilinylitykset', type: 'liability', vatRate: 0 },
  { number: '2700', name: 'Ennakkomaksut', type: 'liability', vatRate: 0 },
  { number: '2800', name: 'Ostovelat', type: 'liability', vatRate: 0 },
  { number: '2900', name: 'Muut velat', type: 'liability', vatRate: 0 },
  { number: '2950', name: 'Siirtovelat', type: 'liability', vatRate: 0 },
  // TUOTOT (Revenue)
  { number: '3000', name: 'Myyntituotot', type: 'revenue', vatRate: 24 },
  { number: '3100', name: 'Tuote-myynti', type: 'revenue', vatRate: 24 },
  { number: '3200', name: 'Palvelu-myynti', type: 'revenue', vatRate: 24 },
  { number: '3300', name: 'Vuokratuotot', type: 'revenue', vatRate: 24 },
  { number: '3400', name: 'Rahoitustuotot', type: 'revenue', vatRate: 0 },
  { number: '3500', name: 'Muut tuotot', type: 'revenue', vatRate: 0 },
  // KULUT (Expenses)
  { number: '4000', name: 'Aine-, tarvike- ja tavarahankinnat', type: 'expense', vatRate: 24 },
  { number: '4100', name: 'Palveluhankinnat', type: 'expense', vatRate: 24 },
  { number: '4200', name: 'Vuokrakulut', type: 'expense', vatRate: 0 },
  { number: '4300', name: 'Henkilöstökulut', type: 'expense', vatRate: 0 },
  { number: '4400', name: 'Poistot ja arvonalentumiset', type: 'expense', vatRate: 0 },
  { number: '4500', name: 'Rahoituskulut', type: 'expense', vatRate: 0 },
  { number: '4600', name: 'Toimitilakulut', type: 'expense', vatRate: 24 },
  { number: '4700', name: 'Markkinointikulut', type: 'expense', vatRate: 24 },
  { number: '4800', name: 'Muut kulut', type: 'expense', vatRate: 24 },
  { number: '4900', name: 'Verot', type: 'expense', vatRate: 0 },
  // VAT accounts
  { number: '29391', name: 'ALV velka', type: 'liability', vatRate: 0 },
  { number: '29392', name: 'ALV saatava', type: 'asset', vatRate: 0 },
];

const defaultCompany: Company = {
  id: 'company-1',
  name: 'Demo Oy',
  yTunnus: '1234567-8',
  address: 'Esimerkkikatu 1',
  postalCode: '00100',
  city: 'Helsinki',
  vatRegistered: true,
  fiscalYearStart: '01-01',
  fiscalYearEnd: '12-31',
  accountantName: 'Kirjanpitäjä Kirsi',
  accountantEmail: 'kirsi@kirjanpito.fi',
  accountantPhone: '040 123 4567',
};

const sampleEntries: Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'attachments'>[] = [
  {
    date: '2024-01-15',
    number: '1',
    description: 'Perustaminen - osakepääoma',
    status: 'confirmed',
    lines: [
      { id: 'l1', accountId: '', accountNumber: '1940', accountName: 'Pankkisaamiset', debit: 2500, credit: 0, description: 'Pankkitalletus' },
      { id: 'l2', accountId: '', accountNumber: '2000', accountName: 'Osakepääoma', debit: 0, credit: 2500, description: 'Osakepääoma' },
    ],
  },
  {
    date: '2024-02-01',
    number: '2',
    description: 'Tietokonehankinta',
    status: 'confirmed',
    lines: [
      { id: 'l3', accountId: '', accountNumber: '1220', accountName: 'Koneet ja kalusto', debit: 1200, credit: 0, description: 'Kannettava tietokone' },
      { id: 'l4', accountId: '', accountNumber: '1940', accountName: 'Pankkisaamiset', debit: 0, credit: 1200, description: 'Maksu pankista' },
    ],
  },
  {
    date: '2024-02-15',
    number: '3',
    description: 'Myynti asiakkaalle A',
    status: 'confirmed',
    lines: [
      { id: 'l5', accountId: '', accountNumber: '3000', accountName: 'Myyntituotot', debit: 0, credit: 5000, description: 'Konsultointipalvelu' },
      { id: 'l6', accountId: '', accountNumber: '29391', accountName: 'ALV velka', debit: 0, credit: 1200, description: 'ALV 24%' },
      { id: 'l7', accountId: '', accountNumber: '1910', accountName: 'Myyntisaamiset', debit: 6200, credit: 0, description: 'Lasku #001' },
    ],
  },
  {
    date: '2024-03-01',
    number: '4',
    description: 'Toimitilan vuokra',
    status: 'confirmed',
    lines: [
      { id: 'l8', accountId: '', accountNumber: '4200', accountName: 'Vuokrakulut', debit: 800, credit: 0, description: 'Maaliskuun vuokra' },
      { id: 'l9', accountId: '', accountNumber: '1940', accountName: 'Pankkisaamiset', debit: 0, credit: 800, description: 'Vuokran maksu' },
    ],
  },
  {
    date: '2024-03-10',
    number: '5',
    description: 'Asiakas A maksaa laskun',
    status: 'confirmed',
    lines: [
      { id: 'l10', accountId: '', accountNumber: '1940', accountName: 'Pankkisaamiset', debit: 6200, credit: 0, description: 'Lasku #001 maksu' },
      { id: 'l11', accountId: '', accountNumber: '1910', accountName: 'Myyntisaamiset', debit: 0, credit: 6200, description: 'Lasku #001 suoritus' },
    ],
  },
  {
    date: '2024-03-20',
    number: '6',
    description: 'Toimistotarvikkeet',
    status: 'confirmed',
    lines: [
      { id: 'l12', accountId: '', accountNumber: '4000', accountName: 'Aine-, tarvike- ja tavarahankinnat', debit: 150, credit: 0, description: 'Tulostuspaperi, kynät' },
      { id: 'l13', accountId: '', accountNumber: '1940', accountName: 'Pankkisaamiset', debit: 0, credit: 150, description: 'Osto' },
    ],
  },
  {
    date: '2024-04-01',
    number: '7',
    description: 'Palkka - toimitusjohtaja',
    status: 'confirmed',
    lines: [
      { id: 'l14', accountId: '', accountNumber: '4300', accountName: 'Henkilöstökulut', debit: 3500, credit: 0, description: 'Huhtikuun palkka' },
      { id: 'l15', accountId: '', accountNumber: '1940', accountName: 'Pankkisaamiset', debit: 0, credit: 3500, description: 'Palkan maksu' },
    ],
  },
  {
    date: '2024-04-15',
    number: '8',
    description: 'Myynti asiakkaalle B',
    status: 'confirmed',
    lines: [
      { id: 'l16', accountId: '', accountNumber: '3000', accountName: 'Myyntituotot', debit: 0, credit: 3500, description: 'Ohjelmistokehitys' },
      { id: 'l17', accountId: '', accountNumber: '29391', accountName: 'ALV velka', debit: 0, credit: 840, description: 'ALV 24%' },
      { id: 'l18', accountId: '', accountNumber: '1910', accountName: 'Myyntisaamiset', debit: 4340, credit: 0, description: 'Lasku #002' },
    ],
  },
  {
    date: '2024-05-01',
    number: '9',
    description: 'Markkinointi - some-kampanja',
    status: 'confirmed',
    lines: [
      { id: 'l19', accountId: '', accountNumber: '4700', accountName: 'Markkinointikulut', debit: 500, credit: 0, description: 'Facebook-mainonta' },
      { id: 'l20', accountId: '', accountNumber: '1940', accountName: 'Pankkisaamiset', debit: 0, credit: 500, description: 'Mainosmaksu' },
    ],
  },
  {
    date: '2024-05-10',
    number: '10',
    description: 'Asiakas B maksaa laskun',
    status: 'confirmed',
    lines: [
      { id: 'l21', accountId: '', accountNumber: '1940', accountName: 'Pankkisaamiset', debit: 4340, credit: 0, description: 'Lasku #002 maksu' },
      { id: 'l22', accountId: '', accountNumber: '1910', accountName: 'Myyntisaamiset', debit: 0, credit: 4340, description: 'Lasku #002 suoritus' },
    ],
  },
];

const sampleCashEntries: Omit<CashRegisterEntry, 'id'>[] = [
  { date: '2024-01-15', description: 'Kassaan perustamisesta', amount: 500, type: 'in' },
  { date: '2024-02-01', description: 'Toimistotarvikkeet', amount: 45, type: 'out' },
  { date: '2024-03-05', description: 'Pienhankinta', amount: 12.5, type: 'out' },
  { date: '2024-04-10', description: 'Käteismyynti', amount: 200, type: 'in' },
  { date: '2024-05-03', description: 'Kuljetus', amount: 35, type: 'out' },
  { date: '2024-05-20', description: 'Käteismyynti', amount: 150, type: 'in' },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export async function seedDatabase(): Promise<void> {
  const existingAccounts = await getAllAccounts();
  if (existingAccounts.length > 0) return; // Already seeded

  // Save company
  await saveCompany(defaultCompany);

  // Save accounts
  const accountIdMap: Record<string, string> = {};
  for (const acc of defaultAccounts) {
    const id = generateId();
    accountIdMap[acc.number] = id;
    await saveAccount({ ...acc, id });
  }

  // Save entries with proper account IDs
  for (const entry of sampleEntries) {
    const id = generateId();
    const lines = entry.lines.map(line => ({
      ...line,
      id: generateId(),
      accountId: accountIdMap[line.accountNumber] || '',
    }));
    const now = new Date().toISOString();
    await saveEntry({
      ...entry,
      id,
      lines,
      attachments: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  // Save cash register entries
  for (const entry of sampleCashEntries) {
    await saveCashRegisterEntry({ ...entry, id: generateId() });
  }
}
