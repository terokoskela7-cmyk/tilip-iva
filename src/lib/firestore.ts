import { db, auth } from '@/firebase/config';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  runTransaction,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore';
import type {
  Account,
  Entry,
  Company,
  Customer,
  Invoice,
  RecurringEntry,
  VatPeriod,
  BankAccount,
  BankTransaction,
  Ledger,
  LedgerType,
  PersonalEntry,
  Budget,
  CashRegisterEntry,
} from '@/types';
import { defaultAccounts } from '@/data/defaultAccounts';
import { privateAccounts } from '@/data/privateAccounts';
import { housingAccounts } from '@/data/housingAccounts';
import { personalAccounts } from '@/data/personalAccounts';

const ACTIVE_LEDGER_KEY = 'activeLedgerId';

function getUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Käyttäjä ei ole kirjautunut');
  return uid;
}

export function getActiveLedgerId(): string {
  return localStorage.getItem(ACTIVE_LEDGER_KEY) || 'default';
}

export function setActiveLedgerId(ledgerId: string): void {
  localStorage.setItem(ACTIVE_LEDGER_KEY, ledgerId);
}

function ledgersCol(): CollectionReference {
  return collection(db, 'users', getUid(), 'ledgers');
}

function ledgerCol(subCollection: string): CollectionReference {
  return collection(db, 'users', getUid(), 'ledgers', getActiveLedgerId(), subCollection);
}

function ledgerDoc(subCollection: string, id: string): DocumentReference {
  return doc(db, 'users', getUid(), 'ledgers', getActiveLedgerId(), subCollection, id);
}

function specificLedgerCol(ledgerId: string, subCollection: string): CollectionReference {
  return collection(db, 'users', getUid(), 'ledgers', ledgerId, subCollection);
}

function specificLedgerDoc(ledgerId: string, subCollection: string, id: string): DocumentReference {
  return doc(db, 'users', getUid(), 'ledgers', ledgerId, subCollection, id);
}

// === LEDGERS ===
export async function getAllLedgers(): Promise<Ledger[]> {
  const snap = await getDocs(query(ledgersCol(), orderBy('createdAt')));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Ledger));
}

export async function saveLedger(ledger: Ledger): Promise<void> {
  await setDoc(doc(ledgersCol(), ledger.id), ledger);
}

export async function deleteLedger(ledgerId: string): Promise<void> {
  await deleteDoc(doc(ledgersCol(), ledgerId));
}

// === COMPANY ===
export async function getCompany(): Promise<Company | null> {
  const snap = await getDoc(ledgerDoc('company', 'main'));
  return snap.exists() ? (snap.data() as Company) : null;
}

export async function saveCompany(company: Company): Promise<void> {
  await setDoc(ledgerDoc('company', 'main'), company);
}

// === ACCOUNTS ===
export async function getAllAccounts(): Promise<Account[]> {
  const snap = await getDocs(query(ledgerCol('accounts'), orderBy('number')));
  return snap.docs.map((d) => d.data() as Account);
}

export async function saveAccount(account: Account): Promise<void> {
  await setDoc(ledgerDoc('accounts', account.id), account);
}

export async function deleteAccount(id: string): Promise<void> {
  await deleteDoc(ledgerDoc('accounts', id));
}

// === ENTRIES ===
export async function getAllEntries(): Promise<Entry[]> {
  const snap = await getDocs(query(ledgerCol('entries'), orderBy('date', 'desc')));
  return snap.docs.map((d) => d.data() as Entry);
}

export async function saveEntry(entry: Entry): Promise<void> {
  await setDoc(ledgerDoc('entries', entry.id), entry);
}

export async function getEntryById(id: string): Promise<Entry | null> {
  const snap = await getDoc(ledgerDoc('entries', id));
  return snap.exists() ? (snap.data() as Entry) : null;
}

export async function deleteEntry(id: string): Promise<void> {
  await deleteDoc(ledgerDoc('entries', id));
}

// === CUSTOMERS ===
export async function getAllCustomers(): Promise<Customer[]> {
  const snap = await getDocs(query(ledgerCol('customers'), orderBy('name')));
  return snap.docs.map((d) => d.data() as Customer);
}

export async function saveCustomer(customer: Customer): Promise<void> {
  await setDoc(ledgerDoc('customers', customer.id), customer);
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(ledgerDoc('customers', id));
}

