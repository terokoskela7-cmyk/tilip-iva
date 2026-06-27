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
} from 'firebase/firestore';
import type { Account, Entry, Company, Customer, Invoice, RecurringEntry, VatPeriod } from '@/types';

function getUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Käyttäjä ei ole kirjautunut');
  return uid;
}

function userCol(name: string) {
  return collection(db, 'users', getUid(), name);
}

function userDoc(name: string, id: string) {
  return doc(db, 'users', getUid(), name, id);
}

// === COMPANY ===
export async function getCompany(): Promise<Company | null> {
  const snap = await getDoc(doc(db, 'users', getUid(), 'company', 'main'));
  return snap.exists() ? (snap.data() as Company) : null;
}

export async function saveCompany(company: Company): Promise<void> {
  await setDoc(doc(db, 'users', getUid(), 'company', 'main'), company);
}

// === ACCOUNTS ===
export async function getAllAccounts(): Promise<Account[]> {
  const snap = await getDocs(query(userCol('accounts'), orderBy('number')));
  return snap.docs.map((d) => d.data() as Account);
}

export async function saveAccount(account: Account): Promise<void> {
  await setDoc(userDoc('accounts', account.id), account);
}

export async function deleteAccount(id: string): Promise<void> {
  await deleteDoc(userDoc('accounts', id));
}

// === ENTRIES ===
export async function getAllEntries(): Promise<Entry[]> {
  const snap = await getDocs(query(userCol('entries'), orderBy('date', 'desc')));
  return snap.docs.map((d) => d.data() as Entry);
}

export async function saveEntry(entry: Entry): Promise<void> {
  await setDoc(userDoc('entries', entry.id), entry);
}

export async function deleteEntry(id: string): Promise<void> {
  await deleteDoc(userDoc('entries', id));
}

// === CUSTOMERS ===
export async function getAllCustomers(): Promise<Customer[]> {
  const snap = await getDocs(query(userCol('customers'), orderBy('name')));
  return snap.docs.map((d) => d.data() as Customer);
}

export async function saveCustomer(customer: Customer): Promise<void> {
  await setDoc(userDoc('customers', customer.id), customer);
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(userDoc('customers', id));
}

// === INVOICES ===
export async function getAllInvoices(): Promise<Invoice[]> {
  const snap = await getDocs(query(userCol('invoices'), orderBy('number')));
  return snap.docs.map((d) => d.data() as Invoice);
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  await setDoc(userDoc('invoices', invoice.id), invoice);
}

export async function deleteInvoice(id: string): Promise<void> {
  await deleteDoc(userDoc('invoices', id));
}

// === RECURRING ENTRIES ===
export async function getAllRecurringEntries(): Promise<RecurringEntry[]> {
  const snap = await getDocs(query(userCol('recurringEntries'), orderBy('name')));
  return snap.docs.map((d) => d.data() as RecurringEntry);
}

export async function saveRecurringEntry(entry: RecurringEntry): Promise<void> {
  await setDoc(userDoc('recurringEntries', entry.id), entry);
}

export async function deleteRecurringEntry(id: string): Promise<void> {
  await deleteDoc(userDoc('recurringEntries', id));
}

// === VAT PERIODS ===
export async function getAllVatPeriods(): Promise<VatPeriod[]> {
  const snap = await getDocs(query(userCol('vatPeriods'), orderBy('startDate', 'desc')));
  return snap.docs.map((d) => d.data() as VatPeriod);
}

export async function saveVatPeriod(period: VatPeriod): Promise<void> {
  await setDoc(userDoc('vatPeriods', period.id), period);
}

export async function deleteVatPeriod(id: string): Promise<void> {
  await deleteDoc(userDoc('vatPeriods', id));
}

// === BATCH OPERATIONS ===
export async function saveManyAccounts(accounts: Account[]): Promise<void> {
  const batch = writeBatch(db);
  for (const account of accounts) {
    batch.set(userDoc('accounts', account.id), account);
  }
  await batch.commit();
}

// === RESET ===
export async function resetDatabase(): Promise<void> {
  const cols = ['accounts', 'entries', 'customers', 'invoices', 'recurringEntries', 'vatPeriods'];
  for (const colName of cols) {
    const snap = await getDocs(userCol(colName));
    const batch = writeBatch(db);
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }
  await deleteDoc(doc(db, 'users', getUid(), 'company', 'main'));
}
