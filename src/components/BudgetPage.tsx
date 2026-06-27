
import { useState, useMemo } from 'react';
import { PiggyBank, Pencil, Check, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Budget, PersonalEntry } from '@/types';
import { format, subMonths } from 'date-fns';
import { fi } from 'date-fns/locale';

interface BudgetPageProps {
  budgets: Budget[];
  entries: PersonalEntry[];
  onSaveBudget: (budget: Budget) => void;
}

const budgetCategories = [
  { id: 'ruoka', name: 'Ruoka', color: '#ef4444' },
  { id: 'asuminen', name: 'Asuminen', color: '#f97316' },
  { id: 'liikenne', name: 'Liikenne', color: '#f59e0b' },
  { id: 'viihde', name: 'Viihde', color: '#84cc16' },
  { id: 'terveys', name: 'Terveys', color: '#10b981' },
  { id: 'vaatteet', name: 'Vaatteet', color: '#06b6d4' },
  { id: 'koulutus', name: 'Koulutus', color: '#3b82f6' },
  { id: 'muut', name: 'Muut', color: '#6366f1' },
];

function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}


export default function BudgetPage({ budgets, entries, onSaveBudget }: BudgetPageProps) {
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const [editing, setEditing] = useState(false);
  const [draftItems, setDraftItems] = useState<Record<string, string>>({});

  const currentBudget = useMemo(
    () => budgets.find((b) => b.month === selectedMonth),
    [budgets, selectedMonth]
  );

  const actuals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      if (e.date.startsWith(selectedMonth) && e.amount < 0) {
        const cat = budgetCategories.find((c) => c.id === e.category);
        if (cat) {
          map[cat.id] = (map[cat.id] || 0) + Math.abs(e.amount);
        }
      }
    }
    return map;
  }, [entries, selectedMonth]);

  const items = useMemo(() => {
    return budgetCategories.map((cat) => {
      const budgeted = currentBudget?.items.find((i) => i.categoryId === cat.id)?.budgeted || 0;
      const actual = actuals[cat.id] || 0;
      const remaining = budgeted - actual;
      const pct = budgeted > 0 ? (actual / budgeted) * 100 : 0;
      return { ...cat, budgeted, actual, remaining, pct };
    });
  }, [currentBudget, actuals]);

  const totals = useMemo(() => {
    const budgeted = items.reduce((sum, i) => sum + i.budgeted, 0);
    const actual = items.reduce((sum, i) => sum + i.actual, 0);
    const remaining = budgeted - actual;
    const pct = budgeted > 0 ? (actual / budgeted) * 100 : 0;
    return { budgeted, actual, remaining, pct };
  }, [items]);

  const months = useMemo(() => {
    const now = new Date();
    const list: { value: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      list.push({ value: monthKey(d), label: format(d, 'MMMM yyyy', { locale: fi }) });
    }
    return list;
  }, []);

  const startEditing = () => {
    const draft: Record<string, string> = {};
    for (const item of items) {
      draft[item.id] = item.budgeted > 0 ? item.budgeted.toString() : '';
    }
    setDraftItems(draft);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraftItems({});
  };

  const saveEditing = () => {
    const newItems = budgetCategories
      .map((cat) => {
        const value = parseFloat((draftItems[cat.id] || '').replace(',', '.'));
        if (isNaN(value) || value <= 0) return null;
        return { categoryId: cat.id, budgeted: value, actual: actuals[cat.id] || 0 };
      })
      .filter(Boolean) as { categoryId: string; budgeted: number; actual: number }[];

    onSaveBudget({
      id: selectedMonth,
      month: selectedMonth,
      items: newItems,
    });
    setEditing(false);
  };

  const overallColor = totals.pct < 80 ? 'bg-green-500' : totals.pct < 100 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><PiggyBank className="w-7 h-7 text-blue-600" /> Budjetti</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEditing}><Pencil className="w-4 h-4 mr-2" /> Muokkaa</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={cancelEditing}><X className="w-4 h-4 mr-2" /> Peruuta</Button>
              <Button size="sm" onClick={saveEditing}><Check className="w-4 h-4 mr-2" /> Tallenna</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Budjetti yht.</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-gray-900">{totals.budgeted.toFixed(2)} €</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Käytetty</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">{totals.actual.toFixed(2)} €</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Jäljellä</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-blue-600">{totals.remaining.toFixed(2)} €</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Käytetty %</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-gray-900">{totals.pct.toFixed(1)} %</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Budjetin tilanne</CardTitle></CardHeader>
        <CardContent>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${overallColor}`} style={{ width: `${Math.min(100, totals.pct)}%` }} />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {totals.pct < 80 ? 'Hyvä! Olet alle 80 % budjetista.' : totals.pct < 100 ? 'Varo, budjetti lähestyy loppuaan.' : 'Budjetti ylitetty tässä kuussa.'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const color = item.pct < 80 ? 'bg-green-500' : item.pct < 100 ? 'bg-yellow-500' : 'bg-red-500';
          return (
            <Card key={item.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  {item.pct >= 100 ? <Badge variant="destructive">Ylitetty</Badge> : item.pct >= 80 ? <Badge className="bg-yellow-500">Lähellä rajaa</Badge> : <Badge variant="secondary">Ok</Badge>}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Toteuma</span>
                    <span className="font-medium">{item.actual.toFixed(2)} € / {item.budgeted.toFixed(2)} €</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${Math.min(100, item.pct)}%` }} />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jäljellä</span>
                  <span className={`font-medium ${item.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>{item.remaining.toFixed(2)} €</span>
                </div>
                {editing && (
                  <div className="pt-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Budjetti €"
                      value={draftItems[item.id] || ''}
                      onChange={(e) => setDraftItems((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500" /> Vinkkejä budjetointiin</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>50/30/20-sääntö</strong> on yksinkertainen tapa jakaa tulot:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
            <li><strong>50 %</strong> pakollisiin menoihin (asuminen, ruoka, liikenne)</li>
            <li><strong>30 %</strong> haluihin (viihde, vaatteet, harrastukset)</li>
            <li><strong>20 %</strong> säästöihin ja velkojen lyhennykseen</li>
          </ul>
          <p className="text-sm text-gray-700 mt-3">
            Voit muokata yllä olevia kategorioita kuukausittain. Toteuma täyttyy automaattisesti Oma talous -sivulla kirjaamistasi menoista.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