// === INVOICES ===
export async function getAllInvoices(): Promise<Invoice[]> {
  // Juokseva numero on merkkijono, jossa "10" jarjestyisi ennen arvoa "9",
  // joten lista haetaan paivamaaran mukaan ja lajitellaan tarvittaessa
  // numerojarjestykseen nakymassa.
  const snap = await getDocs(query(ledgerCol('invoices'), orderBy('date', 'desc')));
  return snap.docs.map((d) => d.data() as Invoice);
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  await setDoc(ledgerDoc('invoices', invoice.id), invoice);
}

export async function deleteInvoice(id: string): Promise<void> {
  await deleteDoc(ledgerDoc('invoices', id));
}

// === RECURRING ENTRIES ===
export async function getAllRecurringEntries(): Promise<RecurringEntry[]> {
  const snap = await getDocs(query(ledgerCol('recurringEntries'), orderBy('name')));
  return snap.docs.map((d) => d.data() as RecurringEntry);
}

export async function saveRecurringEntry(entry: RecurringEntry): Promise<void> {
  await setDoc(ledgerDoc('recurringEntries', entry.id), entry);
}

export async function deleteRecurringEntry(id: string): Promise<void> {
  await deleteDoc(ledgerDoc('recurringEntries', id));
}

// === VAT PERIODS ===
export async function getAllVatPeriods(): Promise<VatPeriod[]> {
  const snap = await getDocs(query(ledgerCol('vatPeriods'), orderBy('startDate', 'desc')));
  return snap.docs.map((d) => d.data() as VatPeriod);
}

export async function saveVatPeriod(period: VatPeriod): Promise<void> {
  await setDoc(ledgerDoc('vatPeriods', period.id), period);
}

export async function deleteVatPeriod(id: string): Promise<void> {
  await deleteDoc(ledgerDoc('vatPeriods', id));
}

// === BANK ACCOUNTS ===
export async function getAllBankAccounts(): Promise<BankAccount[]> {
  const snap = await getDocs(query(ledgerCol('bankAccounts'), orderBy('name')));
  return snap.docs.map((d) => d.data() as BankAccount);
}

export async function saveBankAccount(account: BankAccount): Promise<void> {
  await setDoc(ledgerDoc('bankAccounts', account.id), account);
}

export async function deleteBankAccount(id: string): Promise<void> {
  await deleteDoc(ledgerDoc('bankAccounts', id));
}

// === BANK TRANSACTIONS ===
export async function getAllTransactions(): Promise<BankTransaction[]> {
  const snap = await getDocs(query(ledgerCol('bankTransactions'), orderBy('date', 'desc')));
  return snap.docs.map((d) => d.data() as BankTransaction);
}

export async function saveTransaction(tx: BankTransaction): Promise<void> {
  await setDoc(ledgerDoc('bankTransactions', tx.id), tx);
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(ledgerDoc('bankTransactions', id));
}

// === CASH REGISTER ===
export async function getAllCashRegisterEntries(): Promise<CashRegisterEntry[]> {
  const snap = await getDocs(query(ledgerCol('cashRegister'), orderBy('date')));
  return snap.docs.map((d) => d.data() as CashRegisterEntry);
}

export async function saveCashRegisterEntry(entry: CashRegisterEntry): Promise<void> {
  await setDoc(ledgerDoc('cashRegister', entry.id), entry);
}

export async function deleteCashRegisterEntry(id: string): Promise<void> {
  await deleteDoc(ledgerDoc('cashRegister', id));
}

// === JUOKSEVAT NUMEROT ===
/**
 * Varaa seuraavan juoksevan numeron tilikirjakohtaisesta laskurista.
 *
 * Transaktio takaa, etta kaksi samanaikaista tallennusta (esimerkiksi kaksi
 * valilehtea) eivat saa samaa numeroa. Laskuri alustetaan tarvittaessa jo
 * olemassa olevan aineiston suurimmasta numerosta, jonka kutsuja antaa
 * seed-arvona, joten vanhoja numeroita ei kayteta uudelleen.
 */
async function allocateCounter(name: string, seed: number): Promise<number> {
  const ref = ledgerDoc('counters', name);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const stored = snap.exists() ? Number(snap.data().value) : 0;
    const current = Number.isSafeInteger(stored) ? stored : 0;
    const next = Math.max(current, Number.isSafeInteger(seed) ? seed : 0) + 1;
    tx.set(ref, { value: next });
    return next;
  });
}

