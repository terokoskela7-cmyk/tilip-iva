import { saveEntry, saveCompany, saveLedger, seedLedgerAccounts, setActiveLedgerId } from './firestore';
import { saveCashRegisterEntry } from './db';
import type { Entry, Company, CashRegisterEntry, Ledger } from '@/types';

const defaultCompany: Company = {
  id: 'main',
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
  const ledgerId = generateId();
  const ledger: Ledger = {
    id: ledgerId,
    name: defaultCompany.name,
    type: 'company',
    yTunnus: defaultCompany.yTunnus,
    vatRegistered: true,
    isDefault: true,
    createdAt: new Date().toISOString(),
  };

  setActiveLedgerId(ledgerId);
  await saveLedger(ledger);
  await saveCompany(defaultCompany);
  await seedLedgerAccounts(ledgerId, 'company');

  // We need account ID mapping for entries
  // Import dynamic to avoid circular dependency
  const { getAllAccounts } = await import('./firestore');
  const accounts = await getAllAccounts();
  const accountIdMap: Record<string, string> = {};
  for (const acc of accounts) {
    accountIdMap[acc.number] = acc.id;
  }

  for (const entry of sampleEntries) {
    const id = generateId();
    const lines = entry.lines.map((line) => ({
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

  for (const entry of sampleCashEntries) {
    await saveCashRegisterEntry({ ...entry, id: generateId() }, ledgerId);
  }
}
