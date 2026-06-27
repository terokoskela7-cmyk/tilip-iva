import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Ledger } from '@/types';

interface LedgerSelectorProps {
  ledgers: Ledger[];
  activeLedgerId: string;
  onSelect: (ledgerId: string) => void;
  onCreateNew: () => void;
}

export function LedgerSelector({ ledgers, activeLedgerId, onSelect, onCreateNew }: LedgerSelectorProps) {
  const [open, setOpen] = useState(false);
  const active = ledgers.find((l) => l.id === activeLedgerId);

  return (
    <div className="px-3 py-2">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tilikirja</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between mt-1 bg-white"
          >
            {active ? active.name : 'Valitse tilikirja'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Hae tilikirjaa..." />
            <CommandList>
              <CommandEmpty>Ei tuloksia.</CommandEmpty>
              <CommandGroup>
                {ledgers.map((ledger) => (
                  <CommandItem
                    key={ledger.id}
                    value={ledger.id}
                    onSelect={() => {
                      onSelect(ledger.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${activeLedgerId === ledger.id ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <span className="flex-1 truncate">{ledger.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {ledger.type === 'company' && 'Yritys'}
                      {ledger.type === 'private' && 'Yksityinen'}
                      {ledger.type === 'housing-company' && 'Taloyhtiö'}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem onSelect={() => { onCreateNew(); setOpen(false); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Luo uusi tilikirja
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
