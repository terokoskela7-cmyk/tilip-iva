import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatTile } from '@/components/StatTile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Scale, Calculator, BarChart3 } from 'lucide-react';
import type { Entry, Account } from '@/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { fromCents, toCents } from '@/lib/ledgerMath';
import { buildReport } from '@/lib/reportModel';
import {
  DEFAULT_FISCAL_END,
  DEFAULT_FISCAL_START,
  fiscalYearOf,
  listFiscalPeriods,
} from '@/lib/fiscalYear';

interface ReportsProps {
  entries: Entry[];
  accounts: Account[];
  vatRegistered?: boolean;
  fiscalYearStart?: string;
  fiscalYearEnd?: string;
}

export default function Reports({
  entries,
  accounts,
  vatRegistered = true,
  fiscalYearStart,
  fiscalYearEnd,
}: ReportsProps) {
  const fyStart = fiscalYearStart || DEFAULT_FISCAL_START;
  const fyEnd = fiscalYearEnd || DEFAULT_FISCAL_END;

  const periods = useMemo(
    () => listFiscalPeriods(entries.map((e) => e.date), fyStart, fyEnd),
    [entries, fyStart, fyEnd]
  );

  const yearsWithEntries = useMemo(() => {
    const years = new Set<string>();
    for (const entry of entries) {
      const year = fiscalYearOf(entry.date, fyStart, fyEnd);
      if (year !== null) years.add(String(year));
    }
    return years;
  }, [entries, fyStart, fyEnd]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Oletuksena uusin tilikausi jolla on tapahtumia, muuten kuluva tilikausi.
  const period =
    periods.find((p) => p.key === selectedKey) ??
    periods.find((p) => yearsWithEntries.has(p.key)) ??
    periods[0];

  const report = useMemo(() => buildReport(entries, accounts, period), [entries, accounts, period]);

  const formatMoney = (cents: number) =>
    fromCents(cents).toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Raportit</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Tilikausi {period.start.split('-').reverse().join('.')} – {period.end.split('-').reverse().join('.')}
            </p>
          </div>
          <Select value={period.key} onValueChange={setSelectedKey}>
            <SelectTrigger className="w-[160px]" aria-label="Valitse tilikausi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {report.entryCount === 0 && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Valitulla tilikaudella ei ole tositteita. Tase näyttää tilanteen tilikauden lopussa.
          </div>
        )}

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              <StatTile label="Tuotot yht." value={formatMoney(report.totalRevenue)} valueClassName="text-green-600" />
              <StatTile label="Kulut yht." value={formatMoney(report.totalExpenses)} valueClassName="text-red-600" />
              <StatTile
                label="Tilikauden tulos"
                value={`${report.periodResult > 0 ? '+' : ''}${formatMoney(report.periodResult)}`}
                valueClassName={report.periodResult >= 0 ? 'text-green-600' : 'text-red-600'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Tuotot</h3>
                <div className="space-y-2">
                  {report.revenueRows.map((d) => (
                    <div key={d.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{d.number} {d.name}</span>
                      <span className="font-medium text-gray-900 tabular-nums">{formatMoney(d.cents)}</span>
                    </div>
                  ))}
                  {report.revenueRows.length === 0 && <p className="text-gray-500 text-sm">Ei tuottoja</p>}
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Kulut</h3>
                <div className="space-y-2">
                  {report.expenseRows.map((d) => (
                    <div key={d.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{d.number} {d.name}</span>
                      <span className="font-medium text-gray-900 tabular-nums">{formatMoney(d.cents)}</span>
                    </div>
                  ))}
                  {report.expenseRows.length === 0 && <p className="text-gray-500 text-sm">Ei kuluja</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Balance Sheet */}
          <TabsContent value="balance" className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className={`flex flex-wrap items-center gap-2 text-sm font-medium ${report.balanced ? 'text-green-600' : 'text-red-600'}`}>
                  {report.balanced ? 'Tase tasapainossa' : 'Tase ei täsmää'}
                  <span className="text-gray-500">
                    (Vastaavaa {formatMoney(report.totalAssets)} = Vastattavaa {formatMoney(report.totalLiabilitiesAndEquity)})
                  </span>
                </div>
                {!report.balanced && (
                  <p className="text-xs text-gray-500 mt-1">
                    Erotus {formatMoney(report.totalAssets - report.totalLiabilitiesAndEquity)}. Tarkista, että
                    jokainen tosite on tasan debet- ja kredit-puolelta.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">VASTAAVAA</h3>
                <div className="space-y-2">
                  {report.assetRows.map((a) => (
                    <div key={a.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{a.number} {a.name}</span>
                      <span className="font-medium tabular-nums">{formatMoney(a.cents)}</span>
                    </div>
                  ))}
                  {report.assetRows.length === 0 && <p className="text-gray-500 text-sm">Ei vastaavia</p>}
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span>Vastaavaa yhteensä</span>
                    <span className="tabular-nums">{formatMoney(report.totalAssets)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">VASTATTAVAA</h3>
                <div className="space-y-2">
                  {report.equityRows.map((a) => (
                    <div key={a.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{a.number} {a.name}</span>
                      <span className="font-medium tabular-nums">{formatMoney(a.cents)}</span>
                    </div>
                  ))}
                  {report.earlierResult !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Edellisten tilikausien tulos</span>
                      <span className="font-medium tabular-nums">{formatMoney(report.earlierResult)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Tilikauden tulos</span>
                    <span className="font-medium tabular-nums">{formatMoney(report.periodResult)}</span>
                  </div>
                  {report.liabilityRows.map((a) => (
                    <div key={a.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{a.number} {a.name}</span>
                      <span className="font-medium tabular-nums">{formatMoney(a.cents)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span>Vastattavaa yhteensä</span>
                    <span className="tabular-nums">{formatMoney(report.totalLiabilitiesAndEquity)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {vatRegistered !== false && (
          <TabsContent value="vat" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              <StatTile label="ALV-velka" value={formatMoney(report.vatPayable)} valueClassName="text-red-600" />
              <StatTile label="ALV-saatava" value={formatMoney(report.vatDeductible)} valueClassName="text-green-600" />
              <StatTile
                label="Netto-ALV"
                value={formatMoney(Math.abs(report.vatPayable - report.vatDeductible))}
                valueClassName={report.vatPayable - report.vatDeductible >= 0 ? 'text-red-600' : 'text-green-600'}
                hint={report.vatPayable - report.vatDeductible >= 0 ? 'Maksettavaa' : 'Palautettavaa'}
              />
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">ALV-erittely</h3>
              <div className="space-y-2">
                {report.vatLines.map((l, i) => (
                  <div key={`${l.id}-${i}`} className="flex justify-between text-sm">
                    <span className="text-gray-700">{l.label}</span>
                    <span className={`font-medium tabular-nums ${l.payable ? 'text-red-600' : 'text-green-600'}`}>
                      {formatMoney(l.cents)}
                    </span>
                  </div>
                ))}
                {report.vatLines.length === 0 && <p className="text-gray-500 text-sm">Ei ALV-kirjauksia tällä tilikaudella</p>}
              </div>
            </div>
          </TabsContent>
          )}

          {/* Charts */}
          <TabsContent value="charts" className="space-y-4">
            {report.monthlyData.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-500">Kuukausittainen kehitys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={report.monthlyData}>
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} €`} />
                        <Tooltip formatter={(v: number) => formatMoney(toCents(v))} contentStyle={{ fontSize: '12px' }} />
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
                      <LineChart data={report.monthlyData}>
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} €`} />
                        <Tooltip formatter={(v: number) => formatMoney(toCents(v))} contentStyle={{ fontSize: '12px' }} />
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
