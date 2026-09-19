# Tilipäivä — tekninen auditointi

Päivämäärä: 2026-09-19
Tarkastettu commit: `c7c40cc` (haara `main`)
Laajuus: koko `src/`, Firebase-konfiguraatio ja -säännöt, build-putki ja CI.

## Yhteenveto

**Sovellus kääntyy ja käynnistyy, mutta se ei ole tuotantokunnossa oikeaan kirjanpitoon.**

Tuotantobuild menee läpi puhtaasti (`tsc -b && vite build`, 11,5 s, PWA generoituu). Autentikointi,
Firestore-säännöt ja tilikartat ovat kunnossa. Perusvirta — kirjaudu, luo tilikirja, tee tosite,
katso raportit — toimii.

Vakavimmat ongelmat eivät ole kaatumisia vaan **hiljaisia tietojen menetyksiä**. Sovelluksessa on
kolme rinnakkaista tallennuspaikkaa — Firestore, IndexedDB ja localStorage — ja osa näkymistä
kirjoittaa eri paikkaan kuin mistä muu sovellus lukee. Lisäksi "Lataa varmuuskopio" lukee väärästä
tietokannasta, eli se tuottaa käytännössä tyhjän varmuuskopion.

| Vakavuus | Kpl | Ydin |
|---|---|---|
| Kriittinen | 5 | Data katoaa tai ei synkronoidu; varmuuskopio ei varmuuskopioi |
| Korkea | 8 | Kirjanpidon oikeellisuus: tositteet, raportit, laskutus |
| Keskitaso | 11 | Luokittelu, CSV-tuonti, laskurit, suorituskyky |
| Matala | 9 | Toimitusketju, lint, testit, kuollut koodi |

### Korjaustilanne

| Löydös | Tila |
|---|---|
| K1 Onboarding ohitetaan | ✅ Korjattu |
| K2 Laskutus ja toistuvat kirjaukset IndexedDB:ssä | ✅ Korjattu |
| K3 Varmuuskopio / tyhjennys väärästä tietokannasta | ✅ Korjattu |
| K4 Oma talous lukee localStoragesta | ✅ Korjattu |
| K5 Firestore kaatuu undefined-arvoihin | ✅ Korjattu |
| H8 Kassatapahtumat IndexedDB:ssä | ✅ Korjattu |
| M7 CSV-tuonti kirjoittaa rivi kerrallaan | ✅ Korjattu |
| M10 Migraatio ylittää batch-rajan | ✅ Korjattu |
| M11 Turhia Firestore-lukuja | ✅ Korjattu |
| H1 Epätasapainoinen tosite voi tallentua | ✅ Korjattu |
| H3 Raportit eivät rajaa tilikautta | ✅ Korjattu |
| H4 Negatiiviset saldot nollataan | ✅ Korjattu |
| H5 Tase ei sisällä tilikauden tulosta | ✅ Korjattu |
| H2 Tositenumerointi ei ole luotettava | ✅ Korjattu |
| H6 Laskun numerointi ei ole juokseva | ✅ Korjattu |
| H7 Laskun maksukirjaus on väärin | ✅ Korjattu |
| M1 Yli 500 € luokitellaan palkaksi | ✅ Korjattu |
| M2 Budjetti tuntee vain 8 kategoriaa 13:sta | ✅ Korjattu |
| M3 CSV-summien jäsennys rikkoo pisteelliset formaatit | ✅ Korjattu |
| M4 CSV-jäsennys ei kestä lainausmerkkejä | ✅ Korjattu |
| M5 Tuonti ei tunnista duplikaatteja | ✅ Korjattu |
| M6 Kuollut haarautuminen päivämäärissä | ✅ Korjattu |
| L3 Ei yhtään testiä | 🟡 Laskentalogiikka testattu (79 testiä), CI ajaa testit |
| M8–M9, L1, L2, L4–L9 | ⬜ Avoin |

**Kaikki kirjoitukset menevät nyt Firestoreen.** `src/lib/db.ts` (IndexedDB) ja `src/lib/seed.ts`
on poistettu; `src/lib/legacyMigration.ts` siirtää aiemmin paikallisesti tallennetun aineiston
Firestoreen kertaalleen käyttäjää kohden.

