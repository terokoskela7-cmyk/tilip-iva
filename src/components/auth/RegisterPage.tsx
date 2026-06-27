import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, BookOpen } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { signUp, loading } = useAuth();

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/invalid-email':
          return 'Sähköpostiosoite on virheellinen.';
        case 'auth/email-already-in-use':
          return 'Sähköpostiosoite on jo käytössä. Kirjaudu sisään.';
        case 'auth/weak-password':
          return 'Salasana on liian heikko. Käytä vähintään 6 merkkiä.';
        case 'auth/too-many-requests':
          return 'Liian monta yritystä. Yritä myöhemmin uudelleen.';
        case 'auth/network-request-failed':
          return 'Verkkovirhe. Tarkista internet-yhteys.';
        default:
          return 'Tapahtui virhe rekisteröitymisessä. Yritä uudelleen.';
      }
    }
    return 'Tuntematon virhe. Yritä uudelleen.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Täytä kaikki kentät.');
      return;
    }

    if (password.length < 6) {
      setError('Salasanan on oltava vähintään 6 merkkiä pitkä.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Salasanat eivät täsmää.');
      return;
    }

    try {
      await signUp(email, password);
      setSuccess('Tili luotu onnistuneesti! Voit nyt kirjautua sisään.');
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Tilipäivä</h1>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Luo uusi tili</CardTitle>
            <CardDescription className="text-center">
              Täytä tiedot ja aloita kirjanpitosi
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Sähköposti</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nimi@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Salasana</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-xs text-slate-500">Vähintään 6 merkkiä</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Vahvista salasana</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Luodaan tiliä...
                  </>
                ) : (
                  'Luo tili'
                )}
              </Button>

              <p className="text-sm text-slate-600 text-center">
                Onko sinulla jo tili?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-blue-600 hover:text-blue-700 font-medium underline-offset-4 hover:underline"
                  disabled={loading}
                >
                  Kirjaudu sisään
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Rekisteröitymällä hyväksyt sovelluksen käyttöehdot.
        </p>
      </div>
    </div>
  );
}
