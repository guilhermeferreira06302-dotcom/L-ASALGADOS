export type UserRole = 'ADMIN' | 'FUNCIONARIO';

export interface User {
  id: string;
  name: string;
  password?: string;
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
  maxStock?: number;
  category?: string;
  costPerUnit: number; // Cost in R$ per unit (e.g. per kg or un)
  supplier: string;
  operator?: string;
  hasReceivedEntry?: boolean;
  lastUpdated?: string;
}

export const isStockActive = (ing: Ingredient): boolean => {
  return true;
};

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

export type PaymentMethod = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'DINHEIRO';

export type TransactionType = 'ENTRADA' | 'SAIDA';
export type TransactionCategory = 'VENDAS' | 'FORNECEDOR' | 'SALARIO' | 'MANUTENCAO' | 'IMPOSTOS' | 'PREJUIZO' | 'OUTROS';

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

export type StockMovementType = 'ENTRADA' | 'SAIDA';

export interface StockMovement {
  id: string;
  type: StockMovementType;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  reason: string;
  observation?: string;
  paymentMethod?: string;
  operator: string;
  date: string; // ISO string for easy sorting/filtering
  photo?: string;
}

export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface Shift {
  id: string;
  openedAt: string; // ISO string
  closedAt?: string; // ISO string
  openedBy: string; // User Name
  closedBy?: string; // User Name
  initialCash: number;
  finalCashExpected?: number;
  finalCashActual?: number;
  finalCardActual?: number;
  status: ShiftStatus;
  notes?: string;
}
