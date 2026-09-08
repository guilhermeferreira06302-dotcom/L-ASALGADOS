-- Adicionando colunas para a integração do Telegram na tabela system_settings
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Opcional: Remover as colunas antigas do WhatsApp (CallMeBot)
-- ALTER TABLE system_settings DROP COLUMN whatsapp_number;
-- ALTER TABLE system_settings DROP COLUMN whatsapp_api_key;
