export type UserRole = 'ADMIN' | 'FUNCIONARIO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  shift?: 'Manhã' | 'Tarde / Noite' | 'Madrugada';
  position?: string;
}

export type ProductCategory = 'BURGER' | 'PORCAO' | 'BEBIDA' | 'SOBREMESA' | 'COMBO' | 'OUTROS' | string;

export interface Ingredient {
  id: string;
  name: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'un';
  currentStock: number;
  minStock: number;
  costPerUnit: number; // Cost in R$ per unit (e.g. per kg or un)
  supplier: string;
  lastUpdated: string;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number; // quantity needed per item sold (in the ingredient's unit)
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  costPrice: number; // calculated from recipe or manual
  image: string;
  available: boolean;
  description: string;
  prepTimeMin: number;
  recipe: RecipeItem[];
  salesCountMonthly: number;
  minStock?: number;
  maxStock?: number;
}

export type OrderStatus = 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';
export type PaymentMethod = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'DINHEIRO';
export type OrderType = 'MESA' | 'BALCAO' | 'DELIVERY';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  orderType: OrderType;
  tableNumber?: string;
  createdAt: string;
  cashierName: string;
}

export type TransactionType = 'ENTRADA' | 'SAIDA';
export type TransactionCategory = 'VENDAS' | 'FORNECEDOR' | 'SALARIO' | 'MANUTENCAO' | 'IMPOSTOS' | 'OUTROS';

export interface FinancialTransaction {
  id: string;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  relatedOrderId?: string;
}

export interface InventoryAuditItem {
  ingredientId: string;
  expectedStock: number;
  actualStock: number;
  difference: number;
}

export interface InventoryAudit {
  id: string;
  date: string;
  auditorName: string;
  itemsAudited: number;
  discrepanciesCount: number;
  notes?: string;
}
