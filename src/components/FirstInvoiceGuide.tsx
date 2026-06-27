import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Receipt, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Entry, Account } from '@/types';

interface FirstInvoiceGuideProps {
  onCreateEntry: (entry: Entry) => void;
  onNavigate: (view: string) => void;
  accounts?: Account[];
}

interface InvoiceForm {
  customerName: string;
  customerAddress: string;
  customerPostalCode: string;
  customerCity: string;
  customerYTunnus: string;
  serviceDescription: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  paymentTerm: number;
}

const defaultForm: InvoiceForm = {
  customerName: '',
  customerAddress: '',
  customerPostalCode: '',
  customerCity: '',
  customerYTunnus: '',
  serviceDescription: '',
  quantity: 1,
  unitPrice: 0,
  vatRate: 24,
  paymentTerm: 14,
};

const steps = [
  { title: 'Johdanto', description: 'Tervetuloa tekemään ensimmäistä myyntilaskua' },
  { title: 'Asiakas', description: 'Asiakkaan yhteystiedot' },
  { title: 'Palvelu', description: 'Mitä myyt ja millä hinnalla' },
  { title: 'Esikatselu', description: 'Tarkista laskun tiedot' },
  { title: 'Kirjanpito', description: 'Miten merkitään päiväkirjaan' },
  { title: 'Valmis', description: 'Lasku on valmis' },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function formatMoney(value: number): string {
  return value.toFixed(2).replace('.', ',') + ' €';
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export default function FirstInvoiceGuide({ onCreateEntry, onNavigate, accounts }: FirstInvoiceGuideProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<InvoiceForm>(defaultForm);

  const totalExclVat = form.quantity * form.unitPrice;
  const totalVat = totalExclVat * (form.vatRate / 100);
  const totalInclVat = totalExclVat + totalVat;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + form.paymentTerm);

  const update = <K extends keyof InvoiceForm>(key: K, value: InvoiceForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const findAccount = (number: string) => accounts?.find((a) => a.number === number);

  const handleFinish = () => {
    const arAccount = findAccount('1910');
    const revenueAccount = findAccount('3000');
    const vatAccount = findAccount('29391');

    const entry: Entry = {
      id: generateId(),
      date: today(),
      number: '1',
      description: `Myyntilasku: ${form.customerName} - ${form.serviceDescription}`,
      status: 'confirmed',
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          id: generateId(),
          accountId: arAccount?.id || '',
          accountNumber: '1910',
          accountName: arAccount?.name || 'Myyntisaamiset',
          debit: totalInclVat,
          credit: 0,
          description: `Lasku ${form.customerName}`,
        },
        {
          id: generateId(),
          accountId: revenueAccount?.id || '',
          accountNumber: '3000',
          accountName: revenueAccount?.name || 'Myyntituotot',
          debit: 0,
          credit: totalExclVat,
          description: form.serviceDescription,
        },
        {
          id: generateId(),
          accountId: vatAccount?.id || '',
          accountNumber: '29391',
          accountName: vatAccount?.name || 'ALV velka',
          debit: 0,
          credit: totalVat,
          description: `ALV ${form.vatRate}%`,
        },
      ],
    };
    onCreateEntry(entry);
    setStep(5);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Receipt className="w-5 h-5" /> Ensimmäinen myyntilasku? Ei hätää.
              </h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Tämä opas vie sinut vaihe vaiheelta ensimmäisen myyntilaskusi tekemisessä. Syötä vain asiakkaan tiedot ja myydyn palvelun tiedot — lopuksi näet, miten lasku merkitään kirjanpitoon.
              </p>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Täytä asiakkaan tiedot</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Kerro mitä myyt ja millä hinnalla</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Tarkista laskun esikatselu</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Näe kirjanpitomerkintä valmiina</li>
            </ul>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Syötä asiakkaan laskutusosoite. Nämä tiedot näkyvät laskulla.</p>
            <div className="space-y-2">
              <Label htmlFor="cust-name">Asiakkaan nimi</Label>
              <Input id="cust-name" value={form.customerName} onChange={(e) => update('customerName', e.target.value)} placeholder="Esimerkki Oy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-address">Katuosoite</Label>
              <Input id="cust-address" value={form.customerAddress} onChange={(e) => update('customerAddress', e.target.value)} placeholder="Esimerkkikatu 1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cust-postal">Postinumero</Label>
                <Input id="cust-postal" value={form.customerPostalCode} onChange={(e) => update('customerPostalCode', e.target.value)} placeholder="00100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-city">Postitoimipaikka</Label>
                <Input id="cust-city" value={form.customerCity} onChange={(e) => update('customerCity', e.target.value)} placeholder="Helsinki" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-ytunnus">Y-tunnus</Label>
              <Input id="cust-ytunnus" value={form.customerYTunnus} onChange={(e) => update('customerYTunnus', e.target.value)} placeholder="1234567-8" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Kerro nyt myydyn palvelun tai tuotteen tiedot.</p>
            <div className="space-y-2">
              <Label htmlFor="service-desc">Palvelun/tuotteen kuvaus</Label>
              <Input id="service-desc" value={form.serviceDescription} onChange={(e) => update('serviceDescription', e.target.value)} placeholder="Konsultointipalvelu" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="qty">Määrä</Label>
                <Input id="qty" type="number" min={1} value={form.quantity} onChange={(e) => update('quantity', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-price">Yksikköhinta (€)</Label>
                <Input id="unit-price" type="number" step="0.01" value={form.unitPrice} onChange={(e) => update('unitPrice', Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="vat">ALV-%</Label>
                <Input id="vat" type="number" value={form.vatRate} onChange={(e) => update('vatRate', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="term">Maksuehto (päivää)</Label>
                <Input id="term" type="number" min={0} value={form.paymentTerm} onChange={(e) => update('paymentTerm', Number(e.target.value))} />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Tarkista, että laskun tiedot ovat oikein.</p>
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">LASKU</h3>
                  <p className="text-sm text-gray-500">Päivämäärä: {today().split('-').reverse().join('.')}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Eräpäivä: {dueDate.toLocaleDateString('fi-FI')}</p>
                  <p className="text-sm text-gray-500">Maksuehto: {form.paymentTerm} pv</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="font-semibold text-gray-900">Laskutettava:</p>
                <p className="text-gray-700">{form.customerName || '-'}</p>
                <p className="text-gray-700">{form.customerAddress}</p>
                <p className="text-gray-700">{form.customerPostalCode} {form.customerCity}</p>
                {form.customerYTunnus && <p className="text-gray-500 text-sm">Y-tunnus: {form.customerYTunnus}</p>}
              </div>
              <table className="w-full text-sm mb-6">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2">Kuvaus</th>
                    <th className="text-right py-2">Määrä</th>
                    <th className="text-right py-2">Hinta</th>
                    <th className="text-right py-2">Yhteensä</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2">{form.serviceDescription || '-'}</td>
                    <td className="text-right">{form.quantity}</td>
                    <td className="text-right">{formatMoney(form.unitPrice)}</td>
                    <td className="text-right font-medium">{formatMoney(totalExclVat)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="border-t pt-4 space-y-1 text-right">
                <p className="text-gray-600">Veroton yhteensä: {formatMoney(totalExclVat)}</p>
                <p className="text-gray-600">ALV ({form.vatRate}%): {formatMoney(totalVat)}</p>
                <p className="text-xl font-bold text-gray-900">Yhteensä: {formatMoney(totalInclVat)}</p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Kun myyntilasku lähetetään, kirjanpitoon tehdään seuraava merkintä. Klikkaa "Tallenna" luodaksesi sen.
            </p>
            <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4" /> Kirjanpitomerkintä</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-white rounded border">
                  <span>Myyntisaamiset (1910)</span>
                  <span className="font-medium text-green-700">Debet {formatMoney(totalInclVat)}</span>
                </div>
                <p className="text-gray-500 text-xs pl-2">Asiakas velkaa sinulle laskun summan — tämä on saatava.</p>
                <div className="flex justify-between p-2 bg-white rounded border">
                  <span>Myyntituotot (3000)</span>
                  <span className="font-medium text-red-700">Kredit {formatMoney(totalExclVat)}</span>
                </div>
                <p className="text-gray-500 text-xs pl-2">Tämä on ansaitsemasi liikevaihto.</p>
                <div className="flex justify-between p-2 bg-white rounded border">
                  <span>ALV velka (29391)</span>
                  <span className="font-medium text-red-700">Kredit {formatMoney(totalVat)}</span>
                </div>
                <p className="text-gray-500 text-xs pl-2">Valtiolle maksettava arvonlisävero.</p>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Lasku ja kirjaus valmiit!</h3>
            <p className="text-gray-600">Myyntilasku on nyt kirjattu päiväkirjaan. Voit tarkastella sitä Päiväkirja-välilehdellä tai siirtyä Laskutukseen luomaan varsinaisen laskun.</p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => onNavigate('journal')}><BookOpen className="w-4 h-4 mr-2" /> Päiväkirjaan</Button>
              <Button onClick={() => onNavigate('invoicing')}><FileText className="w-4 h-4 mr-2" /> Laskutukseen</Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Receipt className="w-6 h-6 text-blue-600" />
              {steps[step].title}
            </CardTitle>
            <CardDescription>{steps[step].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stepper */}
            <div className="flex items-center justify-between mb-6">
              {steps.map((s, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 hidden sm:block text-center leading-tight">{s.title}</span>
                </div>
              ))}
            </div>

            {renderStep()}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || step === 5}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Edellinen
              </Button>
              {step < 4 && (
                <Button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={
                  (step === 1 && !form.customerName.trim()) ||
                  (step === 2 && (!form.serviceDescription.trim() || form.unitPrice <= 0))
                }>
                  Seuraava <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {step === 4 && (
                <Button onClick={handleFinish}>
                  <Check className="w-4 h-4 mr-2" /> Tallenna kirjaus
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
