-- Criação da tabela system_settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whatsapp_number TEXT,
  whatsapp_api_key TEXT,
  alerts_enabled BOOLEAN DEFAULT false,
  inactivity_timeout_minutes INTEGER DEFAULT 120,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Enable read access for all users" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON system_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON system_settings FOR UPDATE USING (true);

-- Gatilho para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
