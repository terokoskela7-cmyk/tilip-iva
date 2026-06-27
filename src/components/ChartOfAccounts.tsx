import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Search } from 'lucide-react';
import type { Account } from '@/types';

interface ChartOfAccountsProps {
  accounts: Account[];
  onAddAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  accountBalance: (accountId: string) => number;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

const typeLabels: Record<string, string> = {
  asset: 'Vastaaavaa',
  liability: 'Vastattavaa',
  equity: 'Oma pääoma',
  revenue: 'Tuotot',
  expense: 'Kulut',
};

const typeColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-700',
  liability: 'bg-orange-100 text-orange-700',
  equity: 'bg-purple-100 text-purple-700',
  revenue: 'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-700',
};

export default function ChartOfAccounts({ accounts, onAddAccount, onDeleteAccount, accountBalance }: ChartOfAccountsProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('expense');
  const [vatRate, setVatRate] = useState(24);
  const [errors, setErrors] = useState<string[]>([]);

  const filtered = accounts
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return a.number.includes(q) || a.name.toLowerCase().includes(q);
    })
    .sort((a, b) => a.number.localeCompare(b.number));

  const grouped = filtered.reduce<Record<string, Account[]>>((acc, a) => {
    const prefix = a.number.charAt(0);
    const key = prefix === '1' ? '1-VASTAAVAA' : prefix === '2' ? '2-VASTATTAVAA' : prefix === '3' ? '3-TUOTOT' : '4-KULUT';
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const formatMoney = (v: number) => v.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  function validate(): boolean {
    const errs: string[] = [];
    if (!number.trim()) errs.push('Tilinumero puuttuu');
    if (!name.trim()) errs.push('Nimi puuttuu');
    if (accounts.some((a) => a.number === number.trim())) errs.push('Tilinumero on jo käytössä');
    setErrors(errs);
    return errs.length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onAddAccount({
      id: generateId(),
      number: number.trim(),
      name: name.trim(),
      type,
      vatRate,
    });
    setModalOpen(false);
    setNumber('');
    setName('');
    setErrors([]);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Tilikartta</h2>
          <Button onClick={() => setModalOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> Uusi tili
          </Button>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hae tileistä..." className="pl-9 text-sm" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(grouped).map(([group, accs]) => (
          <div key={group} className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">{group}</h3>
            <div className="bg-white border rounded-lg divide-y divide-gray-200">
              {accs.map((acc) => {
                const bal = accountBalance(acc.id);
                return (
                  <div key={acc.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-sm font-mono font-medium text-gray-900 w-16 tabular-nums">{acc.number}</span>
                      <span className="text-sm text-gray-700 truncate">{acc.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[acc.type]}`}>{typeLabels[acc.type]}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm tabular-nums font-medium ${bal >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {formatMoney(Math.abs(bal))}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteAccount(acc.id)} className="h-8 w-8 p-0" aria-label="Poista tili">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Account Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Lisää uusi tili</DialogTitle>
          </DialogHeader>
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-1">
              {errors.map((err, i) => (
                <p key={i} className="text-red-600 text-sm">{err}</p>
              ))}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label>Tilinumero</Label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="esim. 4990" className="mt-1" />
            </div>
            <div>
              <Label>Nimi</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tilin nimi" className="mt-1" />
            </div>
            <div>
              <Label>Tilityyppi</Label>
              <select value={type} onChange={(e) => setType(e.target.value as Account['type'])} className="mt-1 w-full border rounded-md px-3 py-2 text-sm">
                <option value="asset">Vastaaavaa</option>
                <option value="liability">Vastattavaa</option>
                <option value="equity">Oma pääoma</option>
                <option value="revenue">Tuotot</option>
                <option value="expense">Kulut</option>
              </select>
            </div>
            <div>
              <Label>ALV-kanta (%)</Label>
              <Input type="number" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Peruuta</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Tallenna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
