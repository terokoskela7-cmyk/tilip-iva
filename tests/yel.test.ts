import test from 'node:test';
import assert from 'node:assert/strict';
import {
  qualifiesForUnemploymentCover,
  yelContribution,
  yelIncomeStatus,
  yelPensionAccrual,
  yelSicknessAllowance,
} from '@/lib/yel';
import { YEL } from '@/lib/taxRates';

test('maksuprosentti on sama kaikenikäisille', () => {
  // Aiemmin laskuri käytti ikään perustuvia prosentteja 19/22/25, joita ei
  // ollut olemassa. Vuodesta 2026 ikäryhmäkohtaiset maksut poistuivat.
  assert.equal(YEL.contributionRate, 0.244);
  const contribution = yelContribution(30000);
  assert.equal(Math.round(contribution.annual * 100) / 100, 7320);
  assert.equal(Math.round(contribution.monthly * 100) / 100, 610);
  assert.equal(contribution.discount, 0);
});

test('aloittava yrittäjä saa 22 prosentin alennuksen', () => {
  const full = yelContribution(30000);
  const starter = yelContribution(30000, true);
  assert.equal(Math.round(starter.annual * 100) / 100, 5709.6);
  assert.equal(Math.round(starter.discount * 100) / 100, 1610.4);
  assert.equal(Math.round(starter.rate * 10000) / 10000, 0.1903);
  assert.ok(starter.annual < full.annual);
});

test('nolla tai negatiivinen työtulo ei tuota negatiivista maksua', () => {
  assert.equal(yelContribution(0).annual, 0);
  assert.equal(yelContribution(-5000).annual, 0);
});

test('eläkettä karttuu 1,5 prosenttia työtulosta', () => {
  assert.equal(yelPensionAccrual(30000), 450);
});

test('sairauspäiväraha vastaa Kelan laskentaa', () => {
  // Tarkistettu julkaistuja esimerkkejä vasten: 20 000 € työtulolla
  // 42,43 €/arkipäivä ja 40 000 € työtulolla 71,32 €/arkipäivä.
  assert.equal(Math.round(yelSicknessAllowance(20000).daily * 100) / 100, 42.43);
  assert.equal(Math.round(yelSicknessAllowance(40000).daily * 100) / 100, 71.32);
  assert.equal(Math.round(yelSicknessAllowance(20000).monthly), 1061);
  assert.equal(Math.round(yelSicknessAllowance(40000).monthly), 1783);
});

test('ylärajan jälkeen päiväraha kasvaa hitaammin', () => {
  // Alarajan 28 241 € jälkeen kertymä on 20 % eikä 70 %.
  const below = yelSicknessAllowance(30000).daily;
  const above = yelSicknessAllowance(40000).daily;
  const extraPerEuro = (above - below) / 10000;
  assert.ok(extraPerEuro < 0.7 / 300, 'kertymän pitää hidastua ylärajan jälkeen');
});

test('pieni työtulo jää vähimmäismäärään', () => {
  const small = yelSicknessAllowance(5000);
  assert.equal(small.atMinimum, true);
  assert.equal(small.daily, 31.99);
});

test('työtulon rajat tunnistetaan', () => {
  assert.equal(yelIncomeStatus(9000), 'below-minimum');
  assert.equal(yelIncomeStatus(9423.09), 'insured');
  assert.equal(yelIncomeStatus(30000), 'insured');
  assert.equal(yelIncomeStatus(214001), 'above-maximum');
});

test('työttömyysturvan työtuloraja', () => {
  assert.equal(qualifiesForUnemploymentCover(15480), false);
  assert.equal(qualifiesForUnemploymentCover(15481), true);
});
