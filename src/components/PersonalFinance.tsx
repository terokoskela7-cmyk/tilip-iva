import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, Wallet, Landmark, Coins, Upload, Save, X, Eye, EyeOff, Plane, Umbrella, Users, Dumbbell, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import type { PersonalEntry, BankAccount } from '@/types';
import { format, parseISO, subMonths, startOfMonth } from 'date-fns';
import { fi } from 'date-fns/locale';

const LS_ENTRIES = 'tilipaiva_personal_entries';
const LS_ACCOUNTS = 'tilipaiva_personal_accounts';
const LS_DEMO_CLEARED = 'tilipaiva_demo_cleared';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

interface DemoAccount {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'cash';
}

interface CsvRow {
  date: string;
  description: string;
  amount: number;
  txType?: string;
  message?: string;
  raw: string[];
}

interface ParsedRow extends CsvRow {
  id: string;
  type: 'income' | 'expense';
  category: string;
  confidence: 'high' | 'medium' | 'low';
  selected: boolean;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 'checking', name: 'Kulutustili', balance: 2500, type: 'checking' },
  { id: 'savings', name: 'Palkka-Säästötili', balance: 5000, type: 'savings' },
  { id: 'cash', name: 'Käteiskassa', balance: 150, type: 'cash' },
];

const DEMO_ENTRIES: PersonalEntry[] = [
  { id: 'demo-1', date: '', description: 'Palkka', amount: 3200, category: 'palkka', createdAt: '' },
  { id: 'demo-2', date: '', description: 'Sivutulo verkkokaupasta', amount: 250, category: 'sivutulo', createdAt: '' },
  { id: 'demo-3', date: '', description: 'Ruokaostokset Prisma', amount: -85.5, category: 'ruoka', createdAt: '' },
  { id: 'demo-4', date: '', description: 'Vuokra', amount: -950, category: 'asuminen', createdAt: '' },
  { id: 'demo-5', date: '', description: 'Bussilippu', amount: -55, category: 'liikenne', createdAt: '' },
  { id: 'demo-6', date: '', description: 'Elokuvat', amount: -28, category: 'viihde', createdAt: '' },
  { id: 'demo-7', date: '', description: 'Apteekki', amount: -32.4, category: 'terveys', createdAt: '' },
  { id: 'demo-8', date: '', description: 'Uudet kengät', amount: -89.9, category: 'vaatteet', createdAt: '' },
  { id: 'demo-9', date: '', description: 'Verkkokurssi', amount: -49, category: 'koulutus', createdAt: '' },
  { id: 'demo-10', date: '', description: 'Kahvit ja lahjat', amount: -24.6, category: 'muut', createdAt: '' },
  { id: 'demo-11', date: '', description: 'Sähkölasku', amount: -62, category: 'bills', createdAt: '' },
  { id: 'demo-12', date: '', description: 'Polttoaine', amount: -74, category: 'liikenne', createdAt: '' },
  { id: 'demo-13', date: '', description: 'Spotify', amount: -12.99, category: 'viihde', createdAt: '' },
  { id: 'demo-14', date: '', description: 'Kirja', amount: -24.9, category: 'koulutus', createdAt: '' },
  { id: 'demo-15', date: '', description: 'Lounas', amount: -13.5, category: 'ruoka', createdAt: '' },
];

function createDemoEntries(month: string): PersonalEntry[] {
  const now = new Date().toISOString();
  return DEMO_ENTRIES.map((entry, index) => ({
    ...entry,
    id: `demo-${index + 1}`,
    date: `${month}-${String(index + 1).padStart(2, '0')}`,
    createdAt: now,
  }));
}

