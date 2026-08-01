import { User, Ingredient, Product, Order, FinancialTransaction, InventoryAudit } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Carlos Mendes',
    password: '123456',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    position: 'Sócio Gerente'
  },
  {
    id: 'usr-2',
    name: 'Mariana Silva',
    password: '123456',
    role: 'FUNCIONARIO',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    shift: 'Tarde / Noite',
    position: 'Caixa & Atendimento PDV'
  },
  {
    id: 'usr-3',
    name: 'Roberto Chaves',
    password: '123456',
    role: 'FUNCIONARIO',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    shift: 'Tarde / Noite',
    position: 'Chefe de Cozinha (Chapeiro)'
  }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [];

export const INITIAL_AUDITS: InventoryAudit[] = [];
