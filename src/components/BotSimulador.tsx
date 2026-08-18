import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const BotSimulador: React.FC = () => {
  const app = useApp();
  const [isRunning, setIsRunning] = useState(true);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutos
  const [logs, setLogs] = useState<string[]>([]);
  
  // Use a ref for app so we don't need it in the dependency array
  const appRef = useRef(app);
  useEffect(() => {
    appRef.current = app;
  }, [app]);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  useEffect(() => {
    // Reset timer when component mounts or is active
    setTimeLeft(180);
    setIsRunning(true);
  }, []);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft === 0 && isRunning) {
        setIsRunning(false);
        addLog('Simulação concluída (3 minutos).');
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const actionTimer = setInterval(() => {
      const currentApp = appRef.current;
      const actions = ['ORDER', 'STOCK', 'TRANSACTION', 'PRODUCT'];
      const action = actions[Math.floor(Math.random() * actions.length)];

      switch (action) {
        case 'ORDER':
          if (currentApp.products.length > 0) {
            const randomProd = currentApp.products[Math.floor(Math.random() * currentApp.products.length)];
            const quantity = Math.floor(Math.random() * 15) + 5; // 5 a 20 itens por pedido!
            const total = randomProd.price * quantity;
            currentApp.createOrder({
              items: [{ productId: randomProd.id, productName: randomProd.name, quantity, price: randomProd.price }],
              total: total,
              paymentMethod: 'PIX',
              customerName: 'Cliente VIP Simulado',
              orderType: 'BALCAO',
              cashierName: 'Bot Turbo'
            });
            addLog(`Mega Pedido: ${quantity}x ${randomProd.name} (R$ ${total.toFixed(2)})`);
          } else {
             const num = Math.floor(Math.random() * 1000);
             currentApp.addProduct({
               name: `Combo Prime ${num}`,
               category: 'COMBO',
               price: 189.90 + (Math.random() * 100), // Preço altíssimo
               costPrice: 25.00 + (Math.random() * 15), // Custo baixo -> Alta Margem
               image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop&q=80',
               available: true,
               description: 'Lançamento Exclusivo pelo Bot Turbo',
               prepTimeMin: 15,
               salesCountMonthly: Math.floor(Math.random() * 500),
               minStock: 20,
               maxStock: 100,
               recipe: []
             });
             addLog(`Produto Premium Criado: Combo Prime ${num}`);
          }
          break;
        case 'TRANSACTION':
          const amount = Math.floor(Math.random() * 5000) + 1000; // 1000 a 6000
          const isSaida = Math.random() > 0.8; // Apenas 20% de chance de ser saída, 80% entrada!
          const outCategories: any[] = ['MANUTENCAO', 'SALARIO', 'FORNECEDOR', 'IMPOSTOS'];
          
          currentApp.addTransaction({
            date: new Date().toBRTISOString().toBRTDateString(),
            type: isSaida ? 'SAIDA' : 'ENTRADA',
            category: isSaida ? outCategories[Math.floor(Math.random() * outCategories.length)] : 'VENDAS',
            amount: amount,
            description: `Patrocínio / Venda B2B Bot: ${isSaida ? 'Despesa' : 'Receita Gigante'}`
          });
          addLog(`Transação: R$ ${amount.toFixed(2)} (${isSaida ? 'SAÍDA' : 'MEGA ENTRADA'})`);
          break;
        case 'PRODUCT':
          if (Math.random() > 0.3) { // 70% chance to create products if this case is hit
            const num = Math.floor(Math.random() * 1000);
            currentApp.addProduct({
              name: `Combo Prime ${num}`,
              category: 'COMBO',
              price: 189.90 + (Math.random() * 100),
              costPrice: 25.00 + (Math.random() * 15),
              image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop&q=80',
              available: true,
              description: 'Lançamento Exclusivo pelo Bot Turbo',
              prepTimeMin: 15,
              salesCountMonthly: Math.floor(Math.random() * 500),
              minStock: 20,
              maxStock: 100,
              recipe: []
            });
            addLog(`Produto Premium Criado: Combo Prime ${num}`);
          }
          break;
        case 'STOCK':
          if (currentApp.ingredients.length === 0 || Math.random() > 0.7) {
             const numIng = Math.floor(Math.random() * 100);
             currentApp.addIngredient({
               name: `Insumo Teste ${numIng}`,
               currentStock: 50,
               minStock: 10,
               maxStock: 100,
               category: 'GERAL',
               costPerUnit: 2.50,
               supplier: 'Fornecedor Bot',
               operator: 'Bot',
               unit: 'un'
             });
             addLog(`Novo insumo cadastrado: Insumo Teste ${numIng}`);
          } else if (currentApp.ingredients.length > 0) {
            const randomIng = currentApp.ingredients[Math.floor(Math.random() * currentApp.ingredients.length)];
            const isLoss = Math.random() > 0.7; // 30% chance of loss
            const change = isLoss ? -(Math.floor(Math.random() * 5) + 1) : Math.floor(Math.random() * 10) - 3;
            
            if (change !== 0) {
              const reason = isLoss ? 'Prejuízo' : (change > 0 ? 'Compra' : 'Uso Padrão');
              currentApp.adjustStock(randomIng.id, change, reason, 'Bot Simulado');
              addLog(`Estoque ajustado: ${randomIng.name} (${change > 0 ? '+' : ''}${change}) - ${reason}`);
            }
          }
          break;
      }
    }, 1500); // Executa uma ação a cada 1.5 segundos

    return () => {
      clearInterval(timer);
      clearInterval(actionTimer);
    };
  }, [isRunning]); // Remove timeLeft e app das dependências para não resetar o intervalo

  if (!isRunning && timeLeft <= 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 w-80">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-amber-500 flex items-center gap-2">
          🤖 Bot de Testes
        </h3>
        <span className="text-xs bg-slate-800 px-2 py-1 rounded">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </span>
      </div>
      
      <div className="space-y-1 mb-3 h-24 overflow-y-hidden flex flex-col justify-end">
        {logs.map((log, i) => (
          <div key={i} className="text-xs text-slate-300 border-l-2 border-amber-500 pl-2 opacity-80 mb-1">
            {log}
          </div>
        ))}
      </div>

      <button 
        onClick={() => setIsRunning(!isRunning)}
        className={`w-full py-2 rounded text-sm font-bold transition-colors ${isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
      >
        {isRunning ? 'Pausar Simulação' : 'Retomar Simulação'}
      </button>
    </div>
  );
};
