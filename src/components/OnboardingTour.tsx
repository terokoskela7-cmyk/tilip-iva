import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, BookOpen, MousePointer, BarChart3, Settings, Sparkles, Receipt, HelpCircle } from 'lucide-react';
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
    content: 'Tämä on sinun kirjanpito-ohjelmasi. Käymme läpi muutaman nopean vinkin, jotta pääset alkuun ilman stressiä. Voit ohittaa opastuksen milloin tahansa.',
    icon: Sparkles,
  },
  {
    title: 'Työpöytä',
    content: 'Täällä näet kaiken yhdellä silmäyksellä: viimeisimmät tositteet, tilikartan ja tilinpäätöstiedot. Klikkaa mitä tahansa tiliä suodattaaksesi tositteet helposti.',
    icon: MousePointer,
    action: { label: 'Katso työpöytä', view: 'dashboard' },
  },
  {
    title: 'Tositteen kirjaaminen',
    content: 'Kun ostat tai myyt jotain, klikkaa "Uusi tosite". Syötä päivämäärä, valitse tili ja summa. Älä huoli — ohjelma muistuttaa, jos Debet- ja Kredit-summat eivät täsmää.',
    icon: BookOpen,
    action: { label: 'Kokeile kirjausta', view: 'journal' },
  },
  {
    title: 'Ensimmäinen myyntilasku?',
    content: 'Myyntilaskun tekeminen voi tuntua hankalalta. Ohjaamme sinut vaihe vaiheelta: asiakkaan tiedoista valmiiseen kirjanpitomerkintään. Klikkaa alla olevaa nappia kokeillaksesi.',
    icon: Receipt,
    action: { label: 'Tee ensimmäinen lasku', view: 'firstinvoice' },
  },
  {
    title: 'Raportit',
    content: 'Tuloslaskelmasta näet, tuottaako yrityksesi voittoa. Taseesta näet varallisuuden. ALV-välilehti auttaa verojen seurannassa. Graafit tekevät luvuista helposti ymmärrettäviä.',
    icon: BarChart3,
    action: { label: 'Tutki raportteja', view: 'reports' },
  },
  {
    title: 'Apua jokaiseen tilanteeseen',
    content: 'Epävarma, mihin tiliin jokin kuuluu? Ohjeet-välilehdeltä löydät selkeitä esimerkkejä yleisimmistä tilanteista, kuten tietokoneen ostosta tai vuokran maksusta.',
    icon: HelpCircle,
    action: { label: 'Katso ohjeita', view: 'guides' },
  },
  {
    title: 'Asetukset',
    content: 'Tarkista, että yrityksesi tiedot ovat ajan tasalla. Voit päivittää osoitteen, Y-tunnuksen ja tilikauden asetukset milloin tahansa.',
    icon: Settings,
    action: { label: 'Avaa asetukset', view: 'settings' },
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
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-600 transition-colors"
            aria-label="Sulje opastus"
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
              className="w-full text-center text-xs text-gray-500 hover:text-gray-600 mt-3 transition-colors"
            >
              Ohita opastus
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
