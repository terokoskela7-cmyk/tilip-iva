import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Plus, Trash2, Send, CheckCircle, Users, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, InvoiceLine, Customer, Entry, Account } from '@/types';
import { getAllInvoices, saveInvoice, deleteInvoice, getAllCustomers, saveCustomer, deleteCustomer } from '@/lib/db';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

interface InvoicingProps {
  companyName: string;
  companyYTunnus: string;
  companyAddress: string;
  accounts: Account[];
  onCreateEntry: (entry: Entry) => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Luonnos', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Lähetetty', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Maksettu', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Erääntynyt', color: 'bg-red-100 text-red-700' },
};

export default function Invoicing({ companyName, companyYTunnus, companyAddress, accounts, onCreateEntry }: InvoicingProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [view, setView] = useState<'invoices' | 'customers'>('invoices');
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);

  // Invoice form
  const [invCustomerId, setInvCustomerId] = useState('');
  const [invDate, setInvDate] = useState('');
  const [invDue, setInvDue] = useState('');
  const [invNotes, setInvNotes] = useState('');
  const [invLines, setInvLines] = useState<InvoiceLine[]>([]);

  // Customer form
  const [custName, setCustName] = useState('');
  const [custYTunnus, setCustYTunnus] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custPostal, setCustPostal] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custTerm, setCustTerm] = useState(14);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [inv, cust] = await Promise.all([getAllInvoices(), getAllCustomers()]);
    setInvoices(inv);
    setCustomers(cust);
  }

  function openInvoiceModal() {
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    setInvCustomerId(customers[0]?.id || '');
    setInvDate(today);
    setInvDue(due);
    setInvNotes('');
    setInvLines([{ id: generateId(), description: '', quantity: 1, unit: 'kpl', unitPrice: 0, vatRate: 25.5, total: 0 }]);
    setInvoiceModal(true);
  }

  function openCustomerModal() {
    setCustName(''); setCustYTunnus(''); setCustAddress(''); setCustPostal(''); setCustCity(''); setCustEmail(''); setCustPhone(''); setCustTerm(14);
    setCustomerModal(true);
  }

  function updateInvLine(index: number, field: keyof InvoiceLine, value: string | number) {
    const newLines = [...invLines];
    newLines[index] = { ...newLines[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      newLines[index].total = newLines[index].quantity * newLines[index].unitPrice;
    }
    setInvLines(newLines);
  }

  function addInvLine() {
    setInvLines([...invLines, { id: generateId(), description: '', quantity: 1, unit: 'kpl', unitPrice: 0, vatRate: 25.5, total: 0 }]);
  }

  function removeInvLine(index: number) {
    if (invLines.length <= 1) return;
    setInvLines(invLines.filter((_, i) => i !== index));
  }

  const calcTotals = useCallback(() => {
    const totalExcl = invLines.reduce((s, l) => s + l.total, 0);
    const totalVat = invLines.reduce((s, l) => s + l.total * (l.vatRate / 100), 0);
    return { totalExcl, totalVat, totalIncl: totalExcl + totalVat };
  }, [invLines]);

  async function saveInvoiceData() {
    const customer = customers.find((c) => c.id === invCustomerId);
    if (!customer) return;
    const { totalExcl, totalVat, totalIncl } = calcTotals();
    const invoice: Invoice = {
      id: generateId(),
      number: `L${Date.now().toString().slice(-6)}`,
      date: invDate,
      dueDate: invDue,
      customerId: customer.id,
      customerName: customer.name,
      customerAddress: customer.address,
      customerPostalCode: customer.postalCode,
      customerCity: customer.city,
      customerYTunnus: customer.yTunnus,
      lines: invLines,
      totalExclVat: totalExcl,
      totalVat,
      totalInclVat: totalIncl,
      status: 'draft',
      notes: invNotes,
      createdAt: new Date().toISOString(),
    };
    await saveInvoice(invoice);
    await loadData();
    setInvoiceModal(false);
  }

  async function saveCustomerData() {
    const customer: Customer = {
      id: generateId(),
      name: custName,
      yTunnus: custYTunnus || undefined,
      address: custAddress,
      postalCode: custPostal,
      city: custCity,
      email: custEmail || undefined,
      phone: custPhone || undefined,
      paymentTerm: custTerm,
    };
    await saveCustomer(customer);
    await loadData();
    setCustomerModal(false);
  }

  async function markSent(id: string) {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    await saveInvoice({ ...inv, status: 'sent' });
    await loadData();
  }

  async function markPaid(id: string) {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    await saveInvoice({ ...inv, status: 'paid' });

    // Create accounting entry automatically
    const revenueAccount = accounts.find((a) => a.type === 'revenue');
    const vatAccount = accounts.find((a) => a.number === '29391');
    const receivableAccount = accounts.find((a) => a.number === '1910');

    if (revenueAccount && receivableAccount) {
      const lines: any[] = [
        { id: generateId(), accountId: receivableAccount.id, accountNumber: receivableAccount.number, accountName: receivableAccount.name, debit: inv.totalInclVat, credit: 0, description: `Lasku ${inv.number}` },
        { id: generateId(), accountId: revenueAccount.id, accountNumber: revenueAccount.number, accountName: revenueAccount.name, debit: 0, credit: inv.totalExclVat, description: `Myynti ${inv.customerName}` },
      ];
      if (vatAccount && inv.totalVat > 0) {
        lines.push({ id: generateId(), accountId: vatAccount.id, accountNumber: vatAccount.number, accountName: vatAccount.name, debit: 0, credit: inv.totalVat, description: 'ALV 25,5%' });
      }

      const entry: Entry = {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        number: '',
        description: `Lasku ${inv.number} - ${inv.customerName}`,
        lines,
        attachments: [],
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onCreateEntry(entry);
    }
    await loadData();
  }

  function generatePDF(invoice: Invoice) {
    const doc = new jsPDF();
    doc.setFontSize(10);
    doc.text(companyName, 20, 20);
    doc.setFontSize(8);
    doc.text(companyAddress, 20, 25);
    if (companyYTunnus) doc.text(`Y-tunnus: ${companyYTunnus}`, 20, 30);

    doc.setFontSize(10);
    doc.text('LASKU', 20, 45);
    doc.setFontSize(8);
    doc.text(`Laskunumero: ${invoice.number}`, 20, 52);
    doc.text(`Päivämäärä: ${formatDate(invoice.date)}`, 20, 57);
    doc.text(`Eräpäivä: ${formatDate(invoice.dueDate)}`, 20, 62);

    doc.text('Asiakas:', 120, 45);
    doc.text(invoice.customerName, 120, 50);
    doc.text(invoice.customerAddress, 120, 55);
    doc.text(`${invoice.customerPostalCode} ${invoice.customerCity}`, 120, 60);
    if (invoice.customerYTunnus) doc.text(`Y-tunnus: ${invoice.customerYTunnus}`, 120, 65);

    autoTable(doc, {
      startY: 75,
      head: [['Kuvaus', 'Määrä', 'Yksikkö', 'Hinta', 'ALV%', 'Yhteensä']],
      body: invoice.lines.map((l) => [
        l.description,
        l.quantity.toString(),
        l.unit,
        `${l.unitPrice.toFixed(2)} €`,
        `${l.vatRate}%`,
        `${l.total.toFixed(2)} €`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text(`Yhteensä (veroton): ${invoice.totalExclVat.toFixed(2)} €`, 130, finalY + 10);
    doc.text(`ALV: ${invoice.totalVat.toFixed(2)} €`, 130, finalY + 15);
    doc.setFontSize(10);
    doc.text(`YHTEENSÄ: ${invoice.totalInclVat.toFixed(2)} €`, 130, finalY + 22);

    if (invoice.notes) {
      doc.setFontSize(8);
      doc.text('Lisätiedot:', 20, finalY + 32);
      doc.text(invoice.notes, 20, finalY + 37);
    }

    doc.save(`lasku-${invoice.number}.pdf`);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Laskutus
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === 'invoices' ? 'customers' : 'invoices')}>
              <Users className="w-4 h-4 mr-1" /> {view === 'invoices' ? 'Asiakkaat' : 'Laskut'}
            </Button>
            <Button onClick={view === 'invoices' ? openInvoiceModal : openCustomerModal} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> Uusi {view === 'invoices' ? 'lasku' : 'asiakas'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {view === 'invoices' ? (
          <div className="max-w-4xl mx-auto space-y-2">
            {invoices.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Ei laskuja. Luo ensimmäinen lasku!</p>
              </div>
            )}
            {invoices.map((inv) => (
              <Card key={inv.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-gray-900">{inv.number}</span>
                        <Badge className={`text-xs ${statusLabels[inv.status].color}`}>{statusLabels[inv.status].label}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{inv.customerName}</p>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>{formatDate(inv.date)}</span>
                        <span>Eräpäivä: {formatDate(inv.dueDate)}</span>
                        <span className="font-medium text-gray-900">{inv.totalInclVat.toFixed(2)} €</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {inv.status === 'draft' && (
                        <Button variant="ghost" size="sm" onClick={() => markSent(inv.id)} title="Merkitse lähetetyksi" aria-label="Merkitse lähetetyksi">
                          <Send className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                      {inv.status === 'sent' && (
                        <Button variant="ghost" size="sm" onClick={() => markPaid(inv.id)} title="Merkitse maksetuksi + kirjaus" aria-label="Merkitse maksetuksi">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => generatePDF(inv)} title="Lataa PDF" aria-label="Lataa PDF">
                        <Download className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { deleteInvoice(inv.id); loadData(); }} title="Poista" aria-label="Poista lasku">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-2">
            {customers.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.address}, {c.postalCode} {c.city}</p>
                    <p className="text-xs text-gray-400">Maksuehto: {c.paymentTerm} pv</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { deleteCustomer(c.id); loadData(); }} aria-label="Poista asiakas">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Uusi lasku</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Asiakas</Label>
              <Select value={invCustomerId} onValueChange={setInvCustomerId}>
                <SelectTrigger><SelectValue placeholder="Valitse asiakas" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Laskutuspäivä</Label><Input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} /></div>
              <div><Label>Eräpäivä</Label><Input type="date" value={invDue} onChange={(e) => setInvDue(e.target.value)} /></div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-xs">Rivit</Label>
                <Button type="button" variant="outline" size="sm" onClick={addInvLine}><Plus className="w-3 h-3 mr-1" /> Lisää</Button>
              </div>
              <div className="space-y-1">
                {invLines.map((line, idx) => (
                  <div key={line.id} className="grid grid-cols-12 gap-1 items-center">
                    <div className="col-span-4"><Input className="text-xs h-8" placeholder="Kuvaus" value={line.description} onChange={(e) => updateInvLine(idx, 'description', e.target.value)} /></div>
                    <div className="col-span-1"><Input type="number" className="text-xs h-8" placeholder="Määrä" value={line.quantity} onChange={(e) => updateInvLine(idx, 'quantity', Number(e.target.value))} /></div>
                    <div className="col-span-1"><Input className="text-xs h-8" placeholder="Yks." value={line.unit} onChange={(e) => updateInvLine(idx, 'unit', e.target.value)} /></div>
                    <div className="col-span-2"><Input type="number" className="text-xs h-8" placeholder="Hinta" value={line.unitPrice} onChange={(e) => updateInvLine(idx, 'unitPrice', Number(e.target.value))} /></div>
                    <div className="col-span-1">
                      <Select value={line.vatRate.toString()} onValueChange={(v) => updateInvLine(idx, 'vatRate', Number(v))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="14">14%</SelectItem>
                          <SelectItem value="25.5">25.5%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 text-xs text-right text-gray-700">{line.total.toFixed(2)} €</div>
                    <div className="col-span-1"><Button variant="ghost" size="sm" onClick={() => removeInvLine(idx)} disabled={invLines.length <= 1} className="h-8 w-8 p-0" aria-label="Poista rivi"><Trash2 className="w-3 h-3 text-red-500" /></Button></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-600">Yhteensä (veroton)</span><span>{calcTotals().totalExcl.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span className="text-gray-600">ALV</span><span>{calcTotals().totalVat.toFixed(2)} €</span></div>
              <div className="flex justify-between font-bold"><span>Yhteensä</span><span>{calcTotals().totalIncl.toFixed(2)} €</span></div>
            </div>
            <div><Label>Muistiinpanot</Label><Input value={invNotes} onChange={(e) => setInvNotes(e.target.value)} placeholder="Lisätiedot laskulle" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceModal(false)}>Peruuta</Button>
            <Button onClick={saveInvoiceData} className="bg-blue-600 hover:bg-blue-700 text-white">Tallenna lasku</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Modal */}
      <Dialog open={customerModal} onOpenChange={setCustomerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Uusi asiakas</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nimi *</Label><Input value={custName} onChange={(e) => setCustName(e.target.value)} /></div>
              <div><Label>Y-tunnus</Label><Input value={custYTunnus} onChange={(e) => setCustYTunnus(e.target.value)} placeholder="1234567-8" /></div>
            </div>
            <div><Label>Osoite</Label><Input value={custAddress} onChange={(e) => setCustAddress(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1"><Label>Postinumero</Label><Input value={custPostal} onChange={(e) => setCustPostal(e.target.value)} /></div>
              <div className="col-span-2"><Label>Postitoimipaikka</Label><Input value={custCity} onChange={(e) => setCustCity(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sähköposti</Label><Input type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} /></div>
              <div><Label>Puhelin</Label><Input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} /></div>
            </div>
            <div><Label>Maksuehto (päivää)</Label><Input type="number" value={custTerm} onChange={(e) => setCustTerm(Number(e.target.value))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerModal(false)}>Peruuta</Button>
            <Button onClick={saveCustomerData} className="bg-blue-600 hover:bg-blue-700 text-white">Tallenna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}
