export interface Account {
  id: string;
  number: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
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
  data: string; // base64
  size: number;
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

export type View = 'dashboard' | 'journal' | 'accounts' | 'reports' | 'settings' | 'guides' | 'entrepreneur' | 'taxcalc' | 'checklist' | 'cashflow' | 'yel' | 'realestate' | 'invoicing' | 'recurring';

export interface CashRegisterEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'in' | 'out';
}
