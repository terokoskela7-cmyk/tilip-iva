import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Rocket, Shield, Calculator, Receipt, CalendarDays, AlertTriangle, HeartHandshake,
  CheckCircle2, Circle, Phone, ExternalLink, Info
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

function useChecklist(key: string, initial: ChecklistItem[]) {
  const stored = localStorage.getItem(`checklist-${key}`);
  const [items, setItems] = useState<ChecklistItem[]>(
    stored ? JSON.parse(stored) : initial
  );

  function toggle(id: string) {
    const updated = items.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
    setItems(updated);
    localStorage.setItem(`checklist-${key}`, JSON.stringify(updated));
  }

  function reset() {
    const resetItems = items.map((i) => ({ ...i, done: false }));
    setItems(resetItems);
    localStorage.setItem(`checklist-${key}`, JSON.stringify(resetItems));
  }

  const completed = items.filter((i) => i.done).length;
  return { items, toggle, reset, completed, total: items.length };
}

export default function EntrepreneurGuide() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900">Uuden yrittäjän opas</h2>
        <p className="text-sm text-gray-500 mt-1">
          Kattava opas yrityksen perustamisesta ja arjen hallinnasta.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="perustaminen" className="max-w-5xl mx-auto">
          <TabsList className="grid grid-cols-2 lg:grid-cols-8 mb-4 h-auto">
            <TabsTrigger value="perustaminen" className="text-xs">Perustaminen</TabsTrigger>
            <TabsTrigger value="vakuutukset" className="text-xs">Vakuutukset</TabsTrigger>
            <TabsTrigger value="palkka" className="text-xs">Palkka</TabsTrigger>
            <TabsTrigger value="verot" className="text-xs">Verot</TabsTrigger>
            <TabsTrigger value="alv" className="text-xs">ALV</TabsTrigger>
            <TabsTrigger value="aikataulu" className="text-xs">Aikataulu</TabsTrigger>
            <TabsTrigger value="virheet" className="text-xs">Virheet</TabsTrigger>
            <TabsTrigger value="tuki" className="text-xs">Apua</TabsTrigger>
          </TabsList>

          <TabsContent value="perustaminen"><Perustaminen /></TabsContent>
          <TabsContent value="vakuutukset"><Vakuutukset /></TabsContent>
          <TabsContent value="palkka"><PalkkaVsOsinko /></TabsContent>
          <TabsContent value="verot"><Verovahennykset /></TabsContent>
          <TabsContent value="alv"><ALVOpas /></TabsContent>
          <TabsContent value="aikataulu"><Aikataulu /></TabsContent>
          <TabsContent value="virheet"><Virheet /></TabsContent>
          <TabsContent value="tuki"><Tuki /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ─── PERUSTAMINEN ─── */