const expenseCategories = [
  { id: 'ruoka', name: 'Ruoka', color: '#ef4444', icon: null },
  { id: 'asuminen', name: 'Asuminen', color: '#f97316', icon: null },
  { id: 'liikenne', name: 'Liikenne', color: '#f59e0b', icon: null },
  { id: 'viihde', name: 'Viihde', color: '#84cc16', icon: null },
  { id: 'terveys', name: 'Terveys', color: '#10b981', icon: null },
  { id: 'vaatteet', name: 'Vaatteet', color: '#06b6d4', icon: null },
  { id: 'koulutus', name: 'Koulutus', color: '#3b82f6', icon: null },
  { id: 'children', name: 'Lapset', color: '#8b5cf6', icon: Users },
  { id: 'travel', name: 'Matkailu', color: '#ec4899', icon: Plane },
  { id: 'insurance', name: 'Vakuutukset', color: '#14b8a6', icon: Umbrella },
  { id: 'hobbies', name: 'Harrastukset', color: '#f43f5e', icon: Dumbbell },
  { id: 'bills', name: 'Laskut', color: '#64748b', icon: Receipt },
  { id: 'muut', name: 'Muut', color: '#6366f1', icon: null },
];

const incomeCategories = [
  { id: 'palkka', name: 'Palkka', color: '#16a34a', icon: null },
  { id: 'sivutulo', name: 'Sivutulo', color: '#22c55e', icon: null },
  { id: 'myynti', name: 'Myynti', color: '#4ade80', icon: null },
  { id: 'muut-tulot', name: 'Muut tulot', color: '#86efac', icon: null },
];

