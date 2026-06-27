import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Ledger } from '@/types';

interface LedgerSelectorProps {
  ledgers: Ledger[];
  activeLedgerId: string;
  onSelect: (ledgerId: string) => void;
  onCreateNew: () => void;
}

export function LedgerSelector({ ledgers, activeLedgerId, onSelect, onCreateNew }: LedgerSelectorProps) {
  const active = ledgers.find((l) => l.id === activeLedgerId);

  return (
    <div className="mt-3 space-y-2">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tilikirja</label>
      <Select value={activeLedgerId} onValueChange={onSelect}>
        <SelectTrigger className="w-full bg-white" aria-label="Valitse tilikirja">
          <SelectValue placeholder={active ? active.name : 'Valitse tilikirja'} />
        </SelectTrigger>
        <SelectContent>
          {ledgers.map((ledger) => (
            <SelectItem key={ledger.id} value={ledger.id}>
              <span className="flex items-center justify-between w-full gap-3">
                <span>{ledger.name}</span>
                <span className="text-xs text-gray-500">
                  {ledger.type === 'company' && 'Yritys'}
                  {ledger.type === 'private' && 'Yksityinen'}
                  {ledger.type === 'housing-company' && 'Taloyhtiö'}
                  {ledger.type === 'personal' && 'Oma talous'}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        onClick={onCreateNew}
      >
        <Plus className="w-4 h-4 mr-2" /> Luo uusi tilikirja
      </Button>
    </div>
  );
}