---

## Kriittiset

### K1. Uusi käyttäjä ei näe onboardingia ollenkaan — ✅ korjattu
`src/hooks/useStore.ts:73-99`

Kun rekisteröitynyt käyttäjä kirjautuu ensimmäistä kertaa, tilikirjoja ei ole. Silloin
`activeLedger` jää `undefined`, jolloin

```ts
const companyRequired = activeLedger?.type === 'company';   // undefined === 'company' → false
if (!comp && companyRequired) { setHasCompany(false); ... } // ei koskaan suoriteta
setHasCompany(true);
```

`hasCompany` asetetaan todeksi, ja `MainApp` renderöi päänäkymän. `Onboarding`-komponentti
(`src/components/Onboarding.tsx`) on uudelle käyttäjälle **saavuttamaton koodi**. Käyttäjä laskeutuu
tyhjään dashboardiin ilman tilikarttaa ja ilman ohjeistusta. Ainoa ulospääsy on sivupalkin
"Luo uusi tilikirja".

*Korjaus:* `const companyRequired = !activeLedger || activeLedger.type === 'company';`

### K2. Laskutus ja toistuvat kirjaukset tallentuvat IndexedDB:hen, ei Firestoreen — ✅ korjattu
`src/components/Invoicing.tsx:13`, `src/components/RecurringEntries.tsx:11`

Molemmat importoivat `@/lib/db` (IndexedDB) eivätkä `@/lib/firestore`. Seuraukset:

- Laskut, asiakkaat ja toistuvat kirjaukset elävät vain siinä selaimessa. Toisella laitteella ne eivät näy.
- Ne eivät varmuuskopioidu Firestoreen eivätkä sisälly mihinkään exporttiin.
- Selaimen datan tyhjennys tuhoaa ne pysyvästi.
- IndexedDB-taulut **eivät ole tilikirjakohtaisia**: kaikki tilikirjat jakavat saman lasku- ja
  asiakasrekisterin. Tilikirjaa vaihtamalla näkyvät samat laskut.
- `useStore` lataa `customers`, `invoices` ja `recurringEntries` Firestoresta joka latauksella —
  mutta yksikään näkymä ei käytä niitä (ks. M11).

### K3. Varmuuskopio on tyhjä ja "tyhjennä data" ei tyhjennä — ✅ korjattu
`src/components/SettingsPage.tsx:9, 45-62`

```ts
import { exportAllData, resetDatabase } from '@/lib/db';   // ← IndexedDB
```

- **Lataa varmuuskopio** vie IndexedDB:n sisällön. Koska tositteet, tilit ja yritystiedot ovat
  Firestoressa, ladattu JSON on käytännössä tyhjä. Käyttäjä luulee ottaneensa varmuuskopion.
  Kirjanpitoaineiston säilytysvelvollisuuden (KPL 2:10) kannalta tämä on vakavin yksittäinen löydös.
- **Tyhjennä kaikki data** tyhjentää IndexedDB:n ja kylvää sinne demo-datan (`seedDatabase`),
  mutta Firestoressa oleva oikea aineisto jää koskemattomaksi. Toiminto ei tee mitä lupaa.

`src/lib/firestore.ts` sisältää jo oikeat `exportAllData` ja `resetDatabase` -funktiot — vain
import osoittaa väärään moduuliin.

### K4. "Oma talous" näyttää localStoragen, budjetti Firestoren — ✅ korjattu
`src/components/PersonalFinance.tsx:490, 495-519`

```ts
export default function PersonalFinance({ entries: _entries, ... })
```

Firestoresta tulevat tapahtumat otetaan vastaan ja **heitetään pois**. Näkymä renderöi
`localEntries`, joka luetaan `localStorage`-avaimesta `tilipaiva_personal_entries`.
Samaan aikaan `BudgetPage` saa `store.personalEntries` eli Firestoren datan.

