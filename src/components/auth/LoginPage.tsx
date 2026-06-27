import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, BookOpen } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp, loading } = useAuth();

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/invalid-email':
          return 'Sähköpostiosoite on virheellinen.';
        case 'auth/user-disabled':
          return 'Käyttäjätili on poistettu käytöstä.';
        case 'auth/user-not-found':
          return 'Käyttäjää ei löytynyt. Tarkista sähköpostiosoite.';
        case 'auth/wrong-password':
          return 'Väärä salasana. Yritä uudelleen.';
        case 'auth/invalid-credential':
          return 'Virheelliset kirjautumistiedot. Tarkista sähköposti ja salasana.';
        case 'auth/email-already-in-use':
          return 'Sähköpostiosoite on jo käytössä.';
        case 'auth/weak-password':
          return 'Salasana on liian heikko. Käytä vähintään 6 merkkiä.';
        case 'auth/too-many-requests':
          return 'Liian monta yritystä. Yritä myöhemmin uudelleen.';
        case 'auth/network-request-failed':
          return 'Verkkovirhe. Tarkista internet-yhteys.';
        default:
          return 'Tapahtui virhe. Yritä uudelleen.';
      }
    }
    return 'Tuntematon virhe. Yritä uudelleen.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Syötä sekä sähköposti että salasana.');
      return;
    }

    try {
      if (isRegister) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
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
            <CardTitle className="text-xl text-center">
              {isRegister ? 'Luo uusi tili' : 'Kirjaudu sisään'}
            </CardTitle>
            <CardDescription className="text-center">
              {isRegister
                ? 'Täytä tiedot ja aloita kirjanpitosi'
                : 'Syötä sähköpostisi ja salasanasi'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
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
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ladataan...
                  </>
                ) : isRegister ? (
                  'Luo tili'
                ) : (
                  'Kirjaudu'
                )}
              </Button>

              <p className="text-sm text-slate-600 text-center">
                {isRegister ? 'Onko sinulla jo tili?' : 'Eikö sinulla ole tiliä?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium underline-offset-4 hover:underline"
                  disabled={loading}
                >
                  {isRegister ? 'Kirjaudu sisään' : 'Luo uusi tili'}
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Kirjautumalla hyväksyt sovelluksen käyttöehdot.
        </p>
      </div>
    </div>
  );
}
