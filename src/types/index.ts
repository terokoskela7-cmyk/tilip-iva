export interface Account {
  id: string;
  number: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'income';
  vatRate: number;
  parentId?: string;
  description?: string;
  budget?: number;
}

export interface EntryLine {
  id: string;
  accountId: string;
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  path?: string; // Storage path (after upload)
  url?: string; // Download URL (after upload)
  data?: string; // base64 (local preview before upload)
  uploadedAt: string;
}

export interface Entry {
  id: string;
  date: string; // ISO date
  number: string;
  description: string;
  lines: EntryLine[];
  status: 'draft' | 'confirmed' | 'reviewed';
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface RecurringEntry {
  id: string;
  name: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  lastGenerated?: string;
  description: string;
  lines: EntryLine[];
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  yTunnus?: string;
  address: string;
  postalCode: string;
  city: string;
  email?: string;
  phone?: string;
  paymentTerm: number; // days
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPostalCode: string;
  customerCity: string;
  customerYTunnus?: string;
  lines: InvoiceLine[];
  totalExclVat: number;
  totalVat: number;
  totalInclVat: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  reference?: string;
  entryId?: string; // linked accounting entry
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  yTunnus: string;
  address: string;
  postalCode: string;
  city: string;
  vatRegistered: boolean;
  fiscalYearStart: string; // MM-DD
  fiscalYearEnd: string; // MM-DD
  accountantName: string;
  accountantEmail: string;
  accountantPhone: string;
}

export interface VatPeriod {
  id: string;
  startDate: string;
  endDate: string;
  vatPayable: number;
  vatDeductible: number;
  netVat: number;
  status: 'open' | 'filed' | 'paid';
  filedDate?: string;
}

export type LedgerType = 'company' | 'private' | 'housing-company' | 'personal';

export interface Ledger {
  id: string;
  name: string;
  type: LedgerType;
  yTunnus?: string;
  address?: string;
  description?: string;
  vatRegistered: boolean;
  isDefault: boolean;
  createdAt: string;
}


export interface PersonalEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  accountId?: string;
  notes?: string;
  createdAt: string;
}

export interface BudgetItem {
  categoryId: string;
  budgeted: number;
  actual: number;
}

export interface Budget {
  id: string;
  month: string;
  items: BudgetItem[];
}

export type View = 'dashboard' | 'journal' | 'accounts' | 'reports' | 'settings' | 'guides' | 'entrepreneur' | 'taxcalc' | 'checklist' | 'cashflow' | 'yel' | 'realestate' | 'invoicing' | 'recurring' | 'banking' | 'personalfinance' | 'budget' | 'firstinvoice';

export interface CashRegisterEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'in' | 'out';
}

export interface BankAccount {
  id: string;
  name: string;
  iban: string;
  bank: string;
  currency: string;
  initialBalance: number;
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  description: string;
  reference: string;
  counterparty: string;
  matchedEntryId?: string;
  matchedAccountId?: string;
  status: 'unmatched' | 'matched' | 'ignored';
  importedAt: string;
}

export type BankCSVFormat = 'nordea' | 'op' | 'danske' | 'handelsbanken' | 'generic';
