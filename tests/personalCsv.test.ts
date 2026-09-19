import test from 'node:test';
import assert from 'node:assert/strict';
import { autoCategorize, cleanMerchantName, parseCsv } from '@/lib/personalCsv';
import { expenseCategories } from '@/lib/personalCategories';
import { expenseCategories as budgetCategories } from '@/lib/personalCategories';

test('avainsanat ratkaisevat ennen summasääntöä', () => {
  // Aiemmin mikä tahansa yli 500 euron tapahtuma luokittui palkaksi.
  const vuokra = autoCategorize('Vuokra maaliskuu', '', '', 950);
  assert.equal(vuokra.category, 'asuminen');
  assert.equal(vuokra.type, 'expense');

  const lento = autoCategorize('Finnair lento', '', '', 620);
  assert.equal(lento.category, 'travel');
});

test('iso positiivinen summa on palkka vasta kun muuta ei löydy', () => {
  // Huom: syötteessä ei saa olla yhtään avainsanaa — esimerkiksi "ABC" osuisi
  // liikenteen huoltoasemaan, mikä on juuri se järjestys jonka tämä korjaus tuo.
  const tuntematon = autoCategorize('QX99 REF 55810', '', '', 2400);
  assert.equal(tuntematon.category, 'palkka');
  assert.equal(tuntematon.type, 'income');
  // Pelkkään summaan perustuva arvaus ei saa esiintyä varmana.
  assert.equal(tuntematon.confidence, 'low');
});

test('pieni tuntematon tapahtuma jää kategoriaan muut', () => {
  const pieni = autoCategorize('XYZ999', '', '', -12);
  assert.equal(pieni.category, 'muut');
  assert.equal(pieni.type, 'expense');
});

test('tapahtumalaji ohittaa muun tulkinnan', () => {
  assert.equal(autoCategorize('Maksu', 'Palkka', '', 100).category, 'palkka');
  assert.equal(autoCategorize('Maksu', 'Lyhennys', '', -600).category, 'asuminen');
});

test('omat tilisiirrot ohitetaan tuonnissa', () => {
  const siirto = autoCategorize('Oma tilisiirto', 'Tilisiirto', '', -500);
  assert.equal(siirto.skip, true);
});

test('kauppiaan nimestä siivotaan korttinumero ja päiväys', () => {
  assert.equal(cleanMerchantName('*2832 24.06. K-Market'), 'K-Market');
  assert.equal(cleanMerchantName('Viesti puuttuu'), '');
});

test('budjetti ja tapahtumat käyttävät samoja kategorioita', () => {
  // Aiemmin budjetissa oli 8 ja tapahtumissa 13 kategoriaa, jolloin
  // lapsiin, matkailuun ja vakuutuksiin luokitellut menot katosivat toteumasta.
  assert.equal(budgetCategories, expenseCategories);
  for (const id of ['children', 'travel', 'insurance', 'hobbies', 'bills']) {
    assert.equal(budgetCategories.some((c) => c.id === id), true, id);
  }
});

test('CSV-tuonti lukee lainausmerkeissä olevan pilkun oikein', () => {
  const csv = [
    'Kirjauspäivä;Määrä;Tapahtumalaji;Saajan nimi;Viesti',
    '05.03.2024;-42,50;Kortti;"K-Market, Vaasa";Ruokaostokset',
  ].join('\n');
  const rows = parseCsv(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].date, '2024-03-05');
  assert.equal(Math.round(rows[0].amount * 100), -4250);
});
