import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Receipt, Monitor, Car, GraduationCap, Megaphone, Wifi, Coffee, FileText } from 'lucide-react';

interface DeductionItem {
  label: string;
  icon: typeof Receipt;
  maxPercent: number;
  value: number;
  vatDeductible: boolean;
}

export default function TaxCalculator() {
  const [revenue, setRevenue] = useState(100000);
  const [items, setItems] = useState<DeductionItem[]>([
    { label: 'Toimitilan vuokra', icon: Receipt, maxPercent: 100, value: 12000, vatDeductible: false },
    { label: 'Sähkö, vesi, lämmitys', icon: Receipt, maxPercent: 100, value: 3600, vatDeductible: true },
    { label: 'Tietokoneet ja laitteet', icon: Monitor, maxPercent: 100, value: 5000, vatDeductible: true },
    { label: 'Ohjelmistot ja pilvipalvelut', icon: Wifi, maxPercent: 100, value: 2400, vatDeductible: true },
    { label: 'Puhelin ja internet', icon: Wifi, maxPercent: 100, value: 1200, vatDeductible: true },
    { label: 'Autokulut', icon: Car, maxPercent: 100, value: 6000, vatDeductible: true },
    { label: 'Koulutukset', icon: GraduationCap, maxPercent: 100, value: 1500, vatDeductible: true },
    { label: 'Markkinointi', icon: Megaphone, maxPercent: 100, value: 3000, vatDeductible: true },
    { label: 'Kirjanpitäjä / tilitoimisto', icon: FileText, maxPercent: 100, value: 3600, vatDeductible: true },
    { label: 'Edustuskulut', icon: Coffee, maxPercent: 50, value: 2000, vatDeductible: false },
  ]);

  const updateItem = (index: number, value: number) => {
    const newItems = [...items];
    newItems[index].value = value;
    setItems(newItems);
  };

  const totalDeductions = items.reduce((sum, item) => sum + (item.value * item.maxPercent / 100), 0);
  const yrittajavahennys = Math.min(revenue * 0.15, 5000);
  const totalAllDeductions = totalDeductions + yrittajavahennys;
  const taxableIncome = Math.max(0, revenue - totalAllDeductions);
  const estimatedTax = taxableIncome * 0.20; // Corporate tax 20%
  const effectiveRate = revenue > 0 ? (estimatedTax / revenue) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="w-5 h-5" /> Verovähennyslaskuri
        </h2>
        <p className="text-sm text-gray-500 mt-1">Arvioi verovähennykset ja yrityksen veroaste.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Revenue */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Liikevaihto (€/vuosi)</CardTitle></CardHeader>
            <CardContent>
              <input type="range" min="0" max="500000" step="1000" value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} className="w-full" />
              <p className="text-2xl font-bold text-gray-900 mt-2">{revenue.toLocaleString('fi-FI')} €</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Deductions */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Kulut ja vähennykset</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((item, i) => {
                  const Icon = item.icon;
                  const deductible = item.value * item.maxPercent / 100;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm text-gray-700 flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400" /> {item.label}
                          {item.maxPercent < 100 && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{item.maxPercent}% vähennys</span>}
                        </label>
                        <span className="text-sm font-medium text-gray-900">{deductible.toLocaleString('fi-FI')} €</span>
                      </div>
                      <input
                        type="range" min="0" max="50000" step="100"
                        value={item.value}
                        onChange={(e) => updateItem(i, Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>0 €</span>
                        <span>{item.value.toLocaleString('fi-FI')} € (kulu)</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Yhteenveto</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Liikevaihto</span><span className="font-medium">{revenue.toLocaleString('fi-FI')} €</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Kuluvähennykset</span><span className="font-medium text-red-600">-{totalDeductions.toLocaleString('fi-FI')} €</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Yrittäjävähennys (15%)</span><span className="font-medium text-red-600">-{yrittajavahennys.toLocaleString('fi-FI')} €</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Verotettava tulos</span>
                    <span>{taxableIncome.toLocaleString('fi-FI')} €</span>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-600">Yhteisövero (20%)</span><span className="font-medium text-red-600">-{estimatedTax.toLocaleString('fi-FI')} €</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Veroaste liikevaihdosta</span>
                    <span className="text-blue-600">{effectiveRate.toFixed(1)} %</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
                  <strong>Huom:</strong> Tämä on yksinkertaistettu arvio. Todellinen vero riippuu monista tekijöistä, kuten palkoista, osingoista ja henkilökohtaisesta verotuksesta. Konsultoi tilitoimistoa tarkkaan suunnitteluun.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
