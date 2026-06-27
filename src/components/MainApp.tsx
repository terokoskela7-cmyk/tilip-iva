import { useCallback, useMemo, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import OnboardingTour from '@/components/OnboardingTour';
import { Onboarding } from '@/components/Onboarding';
import SmartHelp from '@/components/SmartHelp';
import EntryModal from '@/components/EntryModal';
import { LedgerModal } from '@/components/LedgerModal';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/hooks/useStore';
import type { Entry, View } from '@/types';
import { format, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';

// Lazy-loaded route components
const Journal = lazy(() => import('@/components/Journal'));
const ChartOfAccounts = lazy(() => import('@/components/ChartOfAccounts'));
const Reports = lazy(() => import('@/components/Reports'));
const SettingsPage = lazy(() => import('@/components/SettingsPage'));
const Guides = lazy(() => import('@/components/Guides'));
const EntrepreneurGuide = lazy(() => import('@/components/EntrepreneurGuide'));
const TaxCalculator = lazy(() => import('@/components/TaxCalculator'));
const MonthlyChecklist = lazy(() => import('@/components/MonthlyChecklist'));
const CashFlowForecast = lazy(() => import('@/components/CashFlowForecast'));
const YELCalculator = lazy(() => import('@/components/YELCalculator'));
const RealEstateInvestor = lazy(() => import('@/components/RealEstateInvestor'));
const Invoicing = lazy(() => import('@/components/Invoicing'));
const RecurringEntries = lazy(() => import('@/components/RecurringEntries'));
const Banking = lazy(() => import('@/components/Banking'));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

export function MainApp() {
  const { user, logout } = useAuth();
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

  if (store.loading || store.hasCompany === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-600">Ladataan kirjanpitoa...</p>
        </div>
      </div>
    );
  }

  if (!store.hasCompany) {
    return <Onboarding onComplete={store.loadData} />;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white">
      <Sidebar
        view={store.view}
        onViewChange={store.setView}
        companyName={store.company?.name || ''}
        yTunnus={store.company?.yTunnus || ''}
        lastBackup={store.lastBackup}
        userEmail={user?.email || ''}
        onLogout={logout}
        ledgers={store.ledgers}
        activeLedgerId={store.activeLedgerId}
        onSelectLedger={store.setActiveLedger}
        onCreateLedger={() => store.setLedgerModalOpen(true)}
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
          <Suspense fallback={<PageLoader />}>
            <Journal
              entries={store.entries}
              accounts={store.accounts}
              onNewEntry={handleNewEntry}
              onEditEntry={handleEditEntry}
              onDeleteEntry={store.removeEntry}
            />
          </Suspense>
        )}

        {store.view === 'accounts' && (
          <Suspense fallback={<PageLoader />}>
            <ChartOfAccounts
              accounts={store.accounts}
              onAddAccount={store.addAccount}
              onDeleteAccount={store.removeAccount}
              accountBalance={store.accountBalance}
            />
          </Suspense>
        )}

        {store.view === 'reports' && (
          <Suspense fallback={<PageLoader />}>
            <Reports
              entries={store.entries}
              accounts={store.accounts}
              accountBalance={store.accountBalance}
              totalVatPayable={store.totalVatPayable}
              totalVatDeductible={store.totalVatDeductible}
            />
          </Suspense>
        )}

        {store.view === 'banking' && (
          <Suspense fallback={<PageLoader />}>
            <Banking accounts={store.accounts} />
          </Suspense>
        )}

        {store.view === 'settings' && (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage
              company={store.company}
              onUpdateCompany={store.updateCompany}
              onReload={store.loadData}
            />
          </Suspense>
        )}

        {store.view === 'guides' && (
          <Suspense fallback={<PageLoader />}>
            <Guides />
          </Suspense>
        )}
        {store.view === 'entrepreneur' && (
          <Suspense fallback={<PageLoader />}>
            <EntrepreneurGuide />
          </Suspense>
        )}
        {store.view === 'taxcalc' && (
          <Suspense fallback={<PageLoader />}>
            <TaxCalculator />
          </Suspense>
        )}
        {store.view === 'checklist' && (
          <Suspense fallback={<PageLoader />}>
            <MonthlyChecklist />
          </Suspense>
        )}
        {store.view === 'cashflow' && (
          <Suspense fallback={<PageLoader />}>
            <CashFlowForecast />
          </Suspense>
        )}
        {store.view === 'yel' && (
          <Suspense fallback={<PageLoader />}>
            <YELCalculator />
          </Suspense>
        )}
        {store.view === 'realestate' && (
          <Suspense fallback={<PageLoader />}>
            <RealEstateInvestor />
          </Suspense>
        )}
        {store.view === 'invoicing' && (
          <Suspense fallback={<PageLoader />}>
            <Invoicing
              companyName={store.company?.name || ''}
              companyYTunnus={store.company?.yTunnus || ''}
              companyAddress={`${store.company?.address || ''}, ${store.company?.postalCode || ''} ${store.company?.city || ''}`}
              accounts={store.accounts}
              onCreateEntry={store.addEntry}
            />
          </Suspense>
        )}
        {store.view === 'recurring' && (
          <Suspense fallback={<PageLoader />}>
            <RecurringEntries accounts={store.accounts} onGenerateEntry={store.addEntry} />
          </Suspense>
        )}
      </main>

      <OnboardingTour onNavigate={handleNavigate} />
      <SmartHelp
        currentView={store.view}
        onNavigate={handleNavigate}
        onNewEntry={handleNewEntry}
      />

      <LedgerModal
        open={store.ledgerModalOpen}
        onOpenChange={store.setLedgerModalOpen}
        onCreate={store.createLedger}
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
