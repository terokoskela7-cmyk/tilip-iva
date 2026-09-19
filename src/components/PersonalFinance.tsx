import { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, TrendingUp, Wallet, Landmark, Coins, Upload, Save, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import type { PersonalEntry, BankAccount } from '@/types';
import { allCategories, expenseCategories, incomeCategories, isIncomeCategory } from '@/lib/personalCategories';
import { autoCategorize, parseCsv, type CsvRow } from '@/lib/personalCsv';
import { format, parseISO, subMonths, startOfMonth } from 'date-fns';
import { fi } from 'date-fns/locale';

interface DemoAccount {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'cash';
}

interface ParsedRow extends CsvRow {
  id: string;
  type: 'income' | 'expense';
  category: string;
  confidence: 'high' | 'medium' | 'low';
  selected: boolean;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 'checking', name: 'Kulutustili', balance: 2500, type: 'checking' },
  { id: 'savings', name: 'Palkka-Säästötili', balance: 5000, type: 'savings' },
  { id: 'cash', name: 'Käteiskassa', balance: 150, type: 'cash' },
];

const DEMO_ENTRIES: PersonalEntry[] = [
  { id: 'demo-1', date: '', description: 'Palkka', amount: 3200, category: 'palkka', createdAt: '' },
  { id: 'demo-2', date: '', description: 'Sivutulo verkkokaupasta', amount: 250, category: 'sivutulo', createdAt: '' },
  { id: 'demo-3', date: '', description: 'Ruokaostokset Prisma', amount: -85.5, category: 'ruoka', createdAt: '' },
  { id: 'demo-4', date: '', description: 'Vuokra', amount: -950, category: 'asuminen', createdAt: '' },
  { id: 'demo-5', date: '', description: 'Bussilippu', amount: -55, category: 'liikenne', createdAt: '' },
  { id: 'demo-6', date: '', description: 'Elokuvat', amount: -28, category: 'viihde', createdAt: '' },
  { id: 'demo-7', date: '', description: 'Apteekki', amount: -32.4, category: 'terveys', createdAt: '' },
  { id: 'demo-8', date: '', description: 'Uudet kengät', amount: -89.9, category: 'vaatteet', createdAt: '' },
  { id: 'demo-9', date: '', description: 'Verkkokurssi', amount: -49, category: 'koulutus', createdAt: '' },
  { id: 'demo-10', date: '', description: 'Kahvit ja lahjat', amount: -24.6, category: 'muut', createdAt: '' },
  { id: 'demo-11', date: '', description: 'Sähkölasku', amount: -62, category: 'bills', createdAt: '' },
  { id: 'demo-12', date: '', description: 'Polttoaine', amount: -74, category: 'liikenne', createdAt: '' },
  { id: 'demo-13', date: '', description: 'Spotify', amount: -12.99, category: 'viihde', createdAt: '' },
  { id: 'demo-14', date: '', description: 'Kirja', amount: -24.9, category: 'koulutus', createdAt: '' },
  { id: 'demo-15', date: '', description: 'Lounas', amount: -13.5, category: 'ruoka', createdAt: '' },
];

