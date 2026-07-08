import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, UserRole, Ingredient, Product, Order, FinancialTransaction, 
  InventoryAudit, OrderStatus 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_INGREDIENTS, INITIAL_PRODUCTS, 
  INITIAL_ORDERS, INITIAL_TRANSACTIONS, INITIAL_AUDITS 
} from '../data/initialData';
import { GoogleGenAI } from '@google/genai';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  ingredients: Ingredient[];
  products: Product[];
  orders: Order[];
  transactions: FinancialTransaction[];
  audits: InventoryAudit[];
  login: (email: string, role?: UserRole) => boolean;
  loginAsUser: (user: User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  // Stock / Ingredient actions
  addIngredient: (ing: Omit<Ingredient, 'id' | 'lastUpdated'>) => void;
  updateIngredient: (ing: Ingredient) => void;
  adjustStock: (ingredientId: string, quantityChange: number, reason?: string) => void;
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
}

const STORAGE_KEY = 'sabor_gestao_data_v2';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]); // default Carlos Mendes (Admin)
  const [users] = useState<User[]>(INITIAL_USERS);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(INITIAL_TRANSACTIONS);
  const [audits, setAudits] = useState<InventoryAudit[]>(INITIAL_AUDITS);
  const [customCategories, setCustomCategories] = useState<string[]>(['BURGER', 'PORCAO', 'BEBIDA', 'SOBREMESA', 'COMBO']);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.ingredients) setIngredients(parsed.ingredients);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.audits) setAudits(parsed.audits);
        if (parsed.customCategories && parsed.customCategories.length > 0) {
          setCustomCategories(parsed.customCategories);
        }
      } catch (e) {
        console.error('Failed to parse localStorage data', e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ingredients,
      products,
      orders,
      transactions,
      audits,
      customCategories
    }));
  }, [ingredients, products, orders, transactions, audits, customCategories]);

  const login = (email: string, role?: UserRole): boolean => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      return true;
    }
    // Fallback: create mock session
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0] || 'Usuário',
      email,
      role: role || 'FUNCIONARIO',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };
    setCurrentUser(newUser);
    return true;
  };

  const loginAsUser = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, role });
  };

  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addIngredient = (ingData: Omit<Ingredient, 'id' | 'lastUpdated'>) => {
    const newIng: Ingredient = {
      ...ingData,
      id: `ing-${Date.now()}`,
      lastUpdated: 'Agora mesmo'
    };
    setIngredients(prev => [newIng, ...prev]);
  };

  const updateIngredient = (updated: Ingredient) => {
    setIngredients(prev => prev.map(i => i.id === updated.id ? { ...updated, lastUpdated: 'Agora mesmo' } : i));
  };

  const adjustStock = (ingredientId: string, quantityChange: number, reason?: string) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === ingredientId) {
        const newStock = Math.max(0, ing.currentStock + quantityChange);
        return {
          ...ing,
          currentStock: newStock,
          lastUpdated: 'Agora mesmo'
        };
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

    // If changing to ENTREGUE for the first time, deduct recipe items from inventory!
    if (newStatus === 'ENTREGUE' && targetOrder.status !== 'ENTREGUE') {
      targetOrder.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod && prod.recipe) {
          prod.recipe.forEach(rec => {
            adjustStock(rec.ingredientId, -(rec.quantity * item.quantity), `Baixa automática Pedido #${targetOrder.orderNumber}`);
          });
        }
      });
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const addTransaction = (tx: Omit<FinancialTransaction, 'id'>) => {
    const newTx: FinancialTransaction = {
      ...tx,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const generateAIAdvice = async (promptType: 'ESTOQUE' | 'FINANCEIRO' | 'VENDAS' | 'GERAL', customQuestion?: string): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Prepare concise context summary
    const lowStockItems = ingredients.filter(i => i.currentStock <= i.minStock).map(i => `${i.name} (Estoque atual: ${i.currentStock}${i.unit}, Mínimo: ${i.minStock}${i.unit})`).join('; ');
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
      return [...prev, clean];
    });
  };

  const updateCustomCategory = (oldName: string, newName: string) => {
    const cleanNew = newName.trim().toUpperCase();
    if (!cleanNew || cleanNew === 'OUTROS') return;
    
    setCustomCategories(prev => prev.map(c => c === oldName ? cleanNew : c));
    
    // Update products that use this category
    setProducts(prev => prev.map(p => 
      p.category === oldName ? { ...p, category: cleanNew } : p
    ));
  };

  const deleteCustomCategory = (name: string) => {
    setCustomCategories(prev => prev.filter(c => c !== name));
    
    // Optionally move products back to GERAL
    setProducts(prev => prev.map(p => 
      p.category === name ? { ...p, category: 'GERAL' } : p
    ));
  };

  const resetToDefaultData = () => {
    setIngredients(INITIAL_INGREDIENTS);
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setAudits(INITIAL_AUDITS);
    setCustomCategories(['BURGER', 'PORCAO', 'BEBIDA', 'SOBREMESA', 'COMBO']);
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
        customCategories,
        login,
        loginAsUser,
        logout,
        switchRole,
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
        resetToDefaultData
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
