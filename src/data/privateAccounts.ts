import type { Account } from '@/types';

export const privateAccounts: Omit<Account, 'id'>[] = [
  // VASTAAVAA
  { number: '1910', name: 'Saamiset', type: 'asset', vatRate: 0 },
  { number: '1920', name: 'Muut saamiset', type: 'asset', vatRate: 0 },
  { number: '1930', name: 'Pankkitili', type: 'asset', vatRate: 0 },
  { number: '1940', name: 'Säästötili', type: 'asset', vatRate: 0 },
  { number: '1950', name: 'Käteiskassa', type: 'asset', vatRate: 0 },
  // VASTATTAVAA
  { number: '2000', name: 'Oma pääoma', type: 'equity', vatRate: 0 },
  { number: '2050', name: 'Edellisten kausien tulos', type: 'equity', vatRate: 0 },
  { number: '2060', name: 'Kauden tulos', type: 'equity', vatRate: 0 },
  { number: '2700', name: 'Ennakkomaksut', type: 'liability', vatRate: 0 },
  { number: '2800', name: 'Ostovelat', type: 'liability', vatRate: 0 },
  { number: '2900', name: 'Muut velat', type: 'liability', vatRate: 0 },
  // TUOTOT
  { number: '3000', name: 'Palkka- ja eläketulot', type: 'revenue', vatRate: 0 },
  { number: '3100', name: 'Vuokratulot', type: 'revenue', vatRate: 0 },
  { number: '3200', name: 'Osinkotulot', type: 'revenue', vatRate: 0 },
  { number: '3400', name: 'Rahoitustuotot', type: 'revenue', vatRate: 0 },
  { number: '3500', name: 'Muut tuotot', type: 'revenue', vatRate: 0 },
  // KULUT
  { number: '4100', name: 'Yleiskulut', type: 'expense', vatRate: 0 },
  { number: '4200', name: 'Vastikkeet', type: 'expense', vatRate: 0 },
  { number: '4210', name: 'Kiinteistövero', type: 'expense', vatRate: 0 },
  { number: '4220', name: 'Lainan korot', type: 'expense', vatRate: 0 },
  { number: '4230', name: 'Vakuutukset', type: 'expense', vatRate: 0 },
  { number: '4240', name: 'Korjaus ja huolto', type: 'expense', vatRate: 0 },
  { number: '4500', name: 'Rahoituskulut', type: 'expense', vatRate: 0 },
  { number: '4800', name: 'Muut kulut', type: 'expense', vatRate: 0 },
  { number: '4900', name: 'Verot', type: 'expense', vatRate: 0 },
];