Seuraukset: lista ja budjetin toteuma eivät koskaan täsmää; toisella laitteella "Oma talous" on
tyhjä (tai näyttää demo-dataa) vaikka Firestoressa on tapahtumia; `clearAllData`
(`PersonalFinance.tsx:686`) tyhjentää vain localStoragen, joten "Tyhjennetäänkö kaikki Oma talous
-tiedot?" jättää Firestoren tapahtumat paikalleen — ja ne näkyvät yhä budjettinäkymässä.

### K5. Firestore hylkää `undefined`-arvot → tallennus kaatuu — ✅ korjattu
`src/components/Onboarding.tsx:61`, `src/components/PersonalFinance.tsx:592`

Firestore-SDK heittää `setDoc`-kutsussa virheen `Unsupported field value: undefined`, koska
`ignoreUndefinedProperties` ei ole päällä (`src/firebase/config.ts:17`).

- `Onboarding.tsx:61` — `yTunnus: company.yTunnus || undefined`. Jos käyttäjä jättää Y-tunnuksen
  tyhjäksi (toiminimellä tavallista), koko yrityksen luonti epäonnistuu: *"Yrityksen luonti
  epäonnistui. Yritä uudelleen."* — ja uudelleenyritys epäonnistuu samoin.
- `PersonalFinance.tsx:592` — `accountId: accountId === 'cash' ? undefined : accountId`.
  Käteistapahtuman tallennus Firestoreen heittää. `handleSubmit` ei `await`aa eikä `catch`aa, joten
  virhe menee käsittelemättömäksi promise-hylkäykseksi: rivi ilmestyy listaan, mutta pilveen se ei
  koskaan päädy.

`useStore.ts:165-170` tekee tämän oikein (poistaa undefined-kentät ennen tallennusta) — sama
käsittely puuttuu muualta.

*Korjaus kerralla kaikkiin:* `initializeFirestore(app, { ignoreUndefinedProperties: true })`.

---

## Korkeat — kirjanpidon oikeellisuus

### H1. Epätasapainoinen tosite voi tallentua — ✅ korjattu
`src/components/EntryModal.tsx:127-142` vs `:174`

`validate()` laskee debet/kredit-summat **kaikilta** riveiltä, mutta tallennus pudottaa rivit joilta
puuttuu tili:

```ts
lines: lines.filter((l) => l.accountId),
```

Jos käyttäjä syöttää debet 100 € tilille A ja kredit 100 € riville jolta tili on valitsematta,
validointi menee läpi ja tallennettu tosite on 100 € epätasapainossa. Kahdenkertaisen kirjanpidon
perusinvariantti rikkoutuu hiljaisesti.

### H2. Tositenumerointi ei ole luotettava — ✅ korjattu
- `EntryModal.tsx:27-31` — `max(numerot)+1`, ei uniikkiustarkistusta eikä varausta. Kaksi
  samanaikaista välilehteä tuottaa saman numeron.
- `Invoicing.tsx:182` ja `RecurringEntries.tsx:111` luovat tositteita kentällä `number: ''`.
  Tositteet jäävät ilman numeroa, eikä niitä löydä haulla.

### H3. Raportit eivät rajaa tilikautta lainkaan — ✅ korjattu
`src/components/Reports.tsx:19, 83`

`period`-tila on kovakoodattu arvoon `'2024'`, ja ainoa painike asettaa saman arvon uudelleen.
Tilaa ei käytetä missään laskennassa. Tuloslaskelma ja tase kattavat **koko historian**
riippumatta tilikaudesta. Tilikauden tulos ja tase ovat siis järjestelmällisesti vääriä heti
toisesta tilikaudesta alkaen.

### H4. Negatiiviset saldot nollataan raporteissa — ✅ korjattu
`src/components/Reports.tsx:26-50`

```ts
amount: Math.max(0, accountBalance(a.id))
```

Negatiivinen saldo — luottotilinen pankkitili, hyvityslasku, tappiollinen oma pääoma, virheellinen
kirjaus — muuttuu nollaksi. Virheet katoavat näkyvistä juuri niiltä riveiltä joilla ne pitäisi
havaita, ja loppusummat ovat vääriä.

