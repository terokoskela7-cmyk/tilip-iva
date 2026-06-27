import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Scale, Calculator, BarChart3 } from 'lucide-react';
import type { Entry, Account } from '@/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';

interface ReportsProps {
  entries: Entry[];
  accounts: Account[];
  accountBalance: (accountId: string) => number;
  totalVatPayable: number;
  totalVatDeductible: number;
  vatRegistered?: boolean;
}

export default function Reports({ entries, accounts, accountBalance, totalVatPayable, totalVatDeductible, vatRegistered = true }: ReportsProps) {
  const [period, setPeriod] = useState('2024');

  const formatMoney = (v: number) => v.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  // Income Statement
  const revenueAccounts = accounts.filter((a) => a.type === 'revenue');
  const expenseAccounts = accounts.filter((a) => a.type === 'expense');

  const revenueData = revenueAccounts.map((a) => ({
    name: a.name,
    number: a.number,
    amount: Math.max(0, accountBalance(a.id)),
  })).filter((d) => d.amount > 0);

  const expenseData = expenseAccounts.map((a) => ({
    name: a.name,
    number: a.number,
    amount: Math.max(0, accountBalance(a.id)),
  })).filter((d) => d.amount > 0);

  const totalRevenue = revenueData.reduce((s, d) => s + d.amount, 0);
  const totalExpenses = expenseData.reduce((s, d) => s + d.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  // Balance Sheet
  const assetAccounts = accounts.filter((a) => a.type === 'asset');
  const liabilityAccounts = accounts.filter((a) => a.type === 'liability');
  const equityAccounts = accounts.filter((a) => a.type === 'equity');

  const totalAssets = assetAccounts.reduce((s, a) => s + Math.max(0, accountBalance(a.id)), 0);
  const totalLiabilities = liabilityAccounts.reduce((s, a) => s + Math.max(0, accountBalance(a.id)), 0);
  const totalEquity = equityAccounts.reduce((s, a) => s + Math.max(0, accountBalance(a.id)), 0);

  const balanceCheck = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; expenses: number }> = {};
    entries.forEach((e) => {
      const month = e.date.substring(0, 7); // YYYY-MM
      if (!months[month]) months[month] = { revenue: 0, expenses: 0 };
      e.lines.forEach((l) => {
        const acc = accounts.find((a) => a.id === l.accountId);
        if (!acc) return;
        if (acc.type === 'revenue') months[month].revenue += l.credit;
        if (acc.type === 'expense') months[month].expenses += l.debit;
      });
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: month.substring(5) + '/' + month.substring(0, 4),
        revenue: Math.round(data.revenue),
        expenses: Math.round(data.expenses),
        profit: Math.round(data.revenue - data.expenses),
      }));
  }, [entries, accounts]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Raportit</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPeriod('2024')} className={period === '2024' ? 'bg-blue-50 text-blue-700' : ''}>
              2024
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="income" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="income" className="flex items-center gap-1 text-xs lg:text-sm">
              <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> Tuloslaskelma
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center gap-1 text-xs lg:text-sm">
              <Scale className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> Tase
            </TabsTrigger>
            {vatRegistered !== false && (
              <TabsTrigger value="vat" className="flex items-center gap-1 text-xs lg:text-sm">
                <Calculator className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> ALV
              </TabsTrigger>
            )}
            <TabsTrigger value="charts" className="flex items-center gap-1 text-xs lg:text-sm">
              <BarChart3 className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> Graafit
            </TabsTrigger>
          </TabsList>

          {/* Income Statement */}
          <TabsContent value="income" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Tuotot yht.</CardTitle></CardHeader>
                <CardContent><p className="text-xl lg:text-2xl font-bold text-green-600">{formatMoney(totalRevenue)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Kulut yht.</CardTitle></CardHeader>
                <CardContent><p className="text-xl lg:text-2xl font-bold text-red-600">{formatMoney(totalExpenses)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Tilikauden tulos</CardTitle></CardHeader>
                <CardContent>
                  <p className={`text-xl lg:text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netIncome >= 0 ? '+' : ''}{formatMoney(netIncome)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Tuotot</h3>
                <div className="space-y-2">
                  {revenueData.map((d) => (
                    <div key={d.number} className="flex justify-between text-sm">
                      <span className="text-gray-700">{d.number} {d.name}</span>
                      <span className="font-medium text-gray-900 tabular-nums">{formatMoney(d.amount)}</span>
                    </div>
                  ))}
                  {revenueData.length === 0 && <p className="text-gray-500 text-sm">Ei tuottoja</p>}
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Kulut</h3>
                <div className="space-y-2">
                  {expenseData.map((d) => (
                    <div key={d.number} className="flex justify-between text-sm">
                      <span className="text-gray-700">{d.number} {d.name}</span>
                      <span className="font-medium text-gray-900 tabular-nums">{formatMoney(d.amount)}</span>
                    </div>
                  ))}
                  {expenseData.length === 0 && <p className="text-gray-500 text-sm">Ei kuluja</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Balance Sheet */}
          <TabsContent value="balance" className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className={`flex items-center gap-2 text-sm font-medium ${balanceCheck ? 'text-green-600' : 'text-red-600'}`}>
                  {balanceCheck ? 'Tase tasapainossa' : 'Tase ei täsmää'}
                  <span className="text-gray-500">(Vastaavaa {formatMoney(totalAssets)} = Vastattavaa {formatMoney(totalLiabilities + totalEquity)})</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">VASTAAVAA</h3>
                <div className="space-y-2">
                  {assetAccounts
                    .filter((a) => accountBalance(a.id) !== 0)
                    .map((a) => (
                      <div key={a.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{a.number} {a.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(Math.abs(accountBalance(a.id)))}</span>
                      </div>
                    ))}
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span>Vastaavaa yhteensä</span>
                    <span className="tabular-nums">{formatMoney(totalAssets)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">VASTATTAVAA</h3>
                <div className="space-y-2">
                  {equityAccounts
                    .filter((a) => accountBalance(a.id) !== 0)
                    .map((a) => (
                      <div key={a.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{a.number} {a.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(Math.abs(accountBalance(a.id)))}</span>
                      </div>
                    ))}
                  {liabilityAccounts
                    .filter((a) => accountBalance(a.id) !== 0)
                    .map((a) => (
                      <div key={a.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{a.number} {a.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(Math.abs(accountBalance(a.id)))}</span>
                      </div>
                    ))}
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span>Vastattavaa yhteensä</span>
                    <span className="tabular-nums">{formatMoney(totalLiabilities + totalEquity)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {vatRegistered !== false && (
          <TabsContent value="vat" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">ALV-velka</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-red-600">{formatMoney(totalVatPayable)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">ALV-saatava</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-green-600">{formatMoney(totalVatDeductible)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Netto-ALV</CardTitle></CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${(totalVatPayable - totalVatDeductible) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatMoney(Math.abs(totalVatPayable - totalVatDeductible))}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">ALV-erittely</h3>
              <div className="space-y-2">
                {entries.flatMap((e) => e.lines)
                  .filter((l) => l.accountNumber === '29391' || l.accountNumber === '29392')
                  .map((l, i) => (
                    <div key={`${l.id}-${i}`} className="flex justify-between text-sm">
                      <span className="text-gray-700">{l.description || l.accountName}</span>
                      <span className={`font-medium tabular-nums ${l.accountNumber === '29391' ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMoney(Math.abs(l.credit - l.debit))}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
          )}

          {/* Charts */}
          <TabsContent value="charts" className="space-y-4">
            {monthlyData.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-500">Kuukausittainen kehitys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} €`} />
                        <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="revenue" name="Tuotot" fill="#16a34a" />
                        <Bar dataKey="expenses" name="Kulut" fill="#dc2626" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-500">Tuloskehitys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={monthlyData}>
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} €`} />
                        <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="profit" name="Tulos" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-gray-500 text-center py-12">Ei riittävästi dataa graafeihin</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
