import { Component, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">Sovelluksessa tapahtui virhe</h1>
            <p className="text-sm text-slate-600">
              {this.state.error?.message || 'Tuntematon virhe'}
            </p>
            <Button onClick={() => window.location.reload()}>Lataa sivu uudelleen</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
