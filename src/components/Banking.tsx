import { useState, useEffect, useCallback, useMemo } from 'react';
import { Landmark, Upload, Plus, Trash2, Check, X, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  getAllBankAccounts,
  saveBankAccount,
  deleteBankAccount,
  getAllTransactions,
  saveTransaction,
  deleteTransaction,
  saveEntry,
  getAllEntries,
} from '@/lib/firestore';
import type { BankAccount, BankTransaction, BankCSVFormat, Account, Entry, EntryLine } from '@/types';

interface BankingProps {
  accounts: Account[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function parseAmount(value: string): number {
  if (!value) return 0;
  // Handle Finnish/European formats: "1 234,56" or "1234,56" or "1,234.56"
  const normalized = value
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(normalized) || 0;
}

function parseDate(value: string): string {
  if (!value) return '';
  // Try DD.MM.YYYY
  const parts = value.trim().split('.');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  // Try MM/DD/YYYY or DD/MM/YYYY - assume DD/MM/YYYY for European
  const slashParts = value.trim().split('/');
  if (slashParts.length === 3) {
    const [a, b, y] = slashParts;
    if (parseInt(a, 10) > 12) {
      return `${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
    }
    return `${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
  }
  return value.trim();
}

function cleanValue(value: string): string {
  return value?.replace(/^["']|["']$/g, '').trim() || '';
}

function parseCSV(csv: string, format: BankCSVFormat, accountId: string): BankTransaction[] {
  const lines = csv.split('\n').filter((l) => l.trim());
  const txs: BankTransaction[] = [];

  for (const line of lines.slice(1)) {
    let cols: string[] = [];
    if (format === 'nordea' || format === 'handelsbanken') {
      cols = line.split(';').map(cleanValue);
    } else {
      cols = line.split(',').map(cleanValue);
    }
    if (cols.length < 3) continue;

    let date = '';
    let amount = 0;
    let description = '';
    let counterparty = '';
    let reference = '';

    try {
      if (format === 'nordea') {
        // Kirjauspäivä;Määrä;Laji;Selitys;Saaja/Maksaja;Viite;Viesti
        date = parseDate(cols[0]);
        amount = parseAmount(cols[1]);
        description = [cols[3], cols[6]].filter(Boolean).join(' ');
        counterparty = cols[4] || '';
        reference = cols[5] || '';
      } else if (format === 'op') {
        // Kirjauspäivä,Arvopäivä,Määrä,Tapahtumalaji,Selitys,Saaja/Maksaja,Viite
        date = parseDate(cols[0]);
        amount = parseAmount(cols[2]);
        description = [cols[3], cols[4]].filter(Boolean).join(' ');
        counterparty = cols[5] || '';
        reference = cols[6] || '';
      } else if (format === 'danske') {
        // Date,Amount,Currency,Description,Counterparty,Reference
        date = parseDate(cols[0]);
        amount = parseAmount(cols[1]);
        description = cols[3] || '';
        counterparty = cols[4] || '';
        reference = cols[5] || '';
      } else if (format === 'handelsbanken') {
        // Transaktionsdatum;Belopp;Valuta;Text;Mottagare/Betalmottagare;Referens
        date = parseDate(cols[0]);
        amount = parseAmount(cols[1]);
        description = cols[3] || '';
        counterparty = cols[4] || '';
        reference = cols[5] || '';
      } else {
        // generic: Date,Amount,Description,Reference,Counterparty
        date = parseDate(cols[0]);
        amount = parseAmount(cols[1]);
        description = cols[2] || '';
        reference = cols[3] || '';
        counterparty = cols[4] || '';
      }
    } catch {
      continue;
    }

    if (!date || amount === 0) continue;

    txs.push({
      id: generateId(),
      accountId,
      date,
      amount,
      description,
      reference,
      counterparty,
      status: 'unmatched',
      importedAt: new Date().toISOString(),
    });
  }

  return txs;
}

function suggestMatch(tx: BankTransaction, accounts: Account[], entries: Entry[]): Account | null {
  // 1. Match by reference in existing entries
  if (tx.reference) {
    const byRef = entries.find((e) =>
      e.lines.some((l) => l.description.includes(tx.reference) || l.description.includes(tx.description))
    );
    if (byRef) {
      const acc = accounts.find((a) => a.id === byRef.lines[0]?.accountId);
      if (acc) return acc;
    }
  }

  // 2. Match by amount and date (±3 days)
  const txAmount = Math.abs(tx.amount);
  const byAmount = entries.find((e) => {
    const entryAmount = Math.abs(e.lines.reduce((s, l) => s + l.debit - l.credit, 0));
    const dateDiff = Math.abs(new Date(e.date).getTime() - new Date(tx.date).getTime());
    return Math.abs(entryAmount - txAmount) < 0.01 && dateDiff <= 3 * 86400000;
  });
  if (byAmount) {
    const acc = accounts.find((a) => a.id === byAmount.lines[0]?.accountId);
    if (acc) return acc;
  }

  // 3. Keyword rules by account number
  const desc = tx.description.toUpperCase();
  const keywordMap: Record<string, string> = {
    YHTIÖVASTIKE: '4200',
    VUOKRA: '4200',
    PALKKA: '4300',
    PALKAT: '4300',
    MARKKINOINTI: '4700',
    MAINONTA: '4700',
    TOIMISTO: '4600',
    TARVIKE: '4000',
    OHJELMISTO: '4100',
    LASKU: '2800',
    MYYNNI: '3000',
    PALVELU: '3200',
  };
  for (const [keyword, number] of Object.entries(keywordMap)) {
    if (desc.includes(keyword)) {
      const acc = accounts.find((a) => a.number === number);
      if (acc) return acc;
    }
  }

  return null;
}

export default function Banking({ accounts }: BankingProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [csvText, setCsvText] = useState('');
  const [csvFormat, setCsvFormat] = useState<BankCSVFormat>('nordea');
  const [isDragging, setIsDragging] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New account form
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountIban, setNewAccountIban] = useState('');
  const [newAccountBank, setNewAccountBank] = useState('Nordea');
  const [newAccountCurrency, setNewAccountCurrency] = useState('EUR');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accs, txs, ents] = await Promise.all([getAllBankAccounts(), getAllTransactions(), getAllEntries()]);
      setBankAccounts(accs);
      setTransactions(txs);
      setEntries(ents);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }
    } catch (e) {
      console.error(e);
      setError('Tietojen lataaminen epäonnistui');
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.accountId === selectedAccountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccountId]);

  const selectedAccount = bankAccounts.find((a) => a.id === selectedAccountId);

  const balance = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, selectedAccount?.initialBalance || 0);
  }, [filteredTransactions, selectedAccount]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = () => setCsvText(reader.result as string);
      reader.readAsText(file);
    } else {
      setError('Vain CSV-tiedostot ovat tuettuja');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCsvText(reader.result as string);
      reader.readAsText(file);
    }
  }, []);

  async function handleImport() {
    if (!csvText.trim() || !selectedAccountId) return;
    setError(null);
    setSuccess(null);
    try {
      const txs = parseCSV(csvText, csvFormat, selectedAccountId);
      if (txs.length === 0) {
        setError('CSV:stä ei löytynyt tapahtumia. Tarkista formaatti.');
        return;
      }
      for (const tx of txs) {
        await saveTransaction(tx);
      }
      setCsvText('');
      setSuccess(`Tuotu ${txs.length} tapahtumaa`);
      await loadData();
    } catch (e) {
      console.error(e);
      setError('Tuonti epäonnistui');
    }
  }

  async function handleAddAccount() {
    if (!newAccountName.trim() || !newAccountIban.trim()) {
      setError('Tilin nimi ja IBAN ovat pakollisia');
      return;
    }
    const account: BankAccount = {
      id: generateId(),
      name: newAccountName.trim(),
      iban: newAccountIban.trim(),
      bank: newAccountBank,
      currency: newAccountCurrency,
      initialBalance: parseFloat(newAccountBalance) || 0,
      createdAt: new Date().toISOString(),
    };
    await saveBankAccount(account);
    setBankAccounts((prev) => [...prev, account]);
    setSelectedAccountId(account.id);
    setShowAccountDialog(false);
    setNewAccountName('');
    setNewAccountIban('');
    setNewAccountBalance('');
  }

  async function handleDeleteAccount(id: string) {
    if (!confirm('Poista tili ja kaikki sen tapahtumat?')) return;
    await deleteBankAccount(id);
    const txsToDelete = transactions.filter((t) => t.accountId === id);
    for (const tx of txsToDelete) {
      await deleteTransaction(tx.id);
    }
    setBankAccounts((prev) => prev.filter((a) => a.id !== id));
    setTransactions((prev) => prev.filter((t) => t.accountId !== id));
    if (selectedAccountId === id) {
      setSelectedAccountId(bankAccounts.find((a) => a.id !== id)?.id || '');
    }
  }

  async function handleMatch(tx: BankTransaction, account: Account) {
    setError(null);
    try {
      const entryId = generateId();
      const now = new Date().toISOString();
      const lines: EntryLine[] = [
        {
          id: generateId(),
          accountId: account.id,
          accountNumber: account.number,
          accountName: account.name,
          debit: tx.amount > 0 ? Math.abs(tx.amount) : 0,
          credit: tx.amount < 0 ? Math.abs(tx.amount) : 0,
          description: tx.description,
        },
        {
          id: generateId(),
          accountId: selectedAccountId,
          accountNumber: '1940',
          accountName: 'Pankkisaamiset',
          debit: tx.amount < 0 ? Math.abs(tx.amount) : 0,
          credit: tx.amount > 0 ? Math.abs(tx.amount) : 0,
          description: tx.description,
        },
      ];
      const entry: Entry = {
        id: entryId,
        date: tx.date,
        number: String(transactions.length + 1),
        description: `${tx.description}${tx.reference ? ` (viite: ${tx.reference})` : ''}`,
        lines,
        status: 'confirmed',
        attachments: [],
        createdAt: now,
        updatedAt: now,
      };
      await saveEntry(entry);
      const updated: BankTransaction = {
        ...tx,
        status: 'matched',
        matchedEntryId: entryId,
        matchedAccountId: account.id,
      };
      await saveTransaction(updated);
      setSuccess('Täsmäytys tallennettu');
      await loadData();
    } catch (e) {
      console.error(e);
      setError('Täsmäytys epäonnistui');
    }
  }

  async function handleIgnore(tx: BankTransaction) {
    const updated: BankTransaction = { ...tx, status: 'ignored' };
    await saveTransaction(updated);
    await loadData();
  }

  function getStatusColor(status: BankTransaction['status']) {
    switch (status) {
      case 'matched': return 'bg-green-100 border-green-300';
      case 'ignored': return 'bg-gray-100 border-gray-300';
      default: return 'bg-yellow-50 border-yellow-200';
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Landmark className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Pankki</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Valitse tili" />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} ({a.iban})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowAccountDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Lisää tili
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Left: accounts and import */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tilit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bankAccounts.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAccountId(a.id)}
                  className={`p-3 rounded-md cursor-pointer border ${
                    selectedAccountId === a.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{a.name}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteAccount(a.id); }}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{a.iban}</p>
                </div>
              ))}
              {bankAccounts.length === 0 && (
                <p className="text-sm text-gray-500">Ei tilejä. Lisää tili ensin.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tuo CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={csvFormat} onValueChange={(v) => setCsvFormat(v as BankCSVFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nordea">Nordea</SelectItem>
                  <SelectItem value="op">OP</SelectItem>
                  <SelectItem value="danske">Danske</SelectItem>
                  <SelectItem value="handelsbanken">Handelsbanken</SelectItem>
                  <SelectItem value="generic">Yleinen</SelectItem>
                </SelectContent>
              </Select>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-2">Raahaa CSV tähän tai</p>
                <Input type="file" accept=".csv,text/csv" onChange={handleFileSelect} className="text-xs" />
              </div>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Liitä CSV-sisältö tähän..."
                className="w-full h-24 p-2 text-xs border rounded-md"
              />

              <Button onClick={handleImport} disabled={!csvText.trim() || !selectedAccountId} className="w-full">
                Tuo tapahtumat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: transactions */}
        <div className="lg:col-span-3 overflow-y-auto">
          <Card className="h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Tapahtumat</CardTitle>
              <div className="text-sm font-medium">
                Saldo: {balance.toFixed(2)} €
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                  <p>Ei tapahtumia valitulla tilillä.</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const suggested = tx.status === 'unmatched' ? suggestMatch(tx, accounts, entries) : null;
                  const matchedAccount = tx.matchedAccountId ? accounts.find((a) => a.id === tx.matchedAccountId) : null;

                  return (
                    <div
                      key={tx.id}
                      className={`border rounded-md p-3 ${getStatusColor(tx.status)}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium w-24">{new Date(tx.date).toLocaleDateString('fi-FI')}</span>
                          <span className={`text-sm font-bold w-24 ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {tx.amount.toFixed(2)} €
                          </span>
                          <div>
                            <p className="text-sm font-medium">{tx.description}</p>
                            {tx.counterparty && <p className="text-xs text-gray-500">{tx.counterparty}</p>}
                            {tx.reference && <p className="text-xs text-gray-500">Viite: {tx.reference}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {tx.status === 'matched' && matchedAccount && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <Check className="w-3 h-3 mr-1" /> {matchedAccount.number} {matchedAccount.name}
                            </Badge>
                          )}
                          {tx.status === 'ignored' && (
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Hylätty</Badge>
                          )}
                        </div>
                      </div>

                      {tx.status === 'unmatched' && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {suggested ? (
                            <>
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                <AlertCircle className="w-3 h-3 mr-1" /> Ehdotus: {suggested.number} {suggested.name}
                              </Badge>
                              <Button size="sm" variant="outline" onClick={() => handleMatch(tx, suggested)}>
                                <Check className="w-3.5 h-3.5 mr-1" /> Hyväksy
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">Ei ehdotusta</span>
                          )}
                          <Select
                            value=""
                            onValueChange={(v) => {
                              const acc = accounts.find((a) => a.id === v);
                              if (acc) handleMatch(tx, acc);
                            }}
                          >
                            <SelectTrigger className="w-48 h-8 text-xs">
                              <SelectValue placeholder="Valitse toinen tili" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.sort((a, b) => a.number.localeCompare(b.number)).map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>{acc.number} - {acc.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={() => handleIgnore(tx)}>
                            <X className="w-3.5 h-3.5 mr-1" /> Hylkää
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add account dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lisää pankkitili</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Tilin nimi</Label>
              <Input value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="Nordea Yritystili" />
            </div>
            <div>
              <Label>IBAN</Label>
              <Input value={newAccountIban} onChange={(e) => setNewAccountIban(e.target.value)} placeholder="FI1234567890123456" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pankki</Label>
                <Select value={newAccountBank} onValueChange={setNewAccountBank}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nordea">Nordea</SelectItem>
                    <SelectItem value="OP">OP</SelectItem>
                    <SelectItem value="Danske">Danske</SelectItem>
                    <SelectItem value="Handelsbanken">Handelsbanken</SelectItem>
                    <SelectItem value="Muu">Muu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valuutta</Label>
                <Input value={newAccountCurrency} onChange={(e) => setNewAccountCurrency(e.target.value)} placeholder="EUR" />
              </div>
            </div>
            <div>
              <Label>Alkusaldo</Label>
              <Input type="number" step="0.01" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccountDialog(false)}>Peruuta</Button>
            <Button onClick={handleAddAccount}>Tallenna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
