import { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, TrendingUp, Wallet, Landmark, Coins, Sparkles, Upload, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
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
import type { PersonalEntry, BankAccount, CashRegisterEntry, BankTransaction } from '@/types';
import { format, parseISO, subMonths, startOfMonth } from 'date-fns';
import { fi } from 'date-fns/locale';

interface PersonalFinanceProps {
  entries: PersonalEntry[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  cashEntries: CashRegisterEntry[];
  onAddEntry: (entry: PersonalEntry) => void;
  onDeleteEntry: (id: string) => void;
}

interface CsvRow {
  date: string;
  description: string;
  amount: number;
  raw: string[];
}

interface ParsedRow extends CsvRow {
  id: string;
  type: 'income' | 'expense';
  category: string;
  confidence: 'high' | 'medium' | 'low';
  selected: boolean;
}

const expenseCategories = [
  { id: 'ruoka', name: 'Ruoka', color: '#ef4444' },
  { id: 'asuminen', name: 'Asuminen', color: '#f97316' },
  { id: 'liikenne', name: 'Liikenne', color: '#f59e0b' },
  { id: 'viihde', name: 'Viihde', color: '#84cc16' },
  { id: 'terveys', name: 'Terveys', color: '#10b981' },
  { id: 'vaatteet', name: 'Vaatteet', color: '#06b6d4' },
  { id: 'koulutus', name: 'Koulutus', color: '#3b82f6' },
  { id: 'muut', name: 'Muut', color: '#6366f1' },
];

const incomeCategories = [
  { id: 'palkka', name: 'Palkka', color: '#16a34a' },
  { id: 'sivutulo', name: 'Sivutulo', color: '#22c55e' },
  { id: 'myynti', name: 'Myynti', color: '#4ade80' },
  { id: 'muut-tulot', name: 'Muut tulot', color: '#86efac' },
];

const allCategories = [...incomeCategories, ...expenseCategories];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  palkka: ['palkka', 'salary', 'palkkio', 'korvaus', 'palkkaus', 'wage', 'payroll'],
  sivutulo: ['sivutulo', 'sivu', 'freelance', 'konsultti', 'vuokratulo', 'vuokra', 'osinko', 'hyvitys', 'korvaus'],
  myynti: ['myynti', 'myy', 'myydy', 'kauppa', 'myyntituotto', 'myyty'],
  ruoka: ['ruoka', 'prisma', 'k-market', 's-market', 'alepa', 'sale', 'lidl', 'stockmann', 'citymarket', 'kärkkäinen', 'food', 'sushi', 'pizza', 'ravintola', 'kahvila', 'kahvi', 'ruokakauppa', 'supermarket', 'market'],
  asuminen: ['asuminen', 'vuokra', 'hoitovastike', 'vastike', 'sähkö', 'vesi', 'lämmitys', 'kiinteistö', 'asunto', 'dna', 'elisa', 'tel', 'nett', 'kiinteistöhuolto', 'isännöinti'],
  liikenne: ['liikenne', 'bussi', 'juna', 'metro', 'taksi', 'uber', 'bolt', 'polttoaine', 'bensa', 'diesel', 'auto', 'rengas', 'huolto', 'katsastus', 'pysäköinti', 'vr', ' hsl', 'matkakortti'],
  viihde: ['viihde', 'elokuva', 'konsertti', 'teatteri', 'spotify', 'netflix', 'hbo', 'disney', 'youtube', 'peli', 'ravintola', 'baari', 'pub', 'olut', 'viini', 'harrastus', 'keilaus'],
  terveys: ['terveys', 'apteekki', 'lääkäri', 'hammas', 'sairaala', 'kela', 'vakuutus', 'terveydenhuolto', 'fysioterapia', 'psykologi', 'optikko', 'mehiläinen', 'terveystalo', 'pihlajalinna'],
  vaatteet: ['vaatteet', 'vaate', 'kenkä', 'h&m', 'zalando', 'cubus', 'dressmann', 'gina', 'tokmanni', 'asko', 'ikea', 'sisustus', 'huonekalu', 'muoti'],
  koulutus: ['koulutus', 'kirja', 'opiskelu', 'kurssi', 'koulu', 'yliopisto', 'kirjasto', 'sanoma', 'tietokirja', 'lukio', 'ammattikoulu', 'opinto', 'luent'],
  muut: ['lahjoitus', 'jäsenmaksu', 'maksu', 'kulu', 'muu', 'pankkikulu', 'kulut', 'nosto', 'siirto'],
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

function parseAmount(value: string): number | null {
  if (!value) return null;
  const normalized = value
    .replace(/\s+/g, '')
    .replace('€', '')
    .replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function normalizeDate(value: string): string | null {
  if (!value) return null;
  const v = value.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // DD.MM.YYYY
  const dmy = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  // D.M.YYYY
  const dmy2 = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
  if (dmy2) {
    const year = parseInt(dmy2[3], 10);
    const fullYear = year >= 50 ? 1900 + year : 2000 + year;
    return `${fullYear}-${dmy2[2].padStart(2, '0')}-${dmy2[1].padStart(2, '0')}`;
  }
  // Try Date.parse
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

function detectAmountColumn(headers: string[], row: string[]): number {
  // Prefer columns named amount, summa, määrä, sum, etc.
  const amountIdx = headers.findIndex((h) =>
    ['amount', 'summa', 'määrä', 'sum', 'euro', 'eur'].some((k) => h.toLowerCase().includes(k))
  );
  if (amountIdx >= 0) return amountIdx;
  // Fallback: find column that looks like a number
  return row.findIndex((cell) => parseAmount(cell) !== null);
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const delimiter = text.includes('\t') ? '\t' : ';';
  const header = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cells.length < 3) continue;
    const dateIdx = header.findIndex((h) => /päivä|date|pvm|kirjauspäivä|arvo|maksupäivä/i.test(h)) || 0;
    const descIdx = header.findIndex((h) => /kuvaus|selitys|description|nimi|saaja|maksaja|viite/i.test(h));
    const amountIdx = detectAmountColumn(header, cells);
    const date = normalizeDate(cells[Math.max(0, dateIdx)]);
    const description = cells[descIdx >= 0 ? descIdx : 1] || '';
    const amount = parseAmount(cells[amountIdx >= 0 ? amountIdx : cells.length - 1]);
    if (!date || amount === null || !description) continue;
    rows.push({ date, description, amount, raw: cells });
  }
  return rows;
}

function autoCategorize(description: string, amount: number): { type: 'income' | 'expense'; category: string; confidence: 'high' | 'medium' | 'low' } {
  const desc = description.toLowerCase();
  // Income first — high confidence
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!incomeCategories.some((c) => c.id === cat)) continue;
    if (keywords.some((k) => desc.includes(k))) {
      return { type: 'income', category: cat, confidence: 'high' };
    }
  }
  // Expense categories
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!expenseCategories.some((c) => c.id === cat)) continue;
    if (keywords.some((k) => desc.includes(k))) {
      return { type: 'expense', category: cat, confidence: 'high' };
    }
  }
  // Partial matches for expenses
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!expenseCategories.some((c) => c.id === cat)) continue;
    for (const kw of keywords) {
      if (kw.length > 3 && desc.includes(kw.slice(0, kw.length - 1))) {
        return { type: 'expense', category: cat, confidence: 'medium' };
      }
    }
  }
  // Fallback by amount sign
  return { type: amount >= 0 ? 'income' : 'expense', category: 'muut', confidence: 'low' };
}

