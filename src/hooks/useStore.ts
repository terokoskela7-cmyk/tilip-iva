import { useState, useEffect, useCallback } from 'react';
import type { Account, Entry, Company, CashRegisterEntry, Customer, Invoice, RecurringEntry, View } from '@/types';
import {
  getAllAccounts,
  getAllEntries,
  getCompany,
  getAllCustomers,
  getAllInvoices,
  getAllRecurringEntries,
  saveEntry,
  saveAccount,
  deleteEntry,
  deleteAccount,
  saveCompany,
  saveCustomer,
  saveInvoice,
  saveRecurringEntry,
  deleteCustomer,
  deleteInvoice,
  deleteRecurringEntry,
} from '@/lib/firestore';
import {
  getAllCashRegisterEntries,
  saveCashRegisterEntry,
} from '@/lib/db';

export function useStore() {
  const [view, setView] = useState<View>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [cashEntries, setCashEntries] = useState<CashRegisterEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recurringEntries, setRecurringEntries] = useState<RecurringEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const comp = await getCompany();
      if (!comp) {
        setHasCompany(false);
        setCompany(null);
        setLoading(false);
        return;
      }
      setHasCompany(true);
      setCompany(comp);

      const [acc, ent, cash, cust, inv, rec] = await Promise.all([
        getAllAccounts(),
        getAllEntries(),
        getAllCashRegisterEntries(),
        getAllCustomers(),
        getAllInvoices(),
        getAllRecurringEntries(),
      ]);
      setAccounts(acc);
      setEntries(ent);
      setCashEntries(cash);
      setCustomers(cust);
      setInvoices(inv);
      setRecurringEntries(rec);
      setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    } catch (e) {
      console.error('Error loading data:', e);
      showToast('Virhe ladattaessa tietoja', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshAccounts = useCallback(async () => {
    const acc = await getAllAccounts();
    setAccounts(acc);
  }, []);

  const refreshEntries = useCallback(async () => {
    const ent = await getAllEntries();
    setEntries(ent);
  }, []);

  const refreshCashEntries = useCallback(async () => {
    const cash = await getAllCashRegisterEntries();
    setCashEntries(cash);
  }, []);

  const refreshCustomers = useCallback(async () => {
    const cust = await getAllCustomers();
    setCustomers(cust);
  }, []);

  const refreshInvoices = useCallback(async () => {
    const inv = await getAllInvoices();
    setInvoices(inv);
  }, []);

  const refreshRecurring = useCallback(async () => {
    const rec = await getAllRecurringEntries();
    setRecurringEntries(rec);
  }, []);

  const addEntry = useCallback(async (entry: Entry) => {
    await saveEntry(entry);
    await refreshEntries();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Tosite tallennettu', 'success');
  }, [refreshEntries, showToast]);

  const removeEntry = useCallback(async (id: string) => {
    await deleteEntry(id);
    await refreshEntries();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Tosite poistettu', 'success');
  }, [refreshEntries, showToast]);

  const addAccount = useCallback(async (account: Account) => {
    await saveAccount(account);
    await refreshAccounts();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Tili tallennettu', 'success');
  }, [refreshAccounts, showToast]);

  const removeAccount = useCallback(async (id: string) => {
    await deleteAccount(id);
    await refreshAccounts();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Tili poistettu', 'success');
  }, [refreshAccounts, showToast]);

  const updateCompany = useCallback(async (comp: Company) => {
    await saveCompany(comp);
    setCompany(comp);
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Yrityksen tiedot päivitetty', 'success');
  }, [showToast]);

  const addCashEntry = useCallback(async (entry: CashRegisterEntry) => {
    await saveCashRegisterEntry(entry);
    await refreshCashEntries();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Kassatapahtuma tallennettu', 'success');
  }, [refreshCashEntries, showToast]);

  const addCustomer = useCallback(async (customer: Customer) => {
    await saveCustomer(customer);
    await refreshCustomers();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Asiakas tallennettu', 'success');
  }, [refreshCustomers, showToast]);

  const removeCustomer = useCallback(async (id: string) => {
    await deleteCustomer(id);
    await refreshCustomers();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Asiakas poistettu', 'success');
  }, [refreshCustomers, showToast]);

  const addInvoice = useCallback(async (invoice: Invoice) => {
    await saveInvoice(invoice);
    await refreshInvoices();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Lasku tallennettu', 'success');
  }, [refreshInvoices, showToast]);

  const removeInvoice = useCallback(async (id: string) => {
    await deleteInvoice(id);
    await refreshInvoices();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Lasku poistettu', 'success');
  }, [refreshInvoices, showToast]);

  const addRecurringEntry = useCallback(async (entry: RecurringEntry) => {
    await saveRecurringEntry(entry);
    await refreshRecurring();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Toistuva tosite tallennettu', 'success');
  }, [refreshRecurring, showToast]);

  const removeRecurringEntry = useCallback(async (id: string) => {
    await deleteRecurringEntry(id);
    await refreshRecurring();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Toistuva tosite poistettu', 'success');
  }, [refreshRecurring, showToast]);

  const filteredEntries = entries.filter((e) => {
    if (selectedAccountId) {
      return e.lines.some((l) => l.accountId === selectedAccountId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.number.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.lines.some((l) => l.description.toLowerCase().includes(q) || l.accountName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const accountBalance = useCallback((accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return 0;
    let balance = 0;
    entries.forEach((e) => {
      e.lines.forEach((l) => {
        if (l.accountId === accountId) {
          if (acc.type === 'asset' || acc.type === 'expense') {
            balance += l.debit - l.credit;
          } else {
            balance += l.credit - l.debit;
          }
        }
      });
    });
    return balance;
  }, [entries, accounts]);

  const totalVatPayable = entries.reduce((sum, e) => {
    return sum + e.lines
      .filter((l) => l.accountNumber === '29391')
      .reduce((s, l) => s + l.credit - l.debit, 0);
  }, 0);

  const totalVatDeductible = entries.reduce((sum, e) => {
    return sum + e.lines
      .filter((l) => l.accountNumber === '29392')
      .reduce((s, l) => s + l.debit - l.credit, 0);
  }, 0);

  const cashBalance = cashEntries.reduce((sum, e) => {
    return e.type === 'in' ? sum + e.amount : sum - e.amount;
  }, 0);

  return {
    view,
    setView,
    accounts,
    entries,
    filteredEntries,
    company,
    cashEntries,
    loading,
    hasCompany,
    selectedAccountId,
    setSelectedAccountId,
    searchQuery,
    setSearchQuery,
    entryModalOpen,
    setEntryModalOpen,
    editingEntry,
    setEditingEntry,
    lastBackup,
    toast,
    addEntry,
    removeEntry,
    addAccount,
    removeAccount,
    updateCompany,
    addCashEntry,
    accountBalance,
    totalVatPayable,
    totalVatDeductible,
    cashBalance,
    customers,
    invoices,
    recurringEntries,
    refreshCustomers,
    refreshInvoices,
    refreshRecurring,
    refreshAccounts,
    refreshEntries,
    loadData,
    addCustomer,
    removeCustomer,
    addInvoice,
    removeInvoice,
    addRecurringEntry,
    removeRecurringEntry,
  };
}