export async function allocateEntryNumber(seed: number): Promise<string> {
  return String(await allocateCounter('entryNumber', seed));
}

export async function allocateInvoiceNumber(seed: number): Promise<string> {
  return String(await allocateCounter('invoiceNumber', seed));
}

// === BATCH OPERATIONS ===
/** Firestoren writeBatch hyvaksyy enintaan 500 operaatiota, joten pilkotaan. */
const BATCH_LIMIT = 500;

async function commitInChunks<T>(
  items: T[],
  apply: (batch: ReturnType<typeof writeBatch>, item: T) => void
): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const item of items.slice(i, i + BATCH_LIMIT)) {
      apply(batch, item);
    }
    await batch.commit();
  }
}

export async function saveManyAccounts(accounts: Account[], ledgerId?: string): Promise<void> {
  const targetLedgerId = ledgerId || getActiveLedgerId();
  await commitInChunks(accounts, (batch, account) => {
    batch.set(specificLedgerDoc(targetLedgerId, 'accounts', account.id), account);
  });
}

/** Kirjoittaa mielivaltaisia dokumentteja nimettyyn tilikirjaan (kaytetaan migraatiossa). */
export async function saveManyToLedger(
  ledgerId: string,
  subCollection: string,
  docs: { id: string }[]
): Promise<void> {
  await commitInChunks(docs, (batch, item) => {
    batch.set(specificLedgerDoc(ledgerId, subCollection, item.id), item);
  });
}

export async function saveManyPersonalEntries(entries: PersonalEntry[]): Promise<void> {
  const ledgerId = getActiveLedgerId();
  await commitInChunks(entries, (batch, entry) => {
    batch.set(specificLedgerDoc(ledgerId, 'personalEntries', entry.id), entry);
  });
}

export async function saveManyTransactions(transactions: BankTransaction[]): Promise<void> {
  const ledgerId = getActiveLedgerId();
  await commitInChunks(transactions, (batch, tx) => {
    batch.set(specificLedgerDoc(ledgerId, 'bankTransactions', tx.id), tx);
  });
}

export async function deleteAllPersonalEntries(): Promise<void> {
  const snap = await getDocs(specificLedgerCol(getActiveLedgerId(), 'personalEntries'));
  await commitInChunks(snap.docs, (batch, d) => batch.delete(d.ref));
}

// === SEEDING ===
export function getAccountsForLedgerType(type: LedgerType): Omit<Account, 'id'>[] {
  switch (type) {
    case 'private':
      return privateAccounts;
    case 'housing-company':
      return housingAccounts;
    case 'personal':
      return personalAccounts;
    case 'company':
    default:
      return defaultAccounts;
  }
}

export async function seedLedgerAccounts(ledgerId: string, type: LedgerType): Promise<void> {
  const source = getAccountsForLedgerType(type);
  const accounts: Account[] = source.map((acc) => ({
    ...acc,
    id: generateId(),
  }));
  await saveManyAccounts(accounts, ledgerId);
}


// === PERSONAL ENTRIES ===
export async function getAllPersonalEntries(): Promise<PersonalEntry[]> {
  const snap = await getDocs(query(ledgerCol('personalEntries'), orderBy('date', 'desc')));
  return snap.docs.map((d) => d.data() as PersonalEntry);
}

export async function savePersonalEntry(entry: PersonalEntry): Promise<void> {
  await setDoc(ledgerDoc('personalEntries', entry.id), entry);
}

export async function deletePersonalEntry(id: string): Promise<void> {
  await deleteDoc(ledgerDoc('personalEntries', id));
}

// === BUDGETS ===
export async function getBudget(month: string): Promise<Budget | null> {
  const snap = await getDoc(ledgerDoc('budgets', month));
  return snap.exists() ? (snap.data() as Budget) : null;
}

export async function getAllBudgets(): Promise<Budget[]> {
  const snap = await getDocs(query(ledgerCol('budgets'), orderBy('month', 'desc')));
  return snap.docs.map((d) => d.data() as Budget);
}

export async function saveBudget(budget: Budget): Promise<void> {
  await setDoc(ledgerDoc('budgets', budget.id), budget);
}

export async function deleteBudget(month: string): Promise<void> {
  await deleteDoc(ledgerDoc('budgets', month));
}