### H5. Tase ei sisällä tilikauden tulosta — ✅ korjattu
`src/components/Reports.tsx:47-52, 162-164`

Oma pääoma lasketaan pelkistä pääomatileistä; tilikauden tulosta ei viedä taseeseen. Heti kun
kirjanpidossa on yhtään tulos- tai kulutapahtumaa, tase ei täsmää ja käyttäjälle näytetään punaisena
**"Tase ei täsmää"** vaikka kirjanpito olisi virheetön. Tarkistusindikaattori on käyttökelvoton.

### H6. Laskun numerointi ei ole juokseva — ✅ korjattu
`src/components/Invoicing.tsx:111`

```ts
number: `L${Date.now().toString().slice(-6)}`
```

ALV-lain 209 e § edellyttää laskulta juoksevaa tunnistetta. Aikaleiman viimeiset kuusi numeroa
eivät ole juoksevia (arvo pyörähtää ympäri ~16,7 minuutin välein) eivätkä taatusti uniikkeja.

### H7. Laskun maksukirjaus on väärin — ✅ korjattu
`src/components/Invoicing.tsx:155-190`

`markPaid` kirjaa myyntisaamiset debet / myynti kredit + ALV vasta kun lasku merkitään maksetuksi,
**maksupäivän päivämäärällä**, eikä kirjaa pankkitilille mitään. Oikea kirjausketju on:
laskun päivämäärällä myyntisaamiset/myynti+ALV, ja maksupäivällä pankki/myyntisaamiset. Nyt
myyntisaamiset jäävät auki ikuisesti ja myynti kohdistuu väärälle kaudelle. Lisäksi tulotili
valitaan `accounts.find(a => a.type === 'revenue')` eli **ensimmäinen löytynyt** — käyttäjä ei voi
valita tiliä, ja ALV-rivin selite on kovakoodattu `'ALV 25,5%'` riippumatta rivin verokannasta.

### H8. Kassatapahtumat vain IndexedDB:ssä — ✅ korjattu
`src/hooks/useStore.ts:36-40`

`getAllCashRegisterEntries` ja `saveCashRegisterEntry` tulevat `@/lib/db`:stä. Kassakirja ja sen
päälle piirretty dashboardin saldo ovat laitekohtaisia eivätkä synkronoidu.

---

## Keskitaso

### M1. Yli 500 € tapahtuma luokitellaan palkaksi — ✅ korjattu
`src/components/PersonalFinance.tsx:312-315`

```ts
if (amount > 500) return { category: 'palkka', type: 'income', confidence: 'medium', skip: false };
```

Sääntö ajetaan **ennen** avainsanatunnistusta, joten mikä tahansa yli 500 € tapahtuma ohittaa
kaikki muut säännöt. Yhdessä etumerkkikäsittelyn kanssa tämä on selvästi yleisin syy
virheluokitteluun tuonnissa.

### M2. Budjetti tuntee vain 8 kategoriaa 13:sta — ✅ korjattu
`src/components/BudgetPage.tsx:24-33` vs `src/components/PersonalFinance.tsx:108-122`

Kategoriat `children`, `travel`, `insurance`, `hobbies` ja `bills` puuttuvat budjetista. Niihin
luokitellut menot pudotetaan hiljaisesti toteumasta (`BudgetPage.tsx:57` — `if (cat)`), joten
budjetti näyttää systemaattisesti todellista pienempää kulutusta.

### M3. CSV-summien jäsennys rikkoo pisteelliset formaatit — ✅ korjattu
`src/components/Banking.tsx:31-38`

```ts
.replace(/\./g, '')   // poistaa KAIKKI pisteet
.replace(',', '.')
```

Kommentti lupaa tukea muotoa `"1,234.56"`, mutta se muuttuu arvoksi `1.23456`. Suomalainen
`1 234,56` toimii.

### M4. CSV-jäsennys ei kestä lainausmerkkejä — ✅ korjattu
`src/components/Banking.tsx:71-76`

