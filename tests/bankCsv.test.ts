import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBankCsv, splitNewTransactions, transactionKey } from '@/lib/bankCsv';

const nordea = [
  'Kirjauspäivä;Määrä;Laji;Selitys;Saaja/Maksaja;Viite;Viesti',
  '05.03.2024;-42,50;Kortti;Ostos;K-Market;;Ruokaostokset',
  '06.03.2024;1 234,56;Tilisiirto;Palkka;Yritys Oy;123456;Maaliskuun palkka',
].join('\n');

test('nordea-tiliote jäsentyy', () => {
  const rows = parseBankCsv(nordea, 'nordea');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    date: '2024-03-05',
    amount: -42.5,
    description: 'Ostos Ruokaostokset',
    counterparty: 'K-Market',
    reference: '',
  });
  assert.equal(rows[1].amount, 1234.56);
  assert.equal(rows[1].reference, '123456');
});

test('otsikkorivi tunnistetaan sisällöstä, ei sijainnista', () => {
  // Otsikoton tiedosto: aiemmin ensimmäinen tapahtuma katosi aina.
  const withoutHeader = '05.03.2024;-42,50;Kortti;Ostos;K-Market;;Viesti';
  assert.equal(parseBankCsv(withoutHeader, 'nordea').length, 1);
  // Otsikollinen: otsikko ei päädy tapahtumaksi.
  assert.equal(parseBankCsv(nordea, 'nordea').length, 2);
});

test('lainausmerkeissä oleva pilkku ei siirrä sarakkeita', () => {
  const op = [
    'Kirjauspäivä,Arvopäivä,Määrä,Tapahtumalaji,Selitys,Saaja/Maksaja,Viite',
    '05.03.2024,05.03.2024,"-1 234,56",Tilisiirto,Vuokra,"Kiinteistö Oy, Helsinki",99887',
  ].join('\n');
  const rows = parseBankCsv(op, 'op');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount, -1234.56);
  assert.equal(rows[0].counterparty, 'Kiinteistö Oy, Helsinki');
  assert.equal(rows[0].reference, '99887');
});

test('nollan suuruinen tapahtuma säilyy, roskarivi ei', () => {
  const csv = [
    '05.03.2024;0,00;Korjaus;Veloituksen oikaisu;Kauppa;;',
    'roskarivi ilman päivämäärää;;;;;;',
  ].join('\n');
  const rows = parseBankCsv(csv, 'nordea');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount, 0);
});

test('windows-rivinvaihdot eivät jää kenttien perään', () => {
  const rows = parseBankCsv('05.03.2024;-10,00;Kortti;Ostos;Kauppa;;Viesti\r\n', 'nordea');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].description, 'Ostos Viesti');
});

test('generic-muodon erotin päätellään sisällöstä', () => {
  const rows = parseBankCsv('2024-03-05;-10,00;Ostos;VIITE;Kauppa', 'generic');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].description, 'Ostos');
  assert.equal(rows[0].counterparty, 'Kauppa');
});

const tx = (date: string, amount: number, description = 'Ostos') => ({
  date,
  amount,
  description,
  reference: '',
  counterparty: 'Kauppa',
});

test('jo tuotuja tapahtumia ei tuoda uudelleen', () => {
  const existing = [tx('2024-03-05', -42.5), tx('2024-03-06', -10)];
  const incoming = [tx('2024-03-05', -42.5), tx('2024-03-07', -5)];
  const result = splitNewTransactions(incoming, existing);
  assert.equal(result.duplicates, 1);
  assert.deepEqual(result.fresh.map((t) => t.date), ['2024-03-07']);
});

test('aidosti kahdesti tehty sama osto tuodaan molemmat kerrat', () => {
  const existing = [tx('2024-03-05', -4.5, 'Kahvi')];
  const incoming = [tx('2024-03-05', -4.5, 'Kahvi'), tx('2024-03-05', -4.5, 'Kahvi')];
  const result = splitNewTransactions(incoming, existing);
  assert.equal(result.duplicates, 1);
  assert.equal(result.fresh.length, 1);
});

test('tunniste ei riipu kirjainkoosta eikä väleistä', () => {
  assert.equal(
    transactionKey(tx('2024-03-05', -42.5, ' Ostos ')),
    transactionKey(tx('2024-03-05', -42.5, 'OSTOS'))
  );
});
