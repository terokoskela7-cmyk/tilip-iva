
import type { PersonalEntry, Budget } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function monthDate(monthOffset: number, day: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  d.setDate(day);
  return d.toISOString().split('T')[0];
}

export async function seedPersonalDemoData(
  onAddEntry: (entry: PersonalEntry) => void | Promise<void>,
  onSaveBudget?: (budget: Budget) => void | Promise<void>
): Promise<void> {
  const entries: Omit<PersonalEntry, 'id' | 'createdAt'>[] = [
    { date: monthDate(0, 1), description: 'Palkka', amount: 3200, category: 'palkka', accountId: undefined },
    { date: monthDate(0, 2), description: 'Sivutulo verkkokaupasta', amount: 250, category: 'sivutulo', accountId: undefined },
    { date: monthDate(0, 3), description: 'Ruokaostokset', amount: -85.5, category: 'ruoka', accountId: undefined },
    { date: monthDate(0, 5), description: 'Vuokra', amount: -950, category: 'asuminen', accountId: undefined },
    { date: monthDate(0, 6), description: 'Bussilippu', amount: -55, category: 'liikenne', accountId: undefined },
    { date: monthDate(0, 8), description: 'Elokuvat', amount: -28, category: 'viihde', accountId: undefined },
    { date: monthDate(0, 10), description: 'Apteekki', amount: -32.4, category: 'terveys', accountId: undefined },
    { date: monthDate(0, 12), description: 'Uudet kengät', amount: -89.9, category: 'vaatteet', accountId: undefined },
    { date: monthDate(0, 14), description: 'Verkkokurssi', amount: -49, category: 'koulutus', accountId: undefined },
    { date: monthDate(0, 15), description: 'Kahvit ja lahjat', amount: -24.6, category: 'muut', accountId: undefined },
    { date: monthDate(-1, 1), description: 'Palkka', amount: 3200, category: 'palkka', accountId: undefined },
    { date: monthDate(-1, 4), description: 'Ruokaostokset', amount: -92.3, category: 'ruoka', accountId: undefined },
    { date: monthDate(-1, 5), description: 'Vuokra', amount: -950, category: 'asuminen', accountId: undefined },
    { date: monthDate(-1, 7), description: 'Bensa', amount: -68, category: 'liikenne', accountId: undefined },
    { date: monthDate(-1, 20), description: 'Konsertti', amount: -65, category: 'viihde', accountId: undefined },
  ];

  for (const entry of entries) {
    await onAddEntry({ ...entry, id: generateId(), createdAt: new Date().toISOString() });
  }

  if (onSaveBudget) {
    const currentMonth = monthDate(0, 1).slice(0, 7);
    await onSaveBudget({
      id: currentMonth,
      month: currentMonth,
      items: [
        { categoryId: 'ruoka', budgeted: 400, actual: 0 },
        { categoryId: 'asuminen', budgeted: 1000, actual: 0 },
        { categoryId: 'liikenne', budgeted: 150, actual: 0 },
        { categoryId: 'viihde', budgeted: 100, actual: 0 },
        { categoryId: 'terveys', budgeted: 50, actual: 0 },
        { categoryId: 'vaatteet', budgeted: 100, actual: 0 },
        { categoryId: 'koulutus', budgeted: 75, actual: 0 },
        { categoryId: 'muut', budgeted: 100, actual: 0 },
      ],
    });
  }
}
