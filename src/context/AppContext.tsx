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
  editStockMovement: (movementId: string, updatedData: Partial<StockMovement>) => Promise<void>;
  deleteStockMovement: (movementId: string) => Promise<void>;
  performInventoryAudit: (auditorName: string, adjustments: { ingredientId: string; actualStock: number }[], notes?: string) => void;
  // Order actions
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  // Financial actions
  addTransaction: (tx: Omit<FinancialTransaction, 'id'>) => void;
  settlePendingDebt: (movementId: string) => Promise<void>;
  convertDebtToLoss: (movementId: string) => Promise<void>;
  convertLoss: (movementId: string, target: 'PENDENTE' | 'FATURAMENTO') => Promise<void>;
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
    const savedUser = localStorage.getItem('sabor_gestao_currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [users, setUsers] = useState<User[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
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

  // Sincronização em tempo real (Realtime)
  useEffect(() => {
    const channel = supabase.channel('public-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const { table, eventType, new: newRec, old: oldRec } = payload;

        // Helper para atualizar os estados locais com base no tipo de evento
        const applyChange = (setStateFunc: React.Dispatch<React.SetStateAction<any[]>>, idField = 'id') => {
          setStateFunc((prev: any[]) => {
            if (eventType === 'INSERT') {
              // Evita duplicatas caso quem inseriu foi o próprio usuário atual
              if (prev.find(item => item[idField] === newRec[idField])) return prev;
              return [newRec, ...prev];
            } else if (eventType === 'UPDATE') {
              return prev.map(item => item[idField] === newRec[idField] ? newRec : item);
            } else if (eventType === 'DELETE') {
              return prev.filter(item => item[idField] !== oldRec[idField]);
            }
            return prev;
          });
        };

        switch (table) {
          case 'users':
            applyChange(setUsers);
            break;
          case 'products':
            applyChange(setProducts);
            break;
          case 'ingredients':
            applyChange(setIngredients);
            break;
          case 'orders':
            applyChange(setOrders);
            break;
          case 'transactions':
            applyChange(setTransactions);
            break;
          case 'stock_movements':
            applyChange(setStockMovements);
            break;
          case 'inventory_audits':
            applyChange(setAudits);
            break;
          case 'custom_categories':
            supabase.from('custom_categories').select('*').then(({data}) => {
                if (data) setCustomCategories(data.map((c: any) => c.name));
            });
            break;
          case 'shifts':
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              if (newRec.status === 'OPEN') {
                setCurrentShift(newRec as Shift);
              } else {
                setCurrentShift(prev => prev?.id === newRec.id ? null : prev);
                setShifts(prev => {
                  const filtered = prev.filter(s => s.id !== newRec.id);
                  return [newRec as Shift, ...filtered];
                });
              }
            } else if (eventType === 'DELETE') {
              setShifts(prev => prev.filter(s => s.id !== oldRec.id));
              setCurrentShift(prev => prev?.id === oldRec.id ? null : prev);
            }
            break;
        }

        setLastSyncTime(new Date().toLocaleTimeString());
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Conectado ao Supabase Realtime!');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
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
            lastUpdated: new Date().toBRTISOString(),
            hasReceivedEntry: false,
            operator: currentUser?.name || 'Sistema'
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
          localStorage.setItem('sabor_gestao_currentUser', JSON.stringify(found));
          return true;
        }
        return false;
      }
      
      setCurrentUser(found);
      localStorage.setItem('sabor_gestao_currentUser', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const updateUser = async (updatedUser: User) => {
    const { error } = await supabase.from('users').update(updatedUser).eq('id', updatedUser.id);
    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao salvar alterações no banco: ' + error.message);
      throw error;
    }
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('sabor_gestao_currentUser', JSON.stringify(updatedUser));
    }
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`
    };
    const { error } = await supabase.from('users').insert(newUser);
    if (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao salvar no banco de dados: ' + error.message);
      throw error;
    }
    setUsers(prev => [...prev, newUser]);
  };

  const deleteUser = async (id: string) => {
    if (currentUser?.id === id) {
      alert("Você não pode excluir o seu próprio acesso atual.");
      return;
    }
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao excluir no banco de dados: ' + error.message);
      throw error;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const loginAsUser = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sabor_gestao_currentUser');
  };

  const switchRole = (role: UserRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
    setCurrentUser(updated);
    localStorage.setItem('sabor_gestao_currentUser', JSON.stringify(updated));
  };

  const addProduct = async (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    const { error } = await supabase.from('products').insert(newProd);
    if (error) {
      console.error('Erro ao adicionar produto:', error);
      alert('Erro ao salvar produto no banco: ' + error.message);
      throw error;
    }
    setProducts(prev => [newProd, ...prev]);
  };

  const updateProduct = async (updated: Product) => {
    const { error } = await supabase.from('products').update(updated).eq('id', updated.id);
    if (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar produto no banco: ' + error.message);
      throw error;
    }
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao excluir produto no banco: ' + error.message);
      throw error;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addIngredient = async (ingData: Omit<Ingredient, 'id' | 'lastUpdated'>) => {
    const newIng: Ingredient = {
      ...ingData,
      unit: 'un',
      id: `ing-${Date.now()}`,
      lastUpdated: new Date().toBRTISOString()
    };
    const { error } = await supabase.from('ingredients').insert(newIng);
    if (error) {
      console.error('Erro ao adicionar insumo:', error);
      alert('Erro ao salvar insumo no banco: ' + error.message);
      throw error;
    }
    setIngredients(prev => [newIng, ...prev]);
  };

  const updateIngredient = async (updated: Ingredient) => {
    const toUpdate = { ...updated, unit: 'un', lastUpdated: new Date().toBRTISOString(), hasReceivedEntry: updated.currentStock > 0 ? true : updated.hasReceivedEntry };
    const { error } = await supabase.from('ingredients').update(toUpdate).eq('id', toUpdate.id);
    if (error) {
      console.error('Erro ao atualizar insumo:', error);
      alert('Erro ao atualizar insumo no banco: ' + error.message);
      throw error;
    }
    setIngredients(prev => prev.map(i => i.id === updated.id ? toUpdate as Ingredient : i));
  };

  const adjustStock = async (ingredientId: string, quantityChange: number, reason?: string, operatorName?: string, observation?: string, photo?: string, paymentMethod?: string) => {
    const targetIng = ingredients.find(i => i.id === ingredientId);
    if (!targetIng) return;

    // 1. Calcular o novo estado do insumo
    const newStock = Math.max(0, targetIng.currentStock + quantityChange);
    const updatedIng = {
      ...targetIng,
      currentStock: newStock,
      lastUpdated: new Date().toBRTISOString(),
      hasReceivedEntry: quantityChange > 0 ? true : (targetIng.hasReceivedEntry ?? (targetIng.currentStock > 0)),
      ...(operatorName ? { operator: operatorName } : {})
    };

    // 2. Atualizar ou Inserir (Upsert) o insumo no banco ANTES da movimentação
    // Isso garante que se for um produto-insumo que ainda não existe no DB, ele será criado,
    // evitando violação de chave estrangeira (foreign key) em stock_movements.
    const { error: errorIng } = await supabase.from('ingredients').upsert(updatedIng);
    if (errorIng) {
      console.error('Erro ao atualizar estoque do insumo:', errorIng);
      alert('Erro ao atualizar estoque no banco: ' + errorIng.message);
      throw errorIng;
    }

    // 3. Registrar a movimentação de estoque
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
      date: new Date().toBRTISOString(),
      photo
    };

    const { error: errorMov } = await supabase.from('stock_movements').insert(movement);
    if (errorMov) {
      console.error('Erro ao registrar movimentação:', errorMov);
      alert('Erro ao salvar movimentação no banco: ' + errorMov.message);
      throw errorMov;
    }

    // 4. Atualizar estados locais
    setStockMovements(m => [movement, ...m]);
    setIngredients(prev => prev.map(i => i.id === ingredientId ? updatedIng : i));

    // If cost related / restock, can also optionally add a transaction
    if (quantityChange > 0 && reason?.includes('Compra')) {
      await addTransaction({
        date: new Date().toBRTISOString().toBRTDateString(),
        type: 'SAIDA',
        category: 'FORNECEDOR',
        amount: quantityChange * updatedIng.costPerUnit,
        description: `Reposição de Estoque: ${updatedIng.name} (${quantityChange} ${updatedIng.unit})`
      });
    }

    // Automatically create a financial loss record if reason is "Prejuízo"
    if (quantityChange < 0 && reason === 'Prejuízo') {
      let unitValue = updatedIng.costPerUnit;
      if (updatedIng.id.startsWith('ing-prod-')) {
        const originalProdId = updatedIng.id.replace('ing-prod-', '');
        const originalProd = products.find(p => p.id === originalProdId);
        if (originalProd) {
          unitValue = originalProd.price > 0 ? originalProd.price : (originalProd.costPrice || 0);
        }
      }
      
      await addTransaction({
        date: new Date().toBRTISOString().toBRTDateString(),
        type: 'SAIDA',
        category: 'PREJUIZO',
        amount: Math.abs(quantityChange) * unitValue,
        description: `Prejuízo Registrado: ${updatedIng.name} (${Math.abs(quantityChange)} ${updatedIng.unit})`
      });
    }
  };

  const editStockMovement = async (movementId: string, updatedData: Partial<StockMovement>) => {
    const oldMovement = stockMovements.find(m => m.id === movementId);
    if (!oldMovement) throw new Error('Movimentação não encontrada');

    const updatedMovement = { ...oldMovement, ...updatedData };
    
    // Check if ingredient, type, or quantity changed
    const quantityChanged = oldMovement.quantity !== updatedMovement.quantity;
    const typeChanged = oldMovement.type !== updatedMovement.type;
    const ingredientChanged = oldMovement.ingredientId !== updatedMovement.ingredientId;

    if (quantityChanged || typeChanged || ingredientChanged) {
      // 1. Revert old movement from old ingredient
      const oldIng = ingredients.find(i => i.id === oldMovement.ingredientId);
      let baseStockForTarget = 0;
      
      if (oldIng) {
        const revertQty = oldMovement.type === 'ENTRADA' ? -oldMovement.quantity : oldMovement.quantity;
        const newOldStock = Math.max(0, oldIng.currentStock + revertQty);
        
        // If the ingredient changed, update state and DB for old ingredient
        if (ingredientChanged) {
          const { error: errOld } = await supabase.from('ingredients').update({ currentStock: newOldStock }).eq('id', oldIng.id);
          if (errOld) throw errOld;
          setIngredients(prev => prev.map(i => i.id === oldIng.id ? { ...i, currentStock: newOldStock } : i));
        } else {
          // If ingredient didn't change, we use newOldStock as base for the apply step
          baseStockForTarget = newOldStock;
        }
      }

      // 2. Apply new movement to new ingredient
      const targetIngId = updatedMovement.ingredientId;
      const targetIng = ingredients.find(i => i.id === targetIngId) || oldIng;
      if (targetIng) {
        const applyQty = updatedMovement.type === 'ENTRADA' ? updatedMovement.quantity : -updatedMovement.quantity;
        let baseStock = targetIng.currentStock;
        if (!ingredientChanged && oldIng) {
          baseStock = baseStockForTarget;
        }
        const finalStock = Math.max(0, baseStock + applyQty);
        
        const { error: errTarget } = await supabase.from('ingredients').update({ currentStock: finalStock }).eq('id', targetIngId);
        if (errTarget) throw errTarget;
        setIngredients(prev => prev.map(i => i.id === targetIngId ? { ...i, currentStock: finalStock } : i));
      }
    }

    // Update movement in database
    const { error } = await supabase.from('stock_movements').update(updatedMovement).eq('id', movementId);
    if (error) throw error;

    setStockMovements(prev => prev.map(m => m.id === movementId ? updatedMovement : m));
  };

  const deleteStockMovement = async (movementId: string) => {
    const targetMov = stockMovements.find(m => m.id === movementId);
    if (!targetMov) throw new Error('Movimentação não encontrada');

    // 1. Revert stock
    const targetIng = ingredients.find(i => i.id === targetMov.ingredientId);
    if (targetIng) {
      const revertQty = targetMov.type === 'ENTRADA' ? -targetMov.quantity : targetMov.quantity;
      const finalStock = Math.max(0, targetIng.currentStock + revertQty);
      
      const { error: errTarget } = await supabase.from('ingredients').update({ currentStock: finalStock }).eq('id', targetIng.id);
      if (errTarget) throw errTarget;
      setIngredients(prev => prev.map(i => i.id === targetIng.id ? { ...i, currentStock: finalStock } : i));
    }

    // 2. Delete movement from DB
    const { error } = await supabase.from('stock_movements').delete().eq('id', movementId);
    if (error) throw error;

    setStockMovements(prev => prev.filter(m => m.id !== movementId));
  };

  const performInventoryAudit = async (auditorName: string, adjustments: { ingredientId: string; actualStock: number }[], notes?: string) => {
    let discrepancies = 0;
    
    // Process all ingredient updates asynchronously
    const updatedIngredients = await Promise.all(ingredients.map(async ing => {
      const adj = adjustments.find(a => a.ingredientId === ing.id);
      if (adj && adj.actualStock !== ing.currentStock) {
        discrepancies++;
        const updatedIng = {
          ...ing,
          currentStock: adj.actualStock,
          lastUpdated: new Date().toBRTISOString(),
          operator: auditorName
        };
        const { error } = await supabase.from('ingredients').upsert(updatedIng);
        if (error) {
           console.error('Erro ao atualizar estoque na auditoria:', error);
           alert('Erro ao salvar auditoria no banco: ' + error.message);
           throw error;
        }
        return updatedIng;
      }
      return ing;
    }));
    setIngredients(updatedIngredients);

    const newAudit: InventoryAudit = {
      id: `aud-${Date.now()}`,
      date: new Date().toBRTISOString(),
      auditorName,
      itemsAudited: adjustments.length,
      discrepanciesCount: discrepancies,
      notes: notes || 'Contagem geral finalizada.'
    };
    const { error } = await supabase.from('inventory_audits').insert(newAudit);
    if (error) {
      console.error('Erro ao salvar auditoria:', error);
      alert('Erro ao registrar auditoria no banco: ' + error.message);
      throw error;
    }
    setAudits(prev => [newAudit, ...prev]);
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>): Promise<Order> => {
    const highestNum = orders.reduce((max, o) => Math.max(max, o.orderNumber), 100);
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: highestNum + 1,
      status: 'EM_PREPARO',
      createdAt: new Date().toBRTISOString()
    };
    const { error } = await supabase.from('orders').insert(newOrder);
    if (error) {
      console.error('Erro ao criar pedido:', error);
      alert('Erro ao salvar pedido no banco: ' + error.message);
      throw error;
    }
    setOrders(prev => [newOrder, ...prev]);

    // Add financial entry immediately or upon delivery
    await addTransaction({
      date: new Date().toBRTISOString().toBRTDateString(),
      type: 'ENTRADA',
      category: 'VENDAS',
      amount: newOrder.total,
      description: `Pedido #${newOrder.orderNumber} - ${newOrder.orderType} (${newOrder.customerName})`,
      relatedOrderId: newOrder.id
    });

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    // Ao entregar o pedido, deduz a quantidade vendida direto do estoque do produto correspondente!
    if (newStatus === 'ENTREGUE' && targetOrder.status !== 'ENTREGUE') {
      await Promise.all(targetOrder.items.map(async item => {
        const targetIngId = `ing-prod-${item.productId}`;
        await adjustStock(targetIngId, -item.quantity, 'Venda', undefined, `Pedido #${targetOrder.orderNumber}`);
      }));
    }

    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      alert('Erro ao atualizar pedido no banco: ' + error.message);
      throw error;
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const addTransaction = async (tx: Omit<FinancialTransaction, 'id'>) => {
    const newTx: FinancialTransaction = {
      ...tx,
      id: `tx-${Date.now()}`
    };
    const { error } = await supabase.from('transactions').insert(newTx);
    if (error) {
      console.error('Erro ao adicionar transação:', error);
      alert('Erro ao salvar transação no banco: ' + error.message);
      throw error;
    }
    setTransactions(prev => [newTx, ...prev]);
  };

  const settlePendingDebt = async (movementId: string) => {
    const targetMov = stockMovements.find(m => m.id === movementId);
    if (!targetMov) return;

    // Atualiza para 'Dinheiro' ou outra forma padrão de quitação
    const { error } = await supabase
      .from('stock_movements')
      .update({ paymentMethod: 'Dinheiro' })
      .eq('id', movementId);

    if (error) {
      console.error('Erro ao quitar dívida:', error);
      alert('Erro ao atualizar dívida no banco: ' + error.message);
      throw error;
    }

    // A atualização local será feita automaticamente pelo Realtime Subscription,
    // mas também podemos fazer otimisticamente:
    setStockMovements(prev => prev.map(m => m.id === movementId ? { ...m, paymentMethod: 'Dinheiro' } : m));
  };

  const convertDebtToLoss = async (movementId: string) => {
    const targetMov = stockMovements.find(m => m.id === movementId);
    if (!targetMov) return;

    const { error } = await supabase
      .from('stock_movements')
      .update({ paymentMethod: 'Prejuízo', reason: 'Prejuízo' })
      .eq('id', movementId);

    if (error) {
      console.error('Erro ao converter dívida para prejuízo:', error);
      alert('Erro ao atualizar banco de dados: ' + error.message);
      throw error;
    }
  };

  const convertLoss = async (movementId: string, target: 'PENDENTE' | 'FATURAMENTO') => {
    const targetMov = stockMovements.find(m => m.id === movementId);
    if (!targetMov) return;

    const paymentMethod = target === 'PENDENTE' ? 'Pegou Fiado' : 'Dinheiro';
    const reason = 'Venda';

    const { error } = await supabase
      .from('stock_movements')
      .update({ paymentMethod, reason })
      .eq('id', movementId);

    if (error) {
      console.error('Erro ao converter prejuízo:', error);
      alert('Erro ao atualizar banco de dados: ' + error.message);
      throw error;
    }
  };

  const generateAIAdvice = async (promptType: 'ESTOQUE' | 'FINANCEIRO' | 'VENDAS' | 'GERAL', customQuestion?: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
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

  const addCustomCategory = async (categoryName: string) => {
    const clean = categoryName.trim().toUpperCase();
    if (!clean || clean === 'OUTROS') return;
    if (customCategories.includes(clean)) return;

    const { error } = await supabase.from('custom_categories').insert({ name: clean });
    if (error) {
      console.error('Erro ao adicionar categoria:', error);
      alert('Erro ao salvar categoria no banco: ' + error.message);
      throw error;
    }
    setCustomCategories(prev => [...prev, clean]);
  };

  const updateCustomCategory = async (oldName: string, newName: string) => {
    const cleanNew = newName.trim().toUpperCase();
    if (!cleanNew || cleanNew === 'OUTROS') return;
    
    const { error } = await supabase.from('custom_categories').update({ name: cleanNew }).eq('name', oldName);
    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      alert('Erro ao atualizar categoria no banco: ' + error.message);
      throw error;
    }
    setCustomCategories(prev => prev.map(c => c === oldName ? cleanNew : c));
    
    // Update products that use this category
    await supabase.from('products').update({ category: cleanNew }).eq('category', oldName);
    setProducts(prev => prev.map(p => 
      p.category === oldName ? { ...p, category: cleanNew } : p
    ));

    // Update ingredients that use this category
    await supabase.from('ingredients').update({ category: cleanNew }).eq('category', oldName);
    setIngredients(prev => prev.map(i => 
      i.category === oldName ? { ...i, category: cleanNew } : i
    ));
  };

  const deleteCustomCategory = async (name: string) => {
    const { error } = await supabase.from('custom_categories').delete().eq('name', name);
    if (error) {
      console.error('Erro ao deletar categoria:', error);
      alert('Erro ao excluir categoria no banco: ' + error.message);
      throw error;
    }
    setCustomCategories(prev => prev.filter(c => c !== name));
    
    // Optionally move products back to GERAL
    await supabase.from('products').update({ category: 'GERAL' }).eq('category', name);
    setProducts(prev => prev.map(p => 
      p.category === name ? { ...p, category: 'GERAL' } : p
    ));

    // Update ingredients back to GERAL
    await supabase.from('ingredients').update({ category: 'GERAL' }).eq('category', name);
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

  const openShift = async (initialCash: number, openedBy: string) => {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toBRTISOString(),
      openedBy,
      initialCash,
      status: 'OPEN'
    };
    const { error } = await supabase.from('shifts').insert(newShift);
    if (error) {
      console.error('Erro ao abrir turno:', error);
      alert('Erro ao abrir turno no banco: ' + error.message);
      throw error;
    }
    setCurrentShift(newShift);
  };

  const closeShift = async (actualCash: number, actualCard: number, closedBy: string, notes?: string) => {
    if (!currentShift) return;
    
    // Calcula o valor esperado no caixa.
    // Pega as transações desde a abertura do turno
    const shiftTransactions = transactions.filter(t => new Date(t.date).getTime() >= new Date(currentShift.openedAt.toBRTDateString()).getTime());
    // Lógica simplificada de dinheiro: Entradas - Saídas
    // (Na prática, deveria considerar apenas transações em DINHEIRO se o caixa for apenas a gaveta de dinheiro,
    // mas aqui faremos um fechamento geral para demonstração)
    const totalIn = shiftTransactions.filter(t => t.type === 'ENTRADA').reduce((acc, t) => acc + t.amount, 0);
    const totalOut = shiftTransactions.filter(t => t.type === 'SAIDA').reduce((acc, t) => acc + t.amount, 0);
    const expected = currentShift.initialCash + totalIn - totalOut;

    const closedShift: Shift = {
      ...currentShift,
      closedAt: new Date().toBRTISOString(),
      closedBy,
      finalCashExpected: expected,
      finalCashActual: actualCash,
      finalCardActual: actualCard,
      status: 'CLOSED',
      notes
    };
    const { error } = await supabase.from('shifts').update(closedShift).eq('id', currentShift.id);
    if (error) {
      console.error('Erro ao fechar turno:', error);
      alert('Erro ao fechar turno no banco: ' + error.message);
      throw error;
    }
    setCurrentShift(null); // O turno atual deixa de existir e vira "fechado"
    setShifts(prev => [closedShift, ...prev]);
  };

  const cancelShift = async (shiftId?: string) => {
    if (!shiftId || (currentShift && currentShift.id === shiftId)) {
      if (currentShift) {
        const { error } = await supabase.from('shifts').delete().eq('id', currentShift.id);
        if (error) {
          console.error('Erro ao cancelar turno atual:', error);
          alert('Erro ao excluir turno atual do banco: ' + error.message);
          throw error;
        }
      }
      setCurrentShift(null);
    } else {
      if (shiftId) {
        const { error } = await supabase.from('shifts').delete().eq('id', shiftId);
        if (error) {
          console.error('Erro ao cancelar turno:', error);
          alert('Erro ao excluir turno do banco: ' + error.message);
          throw error;
        }
      }
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
        editStockMovement,
        deleteStockMovement,
        performInventoryAudit,
        createOrder,
        updateOrderStatus,
        addTransaction,
        settlePendingDebt,
        convertDebtToLoss,
        convertLoss,
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