function createDemoEntries(month: string): PersonalEntry[] {
  const now = new Date().toISOString();
  return DEMO_ENTRIES.map((entry, index) => ({
    ...entry,
    id: `demo-${index + 1}`,
    date: `${month}-${String(index + 1).padStart(2, '0')}`,
    createdAt: now,
  }));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

function CategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = allCategories.find((c) => c.id === value);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs border-gray-200">
        <div className="flex items-center gap-2">
          {selected && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />}
          <span className="truncate">{selected?.name || value}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectGroup>
          <SelectLabel className="text-xs font-semibold text-gray-400 uppercase">Tulot</SelectLabel>
          {incomeCategories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id} className="text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel className="text-xs font-semibold text-gray-400 uppercase">Menot</SelectLabel>
          {expenseCategories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id} className="text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

interface PersonalFinanceProps {
  entries: PersonalEntry[];
  bankAccounts: BankAccount[];
  onAddEntry: (entry: PersonalEntry) => void;
  onAddEntries: (entries: PersonalEntry[]) => Promise<void>;
  onAddAccount: (account: BankAccount) => Promise<void>;
  onDeleteEntry: (id: string) => void;
  onClearEntries: () => Promise<void>;
}

export default function PersonalFinance({
  entries,
  bankAccounts,
  onAddEntry,
  onAddEntries,
  onAddAccount,
  onDeleteEntry,
  onClearEntries,
}: PersonalFinanceProps) {
  const currentMonth = monthKey(new Date());
  const [demoMode, setDemoMode] = useState(false);
  const [csvAccountId, setCsvAccountId] = useState<string>('cash');

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('cash');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [previewRows, setPreviewRows] = useState<ParsedRow[] | null>(null);
  const [accountModal, setAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const demoEntries = useMemo(() => (demoMode ? createDemoEntries(selectedMonth) : []), [demoMode, selectedMonth]);

  // Firestore on ainoa tallennuspaikka; demo-tapahtumat naytetaan vain, niita ei tallenneta.
  const displayEntries = useMemo(() => {
    return [...entries, ...demoEntries];
  }, [entries, demoEntries]);

  const filteredEntries = useMemo(() => {
    return displayEntries.filter((e) => e.date.startsWith(selectedMonth));
  }, [displayEntries, selectedMonth]);

  const totals = useMemo(() => {
    const income = filteredEntries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
    const expense = filteredEntries.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    return { income, expense, savings, savingsRate };
  }, [filteredEntries]);

  // Tilin saldo = alkusaldo + kaikki sille kohdistetut tapahtumat.
  const accountBalances = useMemo(() => {
    const demo: DemoAccount[] = demoMode ? DEMO_ACCOUNTS : [];
    const real = bankAccounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: 'checking' as const,
      balance: displayEntries
        .filter((e) => e.accountId === acc.id)
        .reduce((sum, e) => sum + e.amount, acc.initialBalance),
    }));
    return [...real, ...demo];
  }, [bankAccounts, displayEntries, demoMode]);

  const totalWealth = useMemo(() => {
    return accountBalances.reduce((sum, a) => sum + a.balance, 0);
  }, [accountBalances]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(now, i));
      const label = format(start, 'MMM', { locale: fi });
      const mk = format(start, 'yyyy-MM');
      const monthEntries = displayEntries.filter((e) => e.date.startsWith(mk));
      const income = monthEntries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
      const expense = monthEntries.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
      months.push({ month: label, income, expense });
    }
    return months;
  }, [displayEntries]);

  const categoryData = (categories: typeof expenseCategories, isIncome: boolean) => {
    const data = categories.map((cat) => {
      const total = filteredEntries
        .filter((e) => (isIncome ? e.amount > 0 : e.amount < 0) && e.category === cat.id)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const max = Math.max(
        ...categories.map((c) =>
          filteredEntries
            .filter((e) => (isIncome ? e.amount > 0 : e.amount < 0) && e.category === c.id)
            .reduce((sum, e) => sum + Math.abs(e.amount), 0)
        ),
        1
      );
      return { ...cat, total, pct: (total / max) * 100 };
    });
    return data;
  };

  const expenseData = categoryData(expenseCategories, false);
  const incomeData = categoryData(incomeCategories, true);

  const selectedCategories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(numAmount) || !category) return;
    const signedAmount = type === 'income' ? Math.abs(numAmount) : -Math.abs(numAmount);
    const entry: PersonalEntry = {
      id: generateId(),
      date,
      description: description.trim(),
      amount: signedAmount,
      category,
      accountId: accountId === 'cash' ? undefined : accountId,
      createdAt: new Date().toISOString(),
    };
    onAddEntry(entry);
    setDescription('');
    setAmount('');
    setCategory('');
  };

  const handleDelete = (id: string) => {
    onDeleteEntry(id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      const rows = parseCsv(text);
      const parsed: ParsedRow[] = rows
        .map((r) => {
          const auto = autoCategorize(r.description, r.txType || '', r.message || '', r.amount);
          return {
            ...r,
            id: generateId(),
            type: auto.skip ? 'expense' : auto.type,
            category: auto.category,
            confidence: auto.confidence,
            selected: !auto.skip,
          };
        })
        .filter((r) => r.selected);
      setPreviewRows(parsed);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleRow = (id: string) => {
    setPreviewRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)) : null));
  };

  const toggleAll = (checked: boolean) => {
    setPreviewRows((prev) => (prev ? prev.map((r) => ({ ...r, selected: checked })) : null));
  };

  const updatePreviewCategory = (id: string, category: string) => {
    setPreviewRows((prev) =>
      prev
        ? prev.map((r) => {
            if (r.id !== id) return r;
            const isIncomeCat = isIncomeCategory(category);
            return {
              ...r,
              category,
              type: isIncomeCat ? 'income' : 'expense',
            };
          })
        : null
    );
  };

  const savePreview = async () => {
    if (!previewRows) return;
    const selected = previewRows.filter((r) => r.selected);
    const now = new Date().toISOString();
    const newEntries: PersonalEntry[] = selected.map((row) => ({
      id: generateId(),
      date: row.date,
      description: row.description,
      amount: row.type === 'income' ? Math.abs(row.amount) : -Math.abs(row.amount),
      category: row.category,
      accountId: csvAccountId === 'cash' ? undefined : csvAccountId,
      createdAt: now,
    }));
    // Yksi eratallennus yksittaisten kirjoitusten sijaan.
    await onAddEntries(newEntries);
    setPreviewRows(null);
  };

  const toggleDemo = () => {
    setDemoMode((prev) => !prev);
  };

  const handleAddAccount = async () => {
    const balance = parseFloat((newAccountBalance || '0').replace(',', '.'));
    if (!newAccountName.trim() || isNaN(balance)) return;
    await onAddAccount({
      id: generateId(),
      name: newAccountName.trim(),
      iban: '',
      bank: '',
      currency: 'EUR',
      initialBalance: balance,
      createdAt: new Date().toISOString(),
    });
    setNewAccountName('');
    setNewAccountBalance('');
    setAccountModal(false);
  };

  const clearAllData = async () => {
    if (!window.confirm('Tyhjennetäänkö kaikki Oma talous -tapahtumat? Tätä ei voi peruuttaa.')) return;
    await onClearEntries();
    setDemoMode(false);
  };

  const restoreDemo = () => {
    setDemoMode(true);
  };

  const previewTotals = useMemo(() => {
    if (!previewRows) return null;
    const selected = previewRows.filter((r) => r.selected);
    const income = selected.filter((r) => r.type === 'income').reduce((sum, r) => sum + Math.abs(r.amount), 0);
    const expense = selected.filter((r) => r.type === 'expense').reduce((sum, r) => sum + Math.abs(r.amount), 0);
    return { income, expense, count: selected.length, total: previewRows.length };
  }, [previewRows]);

  const months = useMemo(() => {
    const now = new Date();
    const list: { value: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      list.push({ value: monthKey(d), label: format(d, 'MMMM yyyy', { locale: fi }) });
    }
    return list;
  }, []);

  const hasData = entries.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Oma talous</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 bg-white border rounded-md px-2 py-1">
            <Label className="text-xs text-gray-500 whitespace-nowrap">CSV-tili</Label>
            <Select value={csvAccountId} onValueChange={setCsvAccountId}>
              <SelectTrigger className="w-[160px] border-0 shadow-none h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Ei tiliä</SelectItem>
                {bankAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />

          <Button variant={demoMode ? 'default' : 'outline'} size="sm" onClick={toggleDemo}>
            {demoMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {demoMode ? 'Demo pois' : 'Demo'}
          </Button>

          {hasData ? (
            <Button variant="destructive" size="sm" onClick={clearAllData}>
              <Trash2 className="w-4 h-4 mr-2" /> Tyhjennä
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={restoreDemo}>
              <Eye className="w-4 h-4 mr-2" /> Demo takaisin
            </Button>
          )}
        </div>
      </div>

      {previewRows && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>CSV-esikatselu</span>
              <Button variant="ghost" size="sm" onClick={() => setPreviewRows(null)}><X className="w-4 h-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-gray-600">Tulot: <strong className="text-green-600">{previewTotals?.income.toFixed(2)} €</strong></span>
              <span className="text-gray-600">Menot: <strong className="text-red-600">{previewTotals?.expense.toFixed(2)} €</strong></span>
              <span className="text-gray-600">Valittu: <strong>{previewTotals?.count} / {previewTotals?.total}</strong></span>
            </div>
            <div className="max-h-[400px] overflow-y-auto border rounded-md bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left"><Checkbox checked={previewRows.every((r) => r.selected)} onCheckedChange={(v) => toggleAll(Boolean(v))} /></th>
                    <th className="px-3 py-2 text-left">Päivä</th>
                    <th className="px-3 py-2 text-left">Kuvaus</th>
                    <th className="px-3 py-2 text-left">Luottamus</th>
                    <th className="px-3 py-2 text-right">Summa</th>
                    <th className="px-3 py-2 text-left">Kategoria</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.id} className={row.selected ? '' : 'opacity-50'}>
                      <td className="px-3 py-2"><Checkbox checked={row.selected} onCheckedChange={() => toggleRow(row.id)} /></td>
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2">
                        {row.description}
                        {row.message && <p className="text-xs text-gray-500">{row.message}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={row.confidence === 'high' ? 'default' : row.confidence === 'medium' ? 'secondary' : 'outline'}>
                          {row.confidence === 'high' ? 'Korkea' : row.confidence === 'medium' ? 'Keski' : 'Matala'}
                        </Badge>
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.amount > 0 ? '+' : ''}{row.amount.toFixed(2)} €
                      </td>
                      <td className="px-3 py-2">
                        <CategorySelect
                          key={`cat-${row.id}-${row.category}`}
                          value={row.category}
                          onChange={(v) => updatePreviewCategory(row.id, v)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={savePreview} disabled={!previewTotals || previewTotals.count === 0}>
              <Save className="w-4 h-4 mr-2" /> Tallenna {previewTotals?.count || 0} tapahtumaa
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Tulot</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{totals.income.toFixed(2)} €</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Menot</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{totals.expense.toFixed(2)} €</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Netto / Säästöt</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{totals.savings.toFixed(2)} €</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Säästöaste</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-purple-600">{totals.savingsRate.toFixed(1)} %</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accountBalances.map((acc) => (
          <Card key={acc.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                {acc.type === 'cash' ? <Coins className="w-4 h-4" /> : <Landmark className="w-4 h-4" />} {acc.name}
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-xl font-bold text-gray-900">{acc.balance.toFixed(2)} €</p></CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2"><Wallet className="w-4 h-4" /> Varallisuus yht.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xl font-bold text-blue-600">{totalWealth.toFixed(2)} €</p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setAccountModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Lisää tili
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={accountModal} onOpenChange={setAccountModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Uusi tili</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pf-acc-name">Tilin nimi</Label>
              <Input id="pf-acc-name" placeholder="Esimerkiksi Kulutustili" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-acc-balance">Alkusaldo</Label>
              <Input id="pf-acc-balance" type="number" step="0.01" placeholder="0,00" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} />
              <p className="text-xs text-gray-500">Tilin saldo lasketaan alkusaldosta ja sille kohdistetuista tapahtumista.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountModal(false)}>Peruuta</Button>
            <Button onClick={handleAddAccount} disabled={!newAccountName.trim()}>Tallenna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Tulot vs. Menot</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
              <Legend />
              <Bar dataKey="income" name="Tulot" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Menot" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Menokategoriat</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {expenseData.map((cat) => (
              <div key={cat.id}>
                <div className="flex justify-between text-sm mb-1"><span>{cat.name}</span><span className="font-medium">{cat.total.toFixed(2)} €</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Tulokategoriat</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {incomeData.map((cat) => (
              <div key={cat.id}>
                <div className="flex justify-between text-sm mb-1"><span>{cat.name}</span><span className="font-medium">{cat.total.toFixed(2)} €</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Uusi tapahtuma</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tyyppi</Label>
                <Select value={type} onValueChange={(v) => { setType(v as 'income' | 'expense'); setCategory(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Tulo</SelectItem>
                    <SelectItem value="expense">Meno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="pf-date">Päivämäärä</Label><Input id="pf-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="pf-desc">Kuvaus</Label><Input id="pf-desc" placeholder="Esimerkiksi ruokaostokset" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="pf-amount">Summa</Label><Input id="pf-amount" type="number" step="0.01" placeholder="45,50" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Kategoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Valitse kategoria" /></SelectTrigger>
                  <SelectContent>
                    {selectedCategories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tili</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Käteiskassa</SelectItem>
                    {bankAccounts.map((acc) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={!description.trim() || !amount || !category}>Tallenna</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="text-lg">Viimeisimmät tapahtumat</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredEntries.length === 0 && <p className="text-gray-500 text-sm">Ei tapahtumia valitulta kuukaudelta.</p>}
              {filteredEntries.slice(0, 50).map((entry) => {
                const cat = allCategories.find((c) => c.id === entry.category);
                const isDemo = entry.id.startsWith('demo-');
                return (
                  <div key={entry.id} className={`flex items-center justify-between p-3 rounded-md ${isDemo ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-medium text-gray-900">{entry.description} {isDemo && <span className="text-xs text-blue-600 font-normal">(demo)</span>}</p>
                      <p className="text-xs text-gray-500">{format(parseISO(entry.date), 'dd.MM.yyyy', { locale: fi })} • {cat?.name || entry.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(2)} €</span>
                      {!isDemo && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} aria-label="Poista tapahtuma"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
