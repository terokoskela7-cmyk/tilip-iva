import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, X, BookOpen, Plus, MessageCircle } from 'lucide-react';
import type { View } from '@/types';

interface SmartHelpProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onNewEntry: () => void;
}

const contextualTips: Record<string, { title: string; tips: string[]; actions: { label: string; action: () => void; icon: typeof BookOpen }[] }> = {
  dashboard: {
    title: 'Työpöytä',
    tips: [
      'Klikkaa mitä tahansa tiliä oikealla olevasta tilikartasta suodattaaksesi tositteet.',
      'Kirjoita hakupalkkiin etsiäksesi tositteita tai tilejä.',
      'Vihreät numerot ovat saldoja, punaiset ovat negatiivisia.',
    ],
    actions: [
      { label: 'Uusi tosite', action: () => { /* set by parent */ }, icon: Plus },
      { label: 'Katso ohjeet', action: () => { /* set by parent */ }, icon: BookOpen },
    ],
  },
  journal: {
    title: 'Päiväkirja',
    tips: [
      'Täällä näet kaikki tositteet kronologisessa järjestyksessä.',
      'Suodata päivämäärän, tilin tai hakusanan mukaan.',
      'Debet ja Kredit sarakkeet näyttävät kaksinkertaisen kirjanpidon.',
    ],
    actions: [
      { label: 'Uusi tosite', action: () => { /* set by parent */ }, icon: Plus },
      { label: 'Katso ohjeet', action: () => { /* set by parent */ }, icon: BookOpen },
    ],
  },
  accounts: {
    title: 'Tilikartta',
    tips: [
      'Tilikartta näyttää kaikki kirjanpitotilisi hierarkkisesti.',
      'Tiliryhmät 1-VASTAAVAA ja 2-VASTATTAVAA ovat tasetilejä.',
      '3-TUOTOT ja 4-KULUT ovat tuloslaskelmatilejä.',
      'Voit lisätä omia tilejä "Uusi tili" -napilla.',
    ],
    actions: [
      { label: 'Katso ohjeet', action: () => { /* set by parent */ }, icon: BookOpen },
    ],
  },
  reports: {
    title: 'Raportit',
    tips: [
      'Tuloslaskelma näyttää onko yritys tuottava vai tappiollinen.',
      'Tase näyttää yrityksen varallisuuden ja velat.',
      'ALV-välilehti auttaa seuraamaan arvonlisäverovelkaa.',
      'Graafit visualisoivat kuukausittaista kehitystä.',
    ],
    actions: [
      { label: 'Katso ohjeet', action: () => { /* set by parent */ }, icon: BookOpen },
    ],
  },
  settings: {
    title: 'Asetukset',
    tips: [
      'Päivitä yrityksen tiedot ja Y-tunnus.',
      'Vie varmuuskopio säännöllisesti JSON-muodossa.',
      'Kirjanpitäjän tiedot näkyvät tositteissa.',
    ],
    actions: [
      { label: 'Katso ohjeet', action: () => { /* set by parent */ }, icon: BookOpen },
    ],
  },
};

export default function SmartHelp({ currentView, onNavigate, onNewEntry }: SmartHelpProps) {
  const [open, setOpen] = useState(false);

  const context = contextualTips[currentView];
  if (!context) return null;

  const handleAction = (label: string) => {
    if (label === 'Uusi tosite') {
      onNewEntry();
    } else if (label === 'Katso ohjeet') {
      onNavigate('guides');
    }
    setOpen(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        title="Apu ja vinkit"
      >
        {open ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
      </button>

      {/* Help panel */}
      {open && (
        <Card className="fixed bottom-20 right-6 z-40 w-80 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-sm text-gray-900">{context.title} — Vinkkejä</h4>
            </div>
            <ul className="space-y-2 mb-4">
              {context.tips.map((tip, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              {context.actions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.label === 'Uusi tosite' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs flex-1"
                  onClick={() => handleAction(action.label)}
                >
                  <action.icon className="w-3.5 h-3.5 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