const allCategories = [...incomeCategories, ...expenseCategories];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  palkka: ['palkka', 'salary', 'palkkio', 'korvaus', 'palkkaus', 'wage', 'payroll', 'tulotili', 'tilit', 'palkkatulo', 'palkkaerä'],
  sivutulo: ['sivutulo', 'sivu', 'freelance', 'konsultti', 'vuokratulo', 'vuokra', 'osinko', 'hyvitys', 'korvaus', 'tuki', 'etu', 'palkkio', 'kela', 'asumistuki', 'työmarkkinatuki', 'opintotuki', 'eläke'],
  myynti: ['myynti', 'myy', 'myydy', 'kauppa', 'myyntituotto', 'myyty', 'myyjä', 'kauppapaikka', 'toro', 'huuto', 'fb marketplace', 'tori.fi'],
  ruoka: ['ruoka', 'prisma', 'k-market', 's-market', 'alepa', 'sale', 'lidl', 'stockmann', 'citymarket', 'kärkkäinen', 'food', 'sushi', 'pizza', 'ravintola', 'kahvila', 'kahvi', 'ruokakauppa', 'supermarket', 'market', 'ruokatori', 'hok elanto', 'siwa', 'valintatalo', 'makuuni', 'k-supermarket', 'minimani', 'mestarin herkku', 'anttila', 'foodora', 'wolt', 'kebab', 'burger', 'mcdonalds', 'hesburger', 'subway', 'domino', 'pizza-online', 'kotipizza', 'koti pizza'],
  asuminen: ['asuminen', 'vuokra', 'hoitovastike', 'vastike', 'sähkö', 'vesi', 'lämmitys', 'kiinteistö', 'asunto', 'dna', 'elisa', 'tel', 'nett', 'kiinteistöhuolto', 'isännöinti', 'remontti', 'putki', 'sähkömies', 'taloyhtiö', 'kunnossapito', 'kotivakuutus', 'asuntolaina', 'korko', 'lyhennys', 'yhtiövastike', 'vesimaksu', 'lämmitysöljy', 'ao performance', 'fascia', 'eero karhumäki', 'öhgren', 'kiinteistö', 'huoneistossa'],
  liikenne: ['liikenne', 'bussi', 'juna', 'metro', 'taksi', 'uber', 'bolt', 'polttoaine', 'bensa', 'diesel', 'auto', 'rengas', 'huolto', 'katsastus', 'pysäköinti', 'vr', ' hsl', 'matkakortti', 'neste', 'teboil', 'shell', 'abc', 'huoltoasema', 'moottoripyörä', 'skootteri', 'pysäköinti', 'autopesu'],
  viihde: ['viihde', 'elokuva', 'konsertti', 'teatteri', 'spotify', 'netflix', 'hbo', 'disney', 'youtube', 'peli', 'ravintola', 'baari', 'pub', 'olut', 'viini', 'harrastus', 'keilaus', 'casino', 'bailut', 'yökerho', 'karaoke', 'tapahtuma', 'festivaali', 'musiikki', 'elisa viihde', 'c more'],
  terveys: ['terveys', 'apteekki', 'lääkäri', 'hammas', 'sairaala', 'kela', 'vakuutus', 'terveydenhuolto', 'fysioterapia', 'psykologi', 'optikko', 'mehiläinen', 'terveystalo', 'pihlajalinna', 'lääke', 'resepti', 'työterveys', 'sairaala', 'erikoislääkäri', 'terveyskeskus'],
  vaatteet: ['vaatteet', 'vaate', 'kenkä', 'h&m', 'zalando', 'cubus', 'dressmann', 'gina', 'tokmanni', 'asko', 'ikea', 'sisustus', 'huonekalu', 'muoti', 'vaatekauppa', 'urheilukauppa', 'intersport', 'xxl', 'stadium', 'halonen', 'kappahl', 'lc waikiki', 'gigantti'],
  koulutus: ['koulutus', 'kirja', 'opiskelu', 'kurssi', 'koulu', 'yliopisto', 'kirjasto', 'sanoma', 'tietokirja', 'lukio', 'ammattikoulu', 'opinto', 'luent', 'oppikirja', 'suomen kielen', 'kielikoulu', 'valmennus', 'tutkinto', 'akateeminen'],
  children: ['lapsi', 'lasten', 'päiväkoti', 'koulu', 'kerho', 'vaippa', 'lelu', 'lastenvaunut', 'vauva', 'taaper', 'kummi', 'lastenhoito', 'nuoriso', 'harrastusmaksu', 'urheilukoulu', 'muskari', 'kerhomaksu', 'kerhotoiminta'],
  travel: ['matka', 'lento', 'hotelli', 'juna', 'risteily', 'vuokra-auto', 'lomamatka', 'matkavakuutus', 'bussi', 'rautatie', 'ryanair', 'finnair', 'norwegian', 'booking', 'airbnb', 'hostelli', 'turisti', 'matkalippu', 'viking line', 'tallink', 'silja', 'eckerö', 'wasaline', 'hotels.com'],
  insurance: ['vakuutus', 'vakuutusmaksu', 'if ', 'lähivakuutus', 'pohjola', 'fennia', 'tapiola', 'turva', 'eläkevakuutus', 'henkivakuutus', 'kasko', 'liikennevakuutus', 'kotivakuutus', 'tapaturmavakuutus', 'lähitapiola', 'if vakuutus'],
  hobbies: ['harrastus', 'liikunta', 'kuntosali', 'urheilu', 'golf', 'tennis', 'jalkapallo', 'jääkiekko', 'salibandy', 'uinti', 'hiihto', 'pyöräily', 'kalastus', 'metsästys', 'käsityö', 'tanssi', 'musiikki', 'soitto', 'kuoro', 'partio', 'gym', 'fitness', 'crossfit', 'frisbeegolf'],
  bills: ['lasku', 'maksu', 'suoraveloitus', 'e-lasku', 'laskutus', 'perintä', 'sähkölasku', 'puhelinlasku', 'nettilasku', 'jätehuolto', 'vesilasku', 'kaupungin', 'kunnallisvero', 'jäsenmaksu', 'tilausmaksu', 'käyttömaksu', 'perintätoimisto', 'traficom'],
  muut: ['lahjoitus', 'jäsenmaksu', 'maksu', 'kulu', 'muu', 'pankkikulu', 'kulut', 'nosto', 'siirto', 'palkki', 'provisio', 'varaus'],
};

