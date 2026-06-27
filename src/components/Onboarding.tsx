import { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { saveCompany, saveManyAccounts } from '@/lib/firestore';
import { defaultAccounts } from '@/data/defaultAccounts';
import type { Company, Account } from '@/types';

interface OnboardingProps {
  onComplete: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState('');
  const [yTunnus, setYTunnus] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [vatRegistered, setVatRegistered] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Yrityksen nimi on pakollinen.');
      return;
    }

    setLoading(true);
    try {
      const company: Company = {
        id: 'main',
        name: name.trim(),
        yTunnus: yTunnus.trim(),
        address: address.trim(),
        postalCode: postalCode.trim(),
        city: city.trim(),
        vatRegistered,
        fiscalYearStart: '01-01',
        fiscalYearEnd: '12-31',
        accountantName: '',
        accountantEmail: '',
        accountantPhone: '',
      };

      const accounts: Account[] = defaultAccounts.map((acc) => ({
        ...acc,
        id: generateId(),
      }));

      await saveCompany(company);
      await saveManyAccounts(accounts);

      onComplete();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Yrityksen luonti epäonnistui. Yritä uudelleen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Tilipäivä</h1>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Tervetuloa!</CardTitle>
            <CardDescription className="text-center">
              Aloita luomalla yrityksesi tiedot ja oletustilikartta.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Yrityksen nimi *</Label>
                <Input
                  id="name"
                  placeholder="Esimerkki Oy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yTunnus">Y-tunnus</Label>
                <Input
                  id="yTunnus"
                  placeholder="1234567-8"
                  value={yTunnus}
                  onChange={(e) => setYTunnus(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Osoite</Label>
                <Input
                  id="address"
                  placeholder="Esimerkkikatu 1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postinumero</Label>
                  <Input
                    id="postalCode"
                    placeholder="00100"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Postitoimipaikka</Label>
                  <Input
                    id="city"
                    placeholder="Helsinki"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="vatRegistered"
                  checked={vatRegistered}
                  onCheckedChange={(checked) => setVatRegistered(checked === true)}
                  disabled={loading}
                />
                <Label htmlFor="vatRegistered" className="font-normal">
                  Yritys on arvonlisäverovelvollinen
                </Label>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Luodaan kirjanpitoa...
                  </>
                ) : (
                  'Aloita kirjanpito'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
