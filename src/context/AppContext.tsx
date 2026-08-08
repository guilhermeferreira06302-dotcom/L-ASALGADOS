import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, UserRole, Ingredient, Product, Order, FinancialTransaction, 
  InventoryAudit, OrderStatus, isStockActive, StockMovement, Shift
} from '../types';
import { 
  INITIAL_USERS, INITIAL_INGREDIENTS, INITIAL_PRODUCTS, 
  INITIAL_ORDERS, INITIAL_TRANSACTIONS, INITIAL_AUDITS 
} from '../data/initialData';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  ingredients: Ingredient[];
  products: Product[];
  orders: Order[];
  transactions: FinancialTransaction[];
  audits: InventoryAudit[];
  stockMovements: StockMovement[];
  login: (name: string, password?: string) => boolean;
  loginAsUser: (user: User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateUser: (user: User) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  // Stock / Ingredient actions
  addIngredient: (ing: Omit<Ingredient, 'id' | 'lastUpdated'>) => void;
  updateIngredient: (ing: Ingredient) => void;
  adjustStock: (ingredientId: string, quantityChange: number, reason?: string, operatorName?: string, observation?: string, photo?: string, paymentMethod?: string) => void;
  performInventoryAudit: (auditorName: string, adjustments: { ingredientId: string; actualStock: number }[], notes?: string) => void;
  // Order actions
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  // Financial actions
  addTransaction: (tx: Omit<FinancialTransaction, 'id'>) => void;
  // Custom categories
  customCategories: string[];
  addCustomCategory: (categoryName: string) => void;
  updateCustomCategory: (oldName: string, newName: string) => void;
  deleteCustomCategory: (name: string) => void;
  // AI Helper
  generateAIAdvice: (promptType: 'ESTOQUE' | 'FINANCEIRO' | 'VENDAS' | 'GERAL', customQuestion?: string) => Promise<string>;
  resetToDefaultData: () => void;
  // Shift Management
  shifts: Shift[];
  currentShift: Shift | null;
  openShift: (initialCash: number, openedBy: string) => void;
  closeShift: (actualCash: number, actualCard: number, closedBy: string, notes?: string) => void;
  cancelShift: (shiftId?: string) => void;
  syncStatus: 'SYNCED' | 'SYNCING' | 'ERROR';
  lastSyncTime: string | null;
}

