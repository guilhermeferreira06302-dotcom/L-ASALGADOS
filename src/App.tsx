import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { FinancialAnalysis } from './components/admin/FinancialAnalysis';
import { StockInventory } from './components/admin/StockInventory';
import { ProductManagement } from './components/admin/ProductManagement';
import { StockMovements } from './components/admin/StockMovements';
import { ReceitasDespesas } from './components/admin/ReceitasDespesas';
import { ShiftManagement } from './components/admin/ShiftManagement';
import { EmployeePortal } from './components/employee/EmployeePortal';
import { Menu, Lock } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentUser, currentShift } = useApp();
  const [activePortal, setActivePortal] = useState<'ADMIN' | 'FUNCIONARIO'>(
    currentUser?.role === 'ADMIN' ? 'ADMIN' : 'FUNCIONARIO'
  );
  const [adminTab, setAdminTab] = useState<string>('DASHBOARD');
  const [employeeTab, setEmployeeTab] = useState<'SHIFT' | 'OPERACAO'>('SHIFT');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [employeeAction, setEmployeeAction] = useState<'ENTRADA' | 'SAIDA' | null>(null);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Update current hour periodically to handle shifts correctly if left open
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
    if (activePortal === 'FUNCIONARIO') {
      if (employeeTab === 'SHIFT') return !currentShift ? 'Abertura de Turno' : 'Gestão do Turno Atual';
      return 'Terminal do Operador / PDV';
    }
    switch (adminTab) {
      case 'DASHBOARD': return 'Visão Geral & Gráficos de Desempenho';
      case 'FINANCEIRO': return 'Inteligência Financeira & Fluxo de Caixa';
      case 'RECEITAS_DESPESAS': return 'Receitas / Despesas';
      case 'ESTOQUE': return 'Controle de Estoque & Fichas Técnicas';
      case 'MOVIMENTACAO': return 'Histórico de Movimentações';
      case 'PRODUTOS': return 'Gestão de Cardápio & Insumos por Produto';
      case 'SHIFT': return 'Gestão de Turno / Caixa';
      default: return 'Painel Administrativo';
    }
  };

  const isOperatingHours = currentHour >= 3 && currentHour < 23;
  const isEmployeeLocked = activePortal === 'FUNCIONARIO' && !isOperatingHours;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-amber-500 selection:text-white">
      
      {/* Left Sidebar Panel */}
      <Sidebar 
        activePortal={activePortal} 
        setActivePortal={setActivePortal} 
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        employeeTab={employeeTab}
        setEmployeeTab={setEmployeeTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area on Right */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Unified Top Header Bar with Hamburger Button */}
        {!(activePortal === 'FUNCIONARIO' && employeeAction !== null) && (
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
      )}

        {/* Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {activePortal === 'ADMIN' ? (
            <div className="space-y-6">
              {adminTab === 'DASHBOARD' && <AdminDashboard onNavigateTab={setAdminTab} />}
              {adminTab === 'FINANCEIRO' && <FinancialAnalysis />}
              {adminTab === 'RECEITAS_DESPESAS' && <ReceitasDespesas />}
              {adminTab === 'ESTOQUE' && <StockInventory />}
              {adminTab === 'MOVIMENTACAO' && <StockMovements />}
              {adminTab === 'PRODUTOS' && <ProductManagement />}
              {adminTab === 'SHIFT' && <ShiftManagement isAdminView />}
            </div>
          ) : isEmployeeLocked ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300 h-full min-h-[60vh]">
              <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-xl max-w-md w-full text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-100">
                  <Lock className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Sistema Bloqueado</h2>
                  <p className="text-sm text-slate-600 mt-2 font-medium">
                    Fora do horário de expediente operacional.
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-700">
                  <p>O sistema está disponível para operações e fechamento de caixa somente entre <strong className="text-slate-900 font-extrabold">03:00</strong> e <strong className="text-slate-900 font-extrabold">23:00</strong>.</p>
                  <p className="mt-2 text-[11px] text-slate-500">Apenas o administrador possui acesso fora desse horário.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {employeeTab === 'SHIFT' && <ShiftManagement />}
              {employeeTab === 'OPERACAO' && (
                !currentShift ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
                      <h2 className="text-xl font-bold text-slate-900">Operação Bloqueada</h2>
                      <p className="text-sm text-slate-600">Você precisa abrir o turno antes de realizar movimentações.</p>
                      <button 
                        onClick={() => setEmployeeTab('SHIFT')}
                        className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold shadow-md hover:bg-emerald-600 transition cursor-pointer"
                      >
                        Ir para Abertura de Turno
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmployeePortal onActionChange={setEmployeeAction} />
                )
              )}
            </div>
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

