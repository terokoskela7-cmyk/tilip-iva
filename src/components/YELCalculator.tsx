import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield, AlertCircle, Info } from 'lucide-react';
import { StatTile } from '@/components/StatTile';
import { qualifiesForUnemploymentCover, yelContribution, yelIncomeStatus, yelPensionAccrual, yelSicknessAllowance } from '@/lib/yel';
import { TAX_YEAR, YEL } from '@/lib/taxRates';

const euro = (value: number) =>
  value.toLocaleString('fi-FI', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';

export default function YELCalculator() {
  const [workIncome, setWorkIncome] = useState(30000);
  const [newEntrepreneur, setNewEntrepreneur] = useState(false);

  const contribution = yelContribution(workIncome, newEntrepreneur);
  const pension = yelPensionAccrual(workIncome);
  const allowance = yelSicknessAllowance(workIncome);
  const status = yelIncomeStatus(workIncome);
  const hasUnemploymentCover = qualifiesForUnemploymentCover(workIncome);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5" /> YEL-laskuri
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Arvioi yrittäjän eläkevakuutuksen kustannukset ja turva. Luvut vuodelta {TAX_YEAR}.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Tiedot</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="yel-income" className="text-sm text-gray-700 block mb-1">YEL-työtulo (€/vuosi)</label>
                <input
                  id="yel-income"
                  type="range"
                  min="0"
                  max="120000"
                  step="500"
                  value={workIncome}
                  onChange={(e) => setWorkIncome(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-2xl font-bold text-gray-900 mt-1">{euro(workIncome)}</p>
                <p className="text-xs text-gray-500">
                  Vakuuttamisvelvollisuus alkaa {YEL.minimumIncome.toLocaleString('fi-FI')} eurosta.
                  Yläraja {YEL.maximumIncome.toLocaleString('fi-FI')} €.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="yel-starter"
                    checked={newEntrepreneur}
                    onCheckedChange={(value) => setNewEntrepreneur(Boolean(value))}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="yel-starter" className="cursor-pointer">Aloittava yrittäjä</Label>
                    <p className="text-xs text-gray-500">
                      Neljän ensimmäisen yrittäjävuoden ajan maksusta saa {Math.round(YEL.newEntrepreneurDiscount * 100)} %
                      alennuksen.
                    </p>
                  </div>
                </div>
                <div className="rounded-md bg-gray-50 border p-3">
                  <p className="text-xs text-gray-600">
                    Maksuprosentti on {String(YEL.contributionRate * 100).replace('.', ',')} % ja sama kaikenikäisille.
                    Ikäryhmäkohtaiset maksut poistuivat vuoden {TAX_YEAR} alusta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {status === 'below-minimum' && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Työtulo alittaa {YEL.minimumIncome.toLocaleString('fi-FI')} euron alarajan, joten YEL-vakuutusta ei
                tarvitse ottaa — mutta silloin ei myöskään kerry eläkettä eikä sosiaaliturvaa yritystoiminnasta.
              </p>
            </div>
          )}
          {status === 'above-maximum' && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Työtulon yläraja on {YEL.maximumIncome.toLocaleString('fi-FI')} €. Sen ylittävää osaa ei vakuuteta.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <StatTile
              label="YEL-maksu / vuosi"
              value={euro(contribution.annual)}
              valueClassName="text-blue-700"
              hint={`${contribution.monthly.toLocaleString('fi-FI', { maximumFractionDigits: 0 })} €/kk · ${String(
                Math.round(contribution.rate * 1000) / 10
              ).replace('.', ',')} % työtulosta`}
            />
            <StatTile
              label="Eläke kertyy / vuosi"
              value={euro(pension)}
              valueClassName="text-green-700"
              hint={`${String(YEL.pensionAccrualRate * 100).replace('.', ',')} % työtulosta vuodessa`}
            />
            <StatTile
              label="Sairauspäiväraha"
              value={`${allowance.daily.toFixed(2)} €/pv`}
              valueClassName="text-amber-700"
              hint={
                allowance.atMinimum
                  ? `Vähimmäismäärä, noin ${Math.round(allowance.monthly)} €/kk`
                  : `Noin ${Math.round(allowance.monthly)} €/kk`
              }
            />
          </div>

          {newEntrepreneur && contribution.discount > 0 && (
            <p className="text-sm text-green-700">
              Aloittavan yrittäjän alennus pienentää maksua {euro(contribution.discount)} vuodessa.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Mikä on YEL?</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p><strong>YEL (yrittäjän eläkevakuutus)</strong> on pakollinen vakuutus, joka kerryttää yrittäjälle:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li><strong>Työeläkettä</strong> — vanhuuseläke, osittainen varhennettu vanhuuseläke, työkyvyttömyyseläke</li>
                  <li><strong>Sairauspäivärahaa</strong> — kun et voi tehdä työtä sairauden takia</li>
                  <li><strong>Vanhempainpäivärahaa</strong></li>
                  <li><strong>Työttömyysturvaa</strong> — jos työtulo riittää ja olet liittynyt yrittäjäkassaan</li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    <strong>Vinkki:</strong> Työtulo ei ole sama kuin yrityksen tulos tai nostamasi palkka. Se on arvio
                    työpanoksesi arvosta, ja kaikki yrittäjän sosiaaliturva lasketaan siitä.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Työtulon tasoja</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                {[
                  { income: Math.ceil(YEL.minimumIncome), label: 'Alaraja', desc: 'Pienin vakuutettava työtulo' },
                  { income: YEL.unemploymentCoverageIncome, label: 'Työttömyysturva', desc: 'Yrittäjäkassan alaraja' },
                  { income: 30000, label: 'Keskitaso', desc: 'Kohtuullinen eläkekertymä' },
                  { income: 60000, label: 'Korkea', desc: 'Parempi turva, suurempi maksu' },
                ].map((row) => (
                  <button
                    key={row.income}
                    onClick={() => setWorkIncome(row.income)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                      workIncome === row.income ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-gray-900">{row.label}</span>
                      <span className="text-gray-500 ml-2">{row.income.toLocaleString('fi-FI')} €</span>
                    </div>
                    <span className="text-xs text-gray-500 text-right">{row.desc}</span>
                  </button>
                ))}
                <div className={`rounded-md p-3 mt-2 flex items-start gap-2 border ${hasUnemploymentCover ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${hasUnemploymentCover ? 'text-green-500' : 'text-amber-500'}`} />
                  <p className={`text-xs ${hasUnemploymentCover ? 'text-green-700' : 'text-amber-700'}`}>
                    {hasUnemploymentCover
                      ? `Työtulo riittää yrittäjän työttömyysturvaan (raja ${YEL.unemploymentCoverageIncome.toLocaleString('fi-FI')} €).`
                      : `Yrittäjän työttömyysturva edellyttää vähintään ${YEL.unemploymentCoverageIncome.toLocaleString('fi-FI')} euron työtuloa.`}
                    {' '}Työtulo ilmoitetaan eläkeyhtiölle, ja sitä tarkistetaan tarvittaessa.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
