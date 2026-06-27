import type { Account } from '@/types';

export const personalAccounts: Omit<Account, 'id'>[] = [
  { number: '100', name: 'Palkka', type: 'income', vatRate: 0 },
  { number: '110', name: 'Vuokratulot', type: 'income', vatRate: 0 },
  { number: '120', name: 'Muut tulot', type: 'income', vatRate: 0 },
  { number: '200', name: 'Asuminen', type: 'expense', vatRate: 0 },
  { number: '210', name: 'Ruoka', type: 'expense', vatRate: 0 },
  { number: '220', name: 'Liikenne', type: 'expense', vatRate: 0 },
  { number: '230', name: 'Vakuutukset', type: 'expense', vatRate: 0 },
  { number: '240', name: 'Sähkö/vesi/netti', type: 'expense', vatRate: 0 },
  { number: '250', name: 'Viihde', type: 'expense', vatRate: 0 },
  { number: '260', name: 'Vaatteet', type: 'expense', vatRate: 0 },
  { number: '270', name: 'Terveys', type: 'expense', vatRate: 0 },
  { number: '280', name: 'Säästöt', type: 'expense', vatRate: 0 },
  { number: '290', name: 'Sijoitukset', type: 'expense', vatRate: 0 },
  { number: '300', name: 'Muut', type: 'expense', vatRate: 0 },
];