function createDemoData(): Omit<PersonalEntry, 'id' | 'createdAt'>[] {
  const mk = monthKey(new Date());
  return [
    { date: `${mk}-01`, description: 'Palkka', amount: 3200, category: 'palkka' },
    { date: `${mk}-02`, description: 'Sivutulo verkkokaupasta', amount: 250, category: 'sivutulo' },
    { date: `${mk}-03`, description: 'Ruokaostokset Prisma', amount: -85.5, category: 'ruoka' },
    { date: `${mk}-04`, description: 'Vuokra', amount: -950, category: 'asuminen' },
    { date: `${mk}-05`, description: 'Bussilippu', amount: -55, category: 'liikenne' },
    { date: `${mk}-06`, description: 'Elokuvat', amount: -28, category: 'viihde' },
    { date: `${mk}-07`, description: 'Apteekki', amount: -32.4, category: 'terveys' },
    { date: `${mk}-08`, description: 'Uudet kengät', amount: -89.9, category: 'vaatteet' },
    { date: `${mk}-09`, description: 'Verkkokurssi', amount: -49, category: 'koulutus' },
    { date: `${mk}-10`, description: 'Kahvit ja lahjat', amount: -24.6, category: 'muut' },
    { date: `${mk}-11`, description: 'Sähkölasku', amount: -62, category: 'asuminen' },
    { date: `${mk}-12`, description: 'Polttoaine', amount: -74, category: 'liikenne' },
    { date: `${mk}-13`, description: 'Spotify', amount: -12.99, category: 'viihde' },
    { date: `${mk}-14`, description: 'Kirja', amount: -24.9, category: 'koulutus' },
    { date: `${mk}-15`, description: 'Lounas', amount: -13.5, category: 'ruoka' },
  ];
}