OP-, Danske- ja generic-formaatit pilkotaan `line.split(',')`-kutsulla. Lainausmerkeissä oleva
pilkku (yleinen saajan nimessä: `"Yritys Oy, Helsinki"`) siirtää kaikki sarakkeet. Myös
`\r\n`-rivinvaihdot jäävät kenttien perään Windows-tiedostoissa.

### M5. Tuonti ei tunnista duplikaatteja — ✅ korjattu
`src/components/Banking.tsx:66-138`

Sama tiliote voi tuoda samat tapahtumat moneen kertaan; mitään tunnistetta ei verrata olemassa
oleviin. Lisäksi ensimmäinen rivi pudotetaan aina otsikkona (`lines.slice(1)`), joten
otsikottomasta tiedostosta katoaa ensimmäinen tapahtuma, ja `amount === 0` -tapahtumat ohitetaan.

### M6. Kuollut haarautuminen päivämäärissä — ✅ korjattu
`src/components/Banking.tsx:52-59`

DD/MM ja MM/DD -haarat palauttavat täsmälleen saman arvon — `if`-ehto on turha ja amerikkalainen
muoto jäsentyy väärin.

### M7. Tapahtumat tallennetaan yksi kerrallaan — ✅ korjattu
`src/components/PersonalFinance.tsx:670-673`

```ts
for (const entry of newEntries) { await onAddEntry(entry); }
```

Jokainen `onAddEntry` tekee oman Firestore-kirjoituksen, lataa **kaikki** tapahtumat uudelleen ja
näyttää toastin. 200 rivin tiliotteella tämä on 200 kirjoitusta + 200 täyttä uudelleenlatausta.
`writeBatch` + yksi lataus lopuksi.

### M8. YEL-laskurin prosentit ovat vanhentuneet
`src/components/YELCalculator.tsx:10`

Käytetään 19 % / 22 % / 25 % iän mukaan (<35, <50, muut). Todellinen YEL-maksuprosentti on
**24,10 %** alle 53-vuotiaille ja **25,60 %** 53–62-vuotiaille (ja takaisin 24,10 % 63 vuodesta).
Nuorelle yrittäjälle laskuri antaa noin 20 % liian pienen maksun. Aloittavan yrittäjän 22 %
alennus puuttuu kokonaan. Työtulon alaraja 9 010 € on oikein.

### M9. Verolaskuri sekoittaa yhtiömuodot
`src/components/TaxCalculator.tsx:35-38`

```ts
const yrittajavahennys = Math.min(revenue * 0.15, 5000);
const estimatedTax = taxableIncome * 0.20;  // Corporate tax 20%
```

Yrittäjävähennys on **5 % elinkeinotoiminnan tuloksesta**, ei 15 % liikevaihdosta, eikä siinä ole
5 000 € kattoa. Se koskee toiminimeä ja henkilöyhtiöitä — ei osakeyhtiötä, jolle taas sovelletaan
20 % yhteisöveroa. Laskuri soveltaa molempia yhtä aikaa, joten lopputulos ei vastaa kumpaakaan
yhtiömuotoa. Lisäksi `updateItem` (rivi 28-32) mutatoi tila-olion suoraan.

### M10. Migraatio ylittää Firestoren batch-rajan — ✅ korjattu
`src/lib/firestore.ts:296-340`

Koko migraatio tehdään yhdessä `writeBatch`issä. Firestoren raja on 500 operaatiota; sitä isompi
aineisto kaataa migraation kokonaan eikä mitään siirry.

### M11. Turhia Firestore-lukuja joka latauksella — ✅ korjattu
`src/hooks/useStore.ts:117-134`

`customers`, `invoices`, `recurringEntries`, `bankAccounts` ja `bankTransactions` ladataan joka
kerta, mutta `MainApp` ei välitä niitä yhdellekään näkymälle (`Banking` ja `Invoicing` lataavat omansa).
Maksettuja lukuoperaatioita ja latenssia ilman vastinetta.

---

## Matalat / laatu

