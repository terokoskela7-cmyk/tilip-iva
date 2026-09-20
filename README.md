# Tilipäivä

Kahdenkertaisen kirjanpidon selainsovellus yrittäjille, asunto-osakeyhtiöille ja oman
talouden seurantaan. React + TypeScript + Vite, taustalla Firebase (Auth, Firestore,
Storage) ja Firebase Hosting.

Sovellus tukee useaa **tilikirjaa** saman käyttäjätunnuksen alla: yritys, yksityinen,
asunto-osakeyhtiö ja oma talous. Jokaisella tilikirjalla on oma tilikarttansa, tositteensa
ja raporttinsa.

## Vaatimukset

- **Node.js 20** tai uudempi (CI käyttää 20:tä)
- **firebase-tools** paikalliseen kehitykseen ja julkaisuun (`npm install -g firebase-tools`
  tai `npx firebase-tools`)
- Java-ajoympäristö Firestore-emulaattoria varten

## Asennus

```bash
npm ci
```

Paketit haetaan virallisesta npm-rekisteristä; `.npmrc` lukitsee sen. Älä vaihda rekisteriä,
sillä lockfileen päätyvät peiliosoitteet ovat toimitusketjuriski — `npm test` kaatuu, jos
niitä ilmestyy.

## Paikallinen kehitys

> **Huom:** sovellus kytkeytyy kehitystilassa **aina Firebase-emulaattoreihin**
> (`src/firebase/config.ts`). Ilman käynnissä olevia emulaattoreita kirjautuminen ei toimi
> lainkaan, eikä vika näy selkeänä virheilmoituksena. Käynnistä emulaattorit ensin.

```bash
# Pääte 1: emulaattorit (auth 9099, firestore 8080, storage 9199, käyttöliittymä 4000)
firebase emulators:start

# Pääte 2: kehityspalvelin
npm run dev            # http://localhost:3000
```

Emulaattorit alkavat tyhjästä tietokannasta, joten ensimmäisellä käynnistyksellä luodaan
käyttäjätunnus rekisteröitymisnäkymästä ja sen jälkeen ensimmäinen tilikirja.

## Komennot

| Komento | Kuvaus |
|---|---|
| `npm run dev` | Kehityspalvelin portissa 3000 |
| `npm run build` | Tyyppitarkistus (`tsc -b`) ja tuotantokäännös `dist/`-hakemistoon |
| `npm test` | Laskentalogiikan testit |
| `npm run lint` | ESLint |
| `npm run preview` | Tuotantokäännöksen esikatselu |

## Testit

Testit ovat `tests/`-hakemistossa ja ne ajetaan Noden omalla test runnerilla. Testitiedostot
käännetään ensin esbuildilla (`scripts/run-tests.mjs`), joten TypeScript ja `@/`-polkualias
toimivat ilman erillistä testikehystä eikä uusia riippuvuuksia tarvita.

```bash
npm test
```

Testit kattavat laskentalogiikan: tilikaudet, senttipohjaisen saldolaskennan,
tuloslaskelman ja taseen, tositteen validoinnin, juoksevan numeroinnin, myyntilaskun
kirjausketjun, CSV-tuonnin sekä YEL- ja verolaskennan. Käyttöliittymätasolla testejä ei
vielä ole.

CI ajaa testit ennen käännöstä, joten rikkinäinen laskenta estää julkaisun.

## Rakenne

```
src/
  components/      Näkymät ja käyttöliittymä (ui/ = shadcn-komponentit)
  hooks/useStore   Sovelluksen tila ja Firestore-kutsut
  lib/             Laskentalogiikka ja tiedonhallinta (ks. alla)
  data/            Tilikartat tilikirjatyypeittäin
  context/         Autentikointi
  firebase/        Firebase-alustus ja emulaattorikytkentä
tests/             Testit
scripts/           Testiajuri
```

Laskenta on eriytetty näkymistä `src/lib/`-hakemistoon, jotta se on luettavissa ja
testattavissa ilman Reactia:

| Moduuli | Vastuu |
|---|---|
| `ledgerMath` | Tilien saldot sentteinä, tilityyppien normaalit puolet |
| `fiscalYear` | Tilikausien muodostus, myös vuodenvaihteen yli jatkuvat |
| `reportModel` | Tuloslaskelma, tase ja ALV yhdelle tilikaudelle |
| `entryValidation` | Tositteen tarkistus ennen tallennusta |
| `numbering` | Juoksevat tosite- ja laskunumerot |
| `invoiceEntries` | Myyntilaskun ja suorituksen kirjaukset |
| `csv`, `bankCsv`, `personalCsv` | Tiliotteiden ja tapahtumien tuonti |
| `taxRates`, `yel`, `businessTax` | Verotuksen ja YEL:n luvut ja laskenta |
| `ledgerSelection` | Aktiivisen tilikirjan valinta |
| `firestore`, `storage`, `legacyMigration` | Tallennus ja kertaluonteinen migraatio |

## Verotuksen luvut päivitettävä vuosittain

Kaikki verokannat, YEL-prosentit ja rajat ovat **`src/lib/taxRates.ts`**-tiedostossa, jossa
on myös vuosileima `TAX_YEAR`. Laskurit näyttävät vuosiluvun käyttöliittymässä, jotta
vanhentuneet luvut huomaa näkymästä eikä vasta väärästä lopputuloksesta.

Vuodenvaihteessa tarkistettavat: YEL-maksuprosentti ja työtulon rajat, sairauspäivärahan
rajat, yrittäjävähennys, yhteisöverokanta ja pääomatuloveron rajat. **Yhteisövero laskee
20 %:sta 18 %:iin vuonna 2027.**

Kun luvut päivitetään, muuta `TAX_YEAR` samalla ja aja `npm test` — testit tarkistavat
laskennan julkaistuja esimerkkejä vasten.

## Firebase

Projekti: `tilipaiva-prod` (`.firebaserc`). Konfiguraatio on `src/firebase/config.ts`:ssä.
Web-API-avain ei ole salaisuus, mutta ympäristömuuttujat mahdollistaisivat erillisen
testiympäristön.

Käyttöoikeudet rajaavat datan käyttäjäkohtaisesti:

- `firestore.rules` — `users/{uid}/**` vain omistajalle
- `storage.rules` — `users/{uid}/**` vain omistajalle

```bash
firebase deploy --only firestore:rules,storage    # säännöt
firebase deploy --only hosting                    # sovellus
```

Tuotantojulkaisu tapahtuu automaattisesti, kun `main`-haaraan pushataan
(`.github/workflows/deploy.yml`): `npm ci` → `npm test` → `npm run build` → Firebase Hosting.

## Tiedossa olevat puutteet

Sovelluksen tekninen auditointi ja korjausten tila ovat **[AUDIT.md](AUDIT.md)**-tiedostossa.
Avoimet kohdat on merkitty sinne.
