import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Repeat, Plus, Play, Trash2, Pencil } from 'lucide-react';
import type { RecurringEntry, Entry, EntryLine, Account } from '@/types';
import { getAllRecurringEntries, saveRecurringEntry, deleteRecurringEntry } from '@/lib/db';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

interface RecurringEntriesProps {
  accounts: Account[];
  onGenerateEntry: (entry: Entry) => void;
}

export default function RecurringEntries({ accounts, onGenerateEntry }: RecurringEntriesProps) {
  const [recurring, setRecurring] = useState<RecurringEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringEntry | null>(null);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<EntryLine[]>([]);

  useEffect(() => {
    loadRecurring();
  }, []);

  async function loadRecurring() {
    const items = await getAllRecurringEntries();
    setRecurring(items.filter((i) => i.isActive !== false));
  }

  function openNew() {
    setEditing(null);
    setName('');
    setFrequency('monthly');
    setDescription('');
    setLines([createEmptyLine(), createEmptyLine()]);
    setModalOpen(true);
  }

  function openEdit(item: RecurringEntry) {
    setEditing(item);
    setName(item.name);
    setFrequency(item.frequency);
    setDescription(item.description);
    setLines(item.lines.map((l) => ({ ...l })));
    setModalOpen(true);
  }

  function createEmptyLine(): EntryLine {
    return { id: generateId(), accountId: '', accountNumber: '', accountName: '', debit: 0, credit: 0, description: '' };
  }

  function addLine() {
    setLines([...lines, createEmptyLine()]);
  }

  function removeLine(index: number) {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof EntryLine, value: string | number) {
    const newLines = [...lines];
    if (field === 'accountId') {
      const acc = accounts.find((a) => a.id === value);
      newLines[index] = { ...newLines[index], accountId: value as string, accountNumber: acc?.number || '', accountName: acc?.name || '' };
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    setLines(newLines);
  }

  async function handleSave() {
    const item: RecurringEntry = {
      id: editing?.id || generateId(),
      name,
      frequency,
      startDate: editing?.startDate || new Date().toISOString().split('T')[0],
      endDate: editing?.endDate,
      lastGenerated: editing?.lastGenerated,
      description,
      lines: lines.filter((l) => l.accountId),
      isActive: true,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    await saveRecurringEntry(item);
    await loadRecurring();
    setModalOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Poista toistuva kirjaus?')) return;
    await deleteRecurringEntry(id);
    await loadRecurring();
  }

  function handleGenerate(item: RecurringEntry) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const entry: Entry = {
      id: generateId(),
      date,
      number: '',
      description: item.description,
      lines: item.lines.map((l) => ({ ...l, id: generateId() })),
      attachments: [],
      status: 'confirmed',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    onGenerateEntry(entry);
  }

  const freqLabels: Record<string, string> = { monthly: 'Kuukausittain', quarterly: 'Neljännesvuosittain', yearly: 'Vuosittain' };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Repeat className="w-5 h-5" /> Toistuvat kirjaukset
            </h2>
            <p className="text-sm text-gray-500 mt-1">Automaattiset viennit kuukausittain, neljännesvuosittain tai vuosittain.</p>
          </div>
          <Button onClick={openNew} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> Uusi pohja
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {recurring.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Repeat className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">Ei toistuvia kirjauksia</p>
            <p className="text-sm">Luo pohja automaattisille vienneille.</p>
            <Button onClick={openNew} variant="outline" className="mt-3">
              <Plus className="w-4 h-4 mr-1" /> Luo ensimmäinen
            </Button>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-3">
          {recurring.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <Badge variant="outline" className="text-xs">{freqLabels[item.frequency]}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    <div className="mt-2 space-y-1">
                      {item.lines.map((l) => (
                        <div key={l.id} className="text-xs text-gray-600 flex gap-2">
                          <span className="font-mono">{l.accountNumber}</span>
                          <span>{l.accountName}</span>
                          {l.debit > 0 && <span className="text-red-600">D: {l.debit.toFixed(2)} €</span>}
                          {l.credit > 0 && <span className="text-green-600">K: {l.credit.toFixed(2)} €</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => handleGenerate(item)} title="Luo tosite" aria-label="Luo tosite">
                      <Play className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} title="Muokkaa" aria-label="Muokkaa toistuvaa tositetta">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} title="Poista" aria-label="Poista toistuva tosite">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Muokkaa toistuvaa kirjausta' : 'Uusi toistuva kirjaus'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nimi</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="esim. Yhtiövastike" />
              </div>
              <div>
                <Label>Toistuvuus</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'monthly' | 'quarterly' | 'yearly')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Kuukausittain</SelectItem>
                    <SelectItem value="quarterly">Neljännesvuosittain</SelectItem>
                    <SelectItem value="yearly">Vuosittain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Kuvaus</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tositteen kuvaus" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-xs">Kirjausrivit</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="w-3 h-3 mr-1" /> Lisää</Button>
              </div>
              <div className="space-y-1">
                {lines.map((line, idx) => (
                  <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Select value={line.accountId} onValueChange={(v) => updateLine(idx, 'accountId', v)}>
                        <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Tili" /></SelectTrigger>
                        <SelectContent>
                          {accounts.sort((a, b) => a.number.localeCompare(b.number)).map((a) => (
                            <SelectItem key={a.id} value={a.id} className="text-xs">{a.number} {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Input type="number" className="text-xs h-8" placeholder="Debet" value={line.debit || ''} onChange={(e) => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)} /></div>
                    <div className="col-span-2"><Input type="number" className="text-xs h-8" placeholder="Kredit" value={line.credit || ''} onChange={(e) => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)} /></div>
                    <div className="col-span-2"><Input type="text" className="text-xs h-8" placeholder="Selite" value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} /></div>
                    <div className="col-span-1"><Button variant="ghost" size="sm" onClick={() => removeLine(idx)} disabled={lines.length <= 2} className="text-red-500 h-8 w-8 p-0" aria-label="Poista rivi"><Trash2 className="w-3 h-3" /></Button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Peruuta</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Tallenna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