### L1. Lockfile osoittaa kolmannen osapuolen peiliin
`package-lock.json` — 151 pakettia on lukittu osoitteeseen `registry.npmmirror.com` virallisen
`registry.npmjs.org`:n sijaan. Tässä ympäristössä `npm ci` jumittui yli 20 minuutiksi; virallista
rekisteriä vasten sama asennus kesti **13 sekuntia**. Tämä on sekä CI:n hauraus että
toimitusketjuriski: paketit haetaan taholta, jota projekti ei hallitse. Korjaus:
`npm ci --registry=https://registry.npmjs.org --replace-registry-host=always` ja lockfilen
uudelleenluonti.

### L2. `npm run lint` — 27 virhettä
Merkittävimmät sovelluskoodissa:
- `Dashboard.tsx:198-236` — komponentit (`OverviewCards`, `EntriesList`, `AccountList`, `MobileNav`)
  määritellään renderin sisällä. React purkaa ja mountaa ne uudelleen joka renderillä: tila katoaa,
  scroll-positio hyppää, turha uudelleenpiirto.
- `Invoicing.tsx:58` — `loadData`-kutsu ennen funktion määrittelyä.
- `Invoicing.tsx:169` — `const lines: any[]`.
- `CashFlowForecast.tsx:31` — muuttujan uudelleensijoitus renderin jälkeen.
- `firebase/config.ts:25` — käyttämätön `catch (e)`.

Lint ei ole osa CI:tä, joten nämä eivät estä julkaisua.

### L3. Ei yhtään testiä — 🟡 osittain korjattu
Repossa ei ollut testejä eikä testiajuria. Nyt `npm test` ajaa 79 testiä
(`tests/`, Noden oma test runner + esbuild, ei uusia riippuvuuksia): tilikausien muodostus,
senttipohjainen saldolaskenta, tuloslaskelma/tase/ALV yhdelle tilikaudelle, tositteen
validointi, juokseva numerointi, myyntilaskun kirjausketju ja CSV-tuonti. CI ajaa testit ennen buildia. Kattamatta on yhä komponenttitaso, eikä lint ole vielä osa CI:tä.

### L4. Paikallinen kehitys vaatii emulaattorit — dokumentoimatta
`src/firebase/config.ts:21-29` kytkeytyy emulaattoreihin aina kun `DEV` tai hostname on
`localhost`. Ilman käynnissä olevia emulaattoreita kirjautuminen ei toimi paikallisesti lainkaan.
README on yhä muokkaamaton Vite-template eikä mainitse tätä.

### L5. Kaksi manifestia
`index.html:12` viittaa `public/manifest.json`-tiedostoon, ja VitePWA injektoi lisäksi oman
`manifest.webmanifest`-linkkinsä. Buildatussa `dist/index.html`:ssä on molemmat.

### L6. Ensilatauksen paketti ~2,2 MB
`vendor` 879 kB + `vendor-pdf` 571 kB + `vendor-firebase` 424 kB + `vendor-charts` 314 kB, kaikki
esiladattuna `modulepreload`illa. Service worker esilataa 2,67 MB. `vendor-pdf` (jsPDF) tarvitaan
vain laskun tulostukseen eikä sen kuuluisi olla ensilatauksessa.

### L7. Storage-säännöt eivät rajoita kokoa tai tyyppiä
`storage.rules` sallii omistajalle minkä tahansa tiedoston. 5 MB raja on vain
selainpuolella (`EntryModal.tsx:95`) ja ohitettavissa. Sääntöihin kannattaa lisätä
`request.resource.size` ja `contentType`-rajaus.

### L8. Kuollutta koodia
`src/pages/Home.tsx` on muokkaamaton Vite-template-komponentti, jota ei importoida mistään.
`src/lib/seed.ts` kylvää demo-dataa IndexedDB:hen. `db.ts`:n IndexedDB-kerros on osittain
päällekkäinen `firestore.ts`:n kanssa.

### L9. Firebase-konfiguraatio kovakoodattu
`src/firebase/config.ts:6-13`. Web-API-avain ei ole salaisuus, joten tämä ei ole
tietoturva-aukko, mutta ympäristömuuttujat (`import.meta.env.VITE_*`) mahdollistaisivat staging- ja
tuotantoympäristöjen erottamisen.

