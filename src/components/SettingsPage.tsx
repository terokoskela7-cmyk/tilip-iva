import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Save, Building2, UserCog, RotateCcw } from 'lucide-react';
import type { Company } from '@/types';
import { exportAllData, resetDatabase } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

interface SettingsProps {
  company: Company | null;
  onUpdateCompany: (c: Company) => void;
  onReload: () => void;
}

export default function SettingsPage({ company, onUpdateCompany, onReload }: SettingsProps) {
  const [form, setForm] = useState<Company>({
    id: 'company-1',
    name: '',
    yTunnus: '',
    address: '',
    postalCode: '',
    city: '',
    vatRegistered: true,
    fiscalYearStart: '01-01',
    fiscalYearEnd: '12-31',
    accountantName: '',
    accountantEmail: '',
    accountantPhone: '',
  });

  useEffect(() => {
    if (company) setForm({ ...company });
  }, [company]);

  function handleChange(field: keyof Company, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    onUpdateCompany(form);
  }

  async function handleExport() {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finledger-varmuuskopio-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleReset() {
    if (window.confirm('Haluatko varmasti tyhjentää kaiken datan? Tätä ei voi peruuttaa.')) {
      await resetDatabase();
      await seedDatabase();
      onReload();
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900">Asetukset</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 lg:p-4 max-w-3xl mx-auto w-full">
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Yrityksen tiedot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Yrityksen nimi</Label>
                  <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Y-tunnus</Label>
                  <Input value={form.yTunnus} onChange={(e) => handleChange('yTunnus', e.target.value)} className="mt-1" placeholder="1234567-8" />
                </div>
              </div>
              <div>
                <Label>Katuosoite</Label>
                <Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Postinumero</Label>
                  <Input value={form.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Postitoimipaikka</Label>
                  <Input value={form.city} onChange={(e) => handleChange('city', e.target.value)} className="mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={form.vatRegistered}
                  onCheckedChange={(v) => handleChange('vatRegistered', v)}
                />
                <Label className="cursor-pointer">ALV-velvollinen</Label>
              </div>
            </CardContent>
          </Card>

          {/* Accountant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <UserCog className="w-4 h-4" /> Kirjanpitäjä
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nimi</Label>
                <Input value={form.accountantName} onChange={(e) => handleChange('accountantName', e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sähköposti</Label>
                  <Input value={form.accountantEmail} onChange={(e) => handleChange('accountantEmail', e.target.value)} className="mt-1" type="email" />
                </div>
                <div>
                  <Label>Puhelin</Label>
                  <Input value={form.accountantPhone} onChange={(e) => handleChange('accountantPhone', e.target.value)} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Toiminnot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Vie tiedot</p>
                  <p className="text-xs text-gray-500">Lataa varmuuskopio kaikista tiedoista JSON-muodossa</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" /> Vie JSON
                </Button>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Palauta oletukset</p>
                  <p className="text-xs text-gray-500">Tyhjennä kaikki tiedot ja palauta esimerkkidata</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset} className="text-red-600 border-red-200 hover:bg-red-50">
                  <RotateCcw className="w-4 h-4 mr-2" /> Palauta
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            <Save className="w-4 h-4 mr-2" /> Tallenna muutokset
          </Button>
        </div>
      </div>
    </div>
  );
}