const SKIP_KEYWORDS = ['oma tilisiirto', 'tilisiirto', 'säästötili', 'säästäjä debit', 'säästäjä', 'luotolta siirto', 'luotto', 'siirto', 'panomaatti', 'käteisnosto'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

function parseAmount(value: string): number | null {
  if (!value) return null;
  const normalized = value
    .replace(/\s+/g, '')
    .replace('€', '')
    .replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function normalizeDate(value: string): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const dmy = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  const dmy2 = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
  if (dmy2) {
    const year = parseInt(dmy2[3], 10);
    const fullYear = year >= 50 ? 1900 + year : 2000 + year;
    return `${fullYear}-${dmy2[2].padStart(2, '0')}-${dmy2[1].padStart(2, '0')}`;
  }
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

function shouldSkip(description: string, message: string, txType: string): boolean {
  const combined = `${description} ${message} ${txType}`.toLowerCase();
  return SKIP_KEYWORDS.some((k) => combined.includes(k));
}

function autoCategorize(
  description: string,
  txType: string,
  message: string,
  amount: number
): { category: string; type: 'income' | 'expense'; confidence: 'high' | 'medium' | 'low'; skip: boolean } {
  if (shouldSkip(description, message, txType)) {
    return { category: 'muut', type: 'expense', confidence: 'high', skip: true };
  }

  const combinedText = `${description} ${message}`.toLowerCase();

  const housingTypes = ['korko', 'lyhennys', 'hoitovastike', 'yhtiövastike', 'asuntolaina', 'laina'];
  if (housingTypes.some((h) => txType.toLowerCase().includes(h) || combinedText.includes(h))) {
    return { category: 'asuminen', type: 'expense', confidence: 'high', skip: false };
  }

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!incomeCategories.some((c) => c.id === cat)) continue;
    if (keywords.some((k) => combinedText.includes(k))) {
      return { category: cat, type: 'income', confidence: 'high', skip: false };
    }
  }

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!expenseCategories.some((c) => c.id === cat)) continue;
    if (keywords.some((k) => combinedText.includes(k))) {
      return { category: cat, type: 'expense', confidence: 'high', skip: false };
    }
  }

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!expenseCategories.some((c) => c.id === cat)) continue;
    for (const kw of keywords) {
      if (kw.length > 3 && combinedText.includes(kw.slice(0, kw.length - 1))) {
        return { category: cat, type: 'expense', confidence: 'medium', skip: false };
      }
    }
  }

  return { category: 'muut', type: amount >= 0 ? 'income' : 'expense', confidence: 'low', skip: false };
}

function cleanMerchantName(value: string): string {
  if (!value || value === 'Viesti puuttuu' || value === '-') return '';
  // Remove leading card/account number and date prefix like "*2832 24.06. "
  const cleaned = value
    .replace(/^(?:\*\d+(?:\s+\d+\.\d+\.)?\s+)?(.+)$/, '$1')
    .replace(/^(?:\d{2}\.\d{2}\.\s+)?(.+)$/, '$1')
    .trim();
  return cleaned.length > 2 ? cleaned : '';
}

interface ColumnMap {
  dateIndex: number;
  amountIndex: number;
  descriptionIndex: number;
  counterpartyIndex: number;
  messageIndex: number;
  typeIndex: number;
}

function detectColumns(headers: string[]): ColumnMap {
  const lower = headers.map((h) => h.toLowerCase());
  const find = (candidates: string[]) => {
    for (const candidate of candidates) {
      const idx = lower.findIndex((h) => h.includes(candidate));
      if (idx >= 0) return idx;
    }
    return -1;
  };
  const dateIndex = find(['kirjauspäivä', 'päivämäärä', 'pvm', 'date', 'arvopäivä']);
  const amountIndex = find(['määrä', 'summa', 'euro', 'amount', 'määrä eur']);
  // Prefer the actual counterparty name column (Nordea: "Saajan/Maksajan nimi")
  const counterpartyIndex = find([
    "saajan/maksajan nimi", "saajan nimi", "maksajan nimi", "vastaanottaja", "hyväksyjä",
    "saaja/maksaja", "saaja", "maksaja", "nimi", "kauppa"
  ]);
  const descriptionIndex = find(['tapahtuma', 'tapahtumalaji', 'kuvaus', 'description', 'type']);
  const messageIndex = find(['viesti', 'viestit', 'message', 'selite', 'tarkenne', 'viitenumero']);
  const typeIndex = find(['laji', 'tapahtumalaji', 'tyyppi']);
  return {
    dateIndex: dateIndex >= 0 ? dateIndex : 0,
    amountIndex: amountIndex >= 0 ? amountIndex : 2,
    descriptionIndex: descriptionIndex >= 0 ? descriptionIndex : 1,
    counterpartyIndex: counterpartyIndex >= 0 ? counterpartyIndex : -1,
    messageIndex: messageIndex >= 0 ? messageIndex : 5,
    typeIndex: typeIndex >= 0 ? typeIndex : 3,
  };
}

