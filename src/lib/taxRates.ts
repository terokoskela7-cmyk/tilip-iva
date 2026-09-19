/**
 * Verotuksen ja yrittajan sosiaaliturvan luvut yhdessa paikassa.
 *
 * Luvut muuttuvat vuosittain. Kun ne paivitetaan, muuta TAX_YEAR samalla:
 * laskurit nayttavat vuosiluvun kayttajalle, jotta vanhentuneet luvut
 * huomaa nakymasta eika vasta virheellisesta lopputuloksesta.
 *
 * Vuoden 2026 luvut ja lahteet:
 * - YEL-maksu 24,4 % kaikenikaisille. Ikaryhmakohtaiset maksut poistuivat
 *   vuoden 2026 alusta (siirtymakausi 2017-2025 paattyi).
 * - Aloittavan yrittajan alennus 22 % neljan ensimmaisen yrittajavuoden ajan.
 * - YEL-tyotulon alaraja 9 423,09 e ja ylaraja 214 000 e.
 * - Yrittajan tyottomyysturvan tyotuloraja 15 481 e.
 * - Elakekertyma 1,5 % tyotulosta vuodessa.
 * - Sairauspaivaraha: tyotulosta vahennetaan 9,07 %, minka jalkeen paivaraha on
 *   70 % 28 241 euroon asti ja 20 % sen ylittavalta osalta, jaettuna 300
 *   arkipaivalle. Vahimmaismaara 31,99 e/arkipaiva.
 * - Yrittajavahennys 5 % elinkeinotoiminnan tuloksesta; koskee vain luonnollisia
 *   henkiloita eli toiminimia ja henkiloyhtioita, ei osakeyhtiota.
 * - Yhteisovero 20 %. (Laskee 18 %:iin vuodesta 2027.)
 * - Paaomatulovero 30 %, yli 30 000 euron osalta 34 %.
 * - Toiminimen paaomatulo-osuus enintaan 20 % nettovarallisuudesta; yrittaja voi
 *   vaatia myos 10 % tai 0 %.
 */

export const TAX_YEAR = 2026;

export const YEL = {
  /** Maksuprosentti tyotulosta. Sama kaikille ikaryhmille vuodesta 2026. */
  contributionRate: 0.244,
  /** Aloittavan yrittajan alennus ja sen kesto vuosina. */
  newEntrepreneurDiscount: 0.22,
  newEntrepreneurYears: 4,
  minimumIncome: 9423.09,
  maximumIncome: 214000,
  /** Tyotuloraja, josta alkaen yrittajan tyottomyysturva on mahdollinen. */
  unemploymentCoverageIncome: 15481,
  /** Elaketta karttuu tasta osuudesta tyotuloa vuodessa. */
  pensionAccrualRate: 0.015,
} as const;

export const SICKNESS_ALLOWANCE = {
  /** Tyotulosta tehtava vakuutusmaksuvahennys ennen paivarahan laskentaa. */
  insuranceDeduction: 0.0907,
  lowerRate: 0.7,
  lowerLimit: 28241,
  upperRate: 0.2,
  /** Paivaraha maksetaan arkipaivilta, joita on 300 vuodessa ja 25 kuukaudessa. */
  daysPerYear: 300,
  daysPerMonth: 25,
  minimumDaily: 31.99,
} as const;

export const INCOME_TAX = {
  /** Yrittajavahennys elinkeinotoiminnan tuloksesta. */
  entrepreneurDeduction: 0.05,
  corporateRate: 0.2,
  capitalGainsRate: 0.3,
  capitalGainsHigherRate: 0.34,
  capitalGainsHigherLimit: 30000,
  /** Toiminimen valittavissa olevat paaomatulo-osuudet nettovarallisuudesta. */
  capitalShareOptions: [0.2, 0.1, 0] as const,
} as const;
