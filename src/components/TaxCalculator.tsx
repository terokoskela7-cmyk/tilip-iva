import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Receipt, Monitor, Car, GraduationCap, Megaphone, Wifi, Coffee, FileText, Shield } from 'lucide-react';
import { StatTile } from '@/components/StatTile';
import { calculateBusinessTax, type BusinessForm } from '@/lib/businessTax';
import { INCOME_TAX, TAX_YEAR } from '@/lib/taxRates';

interface DeductionItem {
  label: string;
  icon: typeof Receipt;
  /** Osuus kulusta joka on verotuksessa vähennyskelpoinen. */
  deductiblePercent: number;
  value: number;
}

const initialItems: DeductionItem[] = [
  { label: 'Toimitilan vuokra', icon: Receipt, deductiblePercent: 100, value: 12000 },
  { label: 'Sähkö, vesi, lämmitys', icon: Receipt, deductiblePercent: 100, value: 3600 },
  { label: 'Tietokoneet ja laitteet', icon: Monitor, deductiblePercent: 100, value: 5000 },
  { label: 'Ohjelmistot ja pilvipalvelut', icon: Wifi, deductiblePercent: 100, value: 2400 },
  { label: 'Puhelin ja internet', icon: Wifi, deductiblePercent: 100, value: 1200 },
  { label: 'Autokulut', icon: Car, deductiblePercent: 100, value: 6000 },
  { label: 'Koulutukset', icon: GraduationCap, deductiblePercent: 100, value: 1500 },
  { label: 'Markkinointi', icon: Megaphone, deductiblePercent: 100, value: 3000 },
  { label: 'Kirjanpitäjä / tilitoimisto', icon: FileText, deductiblePercent: 100, value: 3600 },
  { label: 'YEL-maksut', icon: Shield, deductiblePercent: 100, value: 7320 },
  { label: 'Edustuskulut', icon: Coffee, deductiblePercent: 50, value: 2000 },
];

const euro = (value: number) =>
  value.toLocaleString('fi-FI', { maximumFractionDigits: 0 }) + ' €';

const percent = (value: number) => `${(value * 100).toFixed(1).replace('.', ',')} %`;

