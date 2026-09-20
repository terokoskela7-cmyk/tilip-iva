import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLedgerSelection, type LedgerSummary } from '@/lib/ledgerSelection';

const asOy: LedgerSummary = { id: 'asoy', type: 'housing-company' };
const yritys: LedgerSummary = { id: 'yritys', type: 'company' };
const omaTalous: LedgerSummary = { id: 'oma', type: 'personal' };

test('ilman tilikirjoja näytetään onboarding', () => {
  const selection = resolveLedgerSelection([], 'default');
  assert.equal(selection.needsOnboarding, true);
  assert.equal(selection.ledgerId, null);
});

test('lisätty yritys valitaan eikä onboarding keskeytä', () => {
  // Aiemmin company-tyyppinen tilikirja ilman yritysdokumenttia pakotti
  // onboarding-ruutuun, jolloin juuri lisätty yritys ei näkynyt missään.
  const selection = resolveLedgerSelection([asOy, yritys], 'yritys');
  assert.equal(selection.needsOnboarding, false);
  assert.equal(selection.ledgerId, 'yritys');
  assert.equal(selection.ledgerChanged, false);
});

test('tuntematon tallennettu valinta korvataan ensimmäisellä tilikirjalla', () => {
  const selection = resolveLedgerSelection([asOy, yritys], 'default');
  assert.equal(selection.ledgerId, 'asoy');
  assert.equal(selection.ledgerChanged, true);
  assert.equal(selection.needsOnboarding, false);
});

test('oma talous tunnistetaan henkilökohtaiseksi', () => {
  assert.equal(resolveLedgerSelection([omaTalous], 'oma').isPersonal, true);
  assert.equal(resolveLedgerSelection([asOy], 'asoy').isPersonal, false);
});

test('yritystilikirjaan pääsee myös ilman yritysdokumenttia', () => {
  // Yritysdokumentti on täydennettävää tietoa, ei pääsyn ehto: tilikirjalla on
  // jo nimi, ja loput voi täyttää asetuksista.
  for (const ledgers of [[yritys], [yritys, asOy], [asOy, yritys]]) {
    assert.equal(resolveLedgerSelection(ledgers, 'yritys').needsOnboarding, false);
  }
});
