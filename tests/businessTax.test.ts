import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBusinessTax, capitalIncomeTax } from '@/lib/businessTax';

const round = (value: number) => Math.round(value * 100) / 100;

test('osakeyhtiö maksaa yhteisöveroa eikä saa yrittäjävähennystä', () => {
  // Yrittäjävähennys myönnetään vain luonnolliselle henkilölle.
  const result = calculateBusinessTax({ revenue: 100000, deductions: 60000, form: 'osakeyhtio' });
  assert.equal(result.profit, 40000);
  assert.equal(result.entrepreneurDeduction, 0);
  assert.equal(result.corporateTax, 8000);
  assert.equal(result.totalTax, 8000);
  assert.equal(round(result.effectiveRateOfProfit * 100), 20);
});

test('toiminimen yrittäjävähennys on 5 % tuloksesta, ei 15 % liikevaihdosta', () => {
  // Aiemmin: min(liikevaihto * 0,15, 5000) = 5000. Oikein: 40000 * 0,05 = 2000.
  const result = calculateBusinessTax({
    revenue: 100000,
    deductions: 60000,
    form: 'toiminimi',
    earnedIncomeRate: 0.3,
  });
  assert.equal(result.entrepreneurDeduction, 2000);
  assert.equal(result.taxableIncome, 38000);
});

test('yrittäjävähennyksessä ei ole kattoa', () => {
  const result = calculateBusinessTax({ revenue: 500000, deductions: 100000, form: 'toiminimi' });
  assert.equal(result.entrepreneurDeduction, 20000);
});

test('toiminimen tulo jakautuu pääomatuloksi ja ansiotuloksi', () => {
  // Nettovarallisuus 100 000 ja 20 %:n vaatimus -> 20 000 pääomatuloa.
  const result = calculateBusinessTax({
    revenue: 100000,
    deductions: 40000,
    form: 'toiminimi',
    netAssets: 100000,
    capitalShare: 0.2,
    earnedIncomeRate: 0.3,
  });
  assert.equal(result.taxableProfit, 60000);
  assert.equal(result.entrepreneurDeduction, 3000);
  assert.equal(result.taxableIncome, 57000);
  assert.equal(result.capitalIncome, 20000);
  assert.equal(result.earnedIncome, 37000);
  assert.equal(result.capitalTax, 6000);
  assert.equal(round(result.earnedIncomeTax), 11100);
  assert.equal(round(result.totalTax), 17100);
});

test('pääomatulo-osuudeksi voi vaatia pienemmän osuuden', () => {
  const base = { revenue: 100000, deductions: 40000, form: 'toiminimi' as const, netAssets: 100000, earnedIncomeRate: 0.3 };
  assert.equal(calculateBusinessTax({ ...base, capitalShare: 0.1 }).capitalIncome, 10000);
  assert.equal(calculateBusinessTax({ ...base, capitalShare: 0 }).capitalIncome, 0);
});

test('pääomatulo-osuus ei voi ylittää verotettavaa tuloa', () => {
  const result = calculateBusinessTax({
    revenue: 20000,
    deductions: 10000,
    form: 'toiminimi',
    netAssets: 500000,
    capitalShare: 0.2,
  });
  assert.equal(result.capitalIncome, result.taxableIncome);
  assert.equal(result.earnedIncome, 0);
});

test('pääomatulovero kiristyy 30 000 euron jälkeen', () => {
  assert.equal(capitalIncomeTax(30000), 9000);
  assert.equal(capitalIncomeTax(40000), 9000 + 3400);
  assert.equal(capitalIncomeTax(0), 0);
  assert.equal(capitalIncomeTax(-5000), 0);
});

test('tappiollisesta toiminnasta ei makseta veroa', () => {
  const result = calculateBusinessTax({ revenue: 50000, deductions: 70000, form: 'osakeyhtio' });
  assert.equal(result.profit, -20000);
  assert.equal(result.taxableProfit, 0);
  assert.equal(result.totalTax, 0);
  assert.equal(result.effectiveRateOfProfit, 0);
});

test('nollaliikevaihto ei tuota jakolaskua nollalla', () => {
  const result = calculateBusinessTax({ revenue: 0, deductions: 0, form: 'toiminimi' });
  assert.equal(result.effectiveRateOfRevenue, 0);
  assert.equal(Number.isFinite(result.effectiveRateOfProfit), true);
});