export default function TaxCalculator() {
  const [revenue, setRevenue] = useState(100000);
  const [form, setForm] = useState<BusinessForm>('toiminimi');
  const [netAssets, setNetAssets] = useState(0);
  const [capitalShare, setCapitalShare] = useState(0.2);
  const [earnedIncomeRate, setEarnedIncomeRate] = useState(30);
  const [items, setItems] = useState<DeductionItem[]>(initialItems);

  const updateItem = (index: number, value: number) => {
    // Alkuperäinen versio muutti oliota paikallaan, mikä on Reactissa virhe.
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, value } : item)));
  };

  const totalDeductions = items.reduce(
    (sum, item) => sum + (item.value * item.deductiblePercent) / 100,
    0
  );

  const result = calculateBusinessTax({
    revenue,
    deductions: totalDeductions,
    form,
    netAssets,
    capitalShare,
    earnedIncomeRate: earnedIncomeRate / 100,
  });

  const isSoleTrader = form === 'toiminimi';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="w-5 h-5" /> Verovähennyslaskuri
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Arvioi verovähennykset ja yrityksen veroaste. Luvut vuodelta {TAX_YEAR}.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Yritys</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax-form">Yhtiömuoto</Label>
                  <Select value={form} onValueChange={(value) => setForm(value as BusinessForm)}>
                    <SelectTrigger id="tax-form" className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toiminimi">Toiminimi tai henkilöyhtiö</SelectItem>
                      <SelectItem value="osakeyhtio">Osakeyhtiö</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {isSoleTrader
                      ? 'Tulos verotetaan yrittäjän henkilökohtaisena tulona, ja siitä tehdään yrittäjävähennys.'
                      : `Osakeyhtiö maksaa tuloksestaan yhteisöveroa ${percent(INCOME_TAX.corporateRate)}. Yrittäjävähennys ei koske osakeyhtiötä.`}
                  </p>
                </div>
                <div>
                  <Label htmlFor="tax-revenue">Liikevaihto (€/vuosi)</Label>
                  <input
                    id="tax-revenue"
                    type="range"
                    min="0"
                    max="500000"
                    step="1000"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                  <p className="text-2xl font-bold text-gray-900">{euro(revenue)}</p>
                </div>
              </div>

              {isSoleTrader && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <Label htmlFor="tax-netassets">Nettovarallisuus (€)</Label>
                    <input
                      id="tax-netassets"
                      type="range"
                      min="0"
                      max="300000"
                      step="1000"
                      value={netAssets}
                      onChange={(e) => setNetAssets(Number(e.target.value))}
                      className="w-full mt-2"
                    />
                    <p className="text-sm font-medium text-gray-900">{euro(netAssets)}</p>
                  </div>
                  <div>
                    <Label htmlFor="tax-capitalshare">Pääomatulo-osuus</Label>
                    <Select value={String(capitalShare)} onValueChange={(value) => setCapitalShare(Number(value))}>
                      <SelectTrigger id="tax-capitalshare" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INCOME_TAX.capitalShareOptions.map((option) => (
                          <SelectItem key={option} value={String(option)}>{Math.round(option * 100)} % nettovarallisuudesta</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Loput verotetaan ansiotulona.</p>
                  </div>
                  <div>
                    <Label htmlFor="tax-earnedrate">Ansiotulon veroprosentti (arvio)</Label>
                    <input
                      id="tax-earnedrate"
                      type="range"
                      min="0"
                      max="60"
                      step="1"
                      value={earnedIncomeRate}
                      onChange={(e) => setEarnedIncomeRate(Number(e.target.value))}
                      className="w-full mt-2"
                    />
                    <p className="text-sm font-medium text-gray-900">{earnedIncomeRate} %</p>
                    <p className="text-xs text-gray-500">Riippuu muista tuloistasi ja kotikunnastasi.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Kulut ja vähennykset</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((item, i) => {
                  const Icon = item.icon;
                  const deductible = (item.value * item.deductiblePercent) / 100;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <label htmlFor={`deduction-${i}`} className="text-sm text-gray-700 flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {item.deductiblePercent < 100 && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex-shrink-0">
                              {item.deductiblePercent} %
                            </span>
                          )}
                        </label>
                        <span className="text-sm font-medium text-gray-900 tabular-nums flex-shrink-0">{euro(deductible)}</span>
                      </div>
                      <input
                        id={`deduction-${i}`}
                        type="range" min="0" max="50000" step="100"
                        value={item.value}
                        onChange={(e) => updateItem(i, Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0 €</span>
                        <span>{euro(item.value)} (kulu)</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <StatTile
                  label="Tulos"
                  value={euro(result.profit)}
                  valueClassName={result.profit >= 0 ? 'text-gray-900' : 'text-red-600'}
                />
                <StatTile
                  label="Verot yhteensä"
                  value={euro(result.totalTax)}
                  valueClassName="text-red-600"
                  hint={result.taxableProfit > 0 ? `${percent(result.effectiveRateOfProfit)} tuloksesta` : undefined}
                />
              </div>

              <Card>
                <CardHeader><CardTitle className="text-sm">Yhteenveto</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Liikevaihto</span>
                      <span className="font-medium tabular-nums">{euro(revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vähennyskelpoiset kulut</span>
                      <span className="font-medium text-red-600 tabular-nums">−{euro(totalDeductions)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Tulos</span>
                      <span className="tabular-nums">{euro(result.profit)}</span>
                    </div>

                    {isSoleTrader ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Yrittäjävähennys ({percent(INCOME_TAX.entrepreneurDeduction)} tuloksesta)
                          </span>
                          <span className="font-medium text-green-600 tabular-nums">−{euro(result.entrepreneurDeduction)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Verotettava yritystulo</span>
                          <span className="tabular-nums">{euro(result.taxableIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pääomatuloa</span>
                          <span className="font-medium tabular-nums">{euro(result.capitalIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pääomatulovero</span>
                          <span className="font-medium text-red-600 tabular-nums">−{euro(result.capitalTax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ansiotuloa</span>
                          <span className="font-medium tabular-nums">{euro(result.earnedIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ansiotulovero (arvio {earnedIncomeRate} %)</span>
                          <span className="font-medium text-red-600 tabular-nums">−{euro(result.earnedIncomeTax)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Yhteisövero ({percent(INCOME_TAX.corporateRate)})</span>
                        <span className="font-medium text-red-600 tabular-nums">−{euro(result.corporateTax)}</span>
                      </div>
                    )}

                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Verot yhteensä</span>
                      <span className="text-blue-600 tabular-nums">{euro(result.totalTax)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Veroaste liikevaihdosta</span>
                      <span className="tabular-nums">{percent(result.effectiveRateOfRevenue)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800 space-y-1">
                    <p><strong>Huom:</strong> Arvio, ei veroilmoitus.</p>
                    {isSoleTrader ? (
                      <p>
                        Ansiotulon vero riippuu kaikista tuloistasi, kotikunnastasi ja henkilökohtaisista
                        vähennyksistäsi, joten sen osuus on yllä oma arviosi. Pääomatulovero on
                        {' '}{percent(INCOME_TAX.capitalGainsRate)} ja {euro(INCOME_TAX.capitalGainsHigherLimit)} ylittävältä
                        osalta {percent(INCOME_TAX.capitalGainsHigherRate)} koko pääomatulostasi, ei vain yritystulosta.
                      </p>
                    ) : (
                      <p>
                        Laskelma koskee yhtiön verotusta. Palkan ja osinkojen verotus sinulle omistajana tulee tämän
                        päälle.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
