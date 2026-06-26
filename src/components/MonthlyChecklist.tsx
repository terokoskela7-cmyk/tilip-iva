import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, RotateCcw, CalendarCheck, AlertCircle } from 'lucide-react';


interface Task {
  id: string;
  text: string;
  category: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  critical: boolean;
}

const defaultTasks: Task[] = [
  // Viikottain
  { id: 'w1', text: 'Tarkista pankkitili ja täsmäytä tositteet', category: 'weekly', critical: false },
  { id: 'w2', text: 'Lähetä laskut (älä viivyttele!)', category: 'weekly', critical: true },
  { id: 'w3', text: 'Seuraa kassavirtaa — riittävätkö rahat laskuihin?', category: 'weekly', critical: true },
  // Kuukausittain
  { id: 'm1', text: 'Kirjaa kaikki tositteet kirjanpitoon', category: 'monthly', critical: true },
  { id: 'm2', text: 'ALV-ilmoitus ja maksu (jos kuukausittainen)', category: 'monthly', critical: true },
  { id: 'm3', text: 'Maksa palkat ja työnantajamaksut', category: 'monthly', critical: true },
  { id: 'm4', text: 'Maksa YEL-vakuutusmaksu', category: 'monthly', critical: true },
  { id: 'm5', text: 'Laita kuittikansio järjestykseen', category: 'monthly', critical: false },
  { id: 'm6', text: 'Vie kirjanpidon varmuuskopio (JSON)', category: 'monthly', critical: false },
  { id: 'm7', text: 'Seuraa myyntiä — tavoitteissa?', category: 'monthly', critical: false },
  // Neljännesvuosittain
  { id: 'q1', text: 'ALV-ilmoitus (jos neljännesvuosittainen)', category: 'quarterly', critical: true },
  { id: 'q2', text: 'Yhteisöveron ennakkovero', category: 'quarterly', critical: true },
  { id: 'q3', text: 'Tarkista tilikauden tulos kehitys', category: 'quarterly', critical: false },
  { id: 'q4', text: 'Päivitä budjetti ja ennuste', category: 'quarterly', critical: false },
  // Vuosittain
  { id: 'y1', text: 'YEL-työtulon ilmoitus eläkeyhtiölle (helmikuu)', category: 'yearly', critical: true },
  { id: 'y2', text: 'Tilinpäätös ja veroilmoitus', category: 'yearly', critical: true },
  { id: 'y3', text: 'Tilinpäätös kaupparekisteriin', category: 'yearly', critical: true },
  { id: 'y4', text: 'Vuosi-ilmoitukset (palkat, osingot)', category: 'yearly', critical: true },
  { id: 'y5', text: 'Tarkista vakuutusten riittävyys', category: 'yearly', critical: false },
  { id: 'y6', text: 'Päivitä hinnasto ja ehdot', category: 'yearly', critical: false },
];

const categoryLabels: Record<string, { label: string; color: string }> = {
  weekly: { label: 'Viikottain', color: 'bg-green-100 text-green-700' },
  monthly: { label: 'Kuukausittain', color: 'bg-blue-100 text-blue-700' },
  quarterly: { label: 'Neljännesvuosittain', color: 'bg-amber-100 text-amber-700' },
  yearly: { label: 'Vuosittain', color: 'bg-purple-100 text-purple-700' },
};

export default function MonthlyChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const stored = localStorage.getItem('monthly-checklist');
    if (stored) setChecked(JSON.parse(stored));
  }, []);

  function toggle(id: string) {
    const updated = { ...checked, [id]: !checked[id] };
    setChecked(updated);
    localStorage.setItem('monthly-checklist', JSON.stringify(updated));
  }

  function reset() {
    setChecked({});
    localStorage.removeItem('monthly-checklist');
  }

  const tasks = filter === 'all' ? defaultTasks : defaultTasks.filter((t) => t.category === filter);
  const completed = tasks.filter((t) => checked[t.id]).length;
  const total = tasks.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5" /> Muistutuslista
            </h2>
            <p className="text-sm text-gray-500 mt-1">Rutiinit yrittäjän arkeen.</p>
          </div>
          <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="w-4 h-4 mr-1" /> Nollaa</Button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {['all', ...Object.keys(categoryLabels)].map((cat) => (
            <Button key={cat} variant={filter === cat ? 'default' : 'outline'} size="sm" className={filter === cat ? 'bg-blue-600 text-white' : ''} onClick={() => setFilter(cat)}>
              {cat === 'all' ? 'Kaikki' : categoryLabels[cat].label}
            </Button>
          ))}
        </div>
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all rounded-full" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{completed}/{total} tehty</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-1">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggle(task.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors ${
                checked[task.id] ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
              }`}
            >
              {checked[task.id] ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />}
              <span className={`flex-1 text-sm ${checked[task.id] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.text}</span>
              <Badge className={`text-xs ${categoryLabels[task.category].color}`}>{categoryLabels[task.category].label}</Badge>
              {task.critical && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
