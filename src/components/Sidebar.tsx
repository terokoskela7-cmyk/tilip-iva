import { useState } from 'react';
import {
  Home, BookOpen, ListTree, BarChart3, Settings, User, CircleDot,
  GraduationCap, Rocket, Calculator, CalendarCheck, Wallet, Shield,
  Building2, Receipt, Repeat, X, Menu, LogOut, Landmark
} from 'lucide-react';
import type { View } from '@/types';

interface SidebarProps {
  view: View;
  onViewChange: (view: View) => void;
  companyName: string;
  yTunnus: string;
  lastBackup: string | null;
  userEmail?: string;
  onLogout?: () => void;
}

const navItems: { view: View; label: string; icon: typeof Home }[] = [
  { view: 'dashboard', label: 'Koti', icon: Home },
  { view: 'journal', label: 'Päiväkirja', icon: BookOpen },
  { view: 'accounts', label: 'Tilikartta', icon: ListTree },
  { view: 'banking', label: 'Pankki', icon: Landmark },
  { view: 'reports', label: 'Raportit', icon: BarChart3 },
];

const toolItems: { view: View; label: string; icon: typeof Home }[] = [
  { view: 'guides', label: 'Ohjeet', icon: GraduationCap },
  { view: 'entrepreneur', label: 'Yrittäjän opas', icon: Rocket },
  { view: 'taxcalc', label: 'Vero-laskuri', icon: Calculator },
  { view: 'checklist', label: 'Muistutuslista', icon: CalendarCheck },
  { view: 'cashflow', label: 'Kassavirta', icon: Wallet },
  { view: 'yel', label: 'YEL-laskuri', icon: Shield },
  { view: 'realestate', label: 'Asuntosijoittaja', icon: Building2 },
  { view: 'invoicing', label: 'Laskutus', icon: Receipt },
  { view: 'recurring', label: 'Toistuvat', icon: Repeat },
  { view: 'settings', label: 'Asetukset', icon: Settings },
];

export default function Sidebar({ view, onViewChange, companyName, yTunnus, lastBackup, userEmail, onLogout }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleNav(newView: View) {
    onViewChange(newView);
    setMobileOpen(false);
  }

  const renderItems = (items: typeof navItems) =>
    items.map((item) => {
      const Icon = item.icon;
      const isActive = view === item.view;
      return (
        <button
          key={item.view}
          onClick={() => handleNav(item.view)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-150 ${
            isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
          <span className="truncate">{item.label}</span>
        </button>
      );
    });

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <h1 className="font-bold text-sm text-gray-900">Tilipäivä</h1>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md hover:bg-gray-200 transition-colors"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - desktop fixed, mobile slide-over */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-100 h-screen flex flex-col shadow-lg lg:shadow-none flex-shrink-0 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Desktop-only logo */}
        <div className="hidden lg:block p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FL</span>
            </div>
            <h1 className="font-bold text-lg text-gray-900">Tilipäivä</h1>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900 truncate">{companyName || 'Yritys'}</p>
            <p className="text-gray-500 text-xs">{yTunnus || ''}</p>
          </div>
        </div>

        {/* Mobile close button inside sidebar */}
        <div className="lg:hidden p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm">
            <p className="font-medium text-gray-900 truncate">{companyName || 'Yritys'}</p>
            <p className="text-gray-500 text-xs">{yTunnus || ''}</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-md hover:bg-gray-200" aria-label="Sulje valikko">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider px-3 py-1">Kirjanpito</p>
          {renderItems(navItems)}

          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider px-3 py-1 mt-3">Työkalut</p>
          {renderItems(toolItems)}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-3">
          {lastBackup && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-md px-3 py-2">
              <CircleDot className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">Tallennettu: {lastBackup}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-xs text-gray-900 truncate">{userEmail || 'Käyttäjä'}</p>
              <p className="text-xs text-gray-500">Kirjautunut</p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Kirjaudu ulos
            </button>
          )}
        </div>
      </aside>

      {/* Mobile spacer */}
      <div className="lg:hidden h-12" />
    </>
  );
}
