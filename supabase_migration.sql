-- Migração de Arquitetura: Criação das Tabelas Relacionais do L&A Salgados

-- 1. Desativar RLS padrão para simplificar a migração inicial (conforme Opção 2)
-- Para segurança total, seria necessário integrar o Supabase Auth e habilitar RLS.

-- Tabela de Categorias Customizadas
CREATE TABLE custom_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Usuários (Funcionários e Admins)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'FUNCIONARIO')),
    avatar TEXT,
    shift VARCHAR(100),
    position VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    image TEXT,
    available BOOLEAN DEFAULT true,
    description TEXT,
    prep_time_min INTEGER DEFAULT 0,
    recipe JSONB DEFAULT '[]'::jsonb,
    sales_count_monthly INTEGER DEFAULT 0,
    min_stock INTEGER,
    max_stock INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Insumos (Ingredientes / Estoque)
CREATE TABLE ingredients (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    current_stock DECIMAL(10,3) NOT NULL,
    min_stock DECIMAL(10,3) NOT NULL,
    max_stock DECIMAL(10,3),
    category VARCHAR(255),
    cost_per_unit DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(255),
    operator VARCHAR(255),
    has_received_entry BOOLEAN DEFAULT false,
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pedidos
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    order_number INTEGER NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    order_type VARCHAR(50) NOT NULL,
    table_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cashier_name VARCHAR(255)
);

-- Tabela de Transações Financeiras
CREATE TABLE transactions (
    id VARCHAR(255) PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ENTRADA', 'SAIDA')),
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    related_order_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Movimentações de Estoque
CREATE TABLE stock_movements (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ENTRADA', 'SAIDA')),
    ingredient_id VARCHAR(255) NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    observation TEXT,
    payment_method VARCHAR(50),
    operator VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Auditorias de Inventário
CREATE TABLE inventory_audits (
    id VARCHAR(255) PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    auditor_name VARCHAR(255) NOT NULL,
    items_audited INTEGER NOT NULL,
    discrepancies_count INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Turnos
CREATE TABLE shifts (
    id VARCHAR(255) PRIMARY KEY,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    opened_by VARCHAR(255) NOT NULL,
    closed_by VARCHAR(255),
    initial_cash DECIMAL(10,2) NOT NULL,
    final_cash_expected DECIMAL(10,2),
    final_cash_actual DECIMAL(10,2),
    final_card_actual DECIMAL(10,2),
    status VARCHAR(50) NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desativa RLS para que o front-end consiga acessar sem a autenticação oficial do Supabase Auth
ALTER TABLE custom_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
