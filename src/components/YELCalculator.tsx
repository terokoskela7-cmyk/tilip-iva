import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle, Info } from 'lucide-react';

export default function YELCalculator() {
  const [workIncome, setWorkIncome] = useState(30000);
  const [age, setAge] = useState(35);

  // YEL premium rate roughly 24% of work income (simplified, actual varies by company and age)
  // In reality it depends on: age, company, and is roughly 19-26%
  const baseRate = age < 35 ? 0.19 : age < 50 ? 0.22 : 0.25;
  const yelCost = workIncome * baseRate;
  const monthlyYel = yelCost / 12;

  // Estimated pension accrual (very rough: ~1.5% per year of work income)
  const yearlyPension = workIncome * 0.015;

  // Sickness daily allowance estimate (roughly 60% of work income / 300)
  const dailyAllowance = (workIncome * 0.6) / 300;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5" /> YEL-laskuri
        </h2>
        <p className="text-sm text-gray-500 mt-1">Arvioi yrittäjän eläkevakuutuksen kustannukset ja turva.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Inputs */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Tiedot</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-700 block mb-1">YEL-työtulo (€/vuosi)</label>
                <input type="range" min="9000" max="100000" step="1000" value={workIncome} onChange={(e) => setWorkIncome(Number(e.target.value))} className="w-full" />
                <p className="text-2xl font-bold text-gray-900 mt-1">{workIncome.toLocaleString('fi-FI')} €</p>
                <p className="text-xs text-gray-500">Minimi 9 010 € (2025), ei ylärajaa</p>
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1">Ikä</label>
                <input type="range" min="18" max="67" step="1" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full" />
                <p className="text-2xl font-bold text-gray-900 mt-1">{age} vuotta</p>
                <p className="text-xs text-gray-500">Vaikuttaa vakuutusmaksun prosenttiin</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-xs text-blue-600 font-medium uppercase">YEL-maksu / vuosi</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{yelCost.toLocaleString('fi-FI')} €</p>
                <p className="text-sm text-blue-700 mt-1">{monthlyYel.toLocaleString('fi-FI')} €/kk</p>
                <p className="text-xs text-blue-500 mt-1">Arvioitu maksu {Math.round(baseRate * 100)} % työtulosta</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-xs text-green-600 font-medium uppercase">Eläke kertyy / vuosi</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{yearlyPension.toLocaleString('fi-FI')} €</p>
                <p className="text-xs text-green-700 mt-1">Noin 1,5 % työtulosta/vuosi</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <p className="text-xs text-amber-600 font-medium uppercase">Sairaspäiväraha</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{dailyAllowance.toFixed(2)} €/pv</p>
                <p className="text-xs text-amber-700 mt-1">Noin 60 % työtulosta</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Mikä on YEL?</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p><strong>YEL (Yrittäjän eläkevakuutus)</strong> on pakollinen vakuutus, joka kerryttää yrittäjälle:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li><strong>Työeläkettä</strong> — vanhuuseläke, osittaisvarhaiselaäke, työkyvyttömyyseläke</li>
                  <li><strong>Sairauspäivärahaa</strong> — kun et voi tehdä työtä sairauden takia</li>
                  <li><strong>Vanhempainpäivärahaa</strong> — äitiys-, isyys- ja vanhempainraha</li>
                  <li><strong>Työttömyysturvaa</strong> — jos olet maksanut YEL:iä riittävästi ja liittynyt työttömyyskassaan</li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700"><strong>Vinkki:</strong> Työtulo voi olla eri kuin todellinen palkkasi. Se on arvio työpanoksesi arvosta. Liian alhainen työtulo = pieni eläke. Liian korkea = turhia maksuja.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Suositeltavat työtulot</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                {[
                  { income: 15000, label: 'Minimi', desc: 'Pienin mahdollinen, kertyy hitaasti' },
                  { income: 30000, label: 'Kohtuullinen', desc: 'Hyvä perustaso, kohtuullinen eläke' },
                  { income: 45000, label: 'Suositus', desc: 'YEL-katon alaraja, verotehokasta palkkaa' },
                  { income: 65000, label: 'Korkea', desc: 'Hyvä eläke, mutta maksut nousevat' },
                ].map((r) => (
                  <button
                    key={r.income}
                    onClick={() => setWorkIncome(r.income)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors ${
                      workIncome === r.income ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-gray-900">{r.label}</span>
                      <span className="text-gray-500 ml-2">{r.income.toLocaleString('fi-FI')} €</span>
                    </div>
                    <span className="text-xs text-gray-400">{r.desc}</span>
                  </button>
                ))}
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700"><strong>Muista:</strong> Työtulo ilmoitetaan vuosittain eläkeyhtiölle (helmikuun loppuun mennessä). Alle 17 500 € työtulolla et saa päivärahoja — hae sitten Keltalta!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
