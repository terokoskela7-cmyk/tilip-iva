export interface GuideStep {
  title: string;
  content: string;
  highlight?: string;
  example?: {
    debit: { account: string; amount: number; description: string };
    credit: { account: string; amount: number; description: string };
  };
  tip?: string;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  icon: 'computer' | 'receipt' | 'users' | 'building' | 'banknote' | 'calculator' | 'truck' | 'coffee';
  category: 'aloitus' | 'osto' | 'myynti' | 'henkilosto' | 'muu';
  steps: GuideStep[];
  relatedAccounts: string[];
}

export const guides: Guide[] = [
  {
    id: 'tietokone-osto',
    title: 'Tietokoneen tai laitteen osto',
    description: 'Miten kirjataan tietokone, puhelin, tulostin tai muu laite?',
    icon: 'computer',
    category: 'osto',
    relatedAccounts: ['1220', '1940', '4000'],
    steps: [
      {
        title: 'Mikä tili?',
        content: 'Tietokone, puhelin ja muut laitteet kirjataan tilille **1220 Koneet ja kalusto**. Tämä on tase-tili, joka tarkoittaa että yrityksellä on omistuksessaan arvokasta omaisuutta.',
        highlight: '1220 Koneet ja kalusto',
        tip: 'Alle 850 € (vuonna 2024) hankinnat voi kirjata suoraan kulukirjauksena tilille 4000, mutta kalliimmat laitteet aktivoidaan taseeseen.',
      },
      {
        title: 'Kirjaus',
        content: 'Kun ostat tietokoneen yrityksen pankkitililtä, kirjaus tehdään näin:',
        example: {
          debit: { account: '1220 Koneet ja kalusto', amount: 1200, description: 'Kannettava tietokone' },
          credit: { account: '1940 Pankkisaamiset', amount: 1200, description: 'Maksu pankkitililtä' },
        },
        tip: 'Debet = Saamme omistukseemme tietokoneen (omaisuus kasvaa). Kredit = Rahaa lähtee pankkitililtä (omaisuus vähenee).',
      },
      {
        title: 'Poistot',
        content: 'Taseeseen aktivoidusta laitteesta tehdään vuosittain poistot. Poisto tarkoittaa, että laitteen arvoa vähennetään ajan kulussa. Yleensä tietokone poistetaan 3-5 vuoden aikana.',
        highlight: '4400 Poistot ja arvonalentumiset',
        tip: 'Esimerkki: 1200 € tietokone, 4 vuoden poistoaika = 300 € poisto vuodessa. Kirjaus: Debet 4400 Poistot / Kredit 1220 Koneet ja kalusto 300 €.',
      },
      {
        title: 'ALV',
        content: 'Jos yritys on ALV-velvollinen, tietokoneen ostosta saa vähentää ALV:n. Jos laitteen hinta on 1200 € + ALV 24 % = 1488 €, ALV (288 €) kirjataan erikseen.',
        example: {
          debit: { account: '1220 Koneet ja kalusto', amount: 1200, description: 'Tietokone (veroton)' },
          credit: { account: '1940 Pankkisaamiset', amount: 1488, description: 'Maksu (sis. ALV)' },
        },
        tip: 'ALV-kirjaus: Debet 29392 ALV-saatava 288 € / Kredit 1220 Koneet ja kalusto 288 €. Näin laitteen arvo taseessa on veroton hinta.',
      },
    ],
  },
  {
    id: 'myyntilasku',
    title: 'Myyntilaskun lähettäminen',
    description: 'Miten kirjataan lasku asiakkaalle, kun myyt palvelun tai tuotteen?',
    icon: 'receipt',
    category: 'myynti',
    relatedAccounts: ['3000', '29391', '1910'],
    steps: [
      {
        title: 'Laskun kirjaaminen',
        content: 'Kun lähetät laskun asiakkaalle, et ole vielä saanut rahaa. Siksi kirjataan **saamainen** — asiakas on velkaa sinulle.',
        highlight: '1910 Myyntisaamiset',
        tip: 'Myyntisaamiset on tase-tili, joka kertoo kuinka paljon asiakkaat ovat velkaa yritykselle.',
      },
      {
        title: 'Kirjaus laskutettaessa',
        content: 'Lähetät laskun 5000 € + ALV 24 % = 6200 €.',
        example: {
          debit: { account: '1910 Myyntisaamiset', amount: 6200, description: 'Lasku #001 asiakas A' },
          credit: { account: '3000 Myyntituotot', amount: 5000, description: 'Konsultointipalvelu' },
        },
        tip: 'Huom! Kirjauksessa on kolme riviä — Kredit-puolelle tulee sekä myyntituotto että ALV-velka.',
      },
      {
        title: 'ALV-kirjaus',
        content: 'Myynnistä syntyy ALV-velka Verottajalle.',
        example: {
          debit: { account: '1910 Myyntisaamiset', amount: 0, description: '' },
          credit: { account: '29391 ALV velka', amount: 1200, description: 'ALV 24 % myynnistä' },
        },
        tip: 'ALV-velka (29391) kasvaa aina kun myyt jotain. ALV maksetaan Verottajalle myöhemmin ALV-ilmoituksella.',
      },
      {
        title: 'Asiakas maksaa',
        content: 'Kun asiakas maksaa laskun, myyntisaaminen muuttuu rahaksi pankkitilillä.',
        example: {
          debit: { account: '1940 Pankkisaamiset', amount: 6200, description: 'Lasku #001 maksu' },
          credit: { account: '1910 Myyntisaamiset', amount: 6200, description: 'Lasku #001 suoritus' },
        },
        tip: 'Debet = Rahaa tulee tilille. Kredit = Saaminen vähenee (asiakas ei ole enää velkaa).',
      },
    ],
  },
  {
    id: 'palkanmaksu',
    title: 'Palkan maksaminen',
    description: 'Miten kirjataan palkka, kun yrityksessä on työntekijöitä?',
    icon: 'users',
    category: 'henkilosto',
    relatedAccounts: ['4300', '1940', '2400'],
    steps: [
      {
        title: 'Bruttopalkka',
        content: 'Palkkakirjauksen perusta on **bruttopalkka** — summa ennen veroja ja muita vähennyksiä. Bruttopalkka on yritykselle kulu.',
        highlight: '4300 Henkilöstökulut',
        tip: 'Nettopalkka (käteen jäävä) on eri asia kuin bruttopalkka. Kirjanpidossa käytetään aina bruttopalkkaa.',
      },
      {
        title: 'Kirjaus palkanmaksusta',
        content: 'Maksat työntekijälle 2500 € nettopalkkaa, josta bruttopalkka on 3500 €.',
        example: {
          debit: { account: '4300 Henkilöstökulut', amount: 3500, description: 'Tammikuun palkka' },
          credit: { account: '1940 Pankkisaamiset', amount: 2500, description: 'Nettopalkan maksu' },
        },
        tip: 'Tämä on yksinkertaistettu versio. Todellisuudessa palkanmaksuun kuuluu myös työnantajamaksut ja verotilit.',
      },
      {
        title: 'Vähennykset',
        content: 'Palkasta vähennetään ennakonpidätys (vero) ja työntekijän eläke- ja työttömyysvakuutusmaksut. Nämä menevät Verottajalle ja vakuutusyhtiöille.',
        highlight: '2400 Verovelat',
        tip: 'Täydellinen palkkakirjaus vaatii useita rivejä: palkkakulu, työnantajamaksut, ennakonpidätysvelka, eläkevakuutusmaksut jne. Käytä palkanlaskentaohjelmaa!',
      },
    ],
  },
  {
    id: 'toimitilan-vuokra',
    title: 'Toimitilan vuokra',
    description: 'Miten kirjataan toimiston tai työtilan vuokra?',
    icon: 'building',
    category: 'osto',
    relatedAccounts: ['4200', '1940'],
    steps: [
      {
        title: 'Vuokrakulu',
        content: 'Toimitilan vuokra on yrityksen **kulu**. Se kirjataan tuloslaskelmaan, mikä pienentää yrityksen verotettavaa tulosta.',
        highlight: '4200 Vuokrakulut',
        tip: 'Vuokrakulut ovat täysin vähennyskelpoisia yrityksen verotuksessa.',
      },
      {
        title: 'Kirjaus',
        content: 'Maksat toimiston vuokran 800 € kuukaudessa pankkitililtä.',
        example: {
          debit: { account: '4200 Vuokrakulut', amount: 800, description: 'Helmikuun vuokra' },
          credit: { account: '1940 Pankkisaamiset', amount: 800, description: 'Vuokran maksu' },
        },
        tip: 'Usein vuokraan sisältyy myös vesimaksu, sähkö tai lämmitys. Ne voidaan kirjata samalle tilille tai erikseen tilille 4600 Toimitilakulut.',
      },
      {
        title: 'ALV',
        content: 'Toimitilan vuokrasta ei yleensä makseta ALV:ta (kiinteistövuokra on ALV-vapaa), joten kirjaus on yksinkertainen.',
        tip: 'Jos vuokranantaja on veloittanut ALV:n (harvinaista), se kirjataan samalla tavalla kuin muut ALV-velvolliset ostot.',
      },
    ],
  },
  {
    id: 'kateismyynti',
    title: 'Käteismyynti',
    description: 'Miten kirjataan käteisellä tehty myynti?',
    icon: 'banknote',
    category: 'myynti',
    relatedAccounts: ['3000', '1950', '29391'],
    steps: [
      {
        title: 'Käteiskassa',
        content: 'Kun asiakas maksaa käteisellä, raha menee yrityksen **käteiskassaan**. Käteiskassa on yrityksen omaisuutta.',
        highlight: '1950 Käteiskassa',
        tip: 'Pidä kirjaa käteiskassasta huolellisesti. Kassan saldo pitää täsmätä fyysiseen kassassa olevaan rahamäärään.',
      },
      {
        title: 'Kirjaus',
        content: 'Asiakas ostaa tuotteen 50 € käteisellä (sis. ALV 24 %).',
        example: {
          debit: { account: '1950 Käteiskassa', amount: 50, description: 'Käteismyynti' },
          credit: { account: '3000 Myyntituotot', amount: 40.32, description: 'Tuotemyynti' },
        },
        tip: 'Kirjaa samalla myös ALV: Debet 1950 50 € / Kredit 3000 40,32 € ja Kredit 29391 9,68 €.',
      },
    ],
  },
  {
    id: 'alv-ilmoitus',
    title: 'ALV-ilmoituksen tekeminen',
    description: 'Miten ALV-ilmoitus tehdään ja mitä pitää tietää?',
    icon: 'calculator',
    category: 'muu',
    relatedAccounts: ['29391', '29392', '1940'],
    steps: [
      {
        title: 'Mikä on ALV?',
        content: 'ALV (arvonlisävero) on joka myyntihinnassa mukana oleva vero. Yritys perii ALV:n asiakkailta ja välittää sen Verottajalle. Ostojen ALV:n saa vähentää.',
        highlight: '29391 ALV velka / 29392 ALV saatava',
      },
      {
        title: 'ALV-velka vs saatava',
        content: '**ALV-velka (29391)** kasvaa aina kun myyt jotain. **ALV-saatava (29392)** kasvaa kun ostat jotain ALV-velvolliselta. Erotus maksetaan Verottajalle.',
        tip: 'Jos myyntiä on enemmän kuin ostoja, maksat Verottajalle. Jos ostoja on enemmän, saat palautusta.',
      },
      {
        title: 'Maksu Verottajalle',
        content: 'Kun ALV-ilmoitus on tehty, maksetaan netto-ALV Verottajalle.',
        example: {
          debit: { account: '29391 ALV velka', amount: 500, description: 'ALV-maksu' },
          credit: { account: '1940 Pankkisaamiset', amount: 500, description: 'ALV-maksu Verottajalle' },
        },
        tip: 'ALV-ilmoitus tehdään yleensä kuukausittain tai neljännesvuosittain OmaVerossa.',
      },
    ],
  },
  {
    id: 'matkakulut',
    title: 'Matkakulut',
    description: 'Miten kirjataan työmatkat ja kilometrikorvaukset?',
    icon: 'truck',
    category: 'muu',
    relatedAccounts: ['4800', '1940', '4300'],
    steps: [
      {
        title: 'Omat matkakulut',
        content: 'Kun makstat työmatkat omasta pussistasi, yritys voi korvata ne sinulle verovapaasti kilometrikorvauksina.',
        highlight: '4800 Muut kulut',
        tip: 'Vuonna 2024 verovapaa kilometrikorvaus on 0,46 €/km (ensimmäiset 5000 km) ja 0,22 €/km (yli 5000 km).',
      },
      {
        title: 'Kirjaus korvauksesta',
        content: 'Ajasit 200 km työmatkaa. Korvaus: 200 × 0,46 € = 92 €.',
        example: {
          debit: { account: '4800 Muut kulut', amount: 92, description: 'Kilometrikorvaus 200 km' },
          credit: { account: '1940 Pankkisaamiset', amount: 92, description: 'Korvaus tilille' },
        },
        tip: 'Kilometrikorvaus maksetaan usein palkkakirjan yhteydessä. Se on verovapaa, joten siitä ei mene veroja.',
      },
    ],
  },
  {
    id: 'edustuskulut',
    title: 'Edustus- ja ravintolakulut',
    description: 'Miten kirjataan asiakasedustus ja yrityslounaat?',
    icon: 'coffee',
    category: 'muu',
    relatedAccounts: ['4800', '1940'],
    steps: [
      {
        title: 'Edustuskulut',
        content: 'Asiakkaan tai kumppanin tarjoilu on **edustuskulu**. Vain puolet edustuskuluista on vähennyskelpoista verotuksessa.',
        highlight: '4800 Muut kulut',
        tip: 'Edustuskuluihin kuuluu ateriat, juomat ja pienet lahjat asiakkaille. Matkalippujen hinta ei ole edustuskulua.',
      },
      {
        title: 'Kirjaus',
        content: 'Tarjoit asiakkaalle lounaan 80 € (sis. ALV).',
        example: {
          debit: { account: '4800 Muut kulut', amount: 80, description: 'Asiakaslounas' },
          credit: { account: '1940 Pankkisaamiset', amount: 80, description: 'Ravintolalasku' },
        },
        tip: 'Verotuksessa vain 50 % (40 €) on vähennyskelpoista. Kirjanpidossa kulu kirjataan kuitenkin täysimääräisenä.',
      },
    ],
  },
];

export function getGuidesByCategory(category: Guide['category']) {
  return guides.filter((g) => g.category === category);
}

export const categoryLabels: Record<Guide['category'], string> = {
  aloitus: 'Aloittaminen',
  osto: 'Ostot',
  myynti: 'Myynnit',
  henkilosto: 'Henkilöstö',
  muu: 'Muut tilanteet',
};