function Perustaminen() {
  const { items, toggle, reset, completed, total } = useChecklist('perustaminen', [
    { id: 'p1', text: 'Valitse yritysmuoto (toiminimi, oy, ky, ay)', done: false },
    { id: 'p2', text: 'Rekisteröi yritys kaupparekisteriin (PRH) → saat Y-tunnuksen', done: false },
    { id: 'p3', text: 'Avaa yritykselle pankkitili', done: false },
    { id: 'p4', text: 'Rekisteröidy arvonlisäverorekisteriin (jos liikevaihto > 15 000 €/vuosi)', done: false },
    { id: 'p5', text: 'Rekisteröidy ennakkoperintärekisteriin (kriittinen!)', done: false },
    { id: 'p6', text: 'Ilmoita toimiala YTJ:ssä', done: false },
    { id: 'p7', text: 'Ota YEL-vakuutus (jos työtulo yli 8 575 €/vuosi)', done: false },
    { id: 'p8', text: 'Hanki kirjanpito-ohjelma (tada — sinulla on jo Tilipäivä!)', done: true },
    { id: 'p9', text: 'Liity Suomen Yrittäjiin (suositus)', done: false },
    { id: 'p10', text: 'Aseta puskurirahasto (3–6 kk kuluihin)', done: false },
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Rocket className="w-4 h-4" /> Perustamisen muistilista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">{completed}/{total} tehtyä</p>
            <Button variant="outline" size="sm" onClick={reset}>Nollaa lista</Button>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-blue-600 transition-all rounded-full" style={{ width: `${(completed/total)*100}%` }} />
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-50 text-left transition-colors"
              >
                {item.done ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                <span className={`text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.text}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Yritysmuodon valinta</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p><strong>Toiminimi</strong> — Helppo aloittaa, henkilökohtainen vastuu. Sopii yksinyrittäjälle.</p>
            <p><strong>Osakeyhtiö (Oy)</strong> — Rajattu vastuu, verotehokas palkan kanssa. Sopii kasvuun ja palkkaomalle.</p>
            <p><strong>Kommandiittiyhtiö (Ky)</strong> — Kaksi+ vastuunkantajaa, osittain rajattu vastuu.</p>
            <p><strong>Aktiivinen ay</strong> — Rajattu vastuu, usein ammattilaisille (lääkärit, asianajajat).</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Ennakkoperintärekisteri — miksi?</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>Jos et ole ennakkoperintärekisterissä, asiakkaasi <strong>joutuu pidättämään 13 % veron palkkiostasi</strong> ja maksamaan sen Verohallinnolle.</p>
            <p>Rekisteröidy heti perustamisen yhteydessä YTJ:ssä — se on ilmaista ja estää rahan jäämisen "jumiin".</p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
              <p className="text-xs text-amber-800"><strong>Vinkki:</strong> Suurin osa asiakkaista vaatii tämän ennen kuin voit laskuttaa.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── VAKUUTUKSET ─── */
function Vakuutukset() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2"><Shield className="w-4 h-4" /> Pakolliset ja suositellut vakuutukset</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'YEL (Yrittäjän eläkevakuutus)', when: 'Kun työtulo > 8 575 €/vuosi, 6 kk kuluessa', cost: '300–500 €/kk', must: true, desc: 'Kerryttää eläkettä ja sairauspäivärahaa. Yrittäjän tärkein vakuutus!' },
              { name: 'Tapaturmavakuutus itselle', when: 'Jos työ vaarallista', cost: '50–200 €/vuosi', must: false, desc: 'Korvaa tapaturmatyössä — tärkeä rakennus-, kuljetus- yms. aloilla' },
              { name: 'Työntekijöiden tapaturmavakuutus', when: 'Heti ensimmäisestä työntekijästä', cost: 'Palkkasummasta', must: true, desc: 'Lakisääteinen — jokaisella työnantajalla oltava' },
              { name: 'Toiminnanvastuuvakuutus', when: 'Suositeltava heti', cost: '200–500 €/vuosi', must: false, desc: 'Suojaa jos asiakas vahingoittuu palvelusi seurauksena' },
              { name: 'Omaisuusvakuutus', when: 'Jos toimitiloja/laitteita', cost: 'Sisältökohtainen', must: false, desc: 'Korvaa varkaudet, tulipalon, vesivahingot' },
              { name: 'Oikeusturvavakuutus', when: 'Suositeltava', cost: '100–300 €/vuosi', must: false, desc: 'Kattaa oikeudenkäyntikuluja riitatilanteissa' },
            ].map((v) => (
              <div key={v.name} className="flex items-start gap-3 p-3 border rounded-md">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${v.must ? 'bg-red-500' : 'bg-blue-400'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{v.name}</p>
                    {v.must && <Badge variant="destructive" className="text-xs">Pakollinen</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{v.desc}</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-gray-500">Milloin: {v.when}</span>
                    <span className="text-xs text-gray-500">Hinta: {v.cost}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── PALKKA VS OSINKO ─── */
function PalkkaVsOsinko() {
  const [brutto, setBrutto] = useState(45000);
  const [osinko, setOsinko] = useState(20000);
  const [capital, setCapital] = useState(2500);

  // Simplified tax calculations (Finland 2024)
  const palkkaVero = brutto * 0.35; // ~35% effective
  const palkkaNetto = brutto - palkkaVero;
  const yelCost = Math.min(brutto, 45000) * 0.24; // ~24% of work income

  const osinkoVero = osinko <= capital * 0.08 ? osinko * 0.30 : (capital * 0.08 * 0.30) + ((osinko - capital * 0.08) * 0.34);
  const osinkoNetto = osinko - osinkoVero;

  const yrittajavahennys = Math.min(brutto * 0.15, 5000);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2"><Calculator className="w-4 h-4" /> Palkka vs. Osinko -laskuri</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Vuosipalkka (brutto)</label>
              <input type="range" min="0" max="150000" step="1000" value={brutto} onChange={(e) => setBrutto(Number(e.target.value))} className="w-full" />
              <p className="text-sm font-bold text-gray-900 mt-1">{brutto.toLocaleString('fi-FI')} €</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Osinko (brutto)</label>
              <input type="range" min="0" max="100000" step="1000" value={osinko} onChange={(e) => setOsinko(Number(e.target.value))} className="w-full" />
              <p className="text-sm font-bold text-gray-900 mt-1">{osinko.toLocaleString('fi-FI')} €</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Osakepääoma</label>
              <input type="range" min="0" max="50000" step="500" value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="w-full" />
              <p className="text-sm font-bold text-gray-900 mt-1">{capital.toLocaleString('fi-FI')} €</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-bold text-blue-800 mb-2">Palkka</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Brutto</span><span className="font-medium">{brutto.toLocaleString('fi-FI')} €</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Verot (~35%)</span><span className="font-medium text-red-600">-{palkkaVero.toLocaleString('fi-FI')} €</span></div>
                <div className="flex justify-between"><span className="text-gray-600">YEL (arvio)</span><span className="font-medium text-red-600">-{yelCost.toLocaleString('fi-FI')} €</span></div>
                <div className="border-t pt-1 flex justify-between font-bold"><span>Netto</span><span>{palkkaNetto.toLocaleString('fi-FI')} €</span></div>
                <div className="flex justify-between text-xs text-green-700"><span>Yrittäjävähennys</span><span>-{yrittajavahennys.toLocaleString('fi-FI')} €</span></div>
              </div>
              <div className="mt-2 text-xs text-blue-700 bg-white rounded p-2">
                <strong>+</strong> Kerryttää eläkettä ja sairauspäivärahaa<br />
                <strong>+</strong> Oikeuttaa työttömyysturvaan (maksullinen)<br />
                <strong>-</strong> Korkeampi veroaste
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <h4 className="text-sm font-bold text-amber-800 mb-2">Osinko</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Brutto</span><span className="font-medium">{osinko.toLocaleString('fi-FI')} €</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Verot</span><span className="font-medium text-red-600">-{osinkoVero.toLocaleString('fi-FI')} €</span></div>
                <div className="border-t pt-1 flex justify-between font-bold"><span>Netto</span><span>{osinkoNetto.toLocaleString('fi-FI')} €</span></div>
              </div>
              <div className="mt-2 text-xs text-amber-700 bg-white rounded p-2">
                <strong>+</strong> Matalampi vero (30–34%)<br />
                <strong>+</strong> Ei YEL-maksua osingosta<br />
                <strong>−</strong> Ei kerrytä eläkettä<br />
                <strong>−</strong> Ei oikeuta sairauspäivärahaan
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
            <strong>Suositus:</strong> Maksa itsellesi palkkaa vähintään 45 000 €/vuosi (YEL-katon verran) — se on verotehokasta ja kerryttää sosiaaliturvaa. Osinkoa voi nostaa täydentävästi.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── VEROVÄHENNYKSET ─── */
function Verovahennykset() {
  const deductions = [
    { item: 'Toimitilan vuokra', percent: '100%', note: 'Täysin vähennyskelpoinen' },
    { item: 'Sähkö, vesi, lämmitys', percent: '100%', note: 'Täysin vähennyskelpoinen' },
    { item: 'Tietokoneet ja laitteet', percent: '100%', note: 'Alle 850 € kuluna, yli taseeseen' },
    { item: 'Ohjelmistot ja pilvipalvelut', percent: '100%', note: 'Office 365, Adobe, jne.' },
    { item: 'Puhelin ja internet', percent: '100%', note: 'Jos yrityskäyttöä' },
    { item: 'Kilometrikorvaus', percent: '0,46 €/km', note: 'Verovapaa korvaus, ei vähennys' },
    { item: 'Edustuskulut', percent: '50%', note: 'Vain puolet vähennyskelpoista' },
    { item: 'Koulutukset ja kirjat', percent: '100%', note: 'Ammatillinen kehittyminen' },
    { item: 'Markkinointi', percent: '100%', note: 'Mainonta, nettisivut, some' },
    { item: 'Kirjanpitäjä/tilitoimisto', percent: '100%', note: 'Kirjanpitokulut' },
    { item: 'Yrittäjävähennys', percent: '15%', note: 'Max 5 000 €/vuosi' },
    { item: 'Autokulut', percent: '50–100%', note: 'Riippuu työajosuhteesta' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2"><Receipt className="w-4 h-4" /> Yleisimmät verovähennykset</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {deductions.map((d) => (
              <div key={d.item} className="flex items-start gap-3 p-3 border rounded-md">
                <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded flex-shrink-0">{d.percent}</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.item}</p>
                  <p className="text-xs text-gray-500">{d.note}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Yrittäjävähennys</CardTitle></CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p><strong>15 % yritystulosta, enintään 5 000 €/vuosi.</strong></p>
            <p>Tämä vähennetään automaattisesti verotuksessa. Sinun ei tarvitse tehdä mitään — Verohallinto laskee sen.</p>
            <p>Esimerkki: 50 000 € tulos → vähennys 5 000 € (maximi).</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Auton käyttö</CardTitle></CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>Jos ajat työasiointia yli 50 % auton käytöstä, kaikki autokulut ovat vähennyskelpoisia.</p>
            <p>J alle 50 %, vain työajoon liittyvä osuus.</p>
            <p><strong>Kilometrikorvaus:</strong> 0,46 €/km (2025) on <em>verovapaa</em> — siitä ei mene veroja ollenkaan.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── ALV ─── */
function ALVOpas() {
  const industries = [
    {
      rate: '25,5 %',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-900',
      labelColor: 'text-blue-600',
      title: 'Yleinen verokanta',
      examples: ['IT-palvelut ja konsultointi', 'Ohjelmistot ja lisenssit', 'Sähkö ja elektroniikka', 'Vaatteet ja kalusteet', 'Rakennus ja remontti', 'Mainonta ja markkinointi', 'Kuljetus ja logistiikka', 'Kauneudenhoito (kosmetiikka)', 'Autojen myynti ja korjaus'],
    },
    {
      rate: '14 %',
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-900',
      labelColor: 'text-orange-600',
      title: 'Alennettu 1',
      examples: ['Ravintola-ateriat ja -palvelut', 'Elintarvikkeet (kaupasta)', 'Nautintoaineet (kahvi, tee)', 'Eläinten ruoka ja rehu', 'Urheiluravinteet', 'Juomavedet (ei virvoitusjuomia)'],
    },
    {
      rate: '10 %',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-900',
      labelColor: 'text-purple-600',
      title: 'Alennettu 2',
      examples: ['Kirjat ja e-kirjat', 'Sanomalehdet ja aikakauslehdet', 'Reseptilääkkeet', 'Liikuntapalvelut (kuntosali, uimahalli)', 'Kulttuuripalvelut (teatteri, museo)', 'Yleinen liikenne (bussi, juna)', 'Eläinlääkäripalvelut'],
    },
    {
      rate: '0 %',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-900',
      labelColor: 'text-green-600',
      title: 'Vapautettu / nolla',
      examples: ['Lääkäri- ja hoivapalvelut', 'Koulutus ja opetus', 'Pankki- ja rahoituspalvelut', 'Vakuutuspalvelut', 'Kiinteistönvälitys ja -vuokraus', 'Lotto ja rahapelit', 'Sosiaalipalvelut', 'Yhteisömyynti EU:ssa'],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {industries.map((ind) => (
          <Card key={ind.rate} className={`${ind.color} ${ind.title === 'Yleinen verokanta' ? 'md:col-span-1' : ''}`}>
            <CardContent className="p-4">
              <p className={`text-xs ${ind.labelColor} font-medium uppercase`}>{ind.title}</p>
              <p className={`text-3xl font-bold ${ind.textColor} mt-1`}>{ind.rate}</p>
              <p className="text-xs text-gray-500 mt-1">{ind.examples.length} toimialaa</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Industry breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {industries.map((ind) => (
          <Card key={ind.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className={`text-lg font-bold ${ind.textColor}`}>{ind.rate}</span>
                {ind.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {ind.examples.map((ex) => (
                  <li key={ex} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${ind.labelColor.replace('text-', 'bg-')}`} />
                    {ex}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Practical example */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Esimerkki: Ravintola-alan yrittäjä</CardTitle></CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>Ravintolassa voi olla samassa laskussa useita eri ALV-kantoja:</p>
          <div className="bg-gray-50 rounded-md p-3 space-y-1">
            <p>🍽️ <strong>Ateria salissa</strong> — 20 € + ALV 14 % = 22,80 €</p>
            <p>🥤 <strong>Virvoitusjuoma</strong> — 3 € + ALV 25,5 % = 3,77 €</p>
            <p>📖 <strong>Ruokakirja myyntiin</strong> — 25 € + ALV 10 % = 27,50 €</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <strong>Tärkeää:</strong> Kun valitset tiliä Tilipäivässä, merkitse myös oikea ALV-kanta. Jos toimialasi on ALV-vapaa (esim. koulutus, terveys), älä lisää ALV:ia ollenkaan.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Miten ALV toimii käytännössä (25,5 %)</CardTitle></CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-3">
          <p><strong>1. Myynti:</strong> Lasket laskun 1 000 € + ALV 25,5 % = 1 255 €. Asiakas maksaa 1 255 €.</p>
          <p><strong>2. ALV-velka:</strong> 255 € on Verottajan rahaa — kirjataan tilille 29391 ALV velka.</p>
          <p><strong>3. Osto:</strong> Ostat tavaraa 500 € + ALV 25,5 % = 627,50 €. ALV (127,50 €) on vähennettävissä.</p>
          <p><strong>4. ALV-saatava:</strong> 127,50 € kirjataan tilille 29392 ALV saatava.</p>
          <p><strong>5. Netto:</strong> 255 € − 127,50 € = <strong>127,50 € maksettavaa</strong> Verottajalle.</p>
          <div className="bg-gray-50 rounded-md p-3 mt-2">
            <p className="text-xs text-gray-500"><strong>Ilmoitusväli:</strong> Pääsääntöisesti kuukausittain jos liikevaihto {'>'} 100 000 €/vuosi, muuten neljännesvuosittain. Ilmoita OmaVerossa.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── AIKATAULU ─── */
function Aikataulu() {
  const events = [
    { date: 'Joka kuukausi', task: 'ALV-ilmoitus ja maksu (jos kuukausittainen)', critical: false },
    { date: 'Helmikuu', task: 'Ilmoita YEL-työtulo eläkeyhtiölle', critical: true },
    { date: 'Maalis, Kesä, Syys, Joulu', task: 'ALV-ilmoitus (neljännesvuosittainen)', critical: false },
    { date: 'Helmikuu, toukokuu, syyskuu, joulukuu', task: 'Yhteisöveron ennakkovero', critical: false },
    { date: '4 kk tilikauden päättymisen jälkeen', task: 'Tilinpäätös ja veroilmoitus', critical: true },
    { date: '6 kk tilikauden päättymisen jälkeen', task: 'Tilinpäätös kaupparekisteriin', critical: true },
    { date: 'Joka vuosi', task: 'YEL-työtulon tarkistus', critical: false },
    { date: 'Tammikuu', task: 'Vuosi-ilmoitukset (palkat, osingot)', critical: true },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Vuosikello yrittäjälle</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.map((e, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-md ${e.critical ? 'bg-red-50 border border-red-200' : 'border'}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.critical ? 'bg-red-500' : 'bg-blue-400'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{e.task}</p>
                  <p className="text-xs text-gray-500">{e.date}</p>
                </div>
                {e.critical && <Badge variant="destructive" className="text-xs">Tärkeä</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── VIRHEET ─── */
function Virheet() {
  const mistakes = [
    { wrong: 'Sekotat omat ja yrityksen rahat', right: 'Aina erillinen pankkitili yritykselle', severity: 'high' },
    { wrong: 'Et rekisteröidy ennakkoperintärekisteriin', right: 'Tee heti perustamisen yhteydessä', severity: 'high' },
    { wrong: 'Unohdat YEL-vakuutuksen', right: 'Ota 6 kk kuluessa, jos työtulo > 8 575 €', severity: 'high' },
    { wrong: 'Et pidä kuitteja', right: 'Kuvaa kuitti heti puhelimella', severity: 'high' },
    { wrong: 'Laittaa liian alhaisen hinnan', right: 'Laske: palkka + YEL + ALV + puskuri', severity: 'medium' },
    { wrong: 'Unohtaa ennakkoverot', right: 'Maksu neljännesvuosittain', severity: 'high' },
    { wrong: 'Ei erota netto- ja bruttopalkkaa', right: 'Kirjanpidossa aina brutto', severity: 'medium' },
    { wrong: 'Ei laskuta ajoissa', right: 'Lähetä lasku heti työn valmistuttua', severity: 'medium' },
    { wrong: 'Ei varmuuskopioi kirjanpitoa', right: 'Vie JSON Tilipäivästä kuukausittain', severity: 'medium' },
    { wrong: 'Sekoittaa palkka- ja osinkonosto', right: 'Palkka ensin 45k+, osinko täydentävästi', severity: 'medium' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Yleisimmät aloittajan virheet</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mistakes.map((m, i) => (
              <div key={i} className={`p-3 rounded-md border ${m.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${m.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                    {m.severity === 'high' ? 'Kriittinen' : 'Huomio'}
                  </span>
                </div>
                <p className="text-sm text-red-700 line-through">❌ {m.wrong}</p>
                <p className="text-sm text-green-700 mt-1">✅ {m.right}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── TUKI ─── */
function Tuki() {
  const resources = [
    { name: 'Verohallinnon neuvonta', contact: '029 497 050', desc: 'Verokysymykset — ilmainen!', type: 'phone' },
    { name: 'Suomen Yrittäjät', contact: 'yritysklinikka', desc: 'Jäsenille lakineuvonta, sopimukset, koulutukset', type: 'link' },
    { name: 'Finnvera', contact: 'finnvera.fi', desc: 'Rahoitus ja takaukset', type: 'link' },
    { name: 'Business Finland', contact: 'businessfinland.fi', desc: 'Innovaatiorahoitus ja kansainvälistyminen', type: 'link' },
    { name: 'Yritys-Suomi', contact: 'suomi.fi/yritykselle', desc: 'Kaikki yrityspalvelut yhdessä paikassa', type: 'link' },
    { name: 'Eläketurvakeskus (ETK)', contact: 'etk.fi', desc: 'YEL- ja työeläkekysymykset', type: 'link' },
    { name: 'Kela', contact: 'kela.fi', desc: 'Yrittäjän sosiaaliturva', type: 'link' },
    { name: 'TE-palvelut', contact: 'te-palvelut.fi', desc: 'Starttiraha, neuvonta', type: 'link' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2"><HeartHandshake className="w-4 h-4" /> Apua ja tukiresurssit</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resources.map((r) => (
              <div key={r.name} className="flex items-start gap-3 p-3 border rounded-md hover:bg-gray-50 transition-colors">
                {r.type === 'phone' ? <Phone className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /> : <ExternalLink className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">{r.contact}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Muista tämä</p>
              <p className="text-sm text-blue-700 mt-1">
                Sinun ei tarvitse osata kaikkea heti. Aloita pienesti, pidä kirjaa rahoista, ja pyydä apua kun tarvitset.
                Tilitoimisto maksaa itsensä takaisin moninkertaisesti — harkitse sellaisen palkkaamista heti alusta.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
