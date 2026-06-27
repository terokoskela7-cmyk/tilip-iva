import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, Paperclip } from 'lucide-react';
import type { Entry, Account } from '@/types';

interface JournalProps {
  entries: Entry[];
  accounts: Account[];
  onNewEntry: () => void;
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (id: string) => void;
}

export default function Journal({ entries, accounts, onNewEntry, onEditEntry, onDeleteEntry }: JournalProps) {
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [accountFilter, setAccountFilter] = useState('');

  const filtered = useMemo(() => {
    let result = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.number.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.lines.some((l) => l.description.toLowerCase().includes(q) || l.accountName.toLowerCase().includes(q))
      );
    }
    if (fromDate) result = result.filter((e) => e.date >= fromDate);
    if (toDate) result = result.filter((e) => e.date <= toDate);
    if (accountFilter) {
      result = result.filter((e) => e.lines.some((l) => l.accountId === accountFilter));
    }
    return result;
  }, [entries, search, fromDate, toDate, accountFilter]);

  const totalDebit = filtered.reduce((s, e) => s + e.lines.reduce((ls, l) => ls + l.debit, 0), 0);
  const totalCredit = filtered.reduce((s, e) => s + e.lines.reduce((ls, l) => ls + l.credit, 0), 0);

  const formatMoney = (v: number) => v.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 lg:p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900">Päiväkirja</h2>
          <Button onClick={onNewEntry} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Uusi tosite</span><span className="sm:hidden">Uusi</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hae..." className="pl-9 text-sm" />
          </div>
          <div className="flex gap-2">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-sm w-full sm:w-auto" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-sm w-full sm:w-auto" />
          </div>
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-white">
            <option value="">Kaikki tilit</option>
            {accounts.sort((a, b) => a.number.localeCompare(b.number)).map((a) => (
              <option key={a.id} value={a.id}>{a.number} - {a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Totals */}
      <div className="px-3 lg:px-4 py-2 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 text-sm">
        <span className="text-gray-600">Tositeita: <strong className="text-gray-900">{filtered.length}</strong></span>
        <span className="text-gray-600">Debet: <strong className="text-gray-900">{formatMoney(totalDebit)}</strong></span>
        <span className="text-gray-600">Kredit: <strong className="text-gray-900">{formatMoney(totalCredit)}</strong></span>
      </div>

      {/* MOBILE: Card list */}
      <div className="flex-1 overflow-y-auto p-3 lg:hidden">
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-center text-gray-500 py-8">Ei tositteita</p>}
          {filtered.map((e) => (
            <button key={e.id} onClick={() => onEditEntry(e)} className="w-full text-left bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">#{e.number}</span>
                    <Badge variant={e.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">{e.status === 'confirmed' ? 'Kirjattu' : 'Luonnos'}</Badge>
                    {e.attachments && e.attachments.length > 0 && <Paperclip className="w-3 h-3 text-blue-500" />}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{e.description}</p>
                  <p className="text-xs text-gray-500">{format(parseISO(e.date), 'dd.MM.yyyy', { locale: fi })}</p>
                </div>
                <span className="text-sm font-medium text-gray-900 tabular-nums ml-2">{formatMoney(e.lines.reduce((s, l) => s + l.debit, 0))}</span>
              </div>
              <div className="mt-2 space-y-0.5">
                {e.lines.slice(0, 3).map((l) => (
                  <div key={l.id} className="text-xs text-gray-600 flex justify-between">
                    <span className="truncate">{l.accountNumber} {l.accountName}</span>
                    <span>{l.debit > 0 ? `D ${formatMoney(l.debit)}` : `K ${formatMoney(l.credit)}`}</span>
                  </div>
                ))}
                {e.lines.length > 3 && <p className="text-xs text-gray-400">+{e.lines.length - 3} riviä</p>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP: Table */}
      <div className="hidden lg:block flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Pvm</th>
              <th className="px-4 py-3">Tosite</th>
              <th className="px-4 py-3">Tili</th>
              <th className="px-4 py-3">Selite</th>
              <th className="px-4 py-3 text-right">Debet</th>
              <th className="px-4 py-3 text-right">Kredit</th>
              <th className="px-4 py-3">Tila</th>
              <th className="px-4 py-3 text-right">Toiminnot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">Ei tositteita</td></tr>
            )}
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-gray-900">{format(parseISO(e.date), 'dd.MM.yyyy', { locale: fi })}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">#{e.number}</p>
                  <p className="text-xs text-gray-500">{e.description}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {e.lines.map((l) => <div key={l.id} className="text-xs">{l.accountNumber} - {l.accountName}</div>)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {e.lines.map((l) => <div key={l.id} className="text-xs">{l.description || '-'}</div>)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                  {e.lines.map((l) => <div key={l.id} className="text-xs">{l.debit > 0 ? formatMoney(l.debit) : ''}</div>)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                  {e.lines.map((l) => <div key={l.id} className="text-xs">{l.credit > 0 ? formatMoney(l.credit) : ''}</div>)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={e.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">{e.status === 'confirmed' ? 'Kirjattu' : 'Luonnos'}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEditEntry(e)} className="h-8 w-8 p-0" aria-label="Muokkaa tositetta"><Pencil className="w-4 h-4 text-gray-500" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteEntry(e.id)} className="h-8 w-8 p-0" aria-label="Poista tosite"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
