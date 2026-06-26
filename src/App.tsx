import { useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Journal from '@/components/Journal';
import ChartOfAccounts from '@/components/ChartOfAccounts';
import Reports from '@/components/Reports';
import SettingsPage from '@/components/SettingsPage';
import Guides from '@/components/Guides';
import EntrepreneurGuide from '@/components/EntrepreneurGuide';
import TaxCalculator from '@/components/TaxCalculator';
import MonthlyChecklist from '@/components/MonthlyChecklist';
import CashFlowForecast from '@/components/CashFlowForecast';
import YELCalculator from '@/components/YELCalculator';
import RealEstateInvestor from '@/components/RealEstateInvestor';
import Invoicing from '@/components/Invoicing';
import RecurringEntries from '@/components/RecurringEntries';
import OnboardingTour from '@/components/OnboardingTour';
import SmartHelp from '@/components/SmartHelp';
import EntryModal from '@/components/EntryModal';
import { useStore } from '@/hooks/useStore';
import type { Entry, View } from '@/types';
import { format, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';

function App() {
  const store = useStore();

  const handleNewEntry = useCallback(() => {
    store.setEditingEntry(null);
    store.setEntryModalOpen(true);
  }, [store]);

  const handleEditEntry = useCallback((entry: Entry) => {
    store.setEditingEntry(entry);
    store.setEntryModalOpen(true);
  }, [store]);

  const handleSaveEntry = useCallback((entry: Entry) => {
    store.addEntry(entry);
  }, [store]);

  const handleNavigate = useCallback((view: View) => {
    store.setView(view);
  }, [store]);

  // Cash history for sparkline
  const cashHistory = useMemo(() => {
    const sorted = [...store.cashEntries].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    return sorted.map((e) => {
      running += e.type === 'in' ? e.amount : -e.amount;
      return { date: format(parseISO(e.date), 'dd.MM.', { locale: fi }), balance: running };
    });
  }, [store.cashEntries]);

  if (store.loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-600">Ladataan kirjanpitoa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white">
      <Sidebar
        view={store.view}
        onViewChange={store.setView}
        companyName={store.company?.name || ''}
        yTunnus={store.company?.yTunnus || ''}
        lastBackup={store.lastBackup}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {store.view === 'dashboard' && (
          <Dashboard
            entries={store.entries}
            accounts={store.accounts}
            filteredEntries={store.filteredEntries}
            selectedAccountId={store.selectedAccountId}
            onSelectAccount={store.setSelectedAccountId}
            searchQuery={store.searchQuery}
            onSearchChange={store.setSearchQuery}
            onNewEntry={handleNewEntry}
            onEditEntry={handleEditEntry}
            accountBalance={store.accountBalance}
            totalVatPayable={store.totalVatPayable}
            totalVatDeductible={store.totalVatDeductible}
            cashBalance={store.cashBalance}
            cashHistory={cashHistory}
          />
        )}

        {store.view === 'journal' && (
          <Journal
            entries={store.entries}
            accounts={store.accounts}
            onNewEntry={handleNewEntry}
            onEditEntry={handleEditEntry}
            onDeleteEntry={store.removeEntry}
          />
        )}

        {store.view === 'accounts' && (
          <ChartOfAccounts
            accounts={store.accounts}
            onAddAccount={store.addAccount}
            onDeleteAccount={store.removeAccount}
            accountBalance={store.accountBalance}
          />
        )}

        {store.view === 'reports' && (
          <Reports
            entries={store.entries}
            accounts={store.accounts}
            accountBalance={store.accountBalance}
            totalVatPayable={store.totalVatPayable}
            totalVatDeductible={store.totalVatDeductible}
          />
        )}

        {store.view === 'settings' && (
          <SettingsPage
            company={store.company}
            onUpdateCompany={store.updateCompany}
            onReload={store.loadData}
          />
        )}

        {store.view === 'guides' && <Guides />}
        {store.view === 'entrepreneur' && <EntrepreneurGuide />}
        {store.view === 'taxcalc' && <TaxCalculator />}
        {store.view === 'checklist' && <MonthlyChecklist />}
        {store.view === 'cashflow' && <CashFlowForecast />}
        {store.view === 'yel' && <YELCalculator />}
        {store.view === 'realestate' && <RealEstateInvestor />}
        {store.view === 'invoicing' && (
          <Invoicing
            companyName={store.company?.name || ''}
            companyYTunnus={store.company?.yTunnus || ''}
            companyAddress={`${store.company?.address || ''}, ${store.company?.postalCode || ''} ${store.company?.city || ''}`}
            accounts={store.accounts}
            onCreateEntry={store.addEntry}
          />
        )}
        {store.view === 'recurring' && (
          <RecurringEntries accounts={store.accounts} onGenerateEntry={store.addEntry} />
        )}
      </main>

      <OnboardingTour onNavigate={handleNavigate} />
      <SmartHelp
        currentView={store.view}
        onNavigate={handleNavigate}
        onNewEntry={handleNewEntry}
      />

      <EntryModal
        open={store.entryModalOpen}
        onOpenChange={store.setEntryModalOpen}
        onSave={handleSaveEntry}
        editingEntry={store.editingEntry}
        accounts={store.accounts}
        existingEntries={store.entries}
      />

      {/* Toast */}
      {store.toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg text-sm font-medium transition-all duration-300 ${
          store.toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {store.toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
