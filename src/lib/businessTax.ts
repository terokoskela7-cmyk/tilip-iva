import { INCOME_TAX } from '@/lib/taxRates';

/**
 * Yritystoiminnan tuloksen verotus yhtiomuodon mukaan.
 *
 * Aiempi laskuri sovelsi samaan lopputulokseen seka yrittajavahennysta etta
 * yhteisoveroa, jolloin se ei vastannut kumpaakaan yhtiomuotoa. Lisaksi
 * yrittajavahennys laskettiin 15 %:na liikevaihdosta 5 000 euron kattoon,
 * vaikka se on 5 % elinkeinotoiminnan tuloksesta eika siina ole kattoa.
 */

export type BusinessForm = 'toiminimi' | 'osakeyhtio';

export interface BusinessTaxInput {
  revenue: number;
  /** Vahennyskelpoiset kulut yhteensa. */
  deductions: number;
  form: BusinessForm;
  /** Toiminimi: yrityksen nettovarallisuus paaomatulo-osuuden pohjaksi. */
  netAssets?: number;
  /** Toiminimi: vaadittu paaomatulo-osuus nettovarallisuudesta (0,2 | 0,1 | 0). */
  capitalShare?: number;
  /** Toiminimi: arvio ansiotulon veroprosentista osuutena. */
  earnedIncomeRate?: number;
}

export interface BusinessTaxResult {
  /** Liikevaihto miinus kulut. Voi olla negatiivinen. */
  profit: number;
  /** Verotuksen pohja, eli tulos jos se on positiivinen. */
  taxableProfit: number;
  entrepreneurDeduction: number;
  taxableIncome: number;
  capitalIncome: number;
  capitalTax: number;
  earnedIncome: number;
  earnedIncomeTax: number;
  corporateTax: number;
  totalTax: number;
  /** Vero suhteessa tulokseen. */
  effectiveRateOfProfit: number;
  /** Vero suhteessa liikevaihtoon. */
  effectiveRateOfRevenue: number;
}

/** Paaomatulovero: alarajaan asti perusprosentti, sen ylittavalta osalta korotettu. */
export function capitalIncomeTax(amount: number): number {
  const taxable = Math.max(0, amount);
  const lower = Math.min(taxable, INCOME_TAX.capitalGainsHigherLimit) * INCOME_TAX.capitalGainsRate;
  const upper =
    Math.max(0, taxable - INCOME_TAX.capitalGainsHigherLimit) * INCOME_TAX.capitalGainsHigherRate;
  return lower + upper;
}

export function calculateBusinessTax(input: BusinessTaxInput): BusinessTaxResult {
  const profit = input.revenue - input.deductions;
  const taxableProfit = Math.max(0, profit);

  if (input.form === 'osakeyhtio') {
    // Osakeyhtio maksaa yhteisoveroa tuloksestaan. Yrittajavahennys ei koske
    // osakeyhtiota, koska se myonnetaan vain luonnolliselle henkilolle.
    const corporateTax = taxableProfit * INCOME_TAX.corporateRate;
    return {
      profit,
      taxableProfit,
      entrepreneurDeduction: 0,
      taxableIncome: taxableProfit,
      capitalIncome: 0,
      capitalTax: 0,
      earnedIncome: 0,
      earnedIncomeTax: 0,
      corporateTax,
      totalTax: corporateTax,
      effectiveRateOfProfit: taxableProfit > 0 ? corporateTax / taxableProfit : 0,
      effectiveRateOfRevenue: input.revenue > 0 ? corporateTax / input.revenue : 0,
    };
  }

  // Toiminimi ja henkiloyhtiot: yrittajavahennys tuloksesta, minka jalkeen
  // jaljelle jaava tulo jakautuu paaomatuloksi ja ansiotuloksi.
  const entrepreneurDeduction = taxableProfit * INCOME_TAX.entrepreneurDeduction;
  const taxableIncome = taxableProfit - entrepreneurDeduction;

  const capitalShare = input.capitalShare ?? INCOME_TAX.capitalShareOptions[0];
  const capitalBase = Math.max(0, input.netAssets ?? 0) * capitalShare;
  const capitalIncome = Math.min(taxableIncome, capitalBase);
  const earnedIncome = taxableIncome - capitalIncome;

  const capitalTax = capitalIncomeTax(capitalIncome);
  const earnedIncomeTax = earnedIncome * Math.max(0, input.earnedIncomeRate ?? 0);
  const totalTax = capitalTax + earnedIncomeTax;

  return {
    profit,
    taxableProfit,
    entrepreneurDeduction,
    taxableIncome,
    capitalIncome,
    capitalTax,
    earnedIncome,
    earnedIncomeTax,
    corporateTax: 0,
    totalTax,
    effectiveRateOfProfit: taxableProfit > 0 ? totalTax / taxableProfit : 0,
    effectiveRateOfRevenue: input.revenue > 0 ? totalTax / input.revenue : 0,
  };
}
