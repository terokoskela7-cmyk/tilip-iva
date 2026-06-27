import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginPage } from '@/components/auth/LoginPage';
import { RegisterPage } from '@/components/auth/RegisterPage';
import { MainApp } from '@/components/MainApp';
import { useAuth } from '@/context/AuthContext';

function App() {
  const { user, loading: authLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-600">Tarkistetaan kirjautumista...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return showRegister ? (
      <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginPage onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return <MainApp />;
}

export default App;