function inferDirection(amount: number, txType: string, description: string): number {
  const text = `${txType} ${description}`.toLowerCase();
  const incomeMarkers = ['saapuva', 'talletus', 'hyvitys', 'palautus', 'palkka', 'tulo', 'credit', 'saatu', 'maksettu meille'];
  const expenseMarkers = ['lähtevä', 'maksu', 'osto', 'debit', 'veloitus', 'maksettu', 'tilisiirto'];
  const isIncome = incomeMarkers.some((m) => text.includes(m));
  const isExpense = expenseMarkers.some((m) => text.includes(m));
  if (amount > 0 && isExpense) return -amount;
  if (amount < 0 && isIncome) return -amount;
  return amount;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const delimiter = text.includes('\t') ? '\t' : ';';
  const firstLine = lines[0].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, '').toLowerCase());
  const hasHeader = firstLine.some((cell) =>
    ['päivämäärä', 'kirjauspäivä', 'määrä', 'summa', 'tapahtuma', 'saaja', 'maksaja', 'viesti', 'kuvaus', 'pvm', 'date', 'amount', 'saajan nimi'].some((kw) =>
      cell.includes(kw)
    )
  );
  const columns = hasHeader
    ? detectColumns(firstLine)
    : { dateIndex: 0, amountIndex: 2, descriptionIndex: 1, counterpartyIndex: -1, messageIndex: 5, typeIndex: 3 };
  const dataStart = hasHeader ? 1 : 0;
  const rows: CsvRow[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const parts = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
    const requiredIdx = Math.max(
      columns.dateIndex,
      columns.amountIndex,
      columns.descriptionIndex,
      columns.counterpartyIndex,
      columns.messageIndex
    );
    if (parts.length < requiredIdx + 1) continue;
    const date = normalizeDate(parts[columns.dateIndex]);
    const rawAmount = parseAmount(parts[columns.amountIndex]);
    const txType = parts[columns.typeIndex] || '';
    const eventName = cleanMerchantName(parts[columns.descriptionIndex] || '');
    const counterparty = columns.counterpartyIndex >= 0 ? cleanMerchantName(parts[columns.counterpartyIndex] || '') : '';
    const messageText = cleanMerchantName(parts[columns.messageIndex] || '');
    const description = counterparty || eventName || messageText || cleanMerchantName(parts[1] || '') || '';
    const message = counterparty && messageText ? messageText : eventName || '';
    if (!date || rawAmount === null || !description) continue;
    const amount = inferDirection(rawAmount, txType, description);
    rows.push({ date, description, amount, txType, message, raw: parts });
  }
  return rows;
}

function CategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = allCategories.find((c) => c.id === value);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px] h-8 flex items-center gap-2">
        {selected && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selected.color }} />}
        <span className="truncate">{selected?.name || value}</span>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectGroup>
          <SelectLabel className="text-xs font-semibold text-gray-400 uppercase">Tulot</SelectLabel>
          {incomeCategories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel className="text-xs font-semibold text-gray-400 uppercase">Menot</SelectLabel>
          {expenseCategories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

interface PersonalFinanceProps {
  entries: PersonalEntry[];
  bankAccounts: BankAccount[];
  onAddEntry: (entry: PersonalEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export default function PersonalFinance({
  entries: _entries,
  bankAccounts,
  onAddEntry,
  onDeleteEntry,
}: PersonalFinanceProps) {
  const demoCleared = localStorage.getItem(LS_DEMO_CLEARED) === 'true';
  const currentMonth = monthKey(new Date());
  const initialEntries = demoCleared ? [] : createDemoEntries(currentMonth);
  const [localEntries, setLocalEntries] = useState<PersonalEntry[]>(() =>
    loadFromStorage<PersonalEntry[]>(LS_ENTRIES, initialEntries)
  );
  const [localAccounts, setLocalAccounts] = useState<DemoAccount[]>(() =>
    loadFromStorage<DemoAccount[]>(LS_ACCOUNTS, DEMO_ACCOUNTS)
  );
  const [demoMode, setDemoMode] = useState(false);
  const [csvAccountType, setCsvAccountType] = useState<'checking' | 'salary'>('checking');

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('cash');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [previewRows, setPreviewRows] = useState<ParsedRow[] | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveToStorage(LS_ENTRIES, localEntries); }, [localEntries]);
  useEffect(() => { saveToStorage(LS_ACCOUNTS, localAccounts); }, [localAccounts]);

  const demoEntries = useMemo(() => (demoMode ? createDemoEntries(selectedMonth) : []), [demoMode, selectedMonth]);

  const displayEntries = useMemo(() => {
    return [...localEntries, ...demoEntries];
  }, [localEntries, demoEntries]);

  const filteredEntries = useMemo(() => {
    return displayEntries.filter((e) => e.date.startsWith(selectedMonth));
  }, [displayEntries, selectedMonth]);

  const totals = useMemo(() => {
    const income = filteredEntries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
    const expense = filteredEntries.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    return { income, expense, savings, savingsRate };
  }, [filteredEntries]);

  const totalWealth = useMemo(() => {
    return localAccounts.reduce((sum, a) => sum + a.balance, 0);
  }, [localAccounts]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(now, i));
      const label = format(start, 'MMM', { locale: fi });
      const mk = format(start, 'yyyy-MM');
      const monthEntries = displayEntries.filter((e) => e.date.startsWith(mk));
      const income = monthEntries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
      const expense = monthEntries.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
      months.push({ month: label, income, expense });
    }
    return months;
  }, [displayEntries]);

  const categoryData = (categories: typeof expenseCategories, isIncome: boolean) => {
    const data = categories.map((cat) => {
      const total = filteredEntries
        .filter((e) => (isIncome ? e.amount > 0 : e.amount < 0) && e.category === cat.id)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const max = Math.max(
        ...categories.map((c) =>
          filteredEntries
            .filter((e) => (isIncome ? e.amount > 0 : e.amount < 0) && e.category === c.id)
            .reduce((sum, e) => sum + Math.abs(e.amount), 0)
        ),
        1
      );
      return { ...cat, total, pct: (total / max) * 100 };
    });
    return data;
  };

  const expenseData = categoryData(expenseCategories, false);
  const incomeData = categoryData(incomeCategories, true);

  const selectedCategories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(numAmount) || !category) return;
    const signedAmount = type === 'income' ? Math.abs(numAmount) : -Math.abs(numAmount);
    const entry: PersonalEntry = {
      id: generateId(),
      date,
      description: description.trim(),
      amount: signedAmount,
      category,
      accountId: accountId === 'cash' ? undefined : accountId,
      createdAt: new Date().toISOString(),
    };
    setLocalEntries((prev) => [entry, ...prev]);
    onAddEntry(entry);
    setDescription('');
    setAmount('');
    setCategory('');
  };

  const handleDelete = (id: string) => {
    setLocalEntries((prev) => prev.filter((e) => e.id !== id));
    onDeleteEntry(id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      const rows = parseCsv(text);
      const parsed: ParsedRow[] = rows
        .map((r) => {
          const auto = autoCategorize(r.description, r.txType || '', r.message || '', r.amount);
          return {
            ...r,
            id: generateId(),
            type: auto.skip ? 'expense' : auto.type,
            category: auto.category,
            confidence: auto.confidence,
            selected: !auto.skip,
          };
        })
        .filter((r) => r.selected);
      setPreviewRows(parsed);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleRow = (id: string) => {
    setPreviewRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)) : null));
  };

  const toggleAll = (checked: boolean) => {
    setPreviewRows((prev) => (prev ? prev.map((r) => ({ ...r, selected: checked })) : null));
  };

  const updatePreviewCategory = (id: string, category: string) => {
    setPreviewRows((prev) =>
      prev
        ? prev.map((r) => {
            if (r.id !== id) return r;
            const isIncomeCat = incomeCategories.some((c) => c.id === category);
            return {
              ...r,
              category,
              type: isIncomeCat ? 'income' : 'expense',
            };
          })
        : null
    );
  };

  const savePreview = async () => {
    if (!previewRows) return;
    const selected = previewRows.filter((r) => r.selected);
    const now = new Date().toISOString();
    const accountId = csvAccountType === 'checking' ? 'checking' : 'savings';
    const newEntries: PersonalEntry[] = selected.map((row) => ({
      id: generateId(),
      date: row.date,
      description: row.description,
      amount: row.type === 'income' ? Math.abs(row.amount) : -Math.abs(row.amount),
      category: row.category,
      accountId,
      createdAt: now,
    }));
    setLocalEntries((prev) => [...newEntries, ...prev]);
    for (const entry of newEntries) {
      await onAddEntry(entry);
    }
    setPreviewRows(null);
    setSuccess(`Tallennettu ${selected.length} tapahtumaa`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const toggleDemo = () => {
    setDemoMode((prev) => !prev);
  };

  const clearAllData = () => {
    if (!window.confirm('Tyhjennetäänkö kaikki Oma talous -tiedot?')) return;
    localStorage.setItem(LS_DEMO_CLEARED, 'true');
    setLocalEntries([]);
    setLocalAccounts(DEMO_ACCOUNTS.map((a) => ({ ...a, balance: 0 })));
    setDemoMode(false);
    setSuccess('Kaikki tiedot tyhjennetty');
    setTimeout(() => setSuccess(null), 3000);
  };

  const restoreDemo = () => {
    if (!window.confirm('Palautetaanko demo-data? Omat lisäykset säilyvät.')) return;
    localStorage.removeItem(LS_DEMO_CLEARED);
    const demo = createDemoEntries(selectedMonth);
    setLocalEntries((prev) => [...demo, ...prev]);
    setLocalAccounts(DEMO_ACCOUNTS);
    setDemoMode(true);
    setSuccess('Demo-data palautettu');
    setTimeout(() => setSuccess(null), 3000);
  };

  const previewTotals = useMemo(() => {
    if (!previewRows) return null;
    const selected = previewRows.filter((r) => r.selected);
    const income = selected.filter((r) => r.type === 'income').reduce((sum, r) => sum + Math.abs(r.amount), 0);
    const expense = selected.filter((r) => r.type === 'expense').reduce((sum, r) => sum + Math.abs(r.amount), 0);
    return { income, expense, count: selected.length, total: previewRows.length };
  }, [previewRows]);

  const months = useMemo(() => {
    const now = new Date();
    const list: { value: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      list.push({ value: monthKey(d), label: format(d, 'MMMM yyyy', { locale: fi }) });
    }
    return list;
  }, []);

  const hasData = localEntries.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-md shadow-lg text-sm font-medium">
          {success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Oma talous</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 bg-white border rounded-md px-2 py-1">
            <Label className="text-xs text-gray-500 whitespace-nowrap">CSV-tili</Label>
            <Select value={csvAccountType} onValueChange={(v) => setCsvAccountType(v as 'checking' | 'salary')}>
              <SelectTrigger className="w-[160px] border-0 shadow-none h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Kulutustili</SelectItem>
                <SelectItem value="salary">Palkka-Säästötili</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />

          <Button variant={demoMode ? 'default' : 'outline'} size="sm" onClick={toggleDemo}>
            {demoMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {demoMode ? 'Demo pois' : 'Demo'}
          </Button>

          {hasData ? (
            <Button variant="destructive" size="sm" onClick={clearAllData}>
              <Trash2 className="w-4 h-4 mr-2" /> Tyhjennä
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={restoreDemo}>
              <Eye className="w-4 h-4 mr-2" /> Demo takaisin
            </Button>
          )}
        </div>
      </div>

      {previewRows && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>CSV-esikatselu</span>
              <Button variant="ghost" size="sm" onClick={() => setPreviewRows(null)}><X className="w-4 h-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-gray-600">Tulot: <strong className="text-green-600">{previewTotals?.income.toFixed(2)} €</strong></span>
              <span className="text-gray-600">Menot: <strong className="text-red-600">{previewTotals?.expense.toFixed(2)} €</strong></span>
              <span className="text-gray-600">Valittu: <strong>{previewTotals?.count} / {previewTotals?.total}</strong></span>
            </div>
            <div className="max-h-[400px] overflow-y-auto border rounded-md bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left"><Checkbox checked={previewRows.every((r) => r.selected)} onCheckedChange={(v) => toggleAll(Boolean(v))} /></th>
                    <th className="px-3 py-2 text-left">Päivä</th>
                    <th className="px-3 py-2 text-left">Kuvaus</th>
                    <th className="px-3 py-2 text-left">Luottamus</th>
                    <th className="px-3 py-2 text-right">Summa</th>
                    <th className="px-3 py-2 text-left">Kategoria</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.id} className={row.selected ? '' : 'opacity-50'}>
                      <td className="px-3 py-2"><Checkbox checked={row.selected} onCheckedChange={() => toggleRow(row.id)} /></td>
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2">
                        {row.description}
                        {row.message && <p className="text-xs text-gray-500">{row.message}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={row.confidence === 'high' ? 'default' : row.confidence === 'medium' ? 'secondary' : 'outline'}>
                          {row.confidence === 'high' ? 'Korkea' : row.confidence === 'medium' ? 'Keski' : 'Matala'}
                        </Badge>
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.amount > 0 ? '+' : ''}{row.amount.toFixed(2)} €
                      </td>
                      <td className="px-3 py-2">
                        <CategorySelect value={row.category} onChange={(v) => updatePreviewCategory(row.id, v)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={savePreview} disabled={!previewTotals || previewTotals.count === 0}>
              <Save className="w-4 h-4 mr-2" /> Tallenna {previewTotals?.count || 0} tapahtumaa
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Tulot</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{totals.income.toFixed(2)} €</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Menot</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{totals.expense.toFixed(2)} €</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Netto / Säästöt</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{totals.savings.toFixed(2)} €</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Säästöaste</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-purple-600">{totals.savingsRate.toFixed(1)} %</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {localAccounts.map((acc) => (
          <Card key={acc.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                {acc.type === 'cash' ? <Coins className="w-4 h-4" /> : <Landmark className="w-4 h-4" />} {acc.name}
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-xl font-bold text-gray-900">{acc.balance.toFixed(2)} €</p></CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2"><Wallet className="w-4 h-4" /> Varallisuus yht.</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold text-blue-600">{totalWealth.toFixed(2)} €</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Tulot vs. Menot</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
              <Legend />
              <Bar dataKey="income" name="Tulot" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Menot" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Menokategoriat</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {expenseData.map((cat) => (
              <div key={cat.id}>
                <div className="flex justify-between text-sm mb-1"><span>{cat.name}</span><span className="font-medium">{cat.total.toFixed(2)} €</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Tulokategoriat</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {incomeData.map((cat) => (
              <div key={cat.id}>
                <div className="flex justify-between text-sm mb-1"><span>{cat.name}</span><span className="font-medium">{cat.total.toFixed(2)} €</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Uusi tapahtuma</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tyyppi</Label>
                <Select value={type} onValueChange={(v) => { setType(v as 'income' | 'expense'); setCategory(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Tulo</SelectItem>
                    <SelectItem value="expense">Meno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="pf-date">Päivämäärä</Label><Input id="pf-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="pf-desc">Kuvaus</Label><Input id="pf-desc" placeholder="Esimerkiksi ruokaostokset" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="pf-amount">Summa</Label><Input id="pf-amount" type="number" step="0.01" placeholder="45,50" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Kategoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Valitse kategoria" /></SelectTrigger>
                  <SelectContent>
                    {selectedCategories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tili</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Käteiskassa</SelectItem>
                    {bankAccounts.map((acc) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    {localAccounts.filter((a) => a.type !== 'cash').map((acc) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={!description.trim() || !amount || !category}>Tallenna</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="text-lg">Viimeisimmät tapahtumat</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredEntries.length === 0 && <p className="text-gray-500 text-sm">Ei tapahtumia valitulta kuukaudelta.</p>}
              {filteredEntries.slice(0, 50).map((entry) => {
                const cat = allCategories.find((c) => c.id === entry.category);
                const isDemo = entry.id.startsWith('demo-');
                return (
                  <div key={entry.id} className={`flex items-center justify-between p-3 rounded-md ${isDemo ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-medium text-gray-900">{entry.description} {isDemo && <span className="text-xs text-blue-600 font-normal">(demo)</span>}</p>
                      <p className="text-xs text-gray-500">{format(parseISO(entry.date), 'dd.MM.yyyy', { locale: fi })} • {cat?.name || entry.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(2)} €</span>
                      {!isDemo && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} aria-label="Poista tapahtuma"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
