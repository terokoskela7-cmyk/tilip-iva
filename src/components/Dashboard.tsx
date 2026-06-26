import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, X, Wallet, Receipt, Calculator, Paperclip } from 'lucide-react';
import type { Entry, Account } from '@/types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardProps {
  entries: Entry[];
  accounts: Account[];
  filteredEntries: Entry[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewEntry: () => void;
  onEditEntry: (entry: Entry) => void;
  accountBalance: (accountId: string) => number;
  totalVatPayable: number;
  totalVatDeductible: number;
  cashBalance: number;
  cashHistory: { date: string; balance: number }[];
}

export default function Dashboard({
  entries, accounts, filteredEntries, selectedAccountId, onSelectAccount,
  searchQuery, onSearchChange, onNewEntry, onEditEntry, accountBalance,
  totalVatPayable, totalVatDeductible, cashBalance, cashHistory,
}: DashboardProps) {
  const [mobileTab, setMobileTab] = useState<'overview' | 'entries' | 'accounts'>('entries');

  const vatNet = totalVatPayable - totalVatDeductible;
  const sortedEntries = useMemo(() => [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date)), [filteredEntries]);
  const recentEntries = sortedEntries.slice(0, 50); // Show up to 50 entries

  const accountGroups = useMemo(() => {
    const groups: Record<string, Account[]> = {};
    accounts.forEach((acc) => {
      const prefix = acc.number.charAt(0);
      const label = prefix === '1' ? 'VASTAAVAA' : prefix === '2' ? 'VASTATTAVAA' : prefix === '3' ? 'TUOTOT' : 'KULUT';
      if (!groups[label]) groups[label] = [];
      groups[label].push(acc);
    });
    return groups;
  }, [accounts]);

  const formatMoney = (v: number) => v.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  // MOBILE VIEW
  const MobileNav = () => (
    <div className="lg:hidden flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
      {[
        { key: 'overview' as const, label: 'Yleiskatsaus' },
        { key: 'entries' as const, label: 'Tositteet' },
        { key: 'accounts' as const, label: 'Tilikartta' },
      ].map((t) => (
        <button
          key={t.key}
          onClick={() => setMobileTab(t.key)}
          className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
            mobileTab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const OverviewCards = () => (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2"><Receipt className="w-4 h-4" /> Kuluva tilikausi</CardTitle></CardHeader>
        <CardContent>
          <p className="text-lg font-bold text-gray-900">2024</p>
          <p className="text-xs text-gray-500">01.01.2024 - 31.12.2024</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2"><Calculator className="w-4 h-4" /> ALV-tilanne</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-600">ALV-velka</span><span className="font-medium text-red-600">{formatMoney(totalVatPayable)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-600">ALV-saatava</span><span className="font-medium text-green-600">{formatMoney(totalVatDeductible)}</span></div>
          <div className="border-t pt-2 flex justify-between text-sm font-bold">
            <span className="text-gray-900">Netto</span>
            <span className={vatNet >= 0 ? 'text-red-600' : 'text-green-600'}>{vatNet >= 0 ? 'Maksettavaa: ' : 'Palautettavaa: '}{formatMoney(Math.abs(vatNet))}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2"><Wallet className="w-4 h-4" /> Käteiskassa</CardTitle></CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(cashBalance)}</p>
          {cashHistory.length > 0 && (
            <div className="mt-3 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashHistory}>
                  <defs><linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} /><stop offset="95%" stopColor="#16a34a" stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="balance" stroke="#16a34a" strokeWidth={2} fill="url(#cashGrad)" />
                  <XAxis dataKey="date" hide /><YAxis hide /><Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ fontSize: '12px' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const EntriesList = () => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-900">{selectedAccountId ? accounts.find(a => a.id === selectedAccountId)?.name : 'Tositteet'}</h2>
          {selectedAccountId && <Badge variant="outline" className="text-xs">{accounts.find(a => a.id === selectedAccountId)?.number}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {selectedAccountId && <Button variant="ghost" size="sm" onClick={() => onSelectAccount(null)} className="text-gray-500 text-xs h-8"><X className="w-3 h-3 mr-1" /> Kaikki</Button>}
          <Button onClick={onNewEntry} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"><Plus className="w-3.5 h-3.5 mr-1" /> Uusi</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="Hae tositteista..." className="pl-9 text-sm" />
        {searchQuery && <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
      </div>

      <div className="space-y-2">
        {recentEntries.length === 0 && <p className="text-center text-gray-500 py-8">Ei tositteita</p>}
        {recentEntries.map((e) => (
          <button key={e.id} onClick={() => onEditEntry(e)} className="w-full text-left bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{e.description}</p>
                <p className="text-xs text-gray-500">{format(parseISO(e.date), 'dd.MM.yyyy', { locale: fi })} · #{e.number} · {e.lines.length} riviä</p>
              </div>
              <span className="text-sm font-medium text-gray-900 tabular-nums ml-2">{formatMoney(e.lines.reduce((s, l) => s + l.debit, 0))}</span>
            </div>
            {e.attachments && e.attachments.length > 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                <Paperclip className="w-3 h-3" /> {e.attachments.length} liite{e.attachments.length > 1 ? 'tä' : ''}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const AccountList = () => (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">Tilikartta</h2>
      <div className="space-y-3">
        {Object.entries(accountGroups).map(([group, accs]) => (
          <div key={group}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">{group}</p>
            <div className="space-y-0.5">
              {accs.sort((a, b) => a.number.localeCompare(b.number)).map((acc) => {
                const bal = accountBalance(acc.id);
                return (
                  <button
                    key={acc.id}
                    onClick={() => onSelectAccount(selectedAccountId === acc.id ? null : acc.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-left text-sm transition-colors ${
                      selectedAccountId === acc.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="truncate"><span className="font-mono text-xs">{acc.number}</span> {acc.name}</span>
                    {bal !== 0 && <span className="tabular-nums text-xs flex-shrink-0 ml-2">{formatMoney(Math.abs(bal))}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile tab navigation */}
      <div className="lg:hidden p-3 pb-0">
        <MobileNav />
      </div>

      {/* Desktop: 3 columns, Mobile: tabbed */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-0">
        {/* MOBILE */}
        <div className="lg:hidden max-w-lg mx-auto">
          {mobileTab === 'overview' && <OverviewCards />}
          {mobileTab === 'entries' && <EntriesList />}
          {mobileTab === 'accounts' && <AccountList />}
        </div>

        {/* DESKTOP: 3 columns */}
        <div className="hidden lg:flex h-full">
          {/* Left */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto p-4 space-y-4">
            <OverviewCards />
          </div>

          {/* Center */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">{selectedAccountId ? accounts.find(a => a.id === selectedAccountId)?.name : 'Pääkirjatilit'}</h2>
                {selectedAccountId && <Badge variant="outline" className="text-xs">{accounts.find(a => a.id === selectedAccountId)?.number}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                {selectedAccountId && <Button variant="ghost" size="sm" onClick={() => onSelectAccount(null)} className="text-gray-500"><X className="w-4 h-4 mr-1" /> Näytä kaikki</Button>}
                <Button onClick={onNewEntry} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-1" /> Uusi tosite</Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <EntriesList />
            </div>
          </div>

          {/* Right */}
          <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-gray-50 overflow-y-auto p-4">
            <AccountList />
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tositeita yht.</span><span className="font-medium text-gray-900">{entries.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tilejä yht.</span><span className="font-medium text-gray-900">{accounts.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
