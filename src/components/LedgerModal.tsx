import { useState } from 'react';
import { Building2, Home, User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Ledger } from '@/types';

interface LedgerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (ledger: Omit<Ledger, 'id' | 'createdAt'>) => Promise<void>;
}

const typeOptions: { value: Ledger['type']; label: string; icon: typeof Building2 }[] = [
  { value: 'company', label: 'Yritys', icon: Building2 },
  { value: 'private', label: 'Yksityinen', icon: User },
  { value: 'housing-company', label: 'Asunto-osakeyhtiö', icon: Home },
  { value: 'personal', label: 'Oma talous', icon: Wallet },
];

export function LedgerModal({ open, onOpenChange, onCreate }: LedgerModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Ledger['type']>('company');
  const [yTunnus, setYTunnus] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setType('company');
    setYTunnus('');
    setDescription('');
    setError(null);
  };

  const handleClose = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Nimi on pakollinen.');
      return;
    }
    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        type,
        yTunnus: type === 'company' || type === 'housing-company' ? yTunnus.trim() || undefined : undefined,
        description: description.trim() || undefined,
        isDefault: false,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error('Ledger creation error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Tilikirjan luonti epäonnistui: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Luo uusi tilikirja</DialogTitle>
          <DialogDescription>
            Lisää uusi kirjanpito eri yritykselle tai käyttötarkoitukselle.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="ledger-name">Nimi *</Label>
            <Input
              id="ledger-name"
              placeholder="Esimerkki Oy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ledger-type">Tyyppi</Label>
            <Select value={type} onValueChange={(v) => setType(v as Ledger['type'])} disabled={loading}>
              <SelectTrigger id="ledger-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {(type === 'company') && (
            <div className="space-y-2">
              <Label htmlFor="ledger-ytunnus">Y-tunnus</Label>
              <Input
                id="ledger-ytunnus"
                placeholder="1234567-8"
                value={yTunnus}
                onChange={(e) => setYTunnus(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="ledger-description">Kuvaus</Label>
            <Input
              id="ledger-description"
              placeholder="Valinnainen kuvaus"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              Peruuta
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              Luo tilikirja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
