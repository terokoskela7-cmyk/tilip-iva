import { openDB, deleteDB } from 'idb';
import { saveManyToLedger } from '@/lib/firestore';
import type { CashRegisterEntry, Customer, Invoice, PersonalEntry, RecurringEntry } from '@/types';

/**
 * Kertaluonteinen siirto vanhoista paikallisista tallennuspaikoista Firestoreen.
 *
 * Laskutus, asiakkaat, toistuvat kirjaukset ja kassakirja tallennettiin aiemmin
 * selaimen IndexedDB:hen ja oman talouden tapahtumat localStorageen, jolloin ne
 * eivat synkronoituneet laitteiden valilla eivatka sisaltyneet varmuuskopioon.
 * Kaikki kirjoitukset menevat nyt Firestoreen; tama siirtaa aiemmin syntyneen
 * aineiston sinne kertaalleen.
 *
 * Lahdeaineistoa ei poisteta, jotta mikaan ei katoa jos siirto keskeytyy.
 */

const LEGACY_DB_NAME = 'FinLedgerDB';
const LEGACY_STORES = ['customers', 'invoices', 'recurringEntries', 'cashRegister'] as const;
const LS_PERSONAL_ENTRIES = 'tilipaiva_personal_entries';

const doneKey = (uid: string) => `tilipaiva_legacy_migrated_${uid}`;
const personalDoneKey = (uid: string, ledgerId: string) =>
  `tilipaiva_legacy_personal_migrated_${uid}_${ledgerId}`;

function isDone(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return true; // Ilman localStoragea ei voi seurata tilaa -> ei yriteta uudelleen.
  }
}

function markDone(key: string): void {
  try {
    localStorage.setItem(key, 'true');
  } catch { /* ignore */ }
}

type LegacyCash = CashRegisterEntry & { ledgerId?: string };

/** Avaa vanhan IndexedDB:n vain lukua varten. Jos sita ei ole, siivoaa tyhjan kannan pois. */
async function readLegacyStores(): Promise<Record<string, unknown[]> | null> {
  if (typeof indexedDB === 'undefined') return null;

  if (typeof indexedDB.databases === 'function') {
    try {
      const dbs = await indexedDB.databases();
      if (!dbs.some((d) => d.name === LEGACY_DB_NAME)) return null;
    } catch { /* jatketaan avaamalla */ }
  }

  const db = await openDB(LEGACY_DB_NAME, 2);
  if (db.objectStoreNames.length === 0) {
    // Kantaa ei ollut olemassa; avaus loi sen tyhjana.
    db.close();
    await deleteDB(LEGACY_DB_NAME);
    return null;
  }

  const result: Record<string, unknown[]> = {};
  for (const store of LEGACY_STORES) {
    result[store] = db.objectStoreNames.contains(store) ? await db.getAll(store) : [];
  }
  db.close();
  return result;
}

function readLegacyPersonalEntries(): PersonalEntry[] {
  try {
    const raw = localStorage.getItem(LS_PERSONAL_ENTRIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Demo-tapahtumat eivat ole kayttajan omaa aineistoa.
    return (parsed as PersonalEntry[]).filter((e) => e?.id && !e.id.startsWith('demo-'));
  } catch {
    return [];
  }
}

/**
 * Siirtaa IndexedDB:n laskutus-, asiakas-, toistuvat ja kassatiedot Firestoreen.
 * Kutsutaan vasta kun kohdetilikirja on ratkaistu, jottei aineisto paady
 * tilikirjaan jota ei ole olemassa.
 */
export async function migrateLegacyLocalData(uid: string, activeLedgerId: string): Promise<boolean> {
  const key = doneKey(uid);
  if (isDone(key)) return false;

  const legacy = await readLegacyStores();
  if (!legacy) {
    markDone(key);
    return false;
  }

  const customers = legacy.customers as Customer[];
  const invoices = legacy.invoices as Invoice[];
  const recurringEntries = legacy.recurringEntries as RecurringEntry[];
  const cashEntries = legacy.cashRegister as LegacyCash[];

  await saveManyToLedger(activeLedgerId, 'customers', customers);
  await saveManyToLedger(activeLedgerId, 'invoices', invoices);
  await saveManyToLedger(activeLedgerId, 'recurringEntries', recurringEntries);

  // Kassatapahtumat kantavat oman tilikirjatunnisteensa, jos sellainen on tallennettu.
  const byLedger = new Map<string, CashRegisterEntry[]>();
  for (const entry of cashEntries) {
    const { ledgerId, ...rest } = entry;
    const target = ledgerId || activeLedgerId;
    const list = byLedger.get(target) ?? [];
    list.push(rest as CashRegisterEntry);
    byLedger.set(target, list);
  }
  for (const [ledgerId, list] of byLedger) {
    await saveManyToLedger(ledgerId, 'cashRegister', list);
  }

  markDone(key);
  return (
    customers.length > 0 ||
    invoices.length > 0 ||
    recurringEntries.length > 0 ||
    cashEntries.length > 0
  );
}

/**
 * Siirtaa oman talouden tapahtumat localStoragesta aktiiviseen tilikirjaan.
 * Ajetaan vain kun aktiivinen tilikirja on tyyppia 'personal', koska tapahtumat
 * kuuluvat sellaiseen.
 */
export async function migrateLegacyPersonalEntries(uid: string, ledgerId: string): Promise<boolean> {
  const key = personalDoneKey(uid, ledgerId);
  if (isDone(key)) return false;

  const entries = readLegacyPersonalEntries();
  if (entries.length > 0) {
    await saveManyToLedger(ledgerId, 'personalEntries', entries);
  }
  markDone(key);
  return entries.length > 0;
}
