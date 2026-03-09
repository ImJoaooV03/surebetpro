import { StrictMode, Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Error Boundary para capturar falhas no ciclo de vida do React
// Evita que um erro silencioso deixe a tela preta/branca.
class GlobalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[React Crash] Erro capturado pelo ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-8">
          <div className="bg-dark-800 border border-red-500/30 p-8 rounded-xl max-w-2xl w-full">
            <h1 className="text-red-500 text-2xl font-bold mb-2">Erro de Renderização Detectado</h1>
            <p className="text-gray-400 mb-6 text-sm">Ocorreu uma falha no ciclo de vida de um componente React.</p>
            <div className="bg-dark-900 p-4 rounded-lg overflow-auto border border-dark-700">
              <pre className="text-red-400 text-sm font-mono whitespace-pre-wrap">
                {this.state.error?.message || 'Erro desconhecido'}
              </pre>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
