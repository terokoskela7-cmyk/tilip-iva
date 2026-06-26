import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, Home, Wrench, TrendingUp, Calculator, BookOpen, Receipt,
  Percent, Info, AlertCircle, CheckCircle2, Wallet
} from 'lucide-react';

/* ═══════════════════════════════════════════
   ASUNTOSIJOITTAJAN KIRJANPITO-MODUULI
   ═══════════════════════════════════════════ */

export default function RealEstateInvestor() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5" /> Asuntosijoittajan kirjanpito
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Kaikki mitä tarvitset asuntosijoittamisen kirjanpitoon ja verosuunnitteluun.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="overview" className="max-w-5xl mx-auto">
          <TabsList className="grid grid-cols-2 lg:grid-cols-6 mb-4 h-auto">
            <TabsTrigger value="overview" className="text-xs flex items-center gap-1"><Home className="w-3.5 h-3.5" /> Perusteet</TabsTrigger>
            <TabsTrigger value="accounts" className="text-xs flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Tilit</TabsTrigger>
            <TabsTrigger value="guides" className="text-xs flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> Kirjaukset</TabsTrigger>
            <TabsTrigger value="calculator" className="text-xs flex items-center gap-1"><Calculator className="w-3.5 h-3.5" /> Tuottolaskuri</TabsTrigger>
            <TabsTrigger value="tax" className="text-xs flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Verotus</TabsTrigger>
            <TabsTrigger value="strategies" className="text-xs flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Strategiat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="accounts"><AccountsTab /></TabsContent>
          <TabsContent value="guides"><GuidesTab /></TabsContent>
          <TabsContent value="calculator"><CalculatorTab /></TabsContent>
          <TabsContent value="tax"><TaxTab /></TabsContent>
          <TabsContent value="strategies"><StrategiesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ─── OVERVIEW ─── */
function OverviewTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <Home className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-xs text-blue-600 font-medium uppercase">Asuntosijoittaminen</p>
            <p className="text-sm text-blue-800 mt-1">
              Asuntojen vuokraustoiminta on elinkeinotoimintaa, kun omistat <strong>vähintään 3 asuntoa</strong> tai toimit aktiivisesti.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <Wallet className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-xs text-green-600 font-medium uppercase">Vuokratulot</p>
            <p className="text-sm text-green-800 mt-1">
              Vuokrat ovat <strong>ALV-vapaita</strong> (kiinteistönkäyttöoikeuden luovutus). Ei ALV-velvollisuutta.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <Percent className="w-6 h-6 text-amber-600 mb-2" />
            <p className="text-xs text-amber-600 font-medium uppercase">Verotus</p>
            <p className="text-sm text-amber-800 mt-1">
              Vuokratuloista maksetaan <strong>puhtaasta vuokratulosta 30 % vero</strong> (elinkeinotoiminta) tai pääomavero (yksityinen).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Asuntosijoittajan vuosikello</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { month: 'Joka kuukausi', task: 'Kirjaa vuokratulot ja menot', critical: false },
              { month: 'Joka kuukausi', task: 'Maksa yhtiövastike', critical: true },
              { month: 'Joka kuukausi', task: 'Maksa lainanlyhennykset ja korot', critical: true },
              { month: 'Neljännesvuosittain', task: 'Tarkista kassavirta per asunto', critical: false },
              { month: 'Kerran vuodessa', task: 'Tarkista vuokrasopimukset ja korotukset', critical: true },
              { month: 'Kerran vuodessa', task: 'Tee kuntotarkastus ja suunnittele remontit', critical: false },
              { month: 'Tammikuu', task: 'Vuokratulojen veroilmoitus (edellinen vuosi)', critical: true },
              { month: 'Helmikuu', task: 'YEL-työtulon ilmoitus (jos elinkeinotoiminta)', critical: true },
            ].map((e, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-md ${e.critical ? 'bg-red-50 border border-red-200' : 'border'}`}>
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.critical ? 'bg-red-500' : 'bg-blue-400'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{e.task}</p>
                  <p className="text-xs text-gray-500">{e.month}</p>
                </div>
                {e.critical && <Badge variant="destructive" className="text-xs">Tärkeä</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Milloin asuntosijoittaminen on elinkeinotoimintaa?</CardTitle></CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>Verottaja katsoo asuntosijoittamisen <strong>elinkeinotoiminnaksi</strong>, kun:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Omistat <strong>vähintään 3 asuntoa</strong> vuokrattavaksi</li>
              <li>Ostat ja myyt asuntoja <strong>aktiivisesti</strong> (flipata)</li>
              <li>Olet rekisteröinyt toiminnan <strong>elinkeinotoimintana</strong></li>
              <li>Toiminta on <strong>säännöllistä ja voittoa tavoittelevaa</strong></li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
              <p className="text-xs text-blue-800"><strong>Vinkki:</strong> Elinkeinotoimintana voit vähentää kaikki kulut — myös lainakorot ja yhtiövastikkeet täysimääräisinä. Yksityisenä vuokranantajana vähennykset ovat rajallisempia.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Asuntosijoittajan kannattavuuskaava</CardTitle></CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <div className="bg-gray-50 rounded-md p-3 space-y-2">
              <p><strong>Vuokratulot</strong> (kk)</p>
              <p className="text-red-600">− <strong>Yhtiövastike</strong> (hoito + rahoitus)</p>
              <p className="text-red-600">− <strong>Lainan korot</strong></p>
              <p className="text-red-600">− <strong>Vakuutus</strong></p>
              <p className="text-red-600">− <strong>Huolto ja korjaus</strong></p>
              <p className="text-red-600">− <strong>Kiinteistövero</strong></p>
              <p className="text-red-600">− <strong>Välitys / isännöinti</strong></p>
              <div className="border-t pt-1 font-bold text-green-700">
                = <strong>Nettovuokratulo</strong> (ennen veroja)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── ACCOUNTS ─── */
function AccountsTab() {
  const accounts = [
    { group: 'TULOT', items: [
      { num: '3100', name: 'Vuokratulot — Asunto A', desc: 'Kuukausivuokrat asunnosta A' },
      { num: '3101', name: 'Vuokratulot — Asunto B', desc: 'Kuukausivuokrat asunnosta B' },
      { num: '3102', name: 'Vuokratulot — Asunto C', desc: 'Kuukausivuomat asunnosta C' },
      { num: '3150', name: 'Vuokratakuun pidätykset', desc: 'Takuuvuokran pidätykset vahingoista' },
      { num: '3200', name: 'Vuokravakuuden korko', desc: 'Korko vuokravakuustililtä' },
    ]},
    { group: 'MENOT', items: [
      { num: '4200', name: 'Yhtiövastike (hoito)', desc: 'Taloyhtiön hoitovastike' },
      { num: '4201', name: 'Yhtiövastike (rahoitus)', desc: 'Taloyhtiön rahoitusvastike (remontit)' },
      { num: '4210', name: 'Kiinteistövero', desc: 'Kaupungin kiinteistövero' },
      { num: '4220', name: 'Lainan korot', desc: 'Pankkilainan korot' },
      { num: '4230', name: 'Vakuutukset', desc: 'Vuokravakuutus, kiinteistövakuutus' },
      { num: '4240', name: 'Huolto ja korjaus', desc: 'Pienkorjaukset, LVIS-huolto' },
      { num: '4241', name: 'Remontit', desc: 'Keittiöremontti, kylpyhuone, pintaremontti' },
      { num: '4250', name: 'Sähkö / vesi / kaasu', desc: 'Jos vuokralaisen puolesta maksettu' },
      { num: '4260', name: 'Välityspalkkio', desc: 'Vuokravälittäjän palkkio' },
      { num: '4270', name: 'Isännöinti', desc: 'Isännöintipalvelut' },
      { num: '4280', name: 'Mainonta', desc: 'Vuokrailmoitukset, kuvaus' },
      { num: '4290', name: 'Oikeudelliset kulut', desc: 'Vuokriidat, sopimukset' },
    ]},
    { group: 'TASE', items: [
      { num: '1210', name: 'Sijoitusasunnot', desc: 'Asuntojen hankintahinnat' },
      { num: '1211', name: 'Asuntojen arvonnousu', desc: 'Käyvän arvon muutokset (ei kirjanpitoon)' },
      { num: '1220', name: 'Asuntoihin tehdyt remontit', desc: 'Parannusmenot, aktivoituu taseeseen' },
      { num: '1940', name: 'Pankkitili — sijoitukset', desc: 'Erillinen tili vuokra-asioille' },
      { num: '1950', name: 'Vuokravakuustili', desc: 'Vuokralaisten vakuudet' },
      { num: '2800', name: 'Pankkilaina — Asunto A', desc: 'Lainan jäljellä oleva pääoma' },
      { num: '2801', name: 'Pankkilaina — Asunto B', desc: 'Lainan jäljellä oleva pääoma' },
    ]},
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Asuntosijoittajan tilikartta</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.map((g) => (
              <div key={g.group}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{g.group}</p>
                <div className="space-y-1">
                  {g.items.map((a) => (
                    <div key={a.num} className="flex items-start gap-3 p-2.5 border rounded-md hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-mono font-medium text-gray-900 w-14 tabular-nums flex-shrink-0">{a.num}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4 text-xs text-blue-800">
            <strong>Vinkki:</strong> Avaa jokaiselle asunnolle <strong>omat alatilit</strong> (3100, 3101, 3102...). Näet tarkasti kunkin asunnon kannattavuuden erikseen.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── GUIDES ─── */
function GuidesTab() {
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  const guides = [
    {
      id: 'osto',
      title: 'Asunnon osto',
      icon: Home,
      steps: [
        'Asunnon ostohinta kirjataan taseeseen tilille 1210 Sijoitusasunnot (Debet)',
        'Vastatilinä Kredit 1940 Pankkisaamiset (käteisosto) tai 2800 Pankkilaina',
        'Kaupanvahvistajan maksu, lainan järjestelypalkkio yms. kulut: Debet 4240 Huolto ja korjaus / Kredit 1940',
        'Varainsiirtovero 2 % (tai 4 % jos alle 2 vuotta omistuksessa): Debet 4240 / Kredit 1940',
        'Remontit ennen vuokrausta: alle 850 €/v kuluna (4240), yli aktivoidaan (1220)',
      ],
      tip: 'Jos ostat asunnon yhtiön nimissä (osakeyhtiö), kaikki kulut ovat yrityksen vähennyskelpoisia. Jos yksityisesti, vähennysoikeus riippuu elinkeinotoiminnan laajuudesta.',
    },
    {
      id: 'vuokra',
      title: 'Vuokratulon kirjaus',
      icon: Wallet,
      steps: [
        'Vuokralainen maksaa 900 € vuokran tilille: Debet 1940 Pankki 900 €',
        'Kredit 3100 Vuokratulot — Asunto A 900 €',
        'Jos pidät takuuvuokran (esim. 2 kk = 1800 €): oma tili 1950 Vuokravakuustili',
        'Vuokrankorotus: muuta summaa samoilla tileillä, lisää selitteeksi "Vuokrankorotus 1.1.2025"',
        'Vuokravakuuden palautus: Debet 1950 Vuokravakuus / Kredit 1940 Pankki',
      ],
      tip: 'Vuokrat ovat ALV-vapaita — ei ALV-kirjausta! Vuokratulo ilmoitetaan vuosittain verottajalle.',
    },
    {
      id: 'yhtiovastike',
      title: 'Yhtiövastikkeen kirjaus',
      icon: Building2,
      steps: [
        'Hoitovastike 250 €: Debet 4200 Yhtiövastike (hoito) / Kredit 1940 Pankki 250 €',
        'Rahoitusvastike 150 € (putkiremontti): Debet 4201 Yhtiövastike (rahoitus) / Kredit 1940 150 €',
        'Rahoitusvastike vähennetään täysimääräisenä elinkeinotoiminnassa',
        'Jos yksityinen vuokranantaja: rahoitusvastikkeen vähennys voi olla rajallinen',
      ],
      tip: 'Säästä jokaisen vastikkeen kuitti! Taloyhtiön vuosikertomus auttaa tarkistamaan vähennykset.',
    },
    {
      id: 'remontti',
      title: 'Remontin kirjaus',
      icon: Wrench,
      steps: [
        'PIENKORJAUS (alle 850 €/v tai kertaluonteinen): Debet 4240 Huolto ja korjaus / Kredit 1940',
        'PARANNUSMENOT (yli 850 €, arvoa nostava): Debet 1220 Asuntoremontit / Kredit 1940',
        'Poista parannusmenot: Debet 4400 Poistot / Kredit 1220 Asuntoremontit (4-10% / vuosi)',
        'ESIMERKKI: Keittiöremontti 8000 € → Debet 1220 / Kredit 1940. Poisto 10% = 800 €/v.',
      ],
      tip: 'Kysy kirjanpitäjältä: kumpi on verotuksellisesti edullisempi — kulu heti vai parannusmeno + poisto?',
    },
    {
      id: 'korko',
      title: 'Lainakoron kirjaus',
      icon: Percent,
      steps: [
        'Lainan korko 350 €/kk: Debet 4220 Lainan korot / Kredit 1940 Pankki 350 €',
        'Lainan lyhennys EI ole kulu — se vähentää velkaa taseessa: Debet 2800 Pankkilaina / Kredit 1940',
        'Korkovähennys on täysimääräinen elinkeinotoiminnassa (yksityisellä rajattu)',
      ],
      tip: '2023 alkaen yksityisen vuokranantajan korkovähennys on enintään 20 % vuokratuloista. Elinkeinotoiminnassa ei rajaa.',
    },
    {
      id: 'siirto',
      title: 'Asunnon siirtäminen yritykselle',
      icon: Building2,
      steps: [
        'Määritä asunnon käypä arvo — tarvitaan arviolausunto tai hinta-arvio välittäjältä',
        'Tee kauppakirja yksityishenkilönä omistetun asunnon myynnistä yritykselle',
        'Yrityksen kirjaus: Debet 1210 Sijoitusasunnot [käypä arvo] / Kredit 1940 Pankki (jos maksu) tai 2000 Osakepääoma (jos pääomasijoitus)',
        'Yksityisen myyntivoitto: Ero myyntihinnan ja hankintameno-olettaman (20 %/40 %) tai todellisen hankintahinnan välillä on veronalaista pääomatuloa',
        'Jos asunto maksetaan osakepääomana: Yrityksen osakepääoma nousee, yksityishenkilö saa osakkeita vastineeksi — ei välitöntä veroa myyntivoitosta (mutta luovutusvoitto verotetaan osakkeiden myynnissä)',
      ],
      tip: 'Konsultoi aina veroasiantuntijaa ennen siirtoa! Siirtotapa (myynti, pääomasijoitus, vuokraoikeus) vaikuttaa merkittävästi verotukseen.',
    },
  ];

  return (
    <div className="space-y-3">
      {guides.map((g) => {
        const Icon = g.icon;
        const isOpen = openGuide === g.id;
        return (
          <Card key={g.id} className="overflow-hidden">
            <button
              onClick={() => setOpenGuide(isOpen ? null : g.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">{g.title}</span>
              </div>
              <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <CardContent className="pt-0 pb-4">
                <div className="ml-11 space-y-2">
                  {g.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 font-medium flex-shrink-0">{i + 1}.</span>
                      <p className="text-gray-600">{step}</p>
                    </div>
                  ))}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2 text-xs text-blue-800">
                    <Info className="w-3.5 h-3.5 inline mr-1" />{g.tip}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ─── CALCULATOR ─── */
function CalculatorTab() {
  const [purchasePrice, setPurchasePrice] = useState(200000);
  const [ownCapital, setOwnCapital] = useState(40000);
  const [loanRate, setLoanRate] = useState(4.0);
  const [monthlyRent, setMonthlyRent] = useState(1100);
  const [hoitoVastike, setHoitoVastike] = useState(250);
  const [rahoitusVastike, setRahoitusVastike] = useState(100);
  const [otherCosts, setOtherCosts] = useState(150);
  const [vacancy, setVacancy] = useState(5);

  const loanAmount = purchasePrice - ownCapital;
  const monthlyInterest = (loanAmount * (loanRate / 100)) / 12;
  const effectiveRent = monthlyRent * (1 - vacancy / 100);
  const totalCosts = hoitoVastike + rahoitusVastike + otherCosts + monthlyInterest;
  const monthlyCashFlow = effectiveRent - totalCosts;
  const yearlyCashFlow = monthlyCashFlow * 12;
  const yieldGross = purchasePrice > 0 ? (monthlyRent * 12 / purchasePrice) * 100 : 0;
  const cashOnCash = ownCapital > 0 ? (yearlyCashFlow / ownCapital) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inputs */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Asunnon tiedot</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Slider label="Ostohinta" value={purchasePrice} onChange={setPurchasePrice} min={50000} max={1000000} step={5000} unit="€" />
            <Slider label="Oma pääoma" value={ownCapital} onChange={setOwnCapital} min={0} max={purchasePrice} step={5000} unit="€" />
            <Slider label="Lainan korko" value={loanRate} onChange={setLoanRate} min={1} max={10} step={0.1} unit="%" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Vuokra ja kulut / kk</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Slider label="Vuokra" value={monthlyRent} onChange={setMonthlyRent} min={300} max={5000} step={50} unit="€" />
            <Slider label="Hoitovastike" value={hoitoVastike} onChange={setHoitoVastike} min={0} max={1000} step={10} unit="€" />
            <Slider label="Rahoitusvastike" value={rahoitusVastike} onChange={setRahoitusVastike} min={0} max={1000} step={10} unit="€" />
            <Slider label="Muut kulut" value={otherCosts} onChange={setOtherCosts} min={0} max={1000} step={10} unit="€" />
            <Slider label="Tyhjäkäynti" value={vacancy} onChange={setVacancy} min={0} max={20} step={1} unit="%" />
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ResultCard label="Lainamäärä" value={`${loanAmount.toLocaleString('fi-FI')} €`} color="blue" />
        <ResultCard label="Korko / kk" value={`${monthlyInterest.toFixed(0)} €`} color="red" />
        <ResultCard label="Kassavirta / kk" value={`${monthlyCashFlow.toFixed(0)} €`} color={monthlyCashFlow >= 0 ? 'green' : 'red'} />
        <ResultCard label="Bruttotuotto" value={`${yieldGross.toFixed(1)} %`} color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={monthlyCashFlow >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Vuosikassavirta</p>
            <p className={`text-3xl font-bold ${yearlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {yearlyCashFlow >= 0 ? '+' : ''}{yearlyCashFlow.toLocaleString('fi-FI')} €
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {monthlyCashFlow >= 0
                ? 'Asunto tuottaa positiivista kassavirtaa — hyvä sijoitus!'
                : 'Asunto tuottaa negatiivista kassavirtaa — harkitse uudelleen.'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Cash-on-Cash tuotto</p>
            <p className="text-3xl font-bold text-blue-600">{cashOnCash.toFixed(1)} %</p>
            <p className="text-xs text-gray-500 mt-1">
              Vuosituotto omalle pääomalle. Yli 5 % on hyvä, yli 8 % erinomainen.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Kulurakenne kuukausittain</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Vuokratulo (brutto)</span><span className="font-medium">{monthlyRent.toLocaleString('fi-FI')} €</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Tyhjäkäyntivaraus ({vacancy}%)</span><span className="text-red-600">−{(monthlyRent * vacancy/100).toFixed(0)} €</span></div>
            <div className="border-t pt-1 flex justify-between font-medium"><span>Vuokratulo (effektiivinen)</span><span>{effectiveRent.toFixed(0)} €</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Hoitovastike</span><span className="text-red-600">−{hoitoVastike} €</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Rahoitusvastike</span><span className="text-red-600">−{rahoitusVastike} €</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Muut kulut</span><span className="text-red-600">−{otherCosts} €</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Lainan korko</span><span className="text-red-600">−{monthlyInterest.toFixed(0)} €</span></div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Nettokassavirta</span>
              <span className={monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>{monthlyCashFlow >= 0 ? '+' : ''}{monthlyCashFlow.toFixed(0)} €/kk</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, unit }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-gray-500">{label}</label>
        <span className="text-sm font-medium text-gray-900">{value.toLocaleString('fi-FI')} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function ResultCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = { blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600' };
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-xl font-bold ${colorMap[color] || 'text-gray-900'}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

/* ─── TAX ─── */
function TaxTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Elinkeinotoiminnan verotus</CardTitle></CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p><strong>1.</strong> Laske vuokratulojen summa (kaikki asunnot yhteensä)</p>
            <p><strong>2.</strong> Vähennä kaikki kulut (korot, vastikkeet, vakuutukset, korjaukset, poistot)</p>
            <p><strong>3.</strong> Tulos = verotettava elinkeinotulo</p>
            <p><strong>4.</strong> Verotus: 20 % yhteisövero (osakeyhtiö) tai progressiivinen vero (toiminimi)</p>
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
              <p className="text-xs text-green-800"><strong>Hyöty:</strong> Kaikki kulut täysin vähennyskelpoisia — myös lainakorot ja rahoitusvastike!</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Yksityisen vuokranantajan verotus</CardTitle></CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p><strong>1.</strong> Vuokratulot ovat pääomatuloa</p>
            <p><strong>2.</strong> Vähennys: joko <em>hyvitysjärjestelmä</em> (20 % tulosta) tai todelliset kulut</p>
            <p><strong>3.</strong> Puhdas vuokratulo verotetaan 30 % (alle 30 000 €) ja 34 % (yli 30 000 €)</p>
            <p><strong>4.</strong> Korkovähennys max 20 % vuokratuloista</p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
              <p className="text-xs text-amber-800"><strong>Rajoitus:</strong> Korkovähennys rajattu, remonttien vähennysoikeus heikompi kuin elinkeinotoiminnassa.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Asuntosijoittajan verovähennykset</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { item: 'Lainan korot', type: 'elinkeino', desc: 'Täysimääräinen vähennys' },
              { item: 'Yhtiövastike (hoito)', type: 'elinkeino', desc: 'Täysimääräinen vähennys' },
              { item: 'Yhtiövastike (rahoitus)', type: 'elinkeino', desc: 'Täysimääräinen vähennys' },
              { item: 'Kiinteistövero', type: 'molemmat', desc: 'Vähennyskelpoinen' },
              { item: 'Vakuutukset', type: 'molemmat', desc: 'Vuokra- ja kiinteistövakuutus' },
              { item: 'Pienkorjaukset', type: 'molemmat', desc: 'Alle 850 €/v tai kertaluonteinen' },
              { item: 'Remontit', type: 'elinkeino', desc: 'Parannusmenona poistoilla' },
              { item: 'Isännöinti', type: 'molemmat', desc: 'Isännöintipalvelun kulut' },
              { item: 'Mainonta', type: 'molemmat', desc: 'Vuokrailmoitukset' },
              { item: 'Oikeudelliset kulut', type: 'molemmat', desc: 'Vuokrasopimukset, riidat' },
              { item: 'Autokulut', type: 'molemmat', desc: 'Asuntojen katselmuksiin' },
              { item: 'Kirjanpitäjä', type: 'molemmat', desc: 'Kirjanpitopalvelut' },
            ].map((d) => (
              <div key={d.item} className="flex items-start gap-2 p-2 border rounded-md">
                <Badge variant={d.type === 'elinkeino' ? 'default' : 'outline'} className="text-xs flex-shrink-0 mt-0.5">
                  {d.type === 'elinkeino' ? 'Yritys' : 'Molemmat'}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.item}</p>
                  <p className="text-xs text-gray-500">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Asunnon siirtäminen yritykselle */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Building2 className="w-4 h-4" /> Asunnon siirtäminen yritykselle</CardTitle></CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-3">
          <p>Asunnon siirtäminen yksityisomistuksesta yritykseen on mahdollista usealla tavalla:</p>

          <div className="space-y-2">
            <div className="bg-gray-50 rounded-md p-3">
              <p className="font-medium text-gray-900">1. Myynti markkinahintaan</p>
              <p>Myyt asunnon normaalisti osakeyhtiölle. Yritys maksaa käyvän hinnan.</p>
              <p className="text-xs text-gray-500 mt-1"><strong>Sinun verotus:</strong> Myyntivoitto = myyntihinta − hankintameno (tai hankintameno-olettama 20 %/40 %). Voitto on pääomatuloa (30 %/34 %). <strong>Yritys:</strong> Saa asunnon täysimääräisenä vähennyskelpoisena hankintamenona.</p>
            </div>

            <div className="bg-gray-50 rounded-md p-3">
              <p className="font-medium text-gray-900">2. Pääomasijoitus (osakepääomaa vastaan)</p>
              <p>Sijoitat asunnon yritykseen osakepääomaa vastaan — saat osakkeita eikä yritys maksa käteistä.</p>
              <p className="text-xs text-gray-500 mt-1"><strong>Sinun verotus:</strong> Myyntivoittoa ei veroteta välittömästi (ei-realisoitunut). Verotus siirtyy osakkeiden myyntihetkeen. <strong>Yritys:</strong> Asunnon hankintameno on käypä arvo sijoitushetkellä — parempi poistopohja!</p>
            </div>

            <div className="bg-gray-50 rounded-md p-3">
              <p className="font-medium text-gray-900">3. Vuokrasopimus yritykselle</p>
              <p>Et siirrä omistusta — annat asunnon <strong>käyttöoikeuden</strong> yritykselle, joka vuokraa eteenpäin.</p>
              <p className="text-xs text-gray-500 mt-1"><strong>Hyöty:</strong> Yksinkertainen, nopea. <strong>Haitta:</strong> Vuokrat ovat sinun pääomatuloa, yrityksen kautta kulut vähenevät mutta omistusriski pysyy sinulla.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-xs font-medium text-green-700 uppercase mb-1">Miksi siirtää yritykseen?</p>
              <ul className="text-xs text-green-800 space-y-1 list-disc ml-3">
                <li>Kaikki kulut täysin vähennyskelpoisia</li>
                <li>Lainakorot vähennetään ilman rajaa</li>
                <li>Yritysvero 20 % vs. henkilövero 30–34 %</li>
                <li>Omaisuussuoja — yrityksen kautta riski eriytetty</li>
                <li>Helpompi skaalata useita asuntoja</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-xs font-medium text-red-700 uppercase mb-1">Huomioitavaa</p>
              <ul className="text-xs text-red-800 space-y-1 list-disc ml-3">
                <li>Myyntivoitto voi olla iso kertavero</li>
                <li>Varainsiirtovero 2–4 % maksettava</li>
                <li>Yrityksen purku = osinkoverotus</li>
                <li>Asunto ei ole enää henkilökohtainen vakuus</li>
                <li>Luovutusvoittovero osakkeiden myynnissä</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
            <strong>Ennen siirtoa tee näin:</strong> (1) Hae arviolausunto asunnon käyvästä arvosta välittäjältä. (2) Konsultoi veroasiantuntijaa — lasketaan verovaikutus etukäteen. (3) Päätä siirtotapa (myynti vs. pääomasijoitus). (4) Tee kauppakirja ja kirjaa kirjanpitoon. (5) Ilmoita kauppa Verohallinnon kiinteistöverotustietojärjestelmään.
          </div>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Varainsiirtovero:</strong> Asunto-osakkeista maksetaan 2 % (tai 4 % jos myyt alle 2 vuoden sisällä ostoista).
          Varainsiirtovero on vähennyskelpoinen elinkeinotoiminnassa. Kiinteistöistä vero on 4 %.
        </div>
      </div>
    </div>
  );
}

/* ─── STRATEGIES ─── */
function StrategiesTab() {
  const strategies = [
    {
      name: 'Buy and Hold',
      desc: 'Osta asunto, vuokraa se pitkäaikaisesti, kerää vuokratuloja ja arvonnousua.',
      pros: ['Passiivinen tulo', 'Arvonnousu pitkällä tähtäimellä', 'Vähemmän työtä'],
      cons: ['Kassavirta voi olla heikko', 'Vuokralaisriski', 'Pääoma sidottu'],
      bestFor: 'Aloittelijat ja ne, jotka haluavat vakaata kassavirtaa',
    },
    {
      name: 'House Flipping',
      desc: 'Osta remontoitava asunto, remontoi, myy voitolla.',
      pros: ['Nopea tuotto', 'Ei vuokralaisriskiä', 'Käteistä nopeasti'],
      cons: ['Paljon työtä', 'Korkea riski', 'Verotus voi olla kova', 'Vaatii osaamista'],
      bestFor: 'Kokeneet sijoittajat, joilla on remontti- ja markkinaosaamista',
    },
    {
      name: 'BRRRR',
      desc: 'Buy, Rehab, Rent, Refinance, Repeat. Osta, remontoi, vuokraa, refinansoi, toista.',
      pros: ['Kierrätät saman pääoman', 'Skaalautuva', 'Arvonnousu + kassavirta'],
      cons: ['Monimutkainen', 'Pankin hyväksyntä tarvitaan', 'Riski kasvaa useilla lainoilla'],
      bestFor: 'Aktiiviset sijoittajat, jotka haluavat kasvattaa nopeasti',
    },
    {
      name: 'Airbnb / Lyhytvuokraus',
      desc: 'Vuokraa asuntoa lyhytaikaisesti turisteille tai työmatkalaisille.',
      pros: ['Korkeampi vuokratuotto', 'Joustavuus', 'Voi käyttää itsekin'],
      cons: ['Enemmän työtä', 'Kausivaihtelu', 'ALV-velvollisuus yli 15 000 €', 'Sääntely'],
      bestFor: 'Kohteet hyvillä paikoilla (keskustat, lomakohteet)',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((s) => (
          <Card key={s.name}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> {s.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>{s.desc}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Hyvää</p>
                  {s.pros.map((p, i) => (
                    <p key={i} className="text-xs text-gray-600">✓ {p}</p>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">Haasteet</p>
                  {s.cons.map((c, i) => (
                    <p key={i} className="text-xs text-gray-600">− {c}</p>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-md p-2 text-xs text-gray-500 mt-1">
                <strong>Sopii:</strong> {s.bestFor}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Aloittelijan valinta:</strong> Suurimmalle osalle paras ensimmäinen askel on
              <strong> Buy and Hold</strong> hyvällä sijainnilla. Etsi asunto, jossa positiivinen kassavirta
              (vuokra {'>'} kulut + korko) ja pidä se pitkään. Aika ja vuokrat korjaavat ostajan virheet.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
