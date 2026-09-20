import type { LedgerType } from '@/types';

/**
 * Aktiivisen tilikirjan valinta ja onboardingin tarve.
 *
 * Onboarding on ensimmaisen kayton nakyma: se kysyy yrityksen tiedot ja luo
 * ensimmaisen tilikirjan. Aiemmin sita vaadittiin jokaiselta company-tyyppiselta
 * tilikirjalta, jolta puuttui yritysdokumentti. Kun kayttaja lisasi uuden
 * yrityksen sivupalkista, han paatyi onboarding-ruutuun eika juuri luotu
 * tilikirja nakynyt missaan — eika sivupalkkia ollut, joten takaisin aiempaan
 * tilikirjaan ei paassyt.
 */

export interface LedgerSummary {
  id: string;
  type: LedgerType;
}

export interface LedgerSelection {
  /** Valittu tilikirja, tai null jos tilikirjoja ei ole. */
  ledgerId: string | null;
  /** Tallennettu valinta ei kelvannut, joten se on kirjoitettava uudelleen. */
  ledgerChanged: boolean;
  /** Onboarding tarvitaan vain kun tilikirjoja ei viela ole. */
  needsOnboarding: boolean;
  isPersonal: boolean;
}

export function resolveLedgerSelection(
  ledgers: LedgerSummary[],
  storedLedgerId: string
): LedgerSelection {
  if (ledgers.length === 0) {
    return { ledgerId: null, ledgerChanged: false, needsOnboarding: true, isPersonal: false };
  }

  const stored = ledgers.find((ledger) => ledger.id === storedLedgerId);
  const active = stored ?? ledgers[0];

  return {
    ledgerId: active.id,
    ledgerChanged: !stored,
    needsOnboarding: false,
    isPersonal: active.type === 'personal',
  };
}
