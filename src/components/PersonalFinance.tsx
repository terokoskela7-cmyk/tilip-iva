import { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import type { PersonalEntry, Budget, Account } from '@/types';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fi } from 'date-fns/locale';

interface PersonalFinanceProps {
  entries: PersonalEntry[];
  budgets: Budget[];
  accounts: Account[];
  onAddEntry: (entry: PersonalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSaveBudget: (budget: Budget) => void;
}

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#7c3aed', '#db2777', '#0891b2', '#65a30d'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export default function PersonalFinance({ entries, budgets, accounts, onAddEntry, onDeleteEntry, onSaveBudget }: PersonalFinanceProps) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  const [budgetMonth, setBudgetMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const incomeCategories = useMemo(
    () => accounts.filter((a) => a.type === 'income').map((a) => ({ id: a.number, name: a.name })),
    [accounts]
  );
  const expenseCategories = useMemo(
    () => accounts.filter((a) => a.type === 'expense').map((a) => ({ id: a.number, name: a.name })),
    [accounts]
  );

  const totals = useMemo(() => {
    const income = entries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
    const expense = entries.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
    return { income, expense, savings: income - expense, savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0 };
  }, [entries]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    for (const e of entries) {
      const month = e.date.slice(0, 7);
      if (!map[month]) map[month] = { income: 0, expense: 0 };
      if (e.amount > 0) map[month].income += e.amount;
      else map[month].expense += Math.abs(e.amount);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({ month, ...values }));
  }, [entries]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      if (e.amount < 0) {
        map[e.category] = (map[e.category] || 0) + Math.abs(e.amount);
      }
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [entries]);

  const trendData = useMemo(() => {
    const now = new Date();
    const months: { month: string; savings: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = startOfMonth(subMonths(now, i));
      const end = endOfMonth(start);
      const label = format(start, 'MMM yyyy', { locale: fi });
      const monthEntries = entries.filter((e) => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start, end });
      });
      const income = monthEntries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
      const expense = monthEntries.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
      months.push({ month: label, savings: income - expense });
    }
    return months;
  }, [entries]);

  const currentMonthBudget = useMemo(
    () => budgets.find((b) => b.month === budgetMonth),
    [budgets, budgetMonth]
  );

  const budgetProgress = useMemo(() => {
    const monthStart = startOfMonth(parseISO(`${budgetMonth}-01`));
    const monthEnd = endOfMonth(monthStart);
    const actuals: Record<string, number> = {};
    for (const e of entries) {
      const d = parseISO(e.date);
      if (isWithinInterval(d, { start: monthStart, end: monthEnd }) && e.amount < 0) {
        actuals[e.category] = (actuals[e.category] || 0) + Math.abs(e.amount);
      }
    }
    const items = (currentMonthBudget?.items || []).map((item) => ({
      ...item,
      actual: actuals[item.categoryId] || 0,
    }));
    return items;
  }, [currentMonthBudget, entries, budgetMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(numAmount) || !category) return;
    onAddEntry({
      id: generateId(),
      date,
      description: description.trim(),
      amount: numAmount,
      category,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setDescription('');
    setAmount('');
    setNotes('');
  };

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(budgetAmount.replace(',', '.'));
    if (!budgetCategory || isNaN(numAmount)) return;

    const existingItems = currentMonthBudget?.items || [];
    const filtered = existingItems.filter((i) => i.categoryId !== budgetCategory);
    const newBudget: Budget = {
      id: budgetMonth,
      month: budgetMonth,
      items: [...filtered, { categoryId: budgetCategory, budgeted: numAmount, actual: 0 }],
    };
    onSaveBudget(newBudget);
    setBudgetAmount('');
  };

  const allCategories = [...incomeCategories, ...expenseCategories];

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Oma talous</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tulot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{totals.income.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Menot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{totals.expense.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Säästöt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{totals.savings.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Säästöaste</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{totals.savingsRate.toFixed(1)} %</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Add entry */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5" /> Uusi tapahtuma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pf-date">Päivämäärä</Label>
                <Input id="pf-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-desc">Kuvaus</Label>
                <Input id="pf-desc" placeholder="Esimerkiksi ruokaostokset" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-amount">Summa (positiivinen = tulo, negatiivinen = meno)</Label>
                <Input id="pf-amount" type="number" step="0.01" placeholder="-45,50" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-category">Kategoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="pf-category">
                    <SelectValue placeholder="Valitse kategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" disabled>Valitse kategoria</SelectItem>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-notes">Muistiinpanot</Label>
                <Input id="pf-notes" placeholder="Valinnainen" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={!description.trim() || !amount || !category}>
                Tallenna
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent entries */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Viimeisimmät tapahtumat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {entries.length === 0 && <p className="text-gray-500 text-sm">Ei tapahtumia vielä.</p>}
              {entries.slice(0, 50).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{entry.description}</p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(entry.date), 'dd.MM.yyyy', { locale: fi })} • {entry.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(2)} €
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteEntry(entry.id)} aria-label="Poista tapahtuma">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PiggyBank className="w-5 h-5" /> Budjetti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddBudget} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-2 flex-1">
              <Label>Kuukausi</Label>
              <Input type="month" value={budgetMonth} onChange={(e) => setBudgetMonth(e.target.value)} />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Kategoria</Label>
              <Select value={budgetCategory} onValueChange={setBudgetCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Valitse" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label>Budjetti (€)</Label>
              <Input type="number" step="0.01" placeholder="500" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
            </div>
            <Button type="submit" disabled={!budgetCategory || !budgetAmount}>Aseta</Button>
          </form>

          <div className="space-y-3">
            {budgetProgress.length === 0 && <p className="text-sm text-gray-500">Ei budjettia valitulle kuukaudelle.</p>}
            {budgetProgress.map((item) => {
              const categoryName = expenseCategories.find((c) => c.name === item.categoryId)?.name || item.categoryId;
              const pct = item.budgeted > 0 ? Math.min(100, (item.actual / item.budgeted) * 100) : 0;
              return (
                <div key={item.categoryId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{categoryName}</span>
                    <span className="text-gray-500">{item.actual.toFixed(2)} / {item.budgeted.toFixed(2)} €</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pct >= 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tulot vs. menot</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                <Legend />
                <Bar dataKey="income" name="Tulot" fill="#16a34a" />
                <Bar dataKey="expense" name="Menot" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Menot kategorioittain</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> 12 kk trendi
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                <Line type="monotone" dataKey="savings" name="Säästöt" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
