import { useState, useEffect, useCallback } from 'react';
import type { Account, Entry, Company, CashRegisterEntry, View, Ledger, BankAccount, PersonalEntry, Budget } from '@/types';
import {
  getAllAccounts,
  getAllEntries,
  getCompany,
  saveEntry,
  saveAccount,
  getEntryById,
  deleteEntry,
  deleteAccount,
  saveCompany,
  saveCompanyToLedger,
  getAllLedgers,
  migrateToLedgers,
  setActiveLedgerId,
  getActiveLedgerId,
  saveLedger,
  seedLedgerAccounts,
  getAllBankAccounts,
  saveBankAccount,
  getAllPersonalEntries,
  savePersonalEntry,
  deletePersonalEntry,
  getAllBudgets,
  saveBudget,
  getAllCashRegisterEntries,
  saveCashRegisterEntry,
  saveManyPersonalEntries,
  deleteAllPersonalEntries,
  allocateEntryNumber,
} from '@/lib/firestore';
import { highestNumber } from '@/lib/numbering';
import { deleteAttachment } from '@/lib/storage';
import { migrateLegacyLocalData, migrateLegacyPersonalEntries } from '@/lib/legacyMigration';
import { resolveLedgerSelection } from '@/lib/ledgerSelection';
import { auth } from '@/firebase/config';

