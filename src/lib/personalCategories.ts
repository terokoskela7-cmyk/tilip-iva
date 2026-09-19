import type { LucideIcon } from 'lucide-react';
import { Dumbbell, Plane, Receipt, Umbrella, Users } from 'lucide-react';

/**
 * Oman talouden kategoriat yhdessa paikassa.
 *
 * Aiemmin budjettinakyma tunsi vain kahdeksan kategoriaa ja tapahtumanakyma
 * kolmetoista, joten esimerkiksi lapsiin, matkailuun ja vakuutuksiin
 * luokitellut menot putosivat hiljaisesti pois budjetin toteumasta.
 */

export interface PersonalCategory {
  id: string;
  name: string;
  color: string;
  icon?: LucideIcon;
}

export const expenseCategories: PersonalCategory[] = [
  { id: 'ruoka', name: 'Ruoka', color: '#ef4444' },
  { id: 'asuminen', name: 'Asuminen', color: '#f97316' },
  { id: 'liikenne', name: 'Liikenne', color: '#f59e0b' },
  { id: 'viihde', name: 'Viihde', color: '#84cc16' },
  { id: 'terveys', name: 'Terveys', color: '#10b981' },
  { id: 'vaatteet', name: 'Vaatteet', color: '#06b6d4' },
  { id: 'koulutus', name: 'Koulutus', color: '#3b82f6' },
  { id: 'children', name: 'Lapset', color: '#8b5cf6', icon: Users },
  { id: 'travel', name: 'Matkailu', color: '#ec4899', icon: Plane },
  { id: 'insurance', name: 'Vakuutukset', color: '#14b8a6', icon: Umbrella },
  { id: 'hobbies', name: 'Harrastukset', color: '#f43f5e', icon: Dumbbell },
  { id: 'bills', name: 'Laskut', color: '#64748b', icon: Receipt },
  { id: 'muut', name: 'Muut', color: '#6366f1' },
];

export const incomeCategories: PersonalCategory[] = [
  { id: 'palkka', name: 'Palkka', color: '#16a34a' },
  { id: 'sivutulo', name: 'Sivutulo', color: '#22c55e' },
  { id: 'myynti', name: 'Myynti', color: '#4ade80' },
  { id: 'muut-tulot', name: 'Muut tulot', color: '#86efac' },
];

export const allCategories: PersonalCategory[] = [...incomeCategories, ...expenseCategories];

export function isIncomeCategory(id: string): boolean {
  return incomeCategories.some((category) => category.id === id);
}
