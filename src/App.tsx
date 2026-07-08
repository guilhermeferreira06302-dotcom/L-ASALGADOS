import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { FinancialAnalysis } from './components/admin/FinancialAnalysis';
import { StockInventory } from './components/admin/StockInventory';
import { ProductManagement } from './components/admin/ProductManagement';
import { EmployeePortal } from './components/employee/EmployeePortal';
import { Menu } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentUser } = useApp();
  const [activePortal, setActivePortal] = useState<'ADMIN' | 'FUNCIONARIO'>(
    currentUser?.role === 'ADMIN' ? 'ADMIN' : 'FUNCIONARIO'
  );
  const [adminTab, setAdminTab] = useState<string>('DASHBOARD');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync portal toggle when user logs in or switches
  React.useEffect(() => {
    if (currentUser) {
      setActivePortal(currentUser.role === 'ADMIN' ? 'ADMIN' : 'FUNCIONARIO');
    }
  }, [currentUser?.role]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  const getSectionTitle = () => {
    if (activePortal === 'FUNCIONARIO') return 'Terminal do Operador / PDV';
    switch (adminTab) {
      case 'DASHBOARD': return 'Visão Geral & Gráficos de Desempenho';
      case 'FINANCEIRO': return 'Inteligência Financeira & Fluxo de Caixa';
      case 'ESTOQUE': return 'Controle de Estoque & Fichas Técnicas';
      case 'PRODUTOS': return 'Gestão de Cardápio & Insumos por Produto';
      default: return 'Painel Administrativo';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-amber-500 selection:text-white">
      
      {/* Left Sidebar Panel */}
      <Sidebar 
        activePortal={activePortal} 
        setActivePortal={setActivePortal} 
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area on Right */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Unified Top Header Bar with Hamburger Button */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-md">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-800 transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center group"
              title="Abrir Painel Administrativo"
              aria-label="Abrir Painel Administrativo"
            >
              <Menu className="w-6 h-6 transition-transform group-hover:scale-110" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-950 shadow-md text-lg flex-shrink-0">
                🍔
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <span>L&A SALGADOS</span>
                  <span className="text-slate-700 hidden sm:inline">•</span>
                  <span className="text-amber-400 font-bold hidden sm:inline">Módulo {activePortal === 'ADMIN' ? 'Administrativo' : 'Operacional'}</span>
                </div>
                <h1 className="text-sm sm:text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                  <span>{getSectionTitle()}</span>
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activePortal === 'ADMIN' ? (
            <div className="space-y-6">
              {adminTab === 'DASHBOARD' && <AdminDashboard onNavigateTab={setAdminTab} />}
              {adminTab === 'FINANCEIRO' && <FinancialAnalysis />}
              {adminTab === 'ESTOQUE' && <StockInventory />}
              {adminTab === 'PRODUTOS' && <ProductManagement />}
            </div>
          ) : (
            <EmployeePortal />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

