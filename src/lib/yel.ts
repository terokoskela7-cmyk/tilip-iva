import { SICKNESS_ALLOWANCE, YEL } from '@/lib/taxRates';

/**
 * YEL-vakuutuksen maksu ja sen tuoma turva.
 *
 * Aiemmin laskuri kaytti ikaan perustuvia prosentteja 19/22/25, jotka eivat
 * vastanneet mitaan voimassa ollutta maksua. Vuodesta 2026 maksu on sama
 * kaikenikaisille, ja aloittava yrittaja saa siita alennuksen.
 */

export interface YelContribution {
  /** Sovellettu maksuprosentti osuutena, esimerkiksi 0,244. */
  rate: number;
  annual: number;
  monthly: number;
  /** Alennuksen tuoma saasto vuodessa; 0 jos alennusta ei sovelleta. */
  discount: number;
}

export function yelContribution(workIncome: number, newEntrepreneur = false): YelContribution {
  const income = Math.max(0, workIncome);
  const full = income * YEL.contributionRate;
  const discount = newEntrepreneur ? full * YEL.newEntrepreneurDiscount : 0;
  const annual = full - discount;
  return {
    rate: newEntrepreneur ? YEL.contributionRate * (1 - YEL.newEntrepreneurDiscount) : YEL.contributionRate,
    annual,
    monthly: annual / 12,
    discount,
  };
}

/** Vuodessa karttuva elake tyotulosta. */
export function yelPensionAccrual(workIncome: number): number {
  return Math.max(0, workIncome) * YEL.pensionAccrualRate;
}

export interface SicknessAllowance {
  daily: number;
  monthly: number;
  /** Paivaraha jai vahimmaismaaraan, eli tyotulo ei nosta turvaa. */
  atMinimum: boolean;
}

/**
 * Kelan sairauspaivaraha YEL-tyotulosta.
 *
 * Tyotulosta vahennetaan ensin vakuutusmaksuvahennys, minka jalkeen paivaraha
 * on 70 % alarajaan asti ja 20 % sen ylittavalta osalta.
 */
export function yelSicknessAllowance(workIncome: number): SicknessAllowance {
  const annualIncome = Math.max(0, workIncome) * (1 - SICKNESS_ALLOWANCE.insuranceDeduction);
  const lower = Math.min(annualIncome, SICKNESS_ALLOWANCE.lowerLimit) * SICKNESS_ALLOWANCE.lowerRate;
  const upper = Math.max(0, annualIncome - SICKNESS_ALLOWANCE.lowerLimit) * SICKNESS_ALLOWANCE.upperRate;
  const calculated = (lower + upper) / SICKNESS_ALLOWANCE.daysPerYear;
  const daily = Math.max(calculated, SICKNESS_ALLOWANCE.minimumDaily);
  return {
    daily,
    monthly: daily * SICKNESS_ALLOWANCE.daysPerMonth,
    atMinimum: calculated < SICKNESS_ALLOWANCE.minimumDaily,
  };
}

export type YelIncomeStatus = 'below-minimum' | 'insured' | 'above-maximum';

/** Kertoo, syntyyko tyotulosta vakuuttamisvelvollisuus ja osuuko se ylarajaan. */
export function yelIncomeStatus(workIncome: number): YelIncomeStatus {
  if (workIncome < YEL.minimumIncome) return 'below-minimum';
  if (workIncome > YEL.maximumIncome) return 'above-maximum';
  return 'insured';
}

/** Riittaako tyotulo yrittajan tyottomyysturvaan. */
export function qualifiesForUnemploymentCover(workIncome: number): boolean {
  return workIncome >= YEL.unemploymentCoverageIncome;
}