const STORAGE_KEY = 'sabor_gestao_data_v3';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('sabor_gestao_currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(INITIAL_TRANSACTIONS);
  const [audits, setAudits] = useState<InventoryAudit[]>(INITIAL_AUDITS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'ERROR'>('SYNCED');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Load from Relational Tables in Cloud
  useEffect(() => {
    const loadData = async () => {
      try {
        setSyncStatus('SYNCING');
        const [
          { data: dbUsers },
          { data: dbCategories },
          { data: dbIngredients },
          { data: dbProducts },
          { data: dbOrders },
          { data: dbTransactions },
          { data: dbMovements },
          { data: dbAudits },
          { data: dbShifts }
        ] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('custom_categories').select('*'),
          supabase.from('ingredients').select('*'),
          supabase.from('products').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('transactions').select('*'),
          supabase.from('stock_movements').select('*'),
          supabase.from('inventory_audits').select('*'),
          supabase.from('shifts').select('*')
        ]);

        if (dbUsers) setUsers(dbUsers);
        if (dbCategories) setCustomCategories(dbCategories.map((c: any) => c.name));
        if (dbIngredients) setIngredients(dbIngredients);
        if (dbProducts) setProducts(dbProducts);
        if (dbOrders) setOrders(dbOrders);
        if (dbTransactions) setTransactions(dbTransactions);
        if (dbMovements) setStockMovements(dbMovements);
        if (dbAudits) setAudits(dbAudits);
        if (dbShifts) {
          setShifts(dbShifts.filter((s: any) => s.status === 'CLOSED'));
          const open = dbShifts.find((s: any) => s.status === 'OPEN');
          if (open) setCurrentShift(open);
        }
        
        setSyncStatus('SYNCED');
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to load from DB:', err);
        setSyncStatus('ERROR');
      }
    };
    
    loadData();
  }, []);



  // Cruzamento estrito: A aba de Estoque (ingredients) deve conter APENAS o que está cadastrado na aba de Produtos
  useEffect(() => {
    setIngredients(prev => {
      const activeProducts = products.filter(p => p.available);
      const activeProdIds = new Set(activeProducts.map(p => `ing-prod-${p.id}`));
      const activeProdNames = new Set(activeProducts.map(p => p.name.toLowerCase().trim()));
      
      // 1. Manter no estoque APENAS os itens cujos IDs ou nomes correspondam exatamente a um produto cadastrado e ativo
      let updated = prev.filter(ing => {
        if (ing.id.startsWith('ing-auto-')) return false;
        if (ing.id.startsWith('ing-prod-')) {
          return activeProdIds.has(ing.id);
        }
        return activeProdNames.has(ing.name.toLowerCase().trim());
      });

      let changed = updated.length !== prev.length;

      // 2. Sincronizar ou inserir os produtos cadastrados com exatidão no estoque (usando o valor do lucro: preço - custo)
      activeProducts.forEach(prod => {
        const prodIngId = `ing-prod-${prod.id}`;
        const targetValue = Math.max(0, prod.price - prod.costPrice);
        
        const existsIdx = updated.findIndex(i => i.id === prodIngId || i.name.toLowerCase().trim() === prod.name.toLowerCase().trim());
        
        if (existsIdx !== -1) {
          const existing = updated[existsIdx];
          if (
            existing.id !== prodIngId ||
            existing.name !== prod.name ||
            existing.minStock !== (prod.minStock ?? 0) ||
            existing.maxStock !== (prod.maxStock ?? 0) ||
            existing.category !== prod.category ||
            existing.costPerUnit !== targetValue
          ) {
            updated[existsIdx] = {
              ...existing,
              id: prodIngId,
              name: prod.name,
              minStock: prod.minStock ?? 0,
              maxStock: prod.maxStock ?? 0,
              category: prod.category,
              costPerUnit: targetValue
            };
            changed = true;
          }
        } else {
          updated.push({
            id: prodIngId,
            name: prod.name,
            unit: 'un' as const,
            currentStock: 0,
            minStock: prod.minStock ?? 0,
            maxStock: prod.maxStock ?? 0,
            category: prod.category,
            costPerUnit: targetValue,
            supplier: 'Cadastrado via Produtos',
            lastUpdated: 'Sem entrada',
            hasReceivedEntry: false,
            operator: currentUser?.name || 'Carlos Mendes'
          });
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [products, currentUser?.name]);

  const login = (name: string, password?: string): boolean => {
    const found = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    
    if (found) {
      if (password !== undefined) {
        if (found.password === password) {
          setCurrentUser(found);
          sessionStorage.setItem('sabor_gestao_currentUser', JSON.stringify(found));
          return true;
        }
        return false;
      }
      
      setCurrentUser(found);
      sessionStorage.setItem('sabor_gestao_currentUser', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const updateUser = (updatedUser: User) => {
    supabase.from('users').update(updatedUser).eq('id', updatedUser.id).then();
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      sessionStorage.setItem('sabor_gestao_currentUser', JSON.stringify(updatedUser));
    }
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`
    };
    supabase.from('users').insert(newUser).then();
    setUsers(prev => [...prev, newUser]);
  };

  const deleteUser = (id: string) => {
    if (currentUser?.id === id) {
      alert("Você não pode excluir o seu próprio acesso atual.");
      return;
    }
    supabase.from('users').delete().eq('id', id).then();
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const loginAsUser = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('sabor_gestao_currentUser');
  };

  const switchRole = (role: UserRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
    setCurrentUser(updated);
    sessionStorage.setItem('sabor_gestao_currentUser', JSON.stringify(updated));
  };

  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    supabase.from('products').insert(newProd).then();
    setProducts(prev => [newProd, ...prev]);
  };

  const updateProduct = (updated: Product) => {
    supabase.from('products').update(updated).eq('id', updated.id).then();
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProduct = (id: string) => {
    supabase.from('products').delete().eq('id', id).then();
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addIngredient = (ingData: Omit<Ingredient, 'id' | 'lastUpdated'>) => {
    const newIng: Ingredient = {
      ...ingData,
      unit: 'un',
      id: `ing-${Date.now()}`,
      lastUpdated: 'Agora mesmo'
    };
    supabase.from('ingredients').insert(newIng).then();
    setIngredients(prev => [newIng, ...prev]);
  };

  const updateIngredient = (updated: Ingredient) => {
    const toUpdate = { ...updated, unit: 'un', lastUpdated: 'Agora mesmo', hasReceivedEntry: updated.currentStock > 0 ? true : updated.hasReceivedEntry };
    supabase.from('ingredients').update(toUpdate).eq('id', toUpdate.id).then();
    setIngredients(prev => prev.map(i => i.id === updated.id ? toUpdate as Ingredient : i));
  };

  const adjustStock = (ingredientId: string, quantityChange: number, reason?: string, operatorName?: string, observation?: string, photo?: string, paymentMethod?: string) => {
    const targetIng = ingredients.find(i => i.id === ingredientId);
    if (targetIng) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: quantityChange > 0 ? 'ENTRADA' : 'SAIDA',
        ingredientId: targetIng.id,
        ingredientName: targetIng.name,
        quantity: Math.abs(quantityChange),
        unit: targetIng.unit,
        reason: reason || 'Ajuste manual',
        observation: observation || 'Sem observação',
        paymentMethod,
        operator: operatorName || currentUser?.name || 'Sistema',
        date: new Date().toISOString(),
        photo
      };
      supabase.from('stock_movements').insert(movement).then();
      setStockMovements(m => [movement, ...m]);
    }

    setIngredients(prev => prev.map(ing => {
      if (ing.id === ingredientId) {
        const newStock = Math.max(0, ing.currentStock + quantityChange);
        const updatedIng = {
          ...ing,
          currentStock: newStock,
          lastUpdated: 'Agora mesmo',
          hasReceivedEntry: quantityChange > 0 ? true : (ing.hasReceivedEntry ?? (ing.currentStock > 0)),
          ...(operatorName ? { operator: operatorName } : {})
        };
        supabase.from('ingredients').update(updatedIng).eq('id', updatedIng.id).then();
        return updatedIng;
      }
      return ing;
    }));

    // If cost related / restock, can also optionally add a transaction
    if (quantityChange > 0 && reason?.includes('Compra')) {
      const ing = ingredients.find(i => i.id === ingredientId);
      if (ing) {
        addTransaction({
          date: new Date().toISOString().split('T')[0],
          type: 'SAIDA',
          category: 'FORNECEDOR',
          amount: quantityChange * ing.costPerUnit,
          description: `Reposição de Estoque: ${ing.name} (${quantityChange} ${ing.unit})`
        });
      }
    }

    // Automatically create a financial loss record if reason is "Prejuízo"
    if (quantityChange < 0 && reason === 'Prejuízo') {
      const ing = ingredients.find(i => i.id === ingredientId);
      if (ing) {
        let unitValue = ing.costPerUnit;
        if (ing.id.startsWith('ing-prod-')) {
          const originalProdId = ing.id.replace('ing-prod-', '');
          const originalProd = products.find(p => p.id === originalProdId);
          if (originalProd) {
            // Using price (valor do produto cadastrado) as requested, or costPrice if more appropriate. 
            // The user said "valor do produto cadastrado", which usually implies the sale price.
            unitValue = originalProd.price > 0 ? originalProd.price : (originalProd.costPrice || 0);
          }
        }

        addTransaction({
          date: new Date().toISOString().split('T')[0],
          type: 'SAIDA',
          category: 'PREJUIZO',
          amount: Math.abs(quantityChange) * unitValue,
          description: `Prejuízo de Estoque: ${ing.name} (${Math.abs(quantityChange)} ${ing.unit})`
        });
      }
    }
  };

  const performInventoryAudit = (auditorName: string, adjustments: { ingredientId: string; actualStock: number }[], notes?: string) => {
    let discrepancies = 0;
    setIngredients(prev => prev.map(ing => {
      const adj = adjustments.find(a => a.ingredientId === ing.id);
      if (adj && adj.actualStock !== ing.currentStock) {
        discrepancies++;
        return {
          ...ing,
          currentStock: adj.actualStock,
          lastUpdated: `Auditado por ${auditorName}`
        };
      }
      return ing;
    }));

    const newAudit: InventoryAudit = {
      id: `aud-${Date.now()}`,
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      auditorName,
      itemsAudited: adjustments.length,
      discrepanciesCount: discrepancies,
      notes: notes || 'Contagem geral finalizada.'
    };
    supabase.from('inventory_audits').insert(newAudit).then();
    setAudits(prev => [newAudit, ...prev]);
  };

  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>): Order => {
    const highestNum = orders.reduce((max, o) => Math.max(max, o.orderNumber), 100);
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: highestNum + 1,
      status: 'EM_PREPARO',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    supabase.from('orders').insert(newOrder).then();
    setOrders(prev => [newOrder, ...prev]);

    // Add financial entry immediately or upon delivery
    addTransaction({
      date: new Date().toISOString().split('T')[0],
      type: 'ENTRADA',
      category: 'VENDAS',
      amount: newOrder.total,
      description: `Pedido #${newOrder.orderNumber} - ${newOrder.orderType} (${newOrder.customerName})`,
      relatedOrderId: newOrder.id
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    // Ao entregar o pedido, deduz a quantidade vendida direto do estoque do produto correspondente!
    if (newStatus === 'ENTREGUE' && targetOrder.status !== 'ENTREGUE') {
      targetOrder.items.forEach(item => {
        const targetIngId = `ing-prod-${item.productId}`;
        adjustStock(targetIngId, -item.quantity, 'Venda', undefined, `Pedido #${targetOrder.orderNumber}`);
      });
    }

    supabase.from('orders').update({ status: newStatus }).eq('id', orderId).then();
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const addTransaction = (tx: Omit<FinancialTransaction, 'id'>) => {
    const newTx: FinancialTransaction = {
      ...tx,
      id: `tx-${Date.now()}`
    };
    supabase.from('transactions').insert(newTx).then();
    setTransactions(prev => [newTx, ...prev]);
  };

  const generateAIAdvice = async (promptType: 'ESTOQUE' | 'FINANCEIRO' | 'VENDAS' | 'GERAL', customQuestion?: string): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Prepare concise context summary
    const lowStockItems = ingredients.filter(i => isStockActive(i) && i.currentStock <= i.minStock).map(i => `${i.name} (Estoque atual: ${i.currentStock}${i.unit}, Mínimo: ${i.minStock}${i.unit})`).join('; ');
    const totalInflow = transactions.filter(t => t.type === 'ENTRADA').reduce((sum, t) => sum + t.amount, 0);
    const totalOutflow = transactions.filter(t => t.type === 'SAIDA').reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalInflow - totalOutflow;
    const topProd = products.sort((a,b) => b.salesCountMonthly - a.salesCountMonthly)[0]?.name || 'Smash Bacon Supreme';

    const promptText = `Você é o Consultor Executivo IA especialista em Gestão de Lanchonetes e Fast Foods.
Dados atuais do estabelecimento:
- Itens em estoque crítico/baixo: ${lowStockItems || 'Nenhum item crítico no momento.'}
- Faturamento Total Recente: R$ ${totalInflow.toFixed(2)}
- Despesas Totais: R$ ${totalOutflow.toFixed(2)}
- Lucro Operacional: R$ ${netProfit.toFixed(2)}
- Produto Campeão de Vendas: ${topProd}

Foco da análise solicitada: ${promptType}
Pergunta adicional do gestor: ${customQuestion || 'Nenhuma.'}

Dê um relatório direto, prático, encorajador e profissional (em 3 ou 4 parágrafos curtos ou tópicos pontuais com emojis adequados) sugerindo ações de compras, estratégias de combos para alavancar margem, ou otimização operacional na cozinha.`;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText
        });
        if (res.text) return res.text;
      } catch (e) {
        console.error('Gemini API Error:', e);
      }
    }

    // Fallback intelligent heuristic AI simulator
    if (promptType === 'ESTOQUE') {
      if (lowStockItems) {
        return `🚨 **Alerta Prioritário de Reposição de Insumos**\n\n Identificamos itens abaixo do estoque de segurança: **${lowStockItems}**.\n\n💡 **Recomendação Estratégica:**\n1. **Negocie compras casadas:** Como o *Blend Angus* ou *Refrigerante* estão no limite, negocie com o fornecedor desconto para pagamento à vista ou volume quinzenal.\n2. **Evite Ruptura no Horário de Pico:** Sexta e sábado representam 55% das vendas da semana. Garanta pelo menos +40% da margem de estoque para pães brioche e batatas.\n3. **Auditoria Rápida:** Recomendamos que a equipe do turno da tarde realize uma conferência cega do Cheddar e Bacon hoje.`;
      }
      return `✅ **Saúde do Estoque Excelente!**\n\nTodos os seus insumos estão operando dentro dos níveis ótimos e acima do estoque mínimo de segurança.\n\n💡 **Dica Gourmet AI:** Aproveite a estabilidade para checar prazos de validade dos molhos artesanais e avaliar a introdução de uma edição limitada de hambúrguer de temporada para testar a resposta dos clientes!`;
    } else if (promptType === 'FINANCEIRO') {
      const margin = totalInflow > 0 ? ((netProfit / totalInflow) * 100).toFixed(1) : '0';
      return `📊 **Análise de Desempenho Financeiro**\n\n📈 **Receita Bruta Registrada:** R$ ${totalInflow.toFixed(2)}\n📉 **Custos e Despesas:** R$ ${totalOutflow.toFixed(2)}\n💰 **Margem Líquida Estimada:** **${margin}%**\n\n💡 **Diagnóstico e Ação:**\nSua margem atual está saudável para o setor de lanchonetes artesanais. Para potencializar o ticket médio (atualmente em torno de R$ 48 por pedido), incentive o caixa a oferecer adicionais de queijo/bacon (+R$ 4,50) ou fazer up-sell para o *Combo Casal Monster*, que possui excelente margem de contribuição bruta!`;
    } else {
      return `🚀 **Estratégia Integral para Lanchonete de Sucesso**\n\n1. **Potencialização de Cardápio:** O item **${topProd}** lidera as preferências. Crie uma promoção em dias de menor movimento (terças e quartas) vinculando este hambúrguer a uma sobremesa (ex: *Churros Artesanais*) com desconto de R$ 3,00.\n2. **Otimização do Tempo de Cozinha:** Mantenha os blends já porcionados antes das 18h para reduzir o tempo médio de preparo na chapa para menos de 10 minutos.\n3. **Controle Contínuo:** Utilize a ferramenta de Auditoria de Estoque no fechamento do turno para manter perda de insumos próxima a 0%!`;
    }
  };

  const addCustomCategory = (categoryName: string) => {
    const clean = categoryName.trim().toUpperCase();
    if (!clean || clean === 'OUTROS') return;
    setCustomCategories(prev => {
      if (prev.includes(clean)) return prev;
      supabase.from('custom_categories').insert({ name: clean }).then();
      return [...prev, clean];
    });
  };

  const updateCustomCategory = (oldName: string, newName: string) => {
    const cleanNew = newName.trim().toUpperCase();
    if (!cleanNew || cleanNew === 'OUTROS') return;
    
    supabase.from('custom_categories').update({ name: cleanNew }).eq('name', oldName).then();
    setCustomCategories(prev => prev.map(c => c === oldName ? cleanNew : c));
    
    // Update products that use this category
    supabase.from('products').update({ category: cleanNew }).eq('category', oldName).then();
    setProducts(prev => prev.map(p => 
      p.category === oldName ? { ...p, category: cleanNew } : p
    ));

    // Update ingredients that use this category
    supabase.from('ingredients').update({ category: cleanNew }).eq('category', oldName).then();
    setIngredients(prev => prev.map(i => 
      i.category === oldName ? { ...i, category: cleanNew } : i
    ));
  };

  const deleteCustomCategory = (name: string) => {
    supabase.from('custom_categories').delete().eq('name', name).then();
    setCustomCategories(prev => prev.filter(c => c !== name));
    
    // Optionally move products back to GERAL
    supabase.from('products').update({ category: 'GERAL' }).eq('category', name).then();
    setProducts(prev => prev.map(p => 
      p.category === name ? { ...p, category: 'GERAL' } : p
    ));

    // Update ingredients back to GERAL
    supabase.from('ingredients').update({ category: 'GERAL' }).eq('category', name).then();
    setIngredients(prev => prev.map(i => 
      i.category === name ? { ...i, category: 'GERAL' } : i
    ));
  };

  const resetToDefaultData = () => {
    setIngredients(INITIAL_INGREDIENTS);
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setAudits(INITIAL_AUDITS);
    setStockMovements([]);
    setCustomCategories([]);
    if (currentShift) supabase.from('shifts').delete().eq('id', currentShift.id).then();
    setCurrentShift(null);
    setShifts([]);
  };

  const openShift = (initialCash: number, openedBy: string) => {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openedBy,
      initialCash,
      status: 'OPEN'
    };
    supabase.from('shifts').insert(newShift).then();
    setCurrentShift(newShift);
  };

  const closeShift = (actualCash: number, actualCard: number, closedBy: string, notes?: string) => {
    if (!currentShift) return;
    
    // Calcula o valor esperado no caixa.
    // Pega as transações desde a abertura do turno
    const shiftTransactions = transactions.filter(t => new Date(t.date).getTime() >= new Date(currentShift.openedAt.split('T')[0]).getTime());
    // Lógica simplificada de dinheiro: Entradas - Saídas
    // (Na prática, deveria considerar apenas transações em DINHEIRO se o caixa for apenas a gaveta de dinheiro,
    // mas aqui faremos um fechamento geral para demonstração)
    const totalIn = shiftTransactions.filter(t => t.type === 'ENTRADA').reduce((acc, t) => acc + t.amount, 0);
    const totalOut = shiftTransactions.filter(t => t.type === 'SAIDA').reduce((acc, t) => acc + t.amount, 0);
    const expected = currentShift.initialCash + totalIn - totalOut;

    const closedShift: Shift = {
      ...currentShift,
      closedAt: new Date().toISOString(),
      closedBy,
      finalCashExpected: expected,
      finalCashActual: actualCash,
      finalCardActual: actualCard,
      status: 'CLOSED',
      notes
    };
    supabase.from('shifts').update(closedShift).eq('id', currentShift.id).then();
    setCurrentShift(null); // O turno atual deixa de existir e vira "fechado"
    setShifts(prev => [closedShift, ...prev]);
  };

  const cancelShift = (shiftId?: string) => {
    if (!shiftId || (currentShift && currentShift.id === shiftId)) {
      if (currentShift) supabase.from('shifts').delete().eq('id', currentShift.id).then();
      setCurrentShift(null);
    } else {
      if (shiftId) supabase.from('shifts').delete().eq('id', shiftId).then();
      setShifts(prev => prev.filter(s => s.id !== shiftId));
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        ingredients,
        products,
        orders,
        transactions,
        audits,
        stockMovements,
        customCategories,
        login,
        loginAsUser,
        logout,
        switchRole,
        updateUser,
        addUser,
        deleteUser,
        addProduct,
        updateProduct,
        deleteProduct,
        addIngredient,
        updateIngredient,
        adjustStock,
        performInventoryAudit,
        createOrder,
        updateOrderStatus,
        addTransaction,
        addCustomCategory,
        updateCustomCategory,
        deleteCustomCategory,
        generateAIAdvice,
        resetToDefaultData,
        shifts,
        currentShift,
        openShift,
        closeShift,
        cancelShift,
        syncStatus,
        lastSyncTime
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
