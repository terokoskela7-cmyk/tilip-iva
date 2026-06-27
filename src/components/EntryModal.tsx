import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Save, Paperclip, X, ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { uploadAttachment, deleteAttachment } from '@/lib/storage';
import type { Entry, EntryLine, Account, Attachment } from '@/types';

interface EntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Entry) => void;
  editingEntry: Entry | null;
  accounts: Account[];
  existingEntries: Entry[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function getNextEntryNumber(entries: Entry[]): string {
  if (entries.length === 0) return '1';
  const nums = entries.map((e) => parseInt(e.number, 10)).filter((n) => !isNaN(n));
  return (Math.max(...nums, 0) + 1).toString();
}

export default function EntryModal({ open, onOpenChange, onSave, editingEntry, accounts, existingEntries }: EntryModalProps) {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [number, setNumber] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<EntryLine[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date);
      setNumber(editingEntry.number);
      setDescription(editingEntry.description);
      setLines(editingEntry.lines.map((l) => ({ ...l })));
      setAttachments(editingEntry.attachments ? [...editingEntry.attachments] : []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setNumber(getNextEntryNumber(existingEntries));
      setDescription('');
      setLines([createEmptyLine(), createEmptyLine()]);
      setAttachments([]);
    }
    setErrors([]);
  }, [editingEntry, open, existingEntries]);

  function createEmptyLine(): EntryLine {
    return { id: generateId(), accountId: '', accountNumber: '', accountName: '', debit: 0, credit: 0, description: '' };
  }

  function addLine() {
    setLines((prev) => [...prev, createEmptyLine()]);
  }

  function removeLine(index: number) {
    setLines((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function updateLine(index: number, field: keyof EntryLine, value: string | number) {
    const newLines = [...lines];
    if (field === 'accountId') {
      const acc = accounts.find((a) => a.id === value);
      newLines[index] = {
        ...newLines[index],
        accountId: value as string,
        accountNumber: acc?.number || '',
        accountName: acc?.name || '',
      };
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    setLines(newLines);
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert(`Tiedosto ${file.name} on liian suuri (max 5 MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        const newAttachment: Attachment = {
          id: generateId(),
          name: file.name,
          type: file.type,
          data,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }, []);

  async function removeAttachment(id: string) {
    const att = attachments.find((a) => a.id === id);
    if (att?.path) {
      try {
        await deleteAttachment(att.path);
      } catch (e) {
        console.error('Failed to delete attachment from storage:', e);
      }
    }
    setAttachments(attachments.filter((a) => a.id !== id));
  }

  function validate(): boolean {
    const errs: string[] = [];
    if (!date) errs.push('Päivämäärä puuttuu');
    if (!number) errs.push('Tositenumero puuttuu');
    if (lines.length < 2) errs.push('Vähintään 2 riviä vaaditaan');
    const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      errs.push(`Debet (${totalDebit.toFixed(2)}) ja Kredit (${totalCredit.toFixed(2)}) eivät täsmää`);
    }
    const hasAccount = lines.some((l) => l.accountId);
    if (!hasAccount) errs.push('Valitse vähintään yksi tili');
    setErrors(errs);
    return errs.length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    if (!user) {
      setErrors(['Käyttäjä ei ole kirjautunut']);
      return;
    }

    setUploading(true);
    try {
      const entryId = editingEntry?.id || generateId();

      // Upload new attachments (those with data but no path)
      const uploadedAttachments: Attachment[] = [];
      for (const att of attachments) {
        if (att.data && !att.path) {
          const { path, url } = await uploadAttachment(entryId, att.id, att.name, att.data);
          uploadedAttachments.push({
            id: att.id,
            name: att.name,
            type: att.type,
            size: att.size,
            path,
            url,
            uploadedAt: att.uploadedAt,
          });
        } else {
          uploadedAttachments.push(att);
        }
      }

      const entry: Entry = {
        id: entryId,
        date,
        number,
        description,
        lines: lines.filter((l) => l.accountId),
        attachments: uploadedAttachments,
        status: editingEntry?.status || 'confirmed',
        createdAt: editingEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSave(entry);
      onOpenChange(false);
    } catch (e) {
      console.error('Upload error:', e);
      setErrors(['Liitteiden tallennus epäonnistui. Yritä uudelleen.']);
    } finally {
      setUploading(false);
    }
  }

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full lg:max-w-3xl lg:h-auto lg:max-h-[90vh] overflow-y-auto p-4 lg:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingEntry ? 'Muokkaa tositetta' : 'Uusi tosite'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-1">
              {errors.map((err, i) => (
                <p key={i} className="text-red-600 text-sm">{err}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entry-date">Päivämäärä</Label>
              <Input id="entry-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="entry-number">Tositenumero</Label>
              <Input id="entry-number" value={number} onChange={(e) => setNumber(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="entry-status">Tila</Label>
              <div className="mt-1 px-3 py-2 border rounded-md bg-gray-50 text-sm text-gray-600">
                {editingEntry ? (editingEntry.status === 'confirmed' ? 'Kirjattu' : 'Luonnos') : 'Uusi'}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="entry-desc">Kuvaus</Label>
            <Textarea id="entry-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tositteen yleiskuvaus" className="mt-1" rows={2} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Kirjausrivit</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="w-4 h-4 mr-1" /> Lisää rivi
              </Button>
            </div>

            <div className="border rounded-md divide-y divide-gray-200">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <div className="col-span-4">Tili</div>
                <div className="col-span-2">Debet</div>
                <div className="col-span-2">Kredit</div>
                <div className="col-span-3">Selite</div>
                <div className="col-span-1"></div>
              </div>

              {lines.map((line, index) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                  <div className="col-span-4">
                    <Select value={line.accountId} onValueChange={(v) => updateLine(index, 'accountId', v)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Valitse tili" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.sort((a, b) => a.number.localeCompare(b.number)).map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.number} - {acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="0.01" min="0" value={line.debit || ''} onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)} className="text-sm" placeholder="0,00" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="0.01" min="0" value={line.credit || ''} onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)} className="text-sm" placeholder="0,00" />
                  </div>
                  <div className="col-span-3">
                    <Input type="text" value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} className="text-sm" placeholder="Selite" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => { if (lines.length > 2) removeLine(index); }}
                      disabled={lines.length <= 2}
                      className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                        lines.length <= 2
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-500 hover:bg-red-50 hover:text-red-700 active:bg-red-100'
                      }`}
                      aria-label="Poista rivi"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-md mt-1">
              <span className="text-sm font-medium">Yhteensä:</span>
              <div className="flex gap-6 text-sm">
                <span className={balanced ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  Debet: {totalDebit.toFixed(2)} €
                </span>
                <span className={balanced ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  Kredit: {totalCredit.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <Label>Liitteet ({attachments.length})</Label>
            <div className="mt-1 space-y-2">
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="relative group border rounded-md p-2 bg-gray-50">
                      {att.type.startsWith('image/') ? (
                        <div>
                          <img src={att.url || att.data} alt={att.name} className="w-full h-20 object-cover rounded" />
                          <p className="text-xs text-gray-600 truncate mt-1">{att.name}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <a
                            href={att.url || att.data}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline truncate"
                            title={att.name}
                          >
                            {att.name}
                          </a>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:bg-red-600"
                        title="Poista liite"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*,.pdf" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
                <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <ImageIcon className="w-4 h-4" /> Lisää kuva tai PDF
                </Label>
                <span className="text-xs text-gray-400">Max 5 MB tiedosto</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Peruuta</Button>
          <Button onClick={handleSave} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Tallennetaan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Tallenna
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
