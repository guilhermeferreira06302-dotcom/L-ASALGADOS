import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Minus, Clock } from 'lucide-react';
import { MaterialMovementModal } from '../MaterialMovementModal';

interface EmployeePortalProps {
  onActionChange?: (action: 'ENTRADA' | 'SAIDA' | null) => void;
  onNavigateToShift?: () => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({ onActionChange, onNavigateToShift }) => {
  const { currentUser, currentShift } = useApp();
  const [materialModalType, setMaterialModalType] = useState<'ENTRADA' | 'SAIDA' | null>(null);

  const handleSetModalType = (type: 'ENTRADA' | 'SAIDA' | null) => {
    setMaterialModalType(type);
    if (onActionChange) onActionChange(type);
  };

  if (materialModalType) {
    return (
      <div className="max-w-3xl mx-auto">
        <MaterialMovementModal 
          type={materialModalType} 
          onClose={() => handleSetModalType(null)} 
          isInline={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Cards Separados: Bem-vindo e Botões */}
      <div className="space-y-4">
        {/* Card de Boas-vindas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h2 className="font-extrabold text-xl text-slate-900 truncate">Bem-vindo, {currentUser?.name || 'Usuário'}</h2>
              <p className="text-xs text-slate-600 font-medium truncate">Ambiente Operacional (Controle de Estoque)</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-lg">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSetModalType('ENTRADA')}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-md transition cursor-pointer border border-emerald-600/20 text-center"
            >
              <div className="p-1.5 bg-white/20 rounded-md">
                <Plus className="w-5 h-5 stroke-[3]" />
              </div>
              <span>Entrada de Material</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetModalType('SAIDA')}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-extrabold text-sm shadow-md transition cursor-pointer border border-orange-600/20 text-center"
            >
              <div className="p-1.5 bg-white/20 rounded-md">
                <Minus className="w-5 h-5 stroke-[3]" />
              </div>
              <span>Saída de Material</span>
            </button>

            {onNavigateToShift && (
              <button
                type="button"
                onClick={onNavigateToShift}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-extrabold text-sm shadow-md transition cursor-pointer border text-center mt-4 ${
                  currentShift 
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 border-rose-600/20' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-blue-600/20'
                }`}
              >
                <div className="p-1.5 bg-white/20 rounded-md">
                  <Clock className="w-5 h-5 stroke-[3]" />
                </div>
                <span>{currentShift ? 'Gerenciar / Fechar Turno' : 'Iniciar Turno'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