// === MIGRATION ===
export async function migrateToLedgers(): Promise<void> {
  const uid = getUid();
  const ledgerId = 'default';

  const oldAccounts = await getDocs(collection(db, 'users', uid, 'accounts'));
  const oldEntries = await getDocs(collection(db, 'users', uid, 'entries'));
  const oldCustomers = await getDocs(collection(db, 'users', uid, 'customers'));
  const oldInvoices = await getDocs(collection(db, 'users', uid, 'invoices'));
  const oldRecurring = await getDocs(collection(db, 'users', uid, 'recurringEntries'));
  const oldVatPeriods = await getDocs(collection(db, 'users', uid, 'vatPeriods'));
  const oldBankAccounts = await getDocs(collection(db, 'users', uid, 'bankAccounts'));
  const oldBankTransactions = await getDocs(collection(db, 'users', uid, 'bankTransactions'));
  const oldCompany = await getDoc(doc(db, 'users', uid, 'company', 'main'));

  // Only migrate if there's any old data
  const hasOldData =
    !oldAccounts.empty ||
    !oldEntries.empty ||
    !oldCustomers.empty ||
    !oldInvoices.empty ||
    !oldRecurring.empty ||
    !oldVatPeriods.empty ||
    !oldBankAccounts.empty ||
    !oldBankTransactions.empty ||
    oldCompany.exists();

  if (!hasOldData) return;

  const defaultLedger: Ledger = {
    id: ledgerId,
    name: 'Yritys',
    type: 'company',
    vatRegistered: true,
    isDefault: true,
    createdAt: new Date().toISOString(),
  };
  await saveLedger(defaultLedger);

  const legacy: { col: string; id: string; data: Record<string, unknown> }[] = [];
  const collect = (col: string, docs: { id: string; data: () => Record<string, unknown> }[]) => {
    for (const d of docs) legacy.push({ col, id: d.id, data: d.data() });
  };

  collect('accounts', oldAccounts.docs);
  collect('entries', oldEntries.docs);
  collect('customers', oldCustomers.docs);
  collect('invoices', oldInvoices.docs);
  collect('recurringEntries', oldRecurring.docs);
  collect('vatPeriods', oldVatPeriods.docs);
  collect('bankAccounts', oldBankAccounts.docs);
  collect('bankTransactions', oldBankTransactions.docs);
  if (oldCompany.exists()) {
    legacy.push({ col: 'company', id: 'main', data: oldCompany.data() });
  }

  await commitInChunks(legacy, (batch, item) => {
    batch.set(specificLedgerDoc(ledgerId, item.col, item.id), item.data);
  });

  setActiveLedgerId(ledgerId);
}

// === EXPORT ===
export async function exportAllData(): Promise<Record<string, unknown>> {
  const ledgerId = getActiveLedgerId();
  const [
    ledgers,
    company,
    accounts,
    entries,
    customers,
    invoices,
    recurringEntries,
    vatPeriods,
    bankAccounts,
    bankTransactions,
    cashRegister,
    personalEntries,
    budgets,
  ] = await Promise.all([
    getAllLedgers(),
    getCompany(),
    getAllAccounts(),
    getAllEntries(),
    getAllCustomers(),
    getAllInvoices(),
    getAllRecurringEntries(),
    getAllVatPeriods(),
    getAllBankAccounts(),
    getAllTransactions(),
    getAllCashRegisterEntries(),
    getAllPersonalEntries(),
    getAllBudgets(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    ledgerId,
    ledger: ledgers.find((l) => l.id === ledgerId) ?? null,
    company,
    accounts,
    entries,
    customers,
    invoices,
    recurringEntries,
    vatPeriods,
    bankAccounts,
    bankTransactions,
    cashRegister,
    personalEntries,
    budgets,
  };
}

// === RESET ===
export async function resetDatabase(): Promise<void> {
  const cols = ['accounts', 'entries', 'customers', 'invoices', 'recurringEntries', 'vatPeriods', 'bankAccounts', 'bankTransactions', 'cashRegister', 'personalEntries', 'budgets', 'counters'];
  const ledgerId = getActiveLedgerId();
  for (const colName of cols) {
    const snap = await getDocs(specificLedgerCol(ledgerId, colName));
    await commitInChunks(snap.docs, (batch, d) => batch.delete(d.ref));
  }
  await deleteDoc(specificLedgerDoc(ledgerId, 'company', 'main'));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
