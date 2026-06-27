import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Account, Entry, Company, VatPeriod, CashRegisterEntry, RecurringEntry, Customer, Invoice } from '@/types';

type CashEntry = CashRegisterEntry & { ledgerId?: string };

interface FinLedgerDB extends DBSchema {
  accounts: {
    key: string;
    value: Account;
    indexes: { 'by-number': string };
  };
  entries: {
    key: string;
    value: Entry;
    indexes: { 'by-date': string; 'by-number': string };
  };
  company: {
    key: string;
    value: Company;
  };
  vatPeriods: {
    key: string;
    value: VatPeriod;
    indexes: { 'by-date': string };
  };
  cashRegister: {
    key: string;
    value: CashRegisterEntry;
    indexes: { 'by-date': string };
  };
  recurringEntries: {
    key: string;
    value: RecurringEntry;
  };
  customers: {
    key: string;
    value: Customer;
  };
  invoices: {
    key: string;
    value: Invoice;
    indexes: { 'by-number': string };
  };
}

let db: IDBPDatabase<FinLedgerDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<FinLedgerDB>> {
  if (db) return db;
  db = await openDB<FinLedgerDB>('FinLedgerDB', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const accountsStore = db.createObjectStore('accounts', { keyPath: 'id' });
        accountsStore.createIndex('by-number', 'number', { unique: true });

        const entriesStore = db.createObjectStore('entries', { keyPath: 'id' });
        entriesStore.createIndex('by-date', 'date');
        entriesStore.createIndex('by-number', 'number', { unique: true });

        db.createObjectStore('company', { keyPath: 'id' });

        const vatStore = db.createObjectStore('vatPeriods', { keyPath: 'id' });
        vatStore.createIndex('by-date', 'startDate');

        const cashStore = db.createObjectStore('cashRegister', { keyPath: 'id' });
        cashStore.createIndex('by-date', 'date');
      }
      if (oldVersion < 2) {
        db.createObjectStore('recurringEntries', { keyPath: 'id' });
        db.createObjectStore('customers', { keyPath: 'id' });
        const invStore = db.createObjectStore('invoices', { keyPath: 'id' });
        invStore.createIndex('by-number', 'number', { unique: true });
      }
    },
  });
  return db;
}

// Account operations
export async function getAllAccounts(): Promise<Account[]> {
  const db = await getDB();
  return db.getAll('accounts');
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  const db = await getDB();
  return db.get('accounts', id);
}

export async function saveAccount(account: Account): Promise<void> {
  const db = await getDB();
  await db.put('accounts', account);
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('accounts', id);
}

// Entry operations
export async function getAllEntries(): Promise<Entry[]> {
  const db = await getDB();
  return db.getAllFromIndex('entries', 'by-date');
}

export async function getEntryById(id: string): Promise<Entry | undefined> {
  const db = await getDB();
  return db.get('entries', id);
}

export async function saveEntry(entry: Entry): Promise<void> {
  const db = await getDB();
  await db.put('entries', entry);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('entries', id);
}

// Company operations
export async function getCompany(): Promise<Company | undefined> {
  const db = await getDB();
  const all = await db.getAll('company');
  return all[0];
}

export async function saveCompany(company: Company): Promise<void> {
  const db = await getDB();
  await db.put('company', company);
}

// VAT period operations
export async function getAllVatPeriods(): Promise<VatPeriod[]> {
  const db = await getDB();
  return db.getAllFromIndex('vatPeriods', 'by-date');
}

export async function saveVatPeriod(period: VatPeriod): Promise<void> {
  const db = await getDB();
  await db.put('vatPeriods', period);
}

// Cash register operations
export async function getAllCashRegisterEntries(ledgerId?: string): Promise<CashRegisterEntry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('cashRegister', 'by-date');
  if (!ledgerId) return all;
  return all.filter((e) => (e as CashEntry).ledgerId === ledgerId);
}

export async function saveCashRegisterEntry(entry: CashRegisterEntry, ledgerId?: string): Promise<void> {
  const db = await getDB();
  const toSave: CashEntry = ledgerId ? { ...entry, ledgerId } : entry;
  await db.put('cashRegister', toSave as CashRegisterEntry);
}

// Recurring entry operations
export async function getAllRecurringEntries(): Promise<RecurringEntry[]> {
  const db = await getDB();
  return db.getAll('recurringEntries');
}

export async function saveRecurringEntry(entry: RecurringEntry): Promise<void> {
  const db = await getDB();
  await db.put('recurringEntries', entry);
}

export async function deleteRecurringEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('recurringEntries', id);
}

// Customer operations
export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDB();
  return db.getAll('customers');
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const db = await getDB();
  return db.get('customers', id);
}

export async function saveCustomer(customer: Customer): Promise<void> {
  const db = await getDB();
  await db.put('customers', customer);
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('customers', id);
}

// Invoice operations
export async function getAllInvoices(): Promise<Invoice[]> {
  const db = await getDB();
  return db.getAllFromIndex('invoices', 'by-number');
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  const db = await getDB();
  return db.get('invoices', id);
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  const db = await getDB();
  await db.put('invoices', invoice);
}

export async function deleteInvoice(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('invoices', id);
}

// Export all data as JSON
export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const db = await getDB();
  return {
    accounts: await db.getAll('accounts'),
    entries: await db.getAll('entries'),
    company: await db.getAll('company'),
    vatPeriods: await db.getAll('vatPeriods'),
    cashRegister: await db.getAll('cashRegister'),
    recurringEntries: await db.getAll('recurringEntries'),
    customers: await db.getAll('customers'),
    invoices: await db.getAll('invoices'),
  };
}

// Reset database
export async function resetDatabase(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['accounts', 'entries', 'company', 'vatPeriods', 'cashRegister', 'recurringEntries', 'customers', 'invoices'],
    'readwrite'
  );
  await Promise.all([
    tx.objectStore('accounts').clear(),
    tx.objectStore('entries').clear(),
    tx.objectStore('company').clear(),
    tx.objectStore('vatPeriods').clear(),
    tx.objectStore('cashRegister').clear(),
    tx.objectStore('recurringEntries').clear(),
    tx.objectStore('customers').clear(),
    tx.objectStore('invoices').clear(),
  ]);
  await tx.done;
}
