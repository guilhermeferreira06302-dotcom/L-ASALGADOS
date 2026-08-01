-- Adicionar colunas de métricas e status avançados que faltavam
ALTER TABLE products ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count_weekly INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count_monthly INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS preparation_time TEXT;

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS max_stock DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS supplier TEXT;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS last_updated TEXT;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS has_received_entry BOOLEAN DEFAULT false;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS operator TEXT;

-- Tabela para Salvar as Configurações e Categorias Customizadas
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL
);
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