---

## Mikä toimii hyvin

- **Build on terve.** `tsc -b && vite build` menee läpi ilman virheitä ja varoituksia,
  koodinjako on tehty järkevästi ja kaikki raskaat näkymät on `lazy`-ladattu.
- **Autentikointi.** `AuthContext`, `LoginPage` ja `RegisterPage` käsittelevät Firebase-virhekoodit
  suomenkielisiksi viesteiksi, ja `ErrorBoundary` estää valkoisen ruudun.
- **Tietoturvasäännöt.** Sekä Firestore- että Storage-säännöt rajaavat pääsyn oikein
  `request.auth.uid == userId` -ehdolla, myös alikokoelmiin.
- **Tilikartat.** 47 / 37 / 25 / 14 tiliä neljälle tilikirjatyypille, suomalaisen käytännön
  mukaisilla tilinumeroilla ja ALV-kannalla **25,5 %** (voimassa oleva yleinen verokanta).
- **Tilikirja-arkkitehtuuri.** Firestoren `users/{uid}/ledgers/{id}/...` -rakenne ja
  migraatiopolku vanhasta mallista on hyvin suunniteltu — se vain ohitetaan osassa näkymistä.

---

## Suositeltu korjausjärjestys

### Tehty

1. ~~**K3** — varmuuskopion import osoittamaan `@/lib/firestore`.~~ Lisäksi `exportAllData`
   laajennettu kattamaan tilikirja, yritystiedot, pankkitilit ja -tapahtumat, oman talouden
   tapahtumat ja budjetit, ja "Tyhjennä kaikki data" ei enää kylvä demo-dataa Firestoreen.
2. ~~**K5** — `initializeFirestore(app, { ignoreUndefinedProperties: true })`.~~
3. ~~**K1** — onboarding-ehto `!activeLedger || activeLedger.type === 'company'`.~~
4. ~~**K2 + K4 + H8** — yksi tallennuskerros.~~ `Invoicing`, `RecurringEntries`,
   `PersonalFinance` ja kassakirja käyttävät Firestorea; `db.ts` ja `seed.ts` poistettu;
   kertaluonteinen migraatio vanhasta IndexedDB:stä ja localStoragesta lisätty. Samalla
   korjattu M7 (eräkirjoitus), M10 (batch-rajan pilkkominen) ja M11 (turhat luvut).

5. ~~**H1** — estä epätasapainoisen tositteen tallennus.~~ Validointi eriytetty
   `lib/entryValidation.ts`:ään ja tehdään tasan niistä riveistä jotka tallennetaan.
6. ~~**H3 + H4 + H5** — raporttien tilikausirajaus, negatiivisten saldojen säilytys,
   tilikauden tulos taseeseen.~~ Laskenta eriytetty `lib/reportModel.ts`:ään ja
   tilikausilogiikka `lib/fiscalYear.ts`:ään; molemmat testattu.

7. ~~**H2 + H6 + H7** — juokseva tosite- ja laskunumerointi sekä oikea laskun kirjausketju.~~
   Numerot varataan Firestoren transaktiolla tilikirjakohtaisesta laskurista
   (`lib/numbering.ts`), ja laskun kirjaukset rakentaa `lib/invoiceEntries.ts`.

8. ~~**M1 + M2 + M3–M6** — oman talouden luokittelusäännöt, budjetin kategoriat ja CSV-jäsennys.~~
   CSV-jäsennyksen perusosat ovat `lib/csv.ts`:ssä, tiliotetuonti `lib/bankCsv.ts`:ssä,
   oman talouden luokittelu `lib/personalCsv.ts`:ssä ja kategoriat `lib/personalCategories.ts`:ssä.

### Seuraavaksi

9. **M8 + M9** — YEL- ja verolaskurin kertoimet ajan tasalle.
10. **L1** — lockfile viralliseen rekisteriin.
11. **L3** — osittain tehty: `npm test` ajaa laskentalogiikan testit (79 kpl) ja CI ajaa ne
    ennen buildia. Jäljellä lint CI:hin ja testit myös komponenttitasolle.
