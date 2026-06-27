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
  const snap = await getDocs(query(ledgerCol('invoices'), orderBy('number')));
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

// === BATCH OPERATIONS ===
export async function saveManyAccounts(accounts: Account[], ledgerId?: string): Promise<void> {
  const batch = writeBatch(db);
  const targetLedgerId = ledgerId || getActiveLedgerId();
  for (const account of accounts) {
    batch.set(specificLedgerDoc(targetLedgerId, 'accounts', account.id), account);
  }
  await batch.commit();
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
    isDefault: true,
    createdAt: new Date().toISOString(),
  };
  await saveLedger(defaultLedger);

  const batch = writeBatch(db);

  for (const d of oldAccounts.docs) {
    batch.set(specificLedgerDoc(ledgerId, 'accounts', d.id), d.data());
  }
  for (const d of oldEntries.docs) {
    batch.set(specificLedgerDoc(ledgerId, 'entries', d.id), d.data());
  }
  for (const d of oldCustomers.docs) {
    batch.set(specificLedgerDoc(ledgerId, 'customers', d.id), d.data());
  }
  for (const d of oldInvoices.docs) {
    batch.set(specificLedgerDoc(ledgerId, 'invoices', d.id), d.data());
  }
  for (const d of oldRecurring.docs) {
    batch.set(specificLedgerDoc(ledgerId, 'recurringEntries', d.id), d.data());
  }
  for (const d of oldVatPeriods.docs) {
    batch.set(specificLedgerDoc(ledgerId, 'vatPeriods', d.id), d.data());
  }
  for (const d of oldBankAccounts.docs) {
    batch.set(specificLedgerDoc(ledgerId, 'bankAccounts', d.id), d.data());
  }
  for (const d of oldBankTransactions.docs) {
    batch.set(specificLedgerDoc(ledgerId, 'bankTransactions', d.id), d.data());
  }
  if (oldCompany.exists()) {
    batch.set(specificLedgerDoc(ledgerId, 'company', 'main'), oldCompany.data());
  }

  await batch.commit();
  setActiveLedgerId(ledgerId);
}

// === EXPORT ===
export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const [accounts, entries, customers, invoices, recurringEntries, vatPeriods] = await Promise.all([
    getAllAccounts(),
    getAllEntries(),
    getAllCustomers(),
    getAllInvoices(),
    getAllRecurringEntries(),
    getAllVatPeriods(),
  ]);
  return {
    accounts,
    entries,
    customers,
    invoices,
    recurringEntries,
    vatPeriods,
  };
}

// === RESET ===
export async function resetDatabase(): Promise<void> {
  const cols = ['accounts', 'entries', 'customers', 'invoices', 'recurringEntries', 'vatPeriods', 'bankAccounts', 'bankTransactions', 'personalEntries', 'budgets'];
  const ledgerId = getActiveLedgerId();
  for (const colName of cols) {
    const snap = await getDocs(specificLedgerCol(ledgerId, colName));
    const batch = writeBatch(db);
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }
  await deleteDoc(specificLedgerDoc(ledgerId, 'company', 'main'));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
