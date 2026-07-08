import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { 
  ChefHat, Clock, CheckCircle2, AlertCircle, ArrowRight, 
  Utensils, MapPin, User, Check, Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const KitchenQueue: React.FC = () => {
  const { orders, updateOrderStatus } = useApp();
  const [filter, setFilter] = useState<'ATIVOS' | 'PRONTOS' | 'ENTREGUES'>('ATIVOS');

  const activeOrders = orders.filter(o => o.status === 'PENDENTE' || o.status === 'EM_PREPARO');
  const readyOrders = orders.filter(o => o.status === 'PRONTO');
  const deliveredOrders = orders.filter(o => o.status === 'ENTREGUE').slice(0, 8); // last 8

  const handleAdvanceStatus = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'EM_PREPARO';
    if (currentStatus === 'PENDENTE' || currentStatus === 'EM_PREPARO') {
      nextStatus = 'PRONTO';
    } else if (currentStatus === 'PRONTO') {
      nextStatus = 'ENTREGUE';
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {
        // ignore
      }
    }
    updateOrderStatus(orderId, nextStatus);
  };

  const renderOrderCard = (o: Order) => {
    const isPrep = o.status === 'EM_PREPARO' || o.status === 'PENDENTE';
    const isReady = o.status === 'PRONTO';
    const isDelivered = o.status === 'ENTREGUE';

    return (
      <div 
        key={o.id} 
        className={`bg-white rounded-3xl p-5 border shadow-xl flex flex-col justify-between transition ${
          isPrep 
            ? 'border-amber-500/50 shadow-amber-500/5' 
            : isReady 
              ? 'border-emerald-500/70 shadow-emerald-500/10 animate-pulse-slow' 
              : 'border-slate-200 opacity-70'
        }`}
      >
        <div>
          {/* Header info */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-black text-slate-900 text-base">
                #{o.orderNumber}
              </span>
              <div>
                <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>{o.customerName}</span>
                </p>
                <span className="text-[11px] text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> {o.createdAt} ({o.orderType})
                </span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              isPrep 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : isReady 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              {o.status.replace('_', ' ')}
            </span>
          </div>

          {/* Table / Location pill */}
          {o.tableNumber && (
            <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs font-bold text-amber-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>{o.tableNumber}</span>
            </div>
          )}

          {/* Items list */}
          <div className="py-4 space-y-2.5">
            {o.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs font-semibold">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                    {item.quantity}x
                  </span>
                  <div>
                    <p className="text-slate-900 font-bold">{item.productName}</p>
                    {item.notes && (
                      <p className="text-[11px] text-amber-400/90 italic bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20 mt-1">
                        ⚠️ Nota: {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-3 border-t border-slate-200">
          {!isDelivered ? (
            <button
              onClick={() => handleAdvanceStatus(o.id, o.status)}
              className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                isPrep 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-95' 
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 active:scale-95'
              }`}
            >
              {isPrep ? (
                <>
                  <Flame className="w-4 h-4" />
                  <span>Marcar como PRONTO PARA ENTREGA</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Entregar & Baixar Estoque</span>
                </>
              )}
            </button>
          ) : (
            <div className="py-2.5 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 bg-emerald-950/30 rounded-2xl border border-emerald-500/20">
              <Check className="w-4 h-4" /> Pedido Entregue e Baixado
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* KDS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-3xl border border-slate-200 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-400" />
            <span>KDS - Fila de Pedidos da Cozinha</span>
          </h2>
          <p className="text-xs text-slate-700 mt-1">
            Gere ordens de preparo, acompanhe a produção na chapa e notifique os atendentes do balcão em tempo real.
          </p>
        </div>

        {/* Status Filter buttons */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setFilter('ATIVOS')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              filter === 'ATIVOS' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <span>Em Preparo ({activeOrders.length})</span>
          </button>
          <button
            onClick={() => setFilter('PRONTOS')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              filter === 'PRONTOS' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <span>Prontos ({readyOrders.length})</span>
          </button>
          <button
            onClick={() => setFilter('ENTREGUES')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
              filter === 'ENTREGUES' ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <span>Concluídos ({deliveredOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Grid of KDS Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filter === 'ATIVOS' && (
          activeOrders.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-700 bg-white rounded-3xl border border-slate-200 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <p className="text-sm font-bold text-slate-900">Excelente! Cozinha em dia e sem fila de espera.</p>
              <p className="text-xs text-slate-600">Novos pedidos lançados no PDV aparecerão nesta tela automaticamente.</p>
            </div>
          ) : (
            activeOrders.map(o => renderOrderCard(o))
          )
        )}

        {filter === 'PRONTOS' && (
          readyOrders.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-700 bg-white rounded-3xl border border-slate-200">
              Nenhum pedido aguardando retirada no balcão no momento.
            </div>
          ) : (
            readyOrders.map(o => renderOrderCard(o))
          )
        )}

        {filter === 'ENTREGUES' && (
          deliveredOrders.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-700 bg-white rounded-3xl border border-slate-200">
              Nenhum pedido entregue recentemente no turno.
            </div>
          ) : (
            deliveredOrders.map(o => renderOrderCard(o))
          )
        )}
      </div>

    </div>
  );
};
