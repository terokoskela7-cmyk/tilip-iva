import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Wallet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

interface MonthData {
  month: string;
  income: number;
  expenses: number;
}

const months = ['Tammi', 'Helmi', 'Maalis', 'Huhti', 'Touko', 'Kesä', 'Heinä', 'Elo', 'Syys', 'Loka', 'Marras', 'Joulu'];

export default function CashFlowForecast() {
  const [startingBalance, setStartingBalance] = useState(10000);
  const [monthlyIncome, setMonthlyIncome] = useState(8000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(6000);
  const [incomeGrowth, setIncomeGrowth] = useState(0);
  const [variability, setVariability] = useState(0);

  const data: MonthData[] = months.map((m, i) => {
    const growthFactor = 1 + (incomeGrowth / 100) * (i / 12);
    const randomFactor = 1 + (Math.sin(i * 2.5) * variability / 100);
    const income = Math.round(monthlyIncome * growthFactor * randomFactor);
    const expenses = Math.round(monthlyExpenses * (1 + (i / 12) * 0.02)); // 2% expense inflation
    return { month: m, income, expenses };
  });

  let running = startingBalance;
  const chartData = data.map((d) => {
    running += d.income - d.expenses;
    return {
      ...d,
      balance: running,
      net: d.income - d.expenses,
    };
  });

  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
  const endBalance = chartData[chartData.length - 1]?.balance || 0;
  const minBalance = Math.min(...chartData.map((d) => d.balance));
  const worstMonth = chartData.find((d) => d.balance === minBalance);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="w-5 h-5" /> Kassavirtaennuste
        </h2>
        <p className="text-sm text-gray-500 mt-1">Arvioi rahatilannetta seuraavalle 12 kuukaudelle.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Inputs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card><CardContent className="p-3">
              <label className="text-xs text-gray-500 block mb-1">Alkusaldo</label>
              <input type="range" min="0" max="50000" step="500" value={startingBalance} onChange={(e) => setStartingBalance(Number(e.target.value))} className="w-full" />
              <p className="text-sm font-bold">{startingBalance.toLocaleString('fi-FI')} €</p>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <label className="text-xs text-gray-500 block mb-1">Keskim. tulot/kk</label>
              <input type="range" min="0" max="30000" step="500" value={monthlyIncome} onChange={(e) => setMonthlyIncome(Number(e.target.value))} className="w-full" />
              <p className="text-sm font-bold text-green-600">{monthlyIncome.toLocaleString('fi-FI')} €</p>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <label className="text-xs text-gray-500 block mb-1">Keskim. kulut/kk</label>
              <input type="range" min="0" max="30000" step="500" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} className="w-full" />
              <p className="text-sm font-bold text-red-600">{monthlyExpenses.toLocaleString('fi-FI')} €</p>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <label className="text-xs text-gray-500 block mb-1">Tulojen kasvu %/v</label>
              <input type="range" min="0" max="50" step="1" value={incomeGrowth} onChange={(e) => setIncomeGrowth(Number(e.target.value))} className="w-full" />
              <p className="text-sm font-bold">{incomeGrowth} %</p>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <label className="text-xs text-gray-500 block mb-1">Vaihtelu %</label>
              <input type="range" min="0" max="30" step="1" value={variability} onChange={(e) => setVariability(Number(e.target.value))} className="w-full" />
              <p className="text-sm font-bold">±{variability} %</p>
            </CardContent></Card>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card className={endBalance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <CardContent className="p-3">
                <p className="text-xs text-gray-500">Lopputulos 12 kk</p>
                <p className={`text-xl font-bold ${endBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{endBalance.toLocaleString('fi-FI')} €</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-gray-500">Tulot yht.</p>
                <p className="text-xl font-bold text-green-600">{totalIncome.toLocaleString('fi-FI')} €</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-gray-500">Kulut yht.</p>
                <p className="text-xl font-bold text-red-600">{totalExpenses.toLocaleString('fi-FI')} €</p>
              </CardContent>
            </Card>
            <Card className={minBalance >= 0 ? '' : 'bg-red-50 border-red-200'}>
              <CardContent className="p-3">
                <p className="text-xs text-gray-500">Pienin saldo</p>
                <p className={`text-xl font-bold ${minBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{minBalance.toLocaleString('fi-FI')} €</p>
                {worstMonth && <p className="text-xs text-gray-500">{worstMonth.month}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Kassasaldo kuukausittain</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString('fi-FI')}`} />
                    <Tooltip formatter={(v: number) => `${v.toLocaleString('fi-FI')} €`} contentStyle={{ fontSize: '12px' }} />
                    <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="3 3" />
                    <Bar dataKey="balance" name="Saldo" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Tulot vs. Kulut</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v.toLocaleString('fi-FI')} €`} contentStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="income" name="Tulot" fill="#16a34a" />
                    <Bar dataKey="expenses" name="Kulut" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {minBalance < 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800 flex items-start gap-2">
              <TrendingDown className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Varoitus:</strong> Ennuste näyttää negatiivista kassaa {worstMonth?.month}kuussa. Harkitse:
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li>Puskurirahan nostoa alkusaldoa</li>
                  <li>Kulujen leikkausta tai tulojen kiihdytystä</li>
                  <li>Laskutusaikojen lyhentämistä</li>
                  <li>Finnvera-lainaa tai pankkiluottoa</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
