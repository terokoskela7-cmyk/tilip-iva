import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, BookOpen, MousePointer, BarChart3, Settings, Sparkles } from 'lucide-react';
import type { View } from '@/types';

interface TourStep {
  title: string;
  content: string;
  icon: typeof BookOpen;
  action?: { label: string; view: View };
}

const tourSteps: TourStep[] = [
  {
    title: 'Tervetuloa Tilipäivään!',
    content: 'Tämä on kirjanpito-ohjelmasi. Opastamme sinut läpi tärkeimmät toiminnot. Voit ohittaa opastuksen milloin tahansa.',
    icon: Sparkles,
  },
  {
    title: 'Työpöytä',
    content: 'Täällä näet kaiken yhdellä silmäyksellä: viimeisimmät tositteet vasemmalla, pääkirjan keskellä, ja tilikartta sekä haku oikealla. Klikkaa mitä tahansa tiliä suodattaaksesi tositteet.',
    icon: MousePointer,
    action: { label: 'Katso työpöytä', view: 'dashboard' },
  },
  {
    title: 'Tositteen kirjaaminen',
    content: 'Kun haluat kirjata tapahtuman (esim. tietokoneen oston), klikkaa "Uusi tosite". Syötä päivämäärä, valitse tili, ja syötä summa joko Debet- tai Kredit-puolelle. Muista: Debet ja Kredit summat täsmäättävä!',
    icon: BookOpen,
    action: { label: 'Kokeile kirjausta', view: 'journal' },
  },
  {
    title: 'Raportit',
    content: 'Tuloslaskelma näyttää ovatko tuotot suuremmat kuin kulut. Tase näyttää yrityksen varallisuuden. ALV-välilehti auttaa arvonlisäveron seurannassa. Graafit visualisoivat kehityksen.',
    icon: BarChart3,
    action: { label: 'Tutki raportteja', view: 'reports' },
  },
  {
    title: 'Ohjeet ja asetukset',
    content: 'Jos et ole varma mihin tiliin jokin kuuluu, katso "Ohjeet"-välilehti. Siellä on opastus yleisimpiin tilanteisiin, kuten tietokoneen ostoon tai myyntilaskun lähettämiseen. Asetuksista voit muokata yrityksen tietoja.',
    icon: Settings,
    action: { label: 'Katso ohjeita', view: 'guides' },
  },
];

interface OnboardingTourProps {
  onNavigate: (view: View) => void;
}

const STORAGE_KEY = 'finledger-tour-seen';

export default function OnboardingTour({ onNavigate }: OnboardingTourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const current = tourSteps[step];
  const Icon = current.icon;
  const isLast = step === tourSteps.length - 1;

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  }

  function handleNext() {
    if (isLast) {
      handleClose();
    } else {
      setStep(step + 1);
    }
  }

  function handleAction() {
    if (current.action) {
      onNavigate(current.action.view);
      handleClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card className="max-w-md w-full mx-4 shadow-2xl">
        <CardContent className="p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{current.title}</h3>
          </div>

          <p className="text-sm text-gray-600 text-center mb-5 leading-relaxed">{current.content}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Edellinen
            </Button>

            <div className="flex gap-2">
              {current.action && (
                <Button variant="outline" size="sm" onClick={handleAction}>
                  {current.action.label}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLast ? 'Aloita käyttö!' : 'Seuraava'} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {!isLast && (
            <button
              onClick={handleClose}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition-colors"
            >
              Ohita opastus
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
