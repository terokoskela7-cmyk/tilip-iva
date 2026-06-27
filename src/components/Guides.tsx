import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ChevronRight, ChevronLeft, Lightbulb, CheckCircle2, Monitor, Receipt, Users, Building2, Banknote, Calculator, Truck, Coffee } from 'lucide-react';
import { guides, categoryLabels, type Guide, type GuideStep } from '@/lib/guideData';

const iconMap = {
  computer: Monitor,
  receipt: Receipt,
  users: Users,
  building: Building2,
  banknote: Banknote,
  calculator: Calculator,
  truck: Truck,
  coffee: Coffee,
};

export default function Guides() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const categories = ['all', ...Object.keys(categoryLabels)];

  const filtered = guides.filter((g) => {
    const matchCategory = activeCategory === 'all' || g.category === activeCategory;
    const matchSearch = !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  function openGuide(guide: Guide) {
    setSelectedGuide(guide);
    setCurrentStep(0);
  }

  function closeGuide() {
    setSelectedGuide(null);
    setCurrentStep(0);
  }

  if (selectedGuide) {
    return <GuideWizard guide={selectedGuide} step={currentStep} onStepChange={setCurrentStep} onClose={closeGuide} />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">Opas kirjanpitoon</h2>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Valitse tilanne alla, niin opastamme askel askeleelta miten kirjataan.
        </p>
        <div className="relative max-w-md mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hae ohjeista..." className="pl-9 text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'bg-blue-600 text-white' : ''}
            >
              {cat === 'all' ? 'Kaikki' : categoryLabels[cat as keyof typeof categoryLabels]}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          {filtered.map((guide) => {
            const Icon = iconMap[guide.icon];
            return (
              <Card
                key={guide.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openGuide(guide)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">{guide.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{guide.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[guide.category]}
                        </Badge>
                        <span className="text-xs text-gray-500">{guide.steps.length} vaihetta</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <p>Ei ohjeita hakuehdoilla</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GuideWizard({ guide, step, onStepChange, onClose }: {
  guide: Guide;
  step: number;
  onStepChange: (s: number) => void;
  onClose: () => void;
}) {
  const [showComplete, setShowComplete] = useState(false);
  const current: GuideStep = guide.steps[step];
  const isLast = step === guide.steps.length - 1;

  function nextStep() {
    if (isLast) {
      setShowComplete(true);
    } else {
      onStepChange(step + 1);
    }
  }

  function prevStep() {
    if (showComplete) {
      setShowComplete(false);
    } else {
      onStepChange(Math.max(0, step - 1));
    }
  }

  if (showComplete) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hienoa!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Olet nyt käynyt läpi oppaan <strong>"{guide.title}"</strong>. Voit nyt kirjata tämän tapahtuman itse!
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-4 text-left">
              <p className="text-xs font-medium text-blue-700 uppercase mb-1">Tarvittavat tilit</p>
              <div className="flex flex-wrap gap-1">
                {guide.relatedAccounts.map((acc) => (
                  <Badge key={acc} variant="outline" className="text-xs bg-white">{acc}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={onClose}>Takaisin oppaisiin</Button>
              <Button onClick={() => { onClose(); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                Siirry kirjaamaan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>← Takaisin</Button>
            <h2 className="text-sm font-medium text-gray-900">{guide.title}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Vaihe {step + 1} / {guide.steps.length}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${((step + 1) / guide.steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{current.title}</h3>

              <div
                className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: current.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
              />

              {current.highlight && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-medium">{current.highlight}</p>
                </div>
              )}

              {current.example && (
                <div className="bg-gray-50 border rounded-md p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-3">Esimerkkikirjaus</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-14 text-xs font-medium text-green-600 text-right">DEBET</span>
                      <div className="flex-1 bg-white border rounded px-3 py-2">
                        <p className="font-medium text-gray-900">{current.example.debit.account}</p>
                        <p className="text-xs text-gray-500">{current.example.debit.description}</p>
                      </div>
                      <span className="w-24 text-right font-medium text-gray-900 tabular-nums">
                        {current.example.debit.amount.toLocaleString('fi-FI', { minimumFractionDigits: 2 })} €
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-14 text-xs font-medium text-red-600 text-right">KREDIT</span>
                      <div className="flex-1 bg-white border rounded px-3 py-2">
                        <p className="font-medium text-gray-900">{current.example.credit.account}</p>
                        <p className="text-xs text-gray-500">{current.example.credit.description}</p>
                      </div>
                      <span className="w-24 text-right font-medium text-gray-900 tabular-nums">
                        {current.example.credit.amount.toLocaleString('fi-FI', { minimumFractionDigits: 2 })} €
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {current.tip && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs font-medium text-blue-700 uppercase mb-1">Vinkki</p>
                  <p className="text-sm text-blue-800">{current.tip}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex justify-between">
          <Button variant="outline" size="sm" onClick={prevStep} disabled={step === 0 && !showComplete}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Edellinen
          </Button>
          <Button size="sm" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLast ? 'Valmis!' : 'Seuraava'} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
