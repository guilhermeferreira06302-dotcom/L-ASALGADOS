import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useApp } from '../context/AppContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Wrapper para usar o hook dentro do ErrorBoundary de classe
export const GlobalErrorBoundary: React.FC<Props> = ({ children }) => {
  const { sendWhatsAppAlert } = useApp();

  return (
    <ErrorBoundaryInner sendWhatsAppAlert={sendWhatsAppAlert}>
      {children}
    </ErrorBoundaryInner>
  );
};

class ErrorBoundaryInner extends Component<Props & { sendWhatsAppAlert: (msg: string) => void }, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Tenta enviar o alerta
    try {
      this.props.sendWhatsAppAlert(
        `🚨 *ALERTA CRÍTICO - SISTEMA CAIU* 🚨\nOcorreu um erro fatal na interface (Tela Branca).\n\nErro: ${error.message}\nVerifique o sistema imediatamente.`
      );
    } catch (e) {
      console.error('Falha ao enviar alerta de error boundary', e);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-slate-800 p-8 rounded-2xl max-w-lg w-full border border-red-500/30 shadow-2xl">
            <h1 className="text-4xl mb-4">💥</h1>
            <h2 className="text-xl font-bold text-white mb-2">Ops! O sistema encontrou um erro crítico.</h2>
            <p className="text-slate-400 mb-6 text-sm">
              Um alerta foi enviado aos administradores se configurado. Por favor, recarregue a página.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg text-left overflow-auto text-xs text-red-400 font-mono mb-6 max-h-32">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition"
            >
              Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