export default function PersonalFinance({
  entries,
  bankAccounts,
  bankTransactions,
  cashEntries,
  onAddEntry,
  onDeleteEntry,
}: PersonalFinanceProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('cash');
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const [previewRows, setPreviewRows] = useState<ParsedRow[] | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategories = type === 'income' ? incomeCategories : expenseCategories;

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => e.date.startsWith(selectedMonth));
  }, [entries, selectedMonth]);

  const totals = useMemo(() => {
    const income = filteredEntries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
    const expense = filteredEntries.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    return { income, expense, savings, savingsRate };
  }, [filteredEntries]);

  const cashBalance = useMemo(() => {
    return cashEntries.reduce((sum, e) => (e.type === 'in' ? sum + e.amount : sum - e.amount), 0);
  }, [cashEntries]);

  const accountBalances = useMemo(() => {
    return bankAccounts.map((acc) => {
      const txs = bankTransactions.filter((t) => t.accountId === acc.id);
      const change = txs.reduce((sum, t) => sum + t.amount, 0);
      return { ...acc, balance: (acc.initialBalance || 0) + change };
    });
  }, [bankAccounts, bankTransactions]);

  const totalWealth = useMemo(() => {
    return accountBalances.reduce((sum, a) => sum + a.balance, 0) + cashBalance;
  }, [accountBalances, cashBalance]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(now, i));
      const label = format(start, 'MMM', { locale: fi });
      const mk = format(start, 'yyyy-MM');
      const monthEntries = entries.filter((e) => e.date.startsWith(mk));
      const income = monthEntries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
      const expense = monthEntries.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
      months.push({ month: label, income, expense });
    }
    return months;
  }, [entries]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(numAmount) || !category) return;
    const signedAmount = type === 'income' ? Math.abs(numAmount) : -Math.abs(numAmount);
    onAddEntry({
      id: generateId(),
      date,
      description: description.trim(),
      amount: signedAmount,
      category,
      accountId: accountId === 'cash' ? undefined : accountId,
      createdAt: new Date().toISOString(),
    });
    setDescription('');
    setAmount('');
    setCategory('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      const rows = parseCsv(text);
      const parsed: ParsedRow[] = rows.map((r) => {
        const auto = autoCategorize(r.description, r.amount);
        return {
          ...r,
          id: generateId(),
          type: auto.type,
          category: auto.category,
          confidence: auto.confidence,
          selected: true,
        };
      });
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
        ? prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  category,
                  type: incomeCategories.some((c) => c.id === category) ? 'income' : 'expense',
                }
              : r
          )
        : null
    );
  };

  const savePreview = async () => {
    if (!previewRows) return;
    const selected = previewRows.filter((r) => r.selected);
    for (const row of selected) {
      await onAddEntry({
        id: generateId(),
        date: row.date,
        description: row.description,
        amount: row.type === 'income' ? Math.abs(row.amount) : -Math.abs(row.amount),
        category: row.category,
        accountId: accountId === 'cash' ? undefined : accountId,
        createdAt: new Date().toISOString(),
      });
    }
    setPreviewRows(null);
    setSuccess(`Tallennettu ${selected.length} tapahtumaa`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const addDemoData = () => {
    const demo = createDemoData();
    for (const entry of demo) {
      onAddEntry({ ...entry, id: generateId(), createdAt: new Date().toISOString() });
    }
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

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-md shadow-lg text-sm font-medium">
          {success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Oma talous</h2>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
          {entries.length === 0 && (
            <Button variant="outline" size="sm" onClick={addDemoData}>
              <Sparkles className="w-4 h-4 mr-2" /> Demo
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
                      <td className="px-3 py-2">{row.description}</td>
                      <td className="px-3 py-2">
                        <Badge variant={row.confidence === 'high' ? 'default' : row.confidence === 'medium' ? 'secondary' : 'outline'}>
                          {row.confidence === 'high' ? 'Korkea' : row.confidence === 'medium' ? 'Keski' : 'Matala'}
                        </Badge>
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.amount > 0 ? '+' : ''}{row.amount.toFixed(2)} €
                      </td>
                      <td className="px-3 py-2">
                        <Select value={row.category} onValueChange={(v) => updatePreviewCategory(row.id, v)}>
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allCategories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
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
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2"><Landmark className="w-4 h-4" /> {acc.name}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-xl font-bold text-gray-900">{acc.balance.toFixed(2)} €</p></CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2"><Coins className="w-4 h-4" /> Käteiskassa</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold text-gray-900">{cashBalance.toFixed(2)} €</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2"><Wallet className="w-4 h-4" /> Varallisuus yht.</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold text-blue-600">{totalWealth.toFixed(2)} €</p></CardContent>
        </Card>
      </div>

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
                return (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">{entry.description}</p>
                      <p className="text-xs text-gray-500">{format(parseISO(entry.date), 'dd.MM.yyyy', { locale: fi })} • {cat?.name || entry.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(2)} €</span>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteEntry(entry.id)} aria-label="Poista tapahtuma"><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