export function useStore() {
  const [view, setView] = useState<View>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [cashEntries, setCashEntries] = useState<CashRegisterEntry[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [personalEntries, setPersonalEntries] = useState<PersonalEntry[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [activeLedgerId, setActiveLedgerIdState] = useState<string>(() => getActiveLedgerId());
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;

      let existingLedgers = await getAllLedgers();
      if (existingLedgers.length === 0) {
        await migrateToLedgers();
        existingLedgers = await getAllLedgers();
      }
      setLedgers(existingLedgers);

      // Onboarding on vain ensimmäisen käytön näkymä. Aiemmin se vaadittiin
      // jokaiselta yritystilikirjalta, jolta puuttui yritysdokumentti, jolloin
      // sivupalkista lisätty yritys ei näkynyt missään eikä takaisin aiempaan
      // tilikirjaan päässyt. Ks. lib/ledgerSelection.
      const selection = resolveLedgerSelection(existingLedgers, getActiveLedgerId());
      const currentLedgerId = selection.ledgerId;
      if (selection.needsOnboarding || currentLedgerId === null) {
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }
      if (selection.ledgerChanged) setActiveLedgerId(currentLedgerId);
      setActiveLedgerIdState(currentLedgerId);
      setNeedsOnboarding(false);

      // Siirtaa aiemmin paikallisesti tallennetun aineiston Firestoreen kertaalleen.
      // Vasta tassa, jotta kohdetilikirja on varmasti olemassa.
      if (uid) {
        await migrateLegacyLocalData(uid, currentLedgerId);
      }

      const isPersonal = selection.isPersonal;

      // Yritystiedot luetaan aina uudelleen; null tyhjentää edellisen
      // tilikirjan tiedot, jottei esimerkiksi laskulle päädy väärä nimi.
      setCompany(await getCompany());

      if (isPersonal) {
        if (uid) {
          await migrateLegacyPersonalEntries(uid, currentLedgerId);
        }
        const [pers, bgt, bankAcc] = await Promise.all([
          getAllPersonalEntries(),
          getAllBudgets(),
          getAllBankAccounts(),
        ]);
        setPersonalEntries(pers);
        setBudgets(bgt);
        setBankAccounts(bankAcc);
        setAccounts([]);
        setEntries([]);
        setCashEntries([]);
      } else {
        // Laskutus, asiakkaat ja toistuvat kirjaukset lataa kukin nakyma itse.
        const [acc, ent, cash, bankAcc] = await Promise.all([
          getAllAccounts(),
          getAllEntries(),
          getAllCashRegisterEntries(),
          getAllBankAccounts(),
        ]);
        setAccounts(acc);
        setEntries(ent);
        setCashEntries(cash);
        setBankAccounts(bankAcc);
        setPersonalEntries([]);
        setBudgets([]);
      }
      setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    } catch (e) {
      console.error('Virhe ladattaessa tietoja:', e);
      showToast('Virhe ladattaessa tietoja', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const changeActiveLedger = useCallback(async (ledgerId: string) => {
    setActiveLedgerId(ledgerId);
    setActiveLedgerIdState(ledgerId);
    setSelectedAccountId(null);
    setSearchQuery('');
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, activeLedgerId]);

  const createLedger = useCallback(async (data: Omit<Ledger, 'id' | 'createdAt'>) => {
    const id = generateId();
    const ledger: Ledger = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    // Firestore does not accept undefined values
    if (!ledger.yTunnus) delete (ledger as Partial<Ledger>).yTunnus;
    if (!ledger.address) delete (ledger as Partial<Ledger>).address;
    if (!ledger.description) delete (ledger as Partial<Ledger>).description;
    await saveLedger(ledger);
    await seedLedgerAccounts(id, ledger.type);

    // Yritystilikirjalle luodaan yritystiedot heti tilikirjan tiedoista, jotta
    // nimi näkyy laskuilla ja asetuksissa ilman erillistä täyttövaihetta.
    if (ledger.type === 'company') {
      await saveCompanyToLedger(id, {
        id: 'main',
        name: ledger.name,
        yTunnus: ledger.yTunnus ?? '',
        address: ledger.address ?? '',
        postalCode: '',
        city: '',
        vatRegistered: ledger.vatRegistered,
        fiscalYearStart: '01-01',
        fiscalYearEnd: '12-31',
        accountantName: '',
        accountantEmail: '',
        accountantPhone: '',
      });
    }

    await changeActiveLedger(id);
    showToast('Tilikirja luotu', 'success');
  }, [changeActiveLedger, showToast]);

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

  const refreshBankAccounts = useCallback(async () => {
    const acc = await getAllBankAccounts();
    setBankAccounts(acc);
  }, []);

  const refreshPersonalEntries = useCallback(async () => {
    const pers = await getAllPersonalEntries();
    setPersonalEntries(pers);
  }, []);

  const refreshBudgets = useCallback(async () => {
    const bgt = await getAllBudgets();
    setBudgets(bgt);
  }, []);

  const addEntry = useCallback(async (entry: Entry) => {
    // Tositteet numeroidaan juoksevasti. Numero varataan vasta tallennuksessa
    // transaktiolla, jotta kaksi samanaikaista tallennusta ei saa samaa numeroa.
    // Olemassa olevan tositteen numero sailyy ennallaan.
    const number = entry.number.trim()
      ? entry.number.trim()
      : await allocateEntryNumber(highestNumber(entries.map((e) => e.number)));
    await saveEntry({ ...entry, number });
    await refreshEntries();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast(`Tosite ${number} tallennettu`, 'success');
  }, [entries, refreshEntries, showToast]);

  const removeEntry = useCallback(async (id: string) => {
    const entry = await getEntryById(id);
    if (entry) {
      for (const att of entry.attachments) {
        if (att.path) {
          try {
            await deleteAttachment(att.path);
          } catch (e) {
            console.error('Failed to delete attachment:', e);
          }
        }
      }
    }
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

  const addPersonalEntry = useCallback(async (entry: PersonalEntry) => {
    await savePersonalEntry(entry);
    await refreshPersonalEntries();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Tapahtuma tallennettu', 'success');
  }, [refreshPersonalEntries, showToast]);

  const removePersonalEntry = useCallback(async (id: string) => {
    await deletePersonalEntry(id);
    await refreshPersonalEntries();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Tapahtuma poistettu', 'success');
  }, [refreshPersonalEntries, showToast]);

  const addBankAccount = useCallback(async (account: BankAccount) => {
    await saveBankAccount(account);
    await refreshBankAccounts();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Tili tallennettu', 'success');
  }, [refreshBankAccounts, showToast]);

  const addPersonalEntries = useCallback(async (entries: PersonalEntry[]) => {
    if (entries.length === 0) return;
    await saveManyPersonalEntries(entries);
    await refreshPersonalEntries();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast(`Tallennettu ${entries.length} tapahtumaa`, 'success');
  }, [refreshPersonalEntries, showToast]);

  const clearPersonalEntries = useCallback(async () => {
    await deleteAllPersonalEntries();
    await refreshPersonalEntries();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Oman talouden tapahtumat poistettu', 'success');
  }, [refreshPersonalEntries, showToast]);

  const addBudget = useCallback(async (budget: Budget) => {
    await saveBudget(budget);
    await refreshBudgets();
    setLastBackup(new Date().toLocaleTimeString('fi-FI'));
    showToast('Budjetti tallennettu', 'success');
  }, [refreshBudgets, showToast]);

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
    needsOnboarding,
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
    ledgers,
    activeLedgerId,
    setActiveLedger: changeActiveLedger,
    createLedger,
    loadData,
    ledgerModalOpen,
    setLedgerModalOpen,
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
    refreshAccounts,
    refreshEntries,
    bankAccounts,
    refreshBankAccounts,
    addBankAccount,
    personalEntries,
    budgets,
    refreshPersonalEntries,
    refreshBudgets,
    addPersonalEntry,
    addPersonalEntries,
    removePersonalEntry,
    clearPersonalEntries,
    addBudget,
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
