import { User, Ingredient, Product, Order, FinancialTransaction, InventoryAudit } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Carlos Mendes',
    email: 'carlos@lanchonete.com',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    position: 'Sócio Gerente'
  },
  {
    id: 'usr-2',
    name: 'Mariana Silva',
    email: 'mariana@lanchonete.com',
    role: 'FUNCIONARIO',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    shift: 'Tarde / Noite',
    position: 'Caixa & Atendimento PDV'
  },
  {
    id: 'usr-3',
    name: 'Roberto Chaves',
    email: 'roberto@lanchonete.com',
    role: 'FUNCIONARIO',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    shift: 'Tarde / Noite',
    position: 'Chefe de Cozinha (Chapeiro)'
  }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing-1',
    name: 'Pão Brioche Artesanal',
    unit: 'un',
    currentStock: 140,
    minStock: 50,
    costPerUnit: 1.80,
    supplier: 'Padaria Imperial',
    lastUpdated: 'Hoje, 08:30'
  },
  {
    id: 'ing-2',
    name: 'Blend Angus 180g (Carne)',
    unit: 'un',
    currentStock: 32,
    minStock: 40,
    costPerUnit: 5.50,
    supplier: 'Frigorífico Bom Corte',
    lastUpdated: 'Hoje, 09:15'
  },
  {
    id: 'ing-3',
    name: 'Queijo Cheddar Fatiado',
    unit: 'g',
    currentStock: 4800,
    minStock: 2000,
    costPerUnit: 0.045, // R$ 45/kg -> 0.045/g
    supplier: 'Laticínios Vale Verde',
    lastUpdated: 'Ontem, 16:00'
  },
  {
    id: 'ing-4',
    name: 'Bacon Defumado em Tiras',
    unit: 'g',
    currentStock: 1100,
    minStock: 1500,
    costPerUnit: 0.052,
    supplier: 'Frigorífico Bom Corte',
    lastUpdated: 'Hoje, 10:00'
  },
  {
    id: 'ing-5',
    name: 'Batata Palito Congelada 9mm',
    unit: 'g',
    currentStock: 18500,
    minStock: 8000,
    costPerUnit: 0.018,
    supplier: 'Distribuidora FrioSul',
    lastUpdated: 'Há 2 dias'
  },
  {
    id: 'ing-6',
    name: 'Refrigerante Cola Lata 350ml',
    unit: 'un',
    currentStock: 18,
    minStock: 36,
    costPerUnit: 2.90,
    supplier: 'Ambev / Distribuidora',
    lastUpdated: 'Ontem, 14:00'
  },
  {
    id: 'ing-7',
    name: 'Alface Americana Limpa',
    unit: 'g',
    currentStock: 2400,
    minStock: 1000,
    costPerUnit: 0.012,
    supplier: 'Hortifruti São José',
    lastUpdated: 'Hoje, 07:45'
  },
  {
    id: 'ing-8',
    name: 'Tomate Fresco Fatiado',
    unit: 'g',
    currentStock: 3100,
    minStock: 1500,
    costPerUnit: 0.010,
    supplier: 'Hortifruti São José',
    lastUpdated: 'Hoje, 07:45'
  },
  {
    id: 'ing-9',
    name: 'Molho Especial da Casa',
    unit: 'ml',
    currentStock: 5400,
    minStock: 2000,
    costPerUnit: 0.025,
    supplier: 'Produção Interna',
    lastUpdated: 'Hoje, 11:00'
  },
  {
    id: 'ing-10',
    name: 'Óleo de Algodão para Fritura',
    unit: 'l',
    currentStock: 35,
    minStock: 15,
    costPerUnit: 9.50,
    supplier: 'Atacadão Alimentos',
    lastUpdated: 'Há 3 dias'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Smash Bacon Supreme',
    category: 'BURGER',
    price: 34.90,
    costPrice: 11.80,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
    available: true,
    description: 'Dois burgers smash 90g com crosta crocante, muito queijo cheddar derretido, farofa de bacon crocante no pão brioche selado na manteiga.',
    prepTimeMin: 12,
    salesCountMonthly: 342,
    recipe: [
      { ingredientId: 'ing-1', quantity: 1 },    // 1 pão
      { ingredientId: 'ing-2', quantity: 1 },    // 1 blend angus
      { ingredientId: 'ing-3', quantity: 60 },   // 60g queijo
      { ingredientId: 'ing-4', quantity: 45 },   // 45g bacon
      { ingredientId: 'ing-9', quantity: 30 }    // 30ml molho especial
    ]
  },
  {
    id: 'prod-2',
    name: 'Classic Salad Burger',
    category: 'BURGER',
    price: 28.50,
    costPrice: 9.40,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80',
    available: true,
    description: 'Hambúrguer artesanal 180g, queijo cheddar, alface americana crocante, tomate fresco e maionese verde da casa no pão brioche.',
    prepTimeMin: 10,
    salesCountMonthly: 215,
    recipe: [
      { ingredientId: 'ing-1', quantity: 1 },
      { ingredientId: 'ing-2', quantity: 1 },
      { ingredientId: 'ing-3', quantity: 40 },
      { ingredientId: 'ing-7', quantity: 30 },
      { ingredientId: 'ing-8', quantity: 40 },
      { ingredientId: 'ing-9', quantity: 25 }
    ]
  },
  {
    id: 'prod-3',
    name: 'Batata Rústica com Cheddar & Bacon',
    category: 'PORCAO',
    price: 29.90,
    costPrice: 7.20,
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
    available: true,
    description: 'Porção generosa de 400g de batata palito crocante coberta com creme de cheddar derretido e pedacinhos de bacon frito.',
    prepTimeMin: 8,
    salesCountMonthly: 289,
    recipe: [
      { ingredientId: 'ing-5', quantity: 400 },
      { ingredientId: 'ing-3', quantity: 80 },
      { ingredientId: 'ing-4', quantity: 50 }
    ]
  },
  {
    id: 'prod-4',
    name: 'Refrigerante Cola Lata 350ml',
    category: 'BEBIDA',
    price: 7.50,
    costPrice: 2.90,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
    available: true,
    description: 'Lata 350ml bem gelada com opção de gelo e limão.',
    prepTimeMin: 1,
    salesCountMonthly: 510,
    recipe: [
      { ingredientId: 'ing-6', quantity: 1 }
    ]
  },
  {
    id: 'prod-5',
    name: 'Combo Casal Monster (2 Burgers + Batata + 2 Refri)',
    category: 'COMBO',
    price: 84.90,
    costPrice: 28.50,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop&q=80',
    available: true,
    description: '2x Smash Bacon Supreme + 1 Porção de Batata com Cheddar + 2 Refris Cola lata. Economia de 15%!',
    prepTimeMin: 15,
    salesCountMonthly: 168,
    recipe: [
      { ingredientId: 'ing-1', quantity: 2 },
      { ingredientId: 'ing-2', quantity: 2 },
      { ingredientId: 'ing-3', quantity: 180 },
      { ingredientId: 'ing-4', quantity: 130 },
      { ingredientId: 'ing-5', quantity: 400 },
      { ingredientId: 'ing-6', quantity: 2 },
      { ingredientId: 'ing-9', quantity: 60 }
    ]
  },
  {
    id: 'prod-6',
    name: 'Churros Artesanais com Doce de Leite',
    category: 'SOBREMESA',
    price: 18.90,
    costPrice: 4.50,
    image: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=500&auto=format&fit=crop&q=80',
    available: true,
    description: '6 minichurros crocantes polvilhados com açúcar e canela acompanhados de pote de doce de leite argentino.',
    prepTimeMin: 6,
    salesCountMonthly: 124,
    recipe: []
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-104',
    orderNumber: 104,
    items: [
      { productId: 'prod-1', productName: 'Smash Bacon Supreme', quantity: 2, price: 34.90, notes: 'Sem cebola no burger 2' },
      { productId: 'prod-3', productName: 'Batata Rústica com Cheddar & Bacon', quantity: 1, price: 29.90 },
      { productId: 'prod-4', productName: 'Refrigerante Cola Lata 350ml', quantity: 2, price: 7.50 }
    ],
    status: 'EM_PREPARO',
    total: 114.70,
    paymentMethod: 'PIX',
    customerName: 'Lucas Oliveira',
    orderType: 'MESA',
    tableNumber: 'Mesa 04',
    createdAt: '19:15',
    cashierName: 'Mariana Silva'
  },
  {
    id: 'ord-103',
    orderNumber: 103,
    items: [
      { productId: 'prod-5', productName: 'Combo Casal Monster', quantity: 1, price: 84.90 }
    ],
    status: 'PRONTO',
    total: 84.90,
    paymentMethod: 'CARTAO_CREDITO',
    customerName: 'Beatriz Costa',
    orderType: 'BALCAO',
    createdAt: '19:02',
    cashierName: 'Mariana Silva'
  },
  {
    id: 'ord-102',
    orderNumber: 102,
    items: [
      { productId: 'prod-2', productName: 'Classic Salad Burger', quantity: 1, price: 28.50 },
      { productId: 'prod-4', productName: 'Refrigerante Cola Lata 350ml', quantity: 1, price: 7.50 }
    ],
    status: 'ENTREGUE',
    total: 36.00,
    paymentMethod: 'CARTAO_DEBITO',
    customerName: 'Fernando Souza',
    orderType: 'MESA',
    tableNumber: 'Mesa 01',
    createdAt: '18:40',
    cashierName: 'Mariana Silva'
  },
  {
    id: 'ord-101',
    orderNumber: 101,
    items: [
      { productId: 'prod-1', productName: 'Smash Bacon Supreme', quantity: 1, price: 34.90 },
      { productId: 'prod-6', productName: 'Churros Artesanais', quantity: 1, price: 18.90 }
    ],
    status: 'ENTREGUE',
    total: 53.80,
    paymentMethod: 'DINHEIRO',
    customerName: 'Carla Dias',
    orderType: 'DELIVERY',
    createdAt: '18:10',
    cashierName: 'Mariana Silva'
  }
];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  { id: 'tx-1', date: '2026-07-01', type: 'ENTRADA', category: 'VENDAS', amount: 1420.50, description: 'Vendas Turno da Manhã & Almoço' },
  { id: 'tx-2', date: '2026-07-01', type: 'SAIDA', category: 'FORNECEDOR', amount: 480.00, description: 'Reposição Pães Brioche & Hortifruti' },
  { id: 'tx-3', date: '2026-06-30', type: 'ENTRADA', category: 'VENDAS', amount: 2840.90, description: 'Fechamento Vendas Terça-feira' },
  { id: 'tx-4', date: '2026-06-30', type: 'SAIDA', category: 'MANUTENCAO', amount: 180.00, description: 'Manutenção preventiva da Chapa a Gás' },
  { id: 'tx-5', date: '2026-06-29', type: 'ENTRADA', category: 'VENDAS', amount: 3120.00, description: 'Fechamento Vendas Segunda-feira' },
  { id: 'tx-6', date: '2026-06-29', type: 'SAIDA', category: 'FORNECEDOR', amount: 950.00, description: 'Frigorífico Bom Corte (Blends & Bacon)' },
  { id: 'tx-7', date: '2026-06-28', type: 'ENTRADA', category: 'VENDAS', amount: 4850.20, description: 'Fechamento Vendas Domingo (Pico da Semana)' },
  { id: 'tx-8', date: '2026-06-27', type: 'ENTRADA', category: 'VENDAS', amount: 5120.00, description: 'Fechamento Vendas Sábado' },
  { id: 'tx-9', date: '2026-06-27', type: 'SAIDA', category: 'SALARIO', amount: 2400.00, description: 'Adiantamento Quinzena Equipe Cozinha e Atendimento' }
];

export const INITIAL_AUDITS: InventoryAudit[] = [
  {
    id: 'aud-1',
    date: '30/06/2026 - 23:45',
    auditorName: 'Carlos Mendes',
    itemsAudited: 10,
    discrepanciesCount: 2,
    notes: 'Pequena diferença em latas de refrigerante (quebra operacional) e cheddar.'
  }
];
